const Campaign = require('../models/campaignModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const { Product, ProductVariant, VariantSize } = require('../models/productModel');
const Review = require('../models/reviewModel');
const { uploadToCloudinary, updateCloudinaryImage } = require('../services/cloudinaryService');
const { toArray, campaignPropsValidator, } = require('../helpers/campaignHelper');

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
        const products = toArray(req.body.products);
        const categories = toArray(req.body.products);
        const brands = toArray(req.body.brands);
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
        res.status(400).json({ message: error.message });
    }
};

exports.updateCampaign = async (req, res) => {
    try {
        const campaignId = req.params.id;
        const { title, description, type, value, startDate, endDate, active } = req.body;
        const products = toArray(req.body.products);
        const categories = toArray(req.body.products);
        const brands = toArray(req.body.brands);
        const image = req.files?.avatar?.[0] || null;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) return res.status(404).json({ message: "Campaign không tồn tại" });
        await campaignPropsValidator({ products, categories, brands, title, type, value, startDate, endDate });

        campaign.products = products;
        campaign.categories = categories;
        campaign.brands = brands;
        campaign.title = title;
        campaign.description = description;
        campaign.type = type;
        campaign.value = value;
        campaign.startDate = startDate;
        campaign.endDate = endDate;
        campaign.active = active;
        if (!active) campaign.manualOverride = true;
        if (image) campaign.imageUrl = await updateCloudinaryImage(campaign.imageUrl, image, 'campaigns');

        await campaign.save();
        res.status(200).json({ message: 'Cập nhật Campaign thành công', campaign });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};