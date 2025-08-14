const cron = require('node-cron');
const Transaction = require('../models/transactionModel');
const { withTransaction } = require('../helpers/dbTransaction');
const { cancelOrder } = require('../services/order.service');

cron.schedule('*/5 * * * *', async () => {
    // console.log('[CRON] Kiểm tra giao dịch chưa thanh toán...');
    const FIFTEEN_MINS = new Date(Date.now() - 15 * 60 * 1000);
    const pendingTrans = await Transaction.find({
        status: 'pending',
        createdAt: { $lt: FIFTEEN_MINS },
        paymentMethod: { $ne: 'cod' }
    });

    for (const trx of pendingTrans) {
        try {
            await withTransaction(async session => {
                await cancelOrder({
                    session,
                    providerTxId: trx.providerTransactionId,
                });
            });
            console.log(`[CRON] Giao dịch ${trx.paymentMethod} ${trx._id} đã bị hủy.`);
        } catch (err) {
            console.error(`[CRON] Lỗi khi kiểm tra giao dịch ${trx._id}:`, err.message);
        }
    }
});