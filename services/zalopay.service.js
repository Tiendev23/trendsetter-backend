const { Transaction, User, Order, VariantSize, CartItem, OrderItem } = require('../models');
const { ZALOPAY_CONFIG, BASE_URL } = require('../config');
const { throwError, resError } = require('../helpers/errorHelper');
const Crypto = require('crypto');
const moment = require('moment');
const { createOrder, updateOrderStatus, cancelOrder } = require('./order.service');
const { validateExistence } = require('../utils/validates');
const { withTransaction } = require('../helpers/dbTransaction');

exports.createTransaction = async (req, res) => {
    try {
        const payload = await withTransaction(async session => {

            const { userId, amount, shippingAddress, recipientName, recipientPhone, items, shippingFee, redirecturl } = req.body;
            if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items || !shippingFee)
                throwError('TRX.CRT_ZALOPAY', 'Thiếu thông tin giao dịch', 400);
            await validateExistence(User, userId);

            const app_trans_id = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

            const app_time = Date.now();
            const embed_data = JSON.stringify({
                redirecturl,
                shippingAddress,
                recipientName,
                recipientPhone,
            });

            const item = JSON.stringify(items);
            const data = `${ZALOPAY_CONFIG.app_id}|${app_trans_id}|${userId}|${amount}|${app_time}|${embed_data}|${item}`;
            const mac = Crypto.createHmac("sha256", ZALOPAY_CONFIG.key1).update(data).digest("hex");
            const callback_url = `${BASE_URL}/api/webhooks/transactions/zalopay`;
            const body = {
                app_id: ZALOPAY_CONFIG.app_id,
                app_user: userId,
                app_trans_id,
                app_time,
                expire_duration_seconds: 900, // Thời gian hết hạn mặc định để dễ quản lý
                amount,
                description: "TRENDSETTER",
                bank_code: "zalopayapp",
                item,
                embed_data,
                callback_url,
                mac
            };
            const response = await ZALOPAY_CONFIG.instance.post("/v2/create", body);

            if (response.data.return_code !== 1)
                throwError('TRX.CRT_ZALOPAY', response.data.sub_return_message, 409);

            await createOrder({
                session, userId, amount, shippingFee, items,
                shippingAddress, recipientName, recipientPhone,
                paymentMethod: req.params.provider,
                providerTxId: app_trans_id,
                payLink: response.data.order_url,
            });
            return {
                checkoutUrl: response.data.order_url,
                providerTrxId: app_trans_id,
            };
        });
        res.json({ data: payload });
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CRT_ZALOPAY",
            defaultMessage: "Tạo giao dịch ZALOPAY thất bại"
        });
    }
};


exports.handleCallback = async (req, res) => {
    const { data: reqData, mac: reqMac } = req.body;
    const expectedMac = Crypto.createHmac("sha256", ZALOPAY_CONFIG.key2).update(reqData).digest("hex");

    if (reqMac !== expectedMac)
        return res.json({ code: -1, message: "MAC không hợp lệ" });

    const data = JSON.parse(reqData);

    await withTransaction(async session => {
        return updateOrderStatus({
            session,
            providerTxId: data.app_trans_id,
        });
    });

    return res.json({ code: 1, message: "Success" });
};

exports.queryOrderStatus = async (transactionId) => {
    try {
        const data = `${ZALOPAY_CONFIG.app_id}|${transactionId}|${ZALOPAY_CONFIG.key1}`;
        const mac = Crypto.createHmac("sha256", ZALOPAY_CONFIG.key1).update(data).digest("hex");

        const body = {
            app_id: ZALOPAY_CONFIG.app_id,
            app_trans_id: transactionId,
            mac
        };

        const response = await ZALOPAY_CONFIG.instance.post("/v2/query", body);
        return response.data;
    } catch (error) {
        console.log("queryOrderStatus error", error.message);
        return;
    }
};

exports.handleCancelPayment = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await withTransaction(async session => {
            return cancelOrder({
                session,
                providerTxId: orderId,
            });
        });

        return res.json({
            message: "ok",
            data: order,
        });
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CXL_ZALOPAY",
            defaultMessage: "Huỷ giao dịch ZALOPAY thất bại"
        });
    }
};