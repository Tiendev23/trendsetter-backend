const Payment = require('../models/paymentModel');
const { payosInstance, CHECKSUM_KEY, zalopayConfig, zalopayInstance } = require("../config");
const moment = require("moment");
const Crypto = require("crypto");


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

exports.zaloPayRedirectHandler = async (req, res) => {
    const { status, apptransid } = req.query;
    // Nếu thanh toán thành công (status === '1')
    if (status === '1') {
        // Redirect về app bạn – màn thành công
        return res.redirect(`trendsetter://payments/succeeded?apptransid=${apptransid}`);
    } else {
        // Redirect về app bạn – màn hủy/thất bại
        return res.redirect(`trendsetter://payments/cancelled?status=${status}&apptransid=${apptransid}`);
    }
};

exports.createZaloPayPayment = async (req, res) => {
    try {
        const { amount, buyerName, buyerEmail, buyerPhone, buyerAddress, items } = req.body;
        const { app_id, key1 } = zalopayConfig;
        if (!amount || !buyerName || !buyerEmail || !buyerPhone || !buyerAddress || !items) {
            return res.status(400).json({ error: "Thiếu thông tin giao dịch" });
        }

        // const callback_url = "https://trendsetter-backend.onrender.com/api/payments/callback";
        const callback_url = "https://1a56-116-110-41-68.ngrok-free.app/api/payments/callback";
        const app_user = buyerName;
        const app_trans_id = moment().format("YYMMDD") + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
        const app_time = Date.now();
        const item = JSON.stringify(items);
        const embed_data = JSON.stringify({
            // preferred_payment_method: [],
            // redirecturl: "https://trendsetter-backend.onrender.com/api/payments/succeeded",
            redirecturl: "https://trendsetter-backend.onrender.com/api/payments/succeeded",
            buyerPhone,
            buyerEmail,
            buyerAddress
        });
        console.log("embed_data:", embed_data);
        const data = `${app_id}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${item}`;
        const mac = Crypto.createHmac("sha256", key1).update(data).digest("hex");

        // Định dạng request body theo đúng cấu trúc mong muốn
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
        console.log("BODY JSON:", JSON.stringify(body, null, 2));
        // Gửi request đến PayOS API
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