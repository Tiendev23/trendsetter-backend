const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyTokenByPurpose } = require('../middlewares/authMiddleware');

// router.get('/user/:user', orderController.getOrdersByUser); // Đã có ở users
router.get('/', orderController.getAllOrders);
router.get('/:orderId',
    // verifyTokenByPurpose('login'),
    orderController.getOrderById);

router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.patch('/:orderId/cancel', verifyTokenByPurpose('login'), orderController.cancelOrderById);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
