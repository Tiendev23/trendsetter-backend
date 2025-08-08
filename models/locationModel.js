const mongoose = require('mongoose');

const WardSchema = new mongoose.Schema({
    ward_code: { type: String, required: true },
    name: { type: String, required: true }
}, { _id: false });

const ProvinceSchema = new mongoose.Schema({
    province_code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    short_name: { type: String },
    code: { type: String },
    place_type: { type: String },
    wards: [WardSchema]
});

module.exports = mongoose.model('Location', ProvinceSchema);