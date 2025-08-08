const { User, Transaction, Order } = require('../models');
const { CHECKSUM_KEY, payOS, BASE_URL } = require('../config');
const { throwError, resError } = require('../helpers/errorHelper');
const moment = require('moment');
const Crypto = require('crypto');
const { createOrder, updateOrderStatus, cancelOrder } = require('./order.service');
const { validateExistence } = require('../utils/validates');
const { withTransaction } = require('../helpers/dbTransaction');

exports.createTransaction = async (req, res) => {
    try {
        const payload = await withTransaction(async session => {

            const { userId, amount, shippingAddress, recipientName, recipientPhone, items, shippingFee } = req.body;
            if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items)
                throwError('TRX.PAYOS.CREATE', 'Thiếu thông tin giao dịch', 400);
            await validateExistence(User, userId);
            const code = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
            const orderCode = Number(code);
            const description = "TRENDSETTER";
            const returnUrl = `${BASE_URL}/api/transactions/succeeded`;
            const cancelUrl = `${BASE_URL}/api/transactions/cancelled`;
            const expiredAt = Math.floor(Date.now() / 1000) + 900 // Tức lệnh hết hạn sau (15 * 60) giây
            const payOSItems = items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.finalPrice
            }));
            const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
            const signature = Crypto.createHmac("sha256", CHECKSUM_KEY).update(signatureString).digest("hex");
            const body = {
                orderCode,
                amount,
                description,
                buyerName: recipientName,
                buyerPhone: recipientPhone,
                buyerAddress: shippingAddress,
                items: payOSItems,
                cancelUrl,
                returnUrl,
                expiredAt,
                signature
            };
            const response = await payOS.createPaymentLink(body);

            await createOrder({
                session, userId, amount, shippingFee, items,
                shippingAddress, recipientName, recipientPhone,
                paymentMethod: req.params.provider,
                providerTxId: response.orderCode.toString()
            });

            return response;
        });
        res.json({ data: payload });
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CRT_PAYOS",
            defaultMessage: "Tạo giao dịch PAYOS thất bại"
        });
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
        if (paymentLink.status === 'PAID') {
            await withTransaction(async session => {
                return updateOrderStatus({
                    session,
                    providerTxId: paymentLink.orderCode.toString(),
                    txStatus,
                });
            });
        }
        return res.json({
            error: 0,
            message: "Ok",
            data: webhookData
        });
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.status(200).json({
            message: "Webhook received but not processed, " + err?.message
        }); // Trả về 200 để không làm fail webhook
    }
};

exports.handleCancelPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const data = await payOS.cancelPaymentLink(orderId);
        if (!data) throwError("TRX.CXL_PAYOS", "Không tìm thấy đơn hàng", 404);

        await withTransaction(async session => {
            return cancelOrder({
                session,
                providerTxId: data.orderCode.toString(),
            });
        });

        return res.json({
            message: "ok",
            data: data,
        });
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CXL_PAYOS",
            defaultMessage: "Huỷ giao dịch PAYOS thất bại"
        });
    }
};
