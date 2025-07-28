const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderItem: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true }, // optional
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, default: '' },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Review', reviewSchema);