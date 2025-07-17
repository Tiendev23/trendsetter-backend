// const Payment = require('../models/paymentModel');
const { payosInstance, CHECKSUM_KEY, zalopayConfig, zalopayInstance } = require("../config");
const moment = require("moment");
const Crypto = require("crypto");
const zaloPay = require('../services/zalopay.service');
const payOS = require('../services/payos.service');


exports.createTransaction = async (req, res) => {
    const { provider } = req.params;
    try {
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
    const { provider } = req.params;
    try {
        switch (provider) {
            case 'zalopay':
                return await zaloPay.handleCallback(req, res);
            case 'payos':
                return await payOS.handleCallback(req, res);
            default:
                return res.status(400).json({ message: 'Unsupported webhook provider' });
        }
    } catch (err) {
        res.json({ code: 0, message: err.message });
    }
};