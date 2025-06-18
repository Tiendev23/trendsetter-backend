const crypto = require("crypto");
const { payosInstance, CHECKSUM_KEY } = require("../config");

// exports.createPayment = async (amount) => {
//     try {
//         const orderCode = Math.floor(Date.now() / 1000);
//         const description = "TRENDSETTER";
//         const returnUrl = "https://ps27928.onrender.com/cancel";
//         const cancelUrl = "https://ps27928.onrender.com/cancel";

//         // Tạo chữ ký để xác thực
//         const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
//         const signature = crypto.createHmac("sha256", CHECKSUM_KEY).update(signatureString).digest("hex");

//         const body = { orderCode, amount, description, returnUrl, cancelUrl, signature };

//         // Gửi request đến PayOS
//         const response = await payosInstance.post(`${PAYOS_URL}/v2/payment-requests`, body);

//         if (response.data.code === 0) {
//             return { paymentUrl: response.data.data.checkoutUrl };
//         } else {
//             throw new Error(response.data.message);
//         }
//     } catch (error) {
//         throw new Error(error.message);
//     }
// };

exports.createPayment = async (paymentData) => {
    try {
        const { amount, buyerName, buyerEmail, buyerPhone, buyerAddress, items } = paymentData;
        const orderCode = Math.floor(Date.now() / 1000);
        const description = "TRENDSETTER";
        const returnUrl = "https://ps27928.onrender.com/cancel";
        const cancelUrl = "https://ps27928.onrender.com/cancel";
        const expiredAt = Math.floor(Date.now() / 1000) + 1200 // Tức lệnh hết hạn sau 20 phút

        // Tạo chữ ký để xác thực request
        const signatureString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}&expiredAt=${expiredAt}`;
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

        // Gửi request đến PayOS API
        const response = await payosInstance.post("/v2/payment-requests", body);

        if (response.data.code === 0) {
            return { paymentUrl: response.data.data.checkoutUrl };
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        throw new Error(error.message);
    }
};
