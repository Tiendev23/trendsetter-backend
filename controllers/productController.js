const { Product, ProductVariant, VariantSize } = require('../models/productModel');
const Review = require('../models/reviewModel');
const { getCampaignForProductCached } = require('../helpers/campaignHelper');
const { uploadToCloudinary, deleteCloudinaryImage } = require('../services/cloudinaryService');
const { getFinalPrice } = require('../helpers/enrichVariant');

// Hàm lấy URL file upload theo field name
const getFileUrl = (req, fieldName) => {
    if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        const file = req.files[fieldName][0];
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    }
    return null;
};

exports.getAllProducts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.brand) filter.brand = req.query.brand;

        const products = await Product.find(filter)
            .populate('category')
            .populate('brand');

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// exports.getProductById = async (req, res) => {
//     try {
//         const product = await Product.findById(req.params.id)
//             .populate('category')
//             .populate('brand');

//         if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
//         res.json(product);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

        const campaign = await getCampaignForProductCached(product, new Map());
        product.campaign = campaign;

        const variants = await ProductVariant.find({ product: product._id }).lean();
        const enrichedVariants = await Promise.all(
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
        product.variants = enrichedVariants;

        const reviews = await Review.find({ product: product._id });
        const avgRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
        product.rating = {
            average: avgRating.toFixed(1),
            count: reviews.length
        };

        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' + err.message });
    }
};

exports.getReviewsById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!await Product.findById(id))
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

        const reviews = await Review.find({ product: id }, '-product')
            .populate('user', 'username fullName avatar')
            .populate('orderDetail', 'productSize productColor')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' + err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, price, category, brand, description, sizes, colors } = req.body;

        //         const image = getFileUrl(req, 'image');
        //         const banner = getFileUrl(req, 'banner');
        let image = null, banner = null;
        image = await uploadToCloudinary(req.files.image?.[0], 'products');
        banner = await uploadToCloudinary(req.files.banner?.[0], 'banners');

        // Xử lý sizes
        let parsedSizes = [];
        if (sizes) {
            if (typeof sizes === 'string') {
                try {
                    parsedSizes = JSON.parse(sizes);
                } catch {
                    parsedSizes = [sizes];
                }
            } else if (Array.isArray(sizes)) {
                parsedSizes = sizes;
            }
        }

        // Xử lý colors
        let parsedColors = [];
        if (colors) {
            if (typeof colors === 'string') {
                try {
                    parsedColors = JSON.parse(colors);
                } catch {
                    parsedColors = [colors];
                }
            } else if (Array.isArray(colors)) {
                parsedColors = colors;
            }
        }

        const product = new Product({
            name,
            price,
            category,
            brand,
            description,
            sizes: parsedSizes,
            colors: parsedColors,
            // sizes: JSON.parse(sizes || "[]"),
            // colors: JSON.parse(colors || "[]"),
            image,
            banner,
        });
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, price, category, brand, description, sizes, colors } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        // const image = getFileUrl(req, 'image');
        // const banner = getFileUrl(req, 'banner');
        // Xử lý upload ảnh
        const image = req.files.image
            ? await uploadToCloudinary(req.files.image[0], "products")
            : product.image;

        const banner = req.files.banner
            ? await uploadToCloudinary(req.files.banner[0], "banners")
            : product.banner;

        // Xóa ảnh cũ trên Cloudinary
        await deleteCloudinaryImage(product.image);
        await deleteCloudinaryImage(product.banner);

        let parsedSizes = [];
        if (sizes) {
            if (typeof sizes === 'string') {
                try {
                    parsedSizes = JSON.parse(sizes);
                } catch {
                    parsedSizes = [sizes];
                }
            } else if (Array.isArray(sizes)) {
                parsedSizes = sizes;
            }
        }

        let parsedColors = [];
        if (colors) {
            if (typeof colors === 'string') {
                try {
                    parsedColors = JSON.parse(colors);
                } catch {
                    parsedColors = [colors];
                }
            } else if (Array.isArray(colors)) {
                parsedColors = colors;
            }
        }

        const updateData = {
            name,
            price,
            category,
            brand,
            description,
            sizes: parsedSizes,
            colors: parsedColors,
        };

        if (image) updateData.image = image;
        if (banner) updateData.banner = banner;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });

        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        await deleteCloudinaryImage(deletedProduct.image);
        await deleteCloudinaryImage(deletedProduct.banner);

        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
