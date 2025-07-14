const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    providerTransactionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Transaction', transactionSchema);