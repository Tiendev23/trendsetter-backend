const Product = require('../models/productModel');

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

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('brand');
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, brand, description, sizes, colors } = req.body;

    const image = getFileUrl(req, 'image');
    const banner = getFileUrl(req, 'banner');

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

    const image = getFileUrl(req, 'image');
    const banner = getFileUrl(req, 'banner');

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
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
