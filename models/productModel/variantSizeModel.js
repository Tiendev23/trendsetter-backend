const mongoose = require('mongoose');

const variantSizeSchema = new mongoose.Schema({
    productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('VariantSize', variantSizeSchema);
