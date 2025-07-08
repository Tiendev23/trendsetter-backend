const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    shippingAddress: { type: String, required: true },
    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    shippingFee: { type: Number, default: 0 },
    // discount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: 'pending',
    },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Order', orderSchema);
