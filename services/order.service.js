const { throwError } = require('../helpers/errorHelper');
const { Order, OrderItem, Transaction, CartItem, VariantSize } = require('../models');
const { validateExistence } = require('../utils/validates');

exports.calculateShippingFee = (amount, items) => {
    const subtotal = items.reduce((sum, item) => sum + item.finalPrice, 0);
    return (amount - subtotal)
}

exports.createOrderFromTransaction = async (transactionData) => {
    try {
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
                const cartItemId = await validateExistence(CartItem, item._id);
                await CartItem.findByIdAndDelete(cartItemId);
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
                    throwError("Invalid", `Variant ${item.variant} không đủ stock`, 400);
                }
                return await OrderItem.create({
                    order: order._id,
                    campaign: item.campaign,
                    variant: item.variant,
                    size: item.size._id,
                    name: item.name,
                    color: item.color,
                    basePrice: item.basePrice,
                    finalPrice: item.finalPrice,
                    imageUrl: item.imageUrl,
                    quantity: item.quantity,
                })
            })
        );
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};