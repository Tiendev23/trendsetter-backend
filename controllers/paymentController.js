const payosService = require("../services/payosService");

exports.createPayOSPayment = async (req, res) => {
    try {
        const paymentData = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!paymentData.amount || paymentData.amount <= 0) {
            return res.status(400).json({ error: "Số tiền không hợp lệ!" });
        }
        if (!paymentData.buyerName || !paymentData.buyerEmail || !paymentData.buyerPhone) {
            return res.status(400).json({ error: "Thiếu thông tin người mua!" });
        }

        // Gọi service xử lý thanh toán
        const result = await payosService.createPayment(paymentData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};