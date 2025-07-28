const { ProductVariant, VariantSize, Review, CartItem } = require("../models");
const { getCampaignForProductCached, getCampaignIdForProduct } = require("./campaignHelper");

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

const getEnrichedCartItems = async (filter) => {
    let cartItems = await CartItem.find(filter)
        .populate({
            path: 'variantSize',
            populate: {
                path: 'productVariant',
                populate: {
                    path: 'product',
                }
            }
        }).lean();

    const campaignCache = new Map();
    cartItems = await Promise.all(
        cartItems.map(async item => {
            const { variantSize, quantity } = item;
            const productVariant = variantSize.productVariant;
            const product = productVariant.product;

            const campaign = await getCampaignForProductCached(product, campaignCache);
            const finalPrice = getFinalPrice(productVariant.basePrice, campaign);

            const genderLabel = product.gender === 'male' ? 'Nam'
                : product.gender === 'female' ? 'Nữ' : 'Unisex';

            const enrichedName = `${product.name} ${genderLabel} Màu ${productVariant.color}`;

            return {
                _id: item._id,
                product: product._id,
                variant: productVariant._id,
                size: {
                    _id: variantSize._id,
                    size: variantSize.size,
                },
                campaign: campaign?._id || null,
                name: enrichedName,
                color: productVariant.color,
                basePrice: productVariant.basePrice,
                finalPrice,
                imageUrl: productVariant.images?.[0] || null,
                quantity
            };
        })
    );

    return cartItems;
};

module.exports = {
    enrichVariants,
    enrichRating,
    getFinalPrice,
    getEnrichedVariants,
    setVariantsActiveByProduct,
    getEnrichedCartItems,
};