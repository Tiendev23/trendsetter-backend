const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true }, // giá tại thời điểm đặt
            size: { type: String },
            color: { type: String },
        },
    ],
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Order', orderSchema);
