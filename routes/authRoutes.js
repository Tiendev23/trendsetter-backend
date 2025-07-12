const express = require('express');
const router = express.Router();
const { verifyTokenByPurpose } = require('../middlewares/authMiddleware')
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
// Đổi mật khẩu
router.patch('/password', verifyTokenByPurpose('login'), authController.changePassword);
router.post('/forgot-password', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.patch('/reset-password', verifyTokenByPurpose('reset-password'), authController.resetPassword);

module.exports = router;
