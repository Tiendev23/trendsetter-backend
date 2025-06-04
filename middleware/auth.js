const jwt = require('jsonwebtoken');

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(403).json({ message: 'Không có token' });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req._id = decoded.id; // Thêm userId vào request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};