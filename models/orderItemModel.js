const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    size: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantSize', required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    basePrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { optimisticConcurrency: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
