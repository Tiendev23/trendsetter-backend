// utils/auth.js
const config = require('./env-config'); // Đảm bảo bạn đã định nghĩa SECRETKEY
const jwt = require('jsonwebtoken');

// Hàm tạo token đặt lại mật khẩu
const createJWT = (userId) => {
    const token = jwt.sign({ id: userId }, config.SECRET_KEY, { expiresIn: '600000' }); // Token có hiệu lực 10 phút
    return token;
};

module.exports = {
    createJWT,
};
