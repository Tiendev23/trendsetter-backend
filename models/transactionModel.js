const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    providerTransactionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'refunded'], default: 'pending' },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Transaction', transactionSchema);