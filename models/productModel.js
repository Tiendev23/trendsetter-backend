const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    image: { type: String },
    banner: { type: String }, // Thêm trường banner ảnh
    description: { type: String },
    sizes: [{ type: String }],
    colors: [{ type: String }],
}, { optimisticConcurrency: true });

module.exports = mongoose.model('Product', productSchema);
