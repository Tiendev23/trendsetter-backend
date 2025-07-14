const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middlewares/authMiddleware')
const userController = require('../controllers/userController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.patch('/:id', upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.updateProfile);
router.put('/changePassword', verifyToken, userController.changePassword);

router.get('/:id/favorites', userController.getUserFavorites);
router.post('/:id/favorites', userController.addFavorite);
router.delete('/:userId/favorites/:variantId', userController.removeFavorite);

router.get('/:id/addresses', userController.getUserAddresses);
router.post('/:id/addresses', userController.addShippingAddress);
router.patch('/:userId/addresses/:addressId', userController.updateShippingAddress);
router.delete('/:userId/addresses/:addressId', userController.removeShippingAddress);

router.get('/:userId/orders', userController.getOrdersById);

module.exports = router;
