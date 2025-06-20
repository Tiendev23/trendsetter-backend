const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', required: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment', required: true
    },
    transactionId: {
        type: String, required: true
    },
    status: {
        type: Number,
        default: 3,
        // 1 : Thành công
        // 2 : Thất bại
        // 3 : Đơn hàng chưa thanh toán hoặc giao dịch đang xử lý hoặc quá hạn
    },
    description: {
        type: String,
    },
    amount: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

}, { timestamps: true, optimisticConcurrency: true });

module.exports = mongoose.model('PaymentDetail', transactionSchema);