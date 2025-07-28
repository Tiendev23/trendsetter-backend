const { Transaction, User } = require('../models');
const { ZALOPAY_CONFIG, BASE_URL } = require('../config');
const { throwError } = require('../helpers/errorHelper');
const Crypto = require('crypto');
const moment = require('moment');
const orderService = require('./order.service');
const { validateExistence } = require('../utils/validates');

exports.createTransaction = async (req, res) => {
    try {
        const { userId, amount, shippingAddress, recipientName, recipientPhone, items, redirecturl } = req.body;
        if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items)
            throwError('Bad Request', 'Thiếu thông tin giao dịch', 400);
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
            amount,
            description: "TRENDSETTER",
            bank_code: "zalopayapp",
            item,
            embed_data,
            callback_url,
            mac
        };
        const response = await ZALOPAY_CONFIG.instance.post("/v2/create", body);

        if (response.data.return_code === 1) {
            await Transaction.create({
                user: userId,
                amount,
                paymentMethod: req.params.provider,
                providerTransactionId: app_trans_id
            });
            return res.json(response.data);
        } else
            throwError('Conflict', response.data.sub_return_message, 409);
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};

exports.handleCallback = async (req, res) => {
    const { data: reqData, mac: reqMac } = req.body;
    const expectedMac = Crypto.createHmac("sha256", ZALOPAY_CONFIG.key2).update(reqData).digest("hex");

    if (reqMac !== expectedMac) return res.json({ code: -1, message: "MAC không hợp lệ" });

    const data = JSON.parse(reqData);
    const embed_data = JSON.parse(data.embed_data);
    const items = JSON.parse(data.item);
    const shippingFee = orderService.calculateShippingFee(data.amount, items);

    const response = await this.queryOrderStatus(data.app_trans_id);

    const transaction = await Transaction.findOneAndUpdate(
        { providerTransactionId: data.app_trans_id },
        { status: response.return_code == 1 ? 'completed' : 'cancelled' }
    );
    if (!transaction) return res.json({ code: -1, message: "Không tìm thấy giao dịch" });
    await orderService.createOrderFromTransaction({
        userId: transaction.user,
        transactionId: transaction._id,
        shippingAddress: embed_data.shippingAddress,
        recipientName: embed_data.recipientName,
        recipientPhone: embed_data.recipientPhone,
        items,
        shippingFee
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

