require('dotenv').config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_URL.split('@')[1],
    api_key: process.env.CLOUDINARY_URL.split('//')[1].split(':')[0],
    api_secret: process.env.CLOUDINARY_URL.split('//')[1].split(':')[1].split('@')[0]
});


module.exports = {
    SECRET_KEY: process.env.SECRET_KEY,
    MONGO_URI: process.env.MONGO_URI,
    cloudinary,
};
