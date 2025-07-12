const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    productName: { type: String, required: true },
    productQuantity: { type: Number, required: true, min: 1 },
    productSize: { type: String, required: true },
    productColor: { type: String, required: true },
    productBasePrice: { type: Number, required: true },
    productFinalPrice: { type: Number, required: true },
    productImageUrl: { type: String, required: true },
}, { optimisticConcurrency: true });

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
