const cron = require('node-cron');
const Transaction = require('../models/transactionModel');
const { payOS } = require('../config');

cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Kiểm tra giao dịch chưa thanh toán...');
    const thirtyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    const pendingTransactions = await Transaction.find({
        status: 'pending',
        createdAt: { $lt: thirtyMinutesAgo }
    });

    for (const tx of pendingTransactions) {
        try {
            const paymentLink = await payOS.getPaymentLinkInformation(tx.providerTransactionId);

            if (paymentLink.status === 'EXPIRED' || paymentLink.status === 'CANCELED') {
                tx.status = 'cancelled';
                await tx.save();
                console.log(`[CRON] Giao dịch ${tx._id} đã bị hủy.`);
            }
        } catch (err) {
            console.error(`[CRON] Lỗi khi kiểm tra giao dịch ${tx._id}:`, err.message);
        }
    }
});