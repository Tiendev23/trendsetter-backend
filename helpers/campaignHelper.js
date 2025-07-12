const Campaign = require('../models/campaignModel');

const getCampaignForProduct = async (product) => {
    const now = new Date();
    return await Campaign.findOne({
        active: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $and: [
            { $or: [{ categories: { $size: 0 } }, { categories: product.category }] },
            { $or: [{ brands: { $size: 0 } }, { brands: product.brand }] },
            { $or: [{ products: { $size: 0 } }, { products: product._id }] }
        ]
    });
};

const getCampaignForProductCached = async (product, campaignCache) => {
    const productId = product._id.toString();
    if (campaignCache.has(productId)) return campaignCache.get(productId);

    const campaign = await Campaign.findOne({
        active: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $and: [
            { $or: [{ categories: { $size: 0 } }, { categories: product.category._id || product.category }] },
            { $or: [{ brands: { $size: 0 } }, { brands: product.brand._id || product.brand }] },
            { $or: [{ products: { $size: 0 } }, { products: product._id }] }
        ]
    }).select('_id type value startDate endDate');

    campaignCache.set(productId, campaign);
    return campaign;
};

module.exports = {
    getCampaignForProductCached,
};