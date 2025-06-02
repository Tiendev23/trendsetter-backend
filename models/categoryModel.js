const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    // Xóa trường image
});

module.exports = mongoose.model('Category', categorySchema);
