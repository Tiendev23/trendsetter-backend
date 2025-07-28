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
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        if (
            req.params.userId &&
            user.role !== 'admin' &&
            user._id.toString() !== req.params.userId
        ) {
            return res
                .status(403)
                .json({ message: 'Không có quyền truy cập vào người dùng này' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ', error: error.message });
    }
};

exports.verifyTokenByPurpose = (expectedPurpose) => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Không có token xác thực' });
        }
        const token = authHeader.split(' ')[1];

        try {
            const decoded = authenticateJWT(token);
            if (decoded.purpose !== expectedPurpose) {
                return res.status(403).json({ message: `Token không hợp lệ cho mục đích '${expectedPurpose}'` });
            }

            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ', error: error.message });
        }
    };
};

