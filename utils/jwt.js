const { SECRET_KEY } = require('../config'); // Đảm bảo bạn đã định nghĩa SECRETKEY
const jwt = require('jsonwebtoken');

// Hàm tạo token đặt lại mật khẩu
const createJWT = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '10m' }); // Token có hiệu lực 10 phút
};

const authenticateJWT = (token) => {
    return jwt.verify(token, SECRET_KEY);
};



module.exports = {
    createJWT,
    authenticateJWT,
};
