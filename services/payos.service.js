const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const { CHECKSUM_KEY, payOS, BASE_URL } = require('../config');
const throwError = require('../helpers/errorHelper');
const moment = require('moment');
const Crypto = require('crypto');
const orderService = require('./order.service');
const validateExistence = require('../utils/validates');
const LZString = require('lz-string');

exports.createTransaction = async (req, res) => {
    try {
        const { userId, amount, shippingAddress, recipientName, recipientPhone, items } = req.body;
        if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items)
            throwError('Bad Request', 'Thiếu thông tin giao dịch', 400);
        await validateExistence(User, userId);
        const code = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
        const orderCode = Number(code);
        const description = "TRENDSETTER";
        const returnUrl = `${BASE_URL}/api/transactions/succeeded`;
        const cancelUrl = `${BASE_URL}/api/transactions/cancelled`;
        const expiredAt = Math.floor(Date.now() / 1000) + 900 // Tức lệnh hết hạn sau (15 * 60) giây
        const enrichedItems = items.map(item => {
            return {
                ...item,
                price: item.finalPrice
            }
        });
        const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = Crypto.createHmac("sha256", CHECKSUM_KEY).update(signatureString).digest("hex");
        const body = {
            orderCode,
            amount,
            description,
            buyerName: recipientName,
            buyerPhone: recipientPhone,
            buyerAddress: shippingAddress,
            items: enrichedItems,
            cancelUrl,
            returnUrl,
            expiredAt,
            signature
        };
        const response = await payOS.createPaymentLink(body);
        const compressedMetadata = LZString.compressToBase64(JSON.stringify({
            shippingAddress,
            recipientName,
            recipientPhone,
            items
        }));
        await Transaction.create({
            user: userId,
            amount,
            paymentMethod: req.params.provider,
            providerTransactionId: response.orderCode.toString(),
            metadata: compressedMetadata,
        });
        res.json(response);
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
};


exports.handleCallback = async (req, res) => {
    
    try {
        const webhookData = payOS.verifyPaymentWebhookData(req.body);
        if (
            ["Ma giao dich thu nghiem", "VQRIO123"].includes(webhookData.description)
        ) {
            return res.json({
                error: 0,
                message: "Ok",
                data: webhookData
            });
        }
        const paymentLink = await payOS.getPaymentLinkInformation(webhookData.paymentLinkId);

        const status = paymentLink.status === 'PAID' ? 'completed' : 'cancelled';
        const transaction = await Transaction.findOneAndUpdate(
            { providerTransactionId: paymentLink.orderCode.toString() },
            { status }
        );
        if (!transaction) throwError("Not Found", "Không tìm thấy giao dịch", 404);
        const metadata = JSON.parse(LZString.decompressFromBase64(transaction.metadata));
        const shippingFee = orderService.calculateShippingFee(transaction.amount, metadata.items);
        await orderService.createOrderFromTransaction({
            userId: transaction.user,
            transactionId: transaction._id,
            shippingAddress: metadata.shippingAddress,
            recipientName: metadata.recipientName,
            recipientPhone: metadata.recipientPhone,
            items: metadata.items,
            shippingFee
        });

        return res.json({
            error: 0,
            message: "Ok",
            data: webhookData
        });
    } catch (error) {
        console.error("Webhook error:", error.message);
        res.status(200).json({ message: "Webhook received but not processed" }); // Trả về 200 để không làm fail webhook
    }
};
