// const Payment = require('../models/paymentModel');
const { payosInstance, CHECKSUM_KEY, zalopayConfig, zalopayInstance } = require("../config");
const moment = require("moment");
const Crypto = require("crypto");
const zaloPay = require('../services/zalopay.service');
const payOS = require('../services/payos.service');
const { payOS: PayOS } = require('../config');


exports.createTransaction = async (req, res) => {
    try {
        const provider = req.params.provider;
        switch (provider) {
            case 'zalopay':
                return await zaloPay.createTransaction(req, res);
            case 'payos':
                return await payOS.createTransaction(req, res);
            default:
                return res.status(400).json({ message: 'Unsupported payment provider' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        const provider = req.params.provider;
        switch (provider) {
            case 'zalopay':
                return await zaloPay.handleCallback(req, res);
            case 'payos':
                return await payOS.handleCallback(req, res);
            default:
                return res.status(400).json({ message: 'Unsupported webhook provider' });
        }
    } catch (err) {
        console.error(`Webhook error from ${req.provider}:`, err.message);
        res.status(500).json({ message: err.message });
    }
};
exports.handlePayOSWebhook = async (req, res) => {
    try {
        if (!req.body || !req.body.data || !req.body.signature) {
            console.log("Webhook test received (incomplete payload):", req.body);
            return res.status(200).send("OK"); // Trả về 200 để xác nhận webhook
        }

        const webhookData = PayOS.verifyPaymentWebhookData(req.body);
        console.log("Webhook verified:", webhookData);

        // Xử lý tiếp...
        res.status(200).json({ message: "Webhook processed" });
    } catch (err) {
        console.error(`Webhook error from PayOS:`, err.message);
        res.status(500).json({ message: err.message });
    }
};