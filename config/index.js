require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const nodemailer = require('nodemailer');
const PayOS = require('@payos/node');

const BASE_URL = 'https://trendsetter-backend.onrender.com';
// const BASE_URL = 'https://1e3ef477f165.ngrok-free.app';
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: 'vongprocf@gmail.com',
        pass: 'dsao nlvl dmjv gufq'
    }
});

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

const payOS = new PayOS(
    process.env.CLIENT_ID,
    process.env.API_KEY,
    process.env.CHECKSUM_KEY
);

(async () => {
    try {
        await payOS.confirmWebhook(`${BASE_URL}/api/webhooks/transactions/payos`);
        console.log("PayOS webhook confirmed");
    } catch (error) {
        console.error('error', error);

        console.error("Failed to confirm PayOS webhook:", error.message);
    }
})();


const zalopayInstance = require('axios').create({
    baseURL: process.env.ZALOPAY_URL,
});

const ZALOPAY_CONFIG = {
    app_id: 2553,
    key1: process.env.ZP_KEY1,
    key2: process.env.ZP_KEY2,
    instance: zalopayInstance,
};

module.exports = {
    SECRET_KEY: process.env.SECRET_KEY,
    LOCAL_URI: process.env.LOCAL_URI,
    MONGO_URI: process.env.MONGO_URI,
    cloudinary,
    payOS,
    payosInstance,
    CHECKSUM_KEY: process.env.CHECKSUM_KEY,
    ZALOPAY_CONFIG,
    transporter,
    BASE_URL,
};
