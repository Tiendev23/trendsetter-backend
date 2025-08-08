const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String, required: true },
    province: { type: String, required: true },
    isDefault: { type: Boolean, required: true },
});

module.exports = mongoose.model('Address', addressSchema);
