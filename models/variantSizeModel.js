const mongoose = require('mongoose');

const variantSizeSchema = new mongoose.Schema({
    productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

variantSizeSchema.post('findOneAndUpdate', async function (doc) {
    if (!doc) return;

    if (doc.stock === 0 && doc.active !== false) {
        await mongoose.model('VariantSize').updateOne(
            { _id: doc._id },
            { $set: { active: false } }
        );
    }
});

module.exports = mongoose.model('VariantSize', variantSizeSchema);
