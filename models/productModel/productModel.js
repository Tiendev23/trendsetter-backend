const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    name: { type: String, required: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'unisex'],
        default: 'unisex',
    },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Product', productSchema);