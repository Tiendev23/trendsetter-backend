const zaloPay = require('../services/zalopay.service');
const payOS = require('../services/payos.service');
const cod = require('../services/cod.service');
const { throwError, resError } = require("../helpers/errorHelper");

exports.createTransaction = async (req, res) => {
    try {
        const provider = req.params.provider;
        switch (provider) {
            case 'cod':
                return await cod.createTransaction(req, res);
            case 'zalopay':
                return await zaloPay.createTransaction(req, res);
            case 'payos':
                return await payOS.createTransaction(req, res);
            default:
                throwError("TRX.CREATE", `Phương thức thanh toán ${provider} không được hỗ trợ`, 400);
        }
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CREATE",
            defaultMessage: "Tạo giao dịch thất bại"
        });
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
                throwError("TRX.WEBHOOK", `Phương thức ${provider} không hỗ trợ webhook`);
        }
    } catch (err) {
        console.error(`Webhook error from ${req.provider}:`, err.message);
        resError(res, err, {
            defaultCode: "TRX.WEBHOOK",
            defaultMessage: "Webhook thất bại"
        });
    }
};

exports.cancelTransaction = async (req, res) => {
    try {
        const provider = req.params.provider;
        switch (provider) {
            case 'cod':
                return await cod.handleCancelPayment(req, res);
            case 'zalopay':
                return await zaloPay.handleCancelPayment(req, res);
            case 'payos':
                return await payOS.handleCancelPayment(req, res);
            default:
                throwError("TRX.CANCEL", `Phương thức ${provider} không hỗ trợ webhook`);
        }
    } catch (err) {
        resError(res, err, {
            defaultCode: "TRX.CXL_ORDER",
            defaultMessage: "Huỷ đơn thất bại"
        });
    }
};