const { Product, ProductVariant, VariantSize, Category, Brand, Review } = require('../models');
const { getCampaignForProductCached } = require('../helpers/campaignHelper');
const { uploadToCloudinary, deleteCloudinaryImage } = require('../services/cloudinaryService');
const { getFinalPrice, setVariantsActiveByProduct, enrichVariants, enrichRating } = require('../helpers/productHelper');
const { validateExistence } = require('../utils/validates');
const { throwError } = require('../helpers/errorHelper');

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
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();

        await Promise.all(
            products.map(async product => {
                const campaign = await getCampaignForProductCached(product, new Map());
                product.campaign = campaign;
                product.variants = await enrichVariants(product._id, campaign);
                product.rating = await enrichRating(product._id);
            })
        );
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
        const productId = await validateExistence(Product, req.params.productId);
        const product = await Product.findById(productId)
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();

        const campaign = await getCampaignForProductCached(product, new Map());
        product.campaign = campaign;
        product.variants = await enrichVariants(productId, campaign);
        product.rating = await enrichRating(productId);

        res.json(product);
    } catch (err) {
        const status = err.statusCode || 500;
        res.status(status).json({ message: err.message });
    }
};

exports.getReviewsById = async (req, res) => {
    try {
        const productId = req.params.productId;
        await validateExistence(Product, productId);

        const reviews = await Review.find({ product: productId }, '-product')
            .populate('user', 'username fullName avatar')
            .populate('orderItem', 'productSize productColor')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        const status = err.statusCode || 500;
        res.status(status).json({ message: err.message });
    }
};

/** old createProduct
exports.createProduct = async (req, res) => {
    try {
        const { name, price, category, brand, description, sizes, colors } = req.body;

        //         const image = getFileUrl(req, 'image');
        //         const banner = getFileUrl(req, 'banner');
        let image = null, banner = null;

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
 */
exports.createProduct = async (req, res) => {
    try {
        const { category, brand, name, gender, description, variants } = req.body;
        const files = req.files;

        if (!category || !brand || !name || !variants)
            throwError("Bad Request", "Thiếu thông tin sản phẩm", 400);
        await validateExistence(Category, category);
        await validateExistence(Brand, brand);

        const parsedVariants = JSON.parse(variants); // parse từ chuỗi JSON
        const product = await Product.create({
            category, brand, name, gender, description
        });
        const objProduct = product.toObject();

        const variantDocs = [];
        for (let index = 0; index < parsedVariants.length; index++) {
            const { color, basePrice, inventories } = parsedVariants[index];
            const imageFiles = files?.filter(file => file.fieldname === `images_${index}`);
            const images = await Promise.all(
                imageFiles.map(file => uploadToCloudinary(file, 'Products'))
            );
            const variant = await ProductVariant.create({
                product: product._id,
                color,
                basePrice,
                images
            });
            const objVariant = variant.toObject();

            const inventoryDocs = [];
            for (const obj of inventories) {
                const { size, stock } = obj;
                const inventory = await VariantSize.create({
                    productVariant: variant._id,
                    size,
                    stock
                });
                inventoryDocs.push(inventory);
            }

            objVariant.inventories = inventoryDocs;
            variantDocs.push(objVariant);
        }

        objProduct.variants = variantDocs;
        res.status(201).json({ message: 'Tạo sản phẩm thành công', product: objProduct });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};

/** old updateProduct
exports.updateProduct = async (req, res) => {
    try {
        const { name, price, category, brand, description, sizes, colors } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        // const image = getFileUrl(req, 'image');
        // const banner = getFileUrl(req, 'banner');
        // Xử lý upload ảnh


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
 */
exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { category, brand, name, gender, description, active } = req.body;

        await validateExistence(Product, productId);
        const product = await Product.findById(productId);

        if (category) product.category = category;
        if (brand) product.brand = brand;
        if (gender) product.gender = gender;
        if (description) product.description = description;
        if (typeof active === 'boolean') {
            product.active = active;
            await setVariantsActiveByProduct(productId, active);
        }

        await product.save();
        res.json({ message: 'Cập nhật sản phẩm thành công', product });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
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
