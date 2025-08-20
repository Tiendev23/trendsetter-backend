const { User, Order, OrderItem, VariantSize } = require('../models');
const { throwError, resError } = require('../helpers/errorHelper');
const moment = require('moment');
const { createOrder, cancelOrder } = require('./order.service');
const { validateExistence } = require('../utils/validates');
const { withTransaction } = require('../helpers/dbTransaction');

exports.createTransaction = async (req, res) => {
    try {
        await withTransaction(async session => {
            const { userId, amount, shippingAddress, recipientName, recipientPhone, items, shippingFee } = req.body;
            if (!userId || !amount || !shippingAddress || !recipientName || !recipientPhone || !items)
                throwError('TRX.CRT_COD', 'Thiếu thông tin giao dịch', 400);
            await validateExistence(User, userId);
            const transId = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

            const orderId = await createOrder({
                session, userId, amount, shippingFee, items,
                shippingAddress, recipientName, recipientPhone,
                paymentMethod: req.params.provider,
                providerTxId: transId
            });

            // await Order.findByIdAndUpdate(
            //     orderId,
            //     { $set: { status: 'confirmed' }, $inc: { __v: 1 } },
            //     { new: true, session }
            // );

            const orderItems = await OrderItem.find({ order: orderId }).session(session);
            for (const item of orderItems) {
                await VariantSize.findOneAndUpdate(
                    { _id: item.size },
                    { $inc: { stock: -item.quantity, __v: 1 } },
                    { new: true, session }
                );
            }

        });
        res.json({ message: "Tạo đơn hàng COD thành công" });
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CRT_COD",
            defaultMessage: "Tạo giao dịch COD thất bại"
        });
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