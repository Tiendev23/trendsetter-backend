const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    productColor: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductColor', required: true },
    size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
    stock: { type: Number, required: true },
    sku: { type: String, unique: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
