const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    logo: { type: String },
    name: { type: String, required: true },
}, { optimisticConcurrency: true });

module.exports = mongoose.model('Payment', paymentSchema);