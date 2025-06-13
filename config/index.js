require('dotenv').config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "trendsetter",
    api_key: "392848611572862",
    api_secret: "iMMifNcnulZ2IWNAh_ms3ZcHzss"
});

module.exports = {
    SECRET_KEY: process.env.SECRET_KEY,
    MONGO_URI: process.env.MONGO_URI,
    cloudinary,
};
