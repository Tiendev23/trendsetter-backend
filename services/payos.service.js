const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const { BASE_URL, CHECKSUM_KEY, payosInstance, payOS } = require('../config');
const throwError = require('../helpers/errorHelper');
const moment = require('moment');
const Crypto = require('crypto');
const orderService = require('./order.service');
const validateExistence = require('../utils/validates');

// exports.createTransaction = async (req, res) => {
//     try {
//         const { userId, shippingFee, amount, shippingAddress, recipientName, recipientPhone, items, redirecturl } = req.body;
//         if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items)
//             throwError('Bad Request', 'Thiếu thông tin giao dịch', 400);
//         const orderCode = Math.floor(Date.now() / 1000);
//         const description = "TRENDSETTER";
//         const returnUrl = "https://trendsetter-backend.onrender.com/api/payments/succeeded";
//         const cancelUrl = "https://trendsetter-backend.onrender.com/api/payments/cancelled";
//         const expiredAt = Math.floor(Date.now() / 1000) + 1200 // Tức lệnh hết hạn sau 20 phút

//         // Tạo chữ ký để xác thực request
//         const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
//         const signature = crypto.createHmac("sha256", CHECKSUM_KEY).update(signatureString).digest("hex");

//         // Định dạng request body theo đúng cấu trúc mong muốn
//         const body = {
//             orderCode,
//             amount,
//             description,
//             buyerName: recipientName,
//             buyerEmail,
//             buyerPhone: recipientPhone,
//             buyerAddress: shippingAddress,
//             items,
//             cancelUrl,
//             returnUrl,
//             expiredAt,
//             signature
//         };
//         // console.log('body:', JSON.stringify(body));

//         // Gửi request đến PayOS API
//         const response = await payosInstance.post("/v2/payment-requests", body);

//         if (response.data.code === "00") {
//             return response.data;
//         } else {
//             throw new Error("code: " + response.data.code, ", desc: " + response.data.desc);
//         }
//     } catch (error) {
//         console.log('you here >>>> error');
//         throw new Error(error.message);
//     }
// };

exports.createTransaction = async (req, res) => {
    try {
        const { userId, amount, shippingAddress, recipientName, recipientPhone, items } = req.body;
        if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items)
            throwError('Bad Request', 'Thiếu thông tin giao dịch', 400);
        await validateExistence(User, userId);
        const code = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
        const orderCode = Number(code);
        const description = "TRENDSETTER";
        const returnUrl = "https://trendsetter-backend.onrender.com/api/payments/succeeded";
        const cancelUrl = "https://trendsetter-backend.onrender.com/api/payments/cancelled";
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
        await Transaction.create({
            user: userId,
            amount,
            paymentMethod: 'payos',
            providerTransactionId: response.orderCode.toString()
        });
        res.json(response);
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
};


exports.handleCallback = async (req, res) => {
    try {
        console.log('body', req.body);

        const webhookData = payOS.verifyPaymentWebhookData(req.body); // Xác thực chữ ký và trích xuất dữ liệu
        console.log('webhookData', webhookData);
        const paymentLink = await payOS.getPaymentLinkInformation(webhookData.paymentLinkId);
        console.log('paymentLink', paymentLink);

        const status = paymentLink.status === '00' ? 'completed' : 'failed'
        const transaction = await Transaction.findOneAndUpdate(
            { orderCode: webhookData.orderCode.toString() },
            { status: status }
        );

        if (!transaction) throwError("Not Found", "Không tìm thấy giao dịch", 404);

        // await orderService.createOrderFromTransaction({
        //     userId: transaction.user,
        //     transactionId: transaction._id,
        //     shippingAddress: transaction.shippingAddress,
        //     recipientName: transaction.recipientName,
        //     recipientPhone: transaction.recipientPhone,
        //     items: transaction.items,
        //     shippingFee: transaction.shippingFee
        // });

        res.status(200).json({ message: "Success" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};