const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware')
const userController = require('../controllers/userController');
const upload = require('../middlewares/upload');


router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.patch('/:userId', upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.updateProfile);
router.put('/changePassword', verifyToken, userController.changePassword);

router.get('/:userId/favorites', userController.getUserFavorites);
router.post('/:userId/favorites', userController.addFavorite);
router.delete('/:userId/favorites/:variantId', userController.removeFavorite);

router.get('/:userId/addresses', userController.getUserAddresses);
router.post('/:userId/addresses', userController.addShippingAddress);
router.patch('/:userId/addresses/:addressId', userController.updateShippingAddress);
router.delete('/:userId/addresses/:addressId', userController.removeShippingAddress);

router.get('/:userId/cart', userController.getUserCart);
router.post('/:userId/cart', userController.addOrUpdateCartItem);
router.patch('/:userId/cart/:sizeId', userController.updateCartItem);
router.delete('/:userId/cart/remove-many', userController.removeManyCartItem);
router.delete('/:userId/cart/:sizeId', userController.removeCartItem);
router.delete('/:userId/cart', userController.clearCart);
router.post('/:userId/cart/sync', userController.syncCart);

router.get('/:userId/orders', userController.getUserOrders);

module.exports = router;
