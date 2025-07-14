const cron = require('node-cron');
const Campaign = require('./models/campaignModel'); // đường dẫn đến model của bạn

// Hàm cập nhật trạng thái active
const updateCampaignStatus = async () => {
    const now = new Date();

    try {
        // Kích hoạt các campaign đang trong thời gian hiệu lực và không bị override
        const activated = await Campaign.updateMany(
            {
                manualOverride: false,
                startDate: { $lte: now },
                endDate: { $gte: now },
                active: false
            },
            { $set: { active: true } }
        );

        // Vô hiệu hóa các campaign đã hết hạn hoặc chưa bắt đầu và không bị override
        const deactivated = await Campaign.updateMany(
            {
                manualOverride: false,
                $or: [
                    { endDate: { $lt: now } },
                    { startDate: { $gt: now } }
                ],
                active: true
            },
            { $set: { active: false } }
        );

        console.log(`[${now.toISOString()}] Cập nhật campaign: ${activated.modifiedCount} bật, ${deactivated.modifiedCount} tắt`);
    } catch (err) {
        console.error(`[${now.toISOString()}] Lỗi cập nhật campaign:`, err.message);
    }
};

// Cron job chạy mỗi phút
cron.schedule('* * * * *', () => {
    updateCampaignStatus();
});