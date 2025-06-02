const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', productController.getAllProducts);
router.delete('/:id', productController.deleteProduct);
router.get('/:id', productController.getProductById);
// Cho phép upload nhiều trường: image và banner
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), productController.createProduct);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), productController.updateProduct);

module.exports = router;
