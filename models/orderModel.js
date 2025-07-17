const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    pickupMethod: {
        type: String,
        enum: ['delivery', 'in-store'],
        default: 'delivery'
    },
    shippingAddress: { type: String },
    recipientName: { type: String },
    recipientPhone: { type: String },
    shippingFee: { type: Number, default: 0 },
    // discount: { type: String, default: null },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: 'pending',
    },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Order', orderSchema);
