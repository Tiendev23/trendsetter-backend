const { throwError } = require('../helpers/errorHelper');
const { Order, OrderItem, Transaction, CartItem, VariantSize } = require('../models');
const { validateExistence } = require('../utils/validates');

exports.createOrderFromTransaction = async (transactionData) => {
    const { userId, transactionId, shippingAddress, recipientName, recipientPhone, items, shippingFee } = transactionData;

    const order = await Order.create({
        user: userId,
        transaction: transactionId,
        shippingAddress,
        recipientName,
        recipientPhone,
        shippingFee,
    });

    await Transaction.updateOne(
        { _id: transactionId },
        { $set: { order: order._id } },
        { version: false }
    );

    await Promise.all(
        items.map(async item => {
            const sizeId = await validateExistence(VariantSize, item.size._id);
            await CartItem.findOneAndDelete({
                user: userId,
                variantSize: sizeId
            });
            const updatedVariant = await VariantSize.findOneAndUpdate(
                {
                    _id: item.size._id,
                    stock: { $gte: item.quantity }  // chỉ match doc khi stock đủ
                },
                {
                    $inc: { stock: -item.quantity }  // trừ stock
                },
                { new: true }                       // trả về doc mới sau update
            );
            if (!updatedVariant) {
                throwError("ORD.CRT_ITEM", `${item.name} không đủ stock`, 400);
            }
            return await OrderItem.create({
                order: order._id,
                campaign: item.campaign,
                product: item.product,
                variant: item.variant,
                size: sizeId,
                name: item.name,
                color: item.color,
                basePrice: item.basePrice,
                finalPrice: item.finalPrice,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
            })
        })
    );
};

async function createOrder({
    userId, amount, paymentMethod, providerTxId, payLink,
    shippingAddress, recipientName, recipientPhone,
    items, shippingFee, session
}) {
    const [transaction] = await Transaction.create([{
        user: userId,
        amount,
        paymentMethod: paymentMethod,
        providerTransactionId: providerTxId,
        providerPayLink: payLink,
    }], { session });

    const [order] = await Order.create([{
        user: userId,
        transaction: transaction._id,
        shippingAddress,
        recipientName,
        recipientPhone,
        shippingFee,
    }], { session });

    await Transaction.updateOne(
        { _id: transaction._id },
        { $set: { order: order._id } },
        {
            session,
            versionKey: false
        }
    );

    for (const item of items) {
        const sizeId = await validateExistence(VariantSize, item.size._id);

        // await CartItem.deleteOne(
        //     { user: userId, variantSize: item.size._id },
        //     { session }
        // );

        const size = await VariantSize.findById(item.size._id).session(session);
        if (size.stock < item.quantity || !(size.active)) throwError("ORD.CRT_ITEM", `${item.name} ${item.size.size} đã hết hàng`, 400);

        await OrderItem.create(
            [{
                order: order._id,
                campaign: item.campaign,
                product: item.product,
                variant: item.variant,
                size: sizeId,
                name: item.name,
                color: item.color,
                basePrice: item.basePrice,
                finalPrice: item.finalPrice,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
            }],
            { session }
        );
    };

    return order._id;
}

async function updateOrderStatus({ session, providerTxId }) {
    const transaction = await Transaction.findOneAndUpdate(
        { providerTransactionId: providerTxId, status: 'pending' },
        {
            $unset: { providerPayLink: "" },
            $set: { status: 'completed' },
            $inc: { __v: 1 }
        },
        { new: true, session }
    );
    if (!transaction) throwError("TRX.WEBHOOK", "Không tìm thấy giao dịch để cập nhật", 404);

    // await Order.findByIdAndUpdate(
    //     transaction.order,
    //     { $set: { status: 'confirmed' }, $inc: { __v: 1 } },
    //     { new: true, session }
    // );

    const orderItems = await OrderItem.find({ order: transaction.order }).session(session);
    for (const item of orderItems) {
        await VariantSize.findOneAndUpdate(
            { _id: item.size },
            { $inc: { stock: -item.quantity, __v: 1 } },
            { new: true, session }
        );
    }
}

async function cancelOrder({ session, providerTxId }) {
    const transaction = await Transaction.findOneAndUpdate(
        { providerTransactionId: providerTxId },
        {
            $unset: { providerPayLink: "" },
            $set: { status: 'cancelled' },
            $inc: { __v: 1 }
        },
        { new: true, session }
    );
    if (!transaction) throwError("TRX.CANCEL", "Không tìm thấy giao dịch để huỷ", 404);

    return await Order.findByIdAndUpdate(
        transaction.order,
        {
            $set: { status: 'cancelled' },
            $inc: { __v: 1 }
        },
        { new: true, session }
    ).populate('transaction');
}

module.exports = {
    createOrder,
    updateOrderStatus,
    cancelOrder
}