const { Campaign, Product, Category, Brand } = require('../models');
const mongoose = require('mongoose');
const { throwError } = require('./errorHelper')

const getCampaignIdForProduct = async (product) => {
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
    }).select('_id');
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

const safeParseArray = (value) => {
    try {
        return value ? JSON.parse(value) : [];
    } catch {
        return [];
    }

};

const isValidObjectIdArray = async (ids, model) => {
    if (!Array.isArray(ids)) return false;
    const count = await model.countDocuments({ _id: { $in: ids } });
    return count === ids.length;
};

const campaignPropsValidator = async (props) => {
    if (!props.products?.length && !props.categories?.length && !props.brands?.length)
        throwError('Bad Request', 'Chiến dịch phải áp dụng cho ít nhất một nhóm sản phẩm, danh mục hoặc thương hiệu', 400);

    if (!props.title || !props.type || !props.value || !props.startDate || !props.endDate)
        throwError('Bad Request', 'Thiếu thông tin chiến dịch', 400);

    const validProducts = await isValidObjectIdArray(props.products, Product);
    const validCategories = await isValidObjectIdArray(props.categories, Category);
    const validBrands = await isValidObjectIdArray(props.brands, Brand);
    if (!validProducts || !validCategories || !validBrands)
        throwError('Not Found', 'Danh sách sản phẩm, danh mục hoặc thương hiệu không hợp lệ', 404);

    if (props.type === 'percentage' && (props.value < 1 || props.value > 100))
        throwError('Unprocessable Entity', 'Giá trị phần trăm không hợp lệ', 422);

    if (new Date(props.startDate) >= new Date(props.endDate))
        throwError('Unprocessable Entity', 'Ngày bắt đầu phải trước ngày kết thúc', 422);
};


module.exports = {
    getCampaignIdForProduct,
    getCampaignForProductCached,
    safeParseArray,
    isValidObjectIdArray,
    campaignPropsValidator,
};