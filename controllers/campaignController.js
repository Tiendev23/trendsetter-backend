const Campaign = require('../models/campaignModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const { Product, ProductVariant, VariantSize } = require('../models/productModel');
const Review = require('../models/reviewModel');
const { uploadToCloudinary, updateCloudinaryImage } = require('../services/cloudinaryService');
const { safeParseArray, campaignPropsValidator, } = require('../helpers/campaignHelper');
const validateExistence = require('../utils/validates');

exports.getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .populate('products', 'name')
            .populate('categories', 'name')
            .populate('brands', 'name')

        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const { title, description, type, value, startDate, endDate } = req.body;
        const products = safeParseArray(req.body.products);
        const categories = safeParseArray(req.body.categories);
        const brands = safeParseArray(req.body.brands);
        const image = req.files?.image?.[0] || null;
        campaignPropsValidator({ products, categories, brands, title, type, value, startDate, endDate }, res);

        let imageUrl = null;
        if (image) imageUrl = await uploadToCloudinary(image, 'campaigns');
        const campaign = await Campaign.create({
            products,
            categories,
            brands,
            title,
            description,
            type,
            value,
            startDate,
            endDate,
            imageUrl
        });
        res.status(201).json({ message: 'Tạo Campaign thành công', campaign });
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
};

exports.updateCampaign = async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const { title, description, type, value, startDate, endDate, active } = req.body;

        const products = safeParseArray(req.body.products);
        const categories = safeParseArray(req.body.categories);
        const brands = safeParseArray(req.body.brands);
        const image = req.files?.avatar?.[0] || null;

        await campaignPropsValidator({ products, categories, brands, title, type, value, startDate, endDate });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throwError("Not Found", "Campaign không tồn tại", 404);

        const updateFields = {
            products,
            categories,
            brands,
            title,
            description,
            type,
            value,
            startDate,
            endDate,
            active
        };

        if (!active) updateFields.manualOverride = true;
        if (image) updateFields.imageUrl = await updateCloudinaryImage(campaign.imageUrl, image, 'campaigns');

        Object.assign(campaign, updateFields);
        await campaign.save();
        res.status(200).json({ message: 'Cập nhật Campaign thành công', campaign });
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
};