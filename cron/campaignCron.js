const cron = require('node-cron');
const Campaign = require('../models/campaignModel'); // đường dẫn đến model của bạn

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

        if (activated.modifiedCount !== 0)
            console.log(`[${now.toISOString()}] Cập nhật campaign: ${activated.modifiedCount} bật`);
        if (deactivated.modifiedCount !== 0)
            console.log(`[${now.toISOString()}] Cập nhật campaign: ${deactivated.modifiedCount} tắt`);

        // console.log(`[${now.toISOString()}] Cập nhật campaign: ${activated.modifiedCount} bật, ${deactivated.modifiedCount} tắt`);
    } catch (err) {
        console.error(`[${now.toISOString()}] Lỗi cập nhật campaign:`, err.message);
    }
};

/** Hướng dẫn sử dụng cron
 *  Allowed fields
 *  # ┌────────────── second (optional)
 *  # │ ┌──────────── minute
 *  # │ │ ┌────────── hour
 *  # │ │ │ ┌──────── day of month
 *  # │ │ │ │ ┌────── month
 *  # │ │ │ │ │ ┌──── day of week
 *  # │ │ │ │ │ │
 *  # * * * * * *
 * 
 *  Allowed values
 *  field           |   value
 *  second          |   0-59
 *  minute          |   0-59
 *  hour            |   0-23
 *  day of month    |   1-31
 *  month           |   1-12 (or names)
 *  day of week     |   0-7 (or names, 0 or 7 are sunday)
 *  
 *  Schedules a task to be executed according to the provided cron expression.
 *  
 *  @param expression - A cron expression (e.g. '* * * * *' for every minute) that determines when the task executes
 *  @param func - Either a function to be executed or a file path to a module containing the task function
 *  @param options - Optional configuration for the task including timezone and whether to start immediately
 *  @returns The created task instance that can be used to control the task
 *  
 *  @example
 *  // Schedule an inline function to run every minute
 *  const task = schedule('* * * * *', () => console.log('Running every minute'));
 *  
 *  @example
 *  // Schedule background task by providing a separate file to run daily with a specific timezone
 *  const dailyTask = schedule('0 0 * * *', './tasks/daily-backup.js', { timezone: 'America/New_York' });
 */
// Ý nghĩa: run mỗi 0 giây * phút * giờ ... (* là mỗi [field]) 
cron.schedule('*/30 * * * * *', () => {
    updateCampaignStatus();
});