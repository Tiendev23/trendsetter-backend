const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// router.get('/user/:user', orderController.getOrdersByUser); // Đã có ở users
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
