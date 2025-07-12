const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
    size: { type: String, required: true, unique: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'unisex'],
        default: 'unisex'
    },
    // type: {
    //     type: String,
    //     enum: ['number', 'characters'],
    //     required: true
    // },
}, { optimisticConcurrency: true });

module.exports = mongoose.model('Size', sizeSchema);