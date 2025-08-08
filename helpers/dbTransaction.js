const mongoose = require('mongoose');

/**
 * Chạy tất cả thao tác trong một session transaction.
 * nếu có lỗi xảy ra sẽ huỷ tất cả thao tác trong session
 * tối ưu catch từng lỗi, không kiểm soát được
 * @param {Function} transactionalFn – async (session) => { ... }
 */
async function withTransaction(transactionalFn) {
    const session = await mongoose.startSession();
    let result;

    try {
        await session.withTransaction(async () => {
            result = await transactionalFn(session);
        });
        return result;
    } finally {
        session.endSession();
    }
}

module.exports = { withTransaction };