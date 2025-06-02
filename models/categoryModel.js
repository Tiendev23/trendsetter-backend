const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // null nếu là cấp 1
});

module.exports = mongoose.model('Category', categorySchema);
