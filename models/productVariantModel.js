const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: String },
    images: [{ type: String }],
    basePrice: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
