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
    imageUrl: { type: String },
    // appliedCount: { type: Number, default: 0 },
    active: { type: Boolean },
    manualOverride: { type: Boolean, default: false }
}, {
    timestamps: true,
    optimisticConcurrency: true
});

campaignSchema.pre('save', function (next) {
    const now = new Date();
    this.active = this.startDate <= now && now <= this.endDate;
    next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
