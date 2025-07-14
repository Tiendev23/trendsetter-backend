const Campaign = require('../models/campaignModel');
const mongoose = require('mongoose');
const { Product } = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');

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

const toArray = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return [input];
    return [];
};

const isValidObjectIdArray = async (ids, model) => {
    if (!Array.isArray(ids)) return false;
    const count = await model.countDocuments({ _id: { $in: ids } });
    return count === ids.length;
};

const campaignPropsValidator = async (props) => {
    if (!props.products?.length && !props.categories?.length && !props.brands?.length)
        throw new Error('Chiến dịch phải áp dụng cho ít nhất một nhóm sản phẩm, danh mục hoặc thương hiệu');

    if (!props.title || !props.type || !props.value || !props.startDate || !props.endDate)
        throw new Error('Thiếu thông tin chiến dịch');

    const validProducts = await isValidObjectIdArray(props.products, Product);
    const validCategories = await isValidObjectIdArray(props.categories, Category);
    const validBrands = await isValidObjectIdArray(props.brands, Brand);
    if (!validProducts || !validCategories || !validBrands)
        throw new Error('Danh sách sản phẩm, danh mục hoặc thương hiệu không hợp lệ');

    if (props.type === 'percentage' && (props.value < 1 || props.value > 100))
        throw new Error('Giá trị phần trăm không hợp lệ');

    if (new Date(props.startDate) >= new Date(props.endDate))
        throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
};


module.exports = {
    getCampaignForProductCached,
    toArray,
    isValidObjectIdArray,
    campaignPropsValidator,
};