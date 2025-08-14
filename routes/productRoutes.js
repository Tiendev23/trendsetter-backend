const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middlewares/upload');
const { verifyToken, verifyTokenByPurpose } = require('../middlewares/authMiddleware');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

router.get('/', productController.getAllProducts);
router.get('/:productId', productController.getProductById);
router.get('/:productId/reviews', productController.getReviewsById);
router.post('/', upload.any(), productController.createProduct);
router.patch('/:productId', productController.updateProduct);

router.post('/:productId/reviews', verifyTokenByPurpose('login'),
    upload.fields([{ name: 'images', maxCount: 3 }]), productController.createReview);

router.delete('/:id', productController.deleteProduct);
// Cho phép upload nhiều trường: image và banner
// router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), productController.createProduct);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), productController.updateProduct);

module.exports = router;
