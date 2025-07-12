const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.patch('/:id', upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.updateProfile);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.get('/:id/favorites', userController.getUserFavorites);
router.post('/:id/favorites', userController.addFavorite);
router.delete('/:id/favorites/:variantId', userController.removeFavorite);

router.get('/:id/addresses', userController.getUserAddresses);
router.post('/:id/addresses', userController.addShippingAddress);
router.delete('/:id/addresses/:addressId', userController.removeShippingAddress);

router.get('/:userId/orders', userController.getOrdersById);

module.exports = router;
