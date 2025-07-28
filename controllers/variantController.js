const { Product, ProductVariant } = require('../models');
const Category = require('../models/categoryModel');
const { cloudinary } = require('../config');
const { getEnrichedVariants } = require('../helpers/productHelper');

const parseMultiValue = (value) => {
    if (!value) return undefined;
    return value.split(',').map(v => v.trim()).filter(Boolean);
};

// Hàm lấy URL file upload theo field name
const getFileUrl = (req, fieldName) => {
    if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        const file = req.files[fieldName][0];
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    }
    return null;
};

/** getProductVariants
exports.getProductVariants = async (req, res) => {
    try {
        const variants = await productVariant.find()
            .populate({
                path: 'product',
                populate: [
                    {
                        path: 'category',
                        select: 'name parent',
                        populate: { path: 'parent', select: 'name' }
                    },
                    { path: 'brand', select: 'name' }
                ]
            })
            .lean();

        const campaignCache = new Map();
        const enrichedVariants = await Promise.all(
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

        res.json(enrichedVariants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
*/

exports.getAllVariants = async (req, res) => {
    try {
        // Lấy giá trị lọc
        const brandFilter = parseMultiValue(req.query.brand);
        const categoryFilter = parseMultiValue(req.query.category) || [];
        const parentCategoryFilter = parseMultiValue(req.query.parentCategory);
        const colorFilter = parseMultiValue(req.query.color);
        const minPrice = req.query.minPrice || 0;
        const maxPrice = req.query.maxPrice || Infinity;
        // Lấy child categories theo parent
        let childCategoryIds = [];
        if (parentCategoryFilter) {
            const childCategories = await Category.find({ parent: { $in: parentCategoryFilter } }).select('_id');
            childCategoryIds = childCategories.map(c => c._id.toString());
        }
        const allCategoryIds = [...categoryFilter, ...childCategoryIds];

        const productFilter = {};
        // if (categoryFilter) productFilter.category = { $in: categoryFilter };
        if (brandFilter) productFilter.brand = { $in: brandFilter };
        if (allCategoryIds.length > 0) {
            productFilter.category = { $in: allCategoryIds };
        }

        const products = await Product.find(productFilter).select('_id');
        const productIds = products.map(p => p._id);

        const variantFilter = {};
        if (productIds.length > 0) variantFilter.product = { $in: productIds };
        if (colorFilter) variantFilter.color = { $in: colorFilter };

        const variants = await getEnrichedVariants(variantFilter);
        const enrichedVariants = variants.filter(v => v.finalPrice >= minPrice && v.finalPrice <= maxPrice);

        res.json(enrichedVariants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};