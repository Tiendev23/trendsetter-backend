const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
        required: true,
    },
    value: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    imageUrl: { type: String, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('Campaign', campaignSchema);