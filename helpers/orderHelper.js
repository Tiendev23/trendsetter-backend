const Model = require('../models');

const getEnrichedOrders = async (orders, userId) => {
    const enrichedOrders = await Promise.all(
        orders.map(async order => {
            const orderItems = await Model.OrderItem.find({ order: order._id }).select('-__v').lean();
            let unreviewedCount = 0;
            const enrichedItems = await Promise.all(
                orderItems.map(async item => {
                    const size = await Model.VariantSize.findById(item.size).select('size active').lean();
                    const review = await Model.Review.findOne({ user: userId, orderItem: item._id }).lean();
                    const isReviewed = Boolean(review);
                    if (!isReviewed) unreviewedCount += 1;
                    return {
                        ...item,
                        size: {
                            _id: size._id,
                            size: size.size
                        },
                        active: size.active,
                        isReviewed
                    };
                })
            )

            const allReviewed = unreviewedCount === 0;
            return {
                ...order,
                items: enrichedItems,
                allReviewed
            };
        })
    );
    return enrichedOrders;
};

module.exports = {
    getEnrichedOrders,
}