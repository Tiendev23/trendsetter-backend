const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // null nếu là cấp 1
}, { optimisticConcurrency: true });

module.exports = mongoose.model('Category', categorySchema);
