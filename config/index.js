require('dotenv').config();
const cloudinary = require("cloudinary").v2

cloudinary.config({
    // cloud_name: process.env.CLOUDINARY_URL.split('@')[1],
    // api_key: process.env.CLOUDINARY_URL.split('//')[1].split(':')[0],
    // api_secret: process.env.CLOUDINARY_URL.split('//')[1].split(':')[1].split('@')[0]
    secure: true,
});

const payosInstance = require('axios').create({
    baseURL: process.env.PAYOS_URL,
    headers: {
        "x-client-id": process.env.CLIENT_ID,
        "x-api-key": process.env.API_KEY,
    },
});

const zalopayInstance = require('axios').create({
    baseURL: process.env.ZALOPAY_URL,
    headers: {
        "x-client-id": process.env.CLIENT_ID,
        "x-api-key": process.env.API_KEY,
    },
});

const zalopayConfig = {
    app_id: 2553,
    key1: process.env.ZP_KEY1,
    key2: process.env.ZP_KEY2,
};

module.exports = {
    SECRET_KEY: process.env.SECRET_KEY,
    LOCAL_URI: process.env.LOCAL_URI,
    MONGO_URI: process.env.MONGO_URI,
    cloudinary,
    payosInstance,
    CHECKSUM_KEY: process.env.CHECKSUM_KEY,
    zalopayInstance,
    zalopayConfig,
};
