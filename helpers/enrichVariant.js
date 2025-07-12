const { ProductVariant } = require("../models/productModel");
const { getCampaignForProductCached } = require("./campaignHelper");

const getFinalPrice = (basePrice, campaign) => {
    if (!campaign) return basePrice;
    const discount = campaign.value || 0;
    return campaign.type === 'percentage'
        ? Math.round(basePrice * (1 - discount / 100))
        : Math.round(basePrice - discount);
};

const getEnrichedVariants = async (filter) => {
    let variants = await ProductVariant.find(filter)
        .populate({
            path: 'product',
            populate: [
                {
                    path: 'category',
                    select: 'name parent',
                    populate: { path: 'parent', select: 'name' }
                },
                {
                    path: 'brand',
                    select: 'name'
                }
            ]
        })
        .lean();
    const campaignCache = new Map();
    variants = await Promise.all(
        variants.map(async variant => {
            const campaign = await getCampaignForProductCached(variant.product, campaignCache);
            const finalPrice = getFinalPrice(variant.basePrice, campaign);

            return {
                ...variant,
                finalPrice,
                campaign
            };
        })
    );
    return variants;
};

module.exports = {
    getFinalPrice,
    getEnrichedVariants,
};