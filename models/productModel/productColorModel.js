const mongoose = require('mongoose');

const productColorSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: String, required: true },
    images: [{ type: String }],
    basePrice: { type: Number, required: true },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('ProductColor', productColorSchema);
