const Order = require('../models/orderModel');
const OrderDetail = require('../models/orderDetailModel');
const Transaction = require('../models/transactionModel');

exports.calculateShippingFee = (amount, items) => {
    const subtotal = items.reduce((sum, item) => sum + item.finalPrice, 0);
    return (amount - subtotal)
}

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
        items.map(item => OrderDetail.create({
            order: order._id,
            campaign: item.campaign,
            productVariant: item.variant,
            productName: item.name,
            productQuantity: item.quantity,
            productSize: item.size.size,
            productColor: item.color,
            productBasePrice: item.basePrice,
            productFinalPrice: item.finalPrice,
            productImageUrl: item.imageUrl
        }))
    );
};