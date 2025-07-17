const { ProductVariant, VariantSize } = require("../models/productModel");
const Review = require("../models/reviewModel");
const { getCampaignForProductCached } = require("./campaignHelper");

const getFinalPrice = (basePrice, campaign) => {
    if (!campaign) return basePrice;
    const discount = campaign.value || 0;
    return campaign.type === 'percentage'
        ? Math.round(basePrice * (1 - discount / 100))
        : Math.round(basePrice - discount);
};

const enrichVariants = async (productId, campaign) => {
    const variants = await ProductVariant.find({ product: productId }).lean();

    return Promise.all(
        variants.map(async variant => {
            const finalPrice = getFinalPrice(variant.basePrice, campaign);
            const inventories = await VariantSize.find({ productVariant: variant._id }, '-productColor');
            return {
                ...variant,
                finalPrice,
                inventories
            };
        })
    );
};

const enrichRating = async (productId) => {
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
    return {
        average: avgRating.toFixed(1),
        count: reviews.length
    };
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

const setActiveVariantInventories = async (variantId, active) => {
    const inventories = await VariantSize.find({ productVariant: variantId });
    await Promise.all(
        inventories.map(item => {
            if (active) item.active = item.stock > 0;
            else item.active = active;
            return item.save();
        })
    );
};

const setVariantsActiveByProduct = async (productId, active) => {
    const variants = await ProductVariant.find({ product: productId });
    await Promise.all(
        variants.map(async variant => {
            variant.active = active;
            await variant.save();
            await setActiveVariantInventories(variant._id, active);
        })
    )
}

module.exports = {
    enrichVariants,
    enrichRating,
    getFinalPrice,
    getEnrichedVariants,
    setVariantsActiveByProduct,
};