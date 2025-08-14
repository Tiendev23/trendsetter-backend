const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    variantSize: { type: mongoose.Schema.Types.ObjectId, ref: VariantSize, required: true },
    quantity: { type: Number, required: true, min: 1 }
});

module.exports = mongoose.model('CartItem', cartItemSchema);