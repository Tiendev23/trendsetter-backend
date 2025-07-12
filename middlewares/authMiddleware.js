const { authenticateJWT } = require('../utils/jwt');
const User = require('../models/userModel');

exports.verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = authenticateJWT(token);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Token không hợp lệ - không tìm thấy người dùng' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ', error: error.message });
    }
};