const crypto = require("crypto");
const { payosInstance, CHECKSUM_KEY } = require("../config");

exports.createPayment = async (paymentData) => {
    try {
        const { amount, buyerName, buyerEmail, buyerPhone, buyerAddress, items } = paymentData;
        const orderCode = Math.floor(Date.now() / 1000);
        const description = "TRENDSETTER";
        const returnUrl = "https://trendsetter-backend.onrender.com/api/payments/succeeded";
        const cancelUrl = "https://trendsetter-backend.onrender.com/api/payments/cancelled";
        const expiredAt = Math.floor(Date.now() / 1000) + 1200 // Tức lệnh hết hạn sau 20 phút

        // Tạo chữ ký để xác thực request
        const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = crypto.createHmac("sha256", CHECKSUM_KEY).update(signatureString).digest("hex");

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
            return response.data;
        } else {
            throw new Error("code: " + response.data.code, ", desc: " + response.data.desc);
        }
    } catch (error) {
        console.log('you here >>>> error');
        throw new Error(error.message);
    }
};
