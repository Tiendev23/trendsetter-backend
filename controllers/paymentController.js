const Payment = require('../models/paymentModel');
const { payosInstance, CHECKSUM_KEY, zalopayConfig, zalopayInstance } = require("../config");
const moment = require("moment");
const Crypto = require("crypto");
const { log } = require('console');


exports.getAllMethods = async (req, res) => {
    try {
        const methods = await Payment.find();
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPayOSPayment = async (req, res) => {
    try {
        const { amount, buyerName, buyerEmail, buyerPhone, buyerAddress, items } = req.body;

        if (!amount || !buyerName || !buyerEmail || !buyerPhone || !buyerAddress || !items) {
            return res.status(400).json({ error: "Thiếu thông tin giao dịch" });
        }

        const orderCode = Math.floor(Date.now() / 1000);
        const description = "TRENDSETTER";
        const returnUrl = "https://trendsetter-backend.onrender.com/api/payments/succeeded";
        const cancelUrl = "https://trendsetter-backend.onrender.com/api/payments/cancelled";
        const expiredAt = Math.floor(Date.now() / 1000) + 1200 // Tức lệnh hết hạn sau 20 phút
        const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = Crypto.createHmac("sha256", CHECKSUM_KEY).update(signatureString).digest("hex");

        // Định dạng request body theo đúng cấu trúc mong muốn
        const body = {
            orderCode,
            amount,
            description,
            buyerName,
            buyerEmail,
            buyerPhone,
            buyerAddress,
            items,
            cancelUrl,
            returnUrl,
            expiredAt,
            signature
        };
        // console.log('body:', JSON.stringify(body));
        // Gửi request đến PayOS API
        const response = await payosInstance.post("/v2/payment-requests", body);

        if (response.data.code === "00") {
            return res.json(response.data);
        } else {
            return res.status(400).json({
                code: response.data.code,
                message: response.data.desc,
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const endpoint = "https://trendsetter-backend.onrender.com"
exports.createZaloPayPayment = async (req, res) => {
    try {
        const { amount, buyerName, buyerEmail, buyerPhone, buyerAddress, items, urlCalbackSuccess } = req.body;

        if (!amount || !buyerName || !buyerEmail || !buyerPhone || !buyerAddress || !items) {
            return res.status(400).json({ error: "Thiếu thông tin giao dịch" });
        }

        const { app_id, key1 } = zalopayConfig;
        const app_trans_id = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
        const app_user = buyerName;
        const app_time = Date.now();
        const embed_data = JSON.stringify({
            // preferred_payment_method: [],
            redirecturl: urlCalbackSuccess,
            buyerPhone,
            buyerEmail,
            buyerAddress
        });
        const item = JSON.stringify(items);
        const data = `${app_id}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${item}`;
        const mac = Crypto.createHmac("sha256", key1).update(data).digest("hex");
        const callback_url = `${endpoint}/api/payments/zalopay/callback`;

        const body = {
            app_id,
            app_user,
            app_trans_id,
            app_time,
            amount,
            description: "TRENDSETTER",
            bank_code: "zalopayapp",
            item,
            embed_data,
            phone: buyerPhone,
            email: buyerEmail,
            address: buyerAddress,
            callback_url,
            mac
        };
        const response = await zalopayInstance.post("/v2/create", body);

        if (response.data.return_code === 1) {
            return res.json(response.data);
        } else {
            return res.status(400).json({
                code: response.data.sub_return_code,
                message: response.data.sub_return_message,
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.callbackZaloPay = async (req, res) => {
    try {
        const { data: reqData, mac: reqMac } = req.body;
        const mac = Crypto.createHmac("sha256", zalopayConfig.key2).update(reqData).digest("hex");
        console.log("MAC req:", reqMac);
        console.log("MAC crypto:", mac);
        if (reqMac !== mac) {
            return res.json({
                code: -1,
                message: "MAC không khớp – callback không hợp lệ"
            });
        } else {
            const data = JSON.parse(reqData);
            console.log("Dữ liệu đơn hàng:", data);
            return res.json({
                code: 1,
                message: "Thanh toán thành công"
            });
        }
    } catch (err) {
        res.json({ code: 0, message: err.message });
    }
};