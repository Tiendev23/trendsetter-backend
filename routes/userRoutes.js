const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.get('/:id/favorites', userController.getUserFavorites);
router.post('/:id/favorites', userController.addFavorite);
router.delete('/:id/favorites/:productId', userController.removeFavorite);

router.post('/login', userController.login)


module.exports = router;
