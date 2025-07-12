const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: String, unique: true },
}, { optimisticConcurrency: true });

module.exports = mongoose.model('Color', colorSchema);