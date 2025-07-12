const { SECRET_KEY } = require('../config'); // Đảm bảo bạn đã định nghĩa SECRETKEY
const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token chứa thông tin `userId` và `purpose` với thời hạn tùy chỉnh.
 *
 * Dựa trên mục đích sử dụng (`purpose`), bạn có thể chọn thời hạn (`expiresIn`) phù hợp.
 * 
 * @param {string} userId - ID của người dùng cần gắn vào token.
 * @param {string} purpose - Mục đích sử dụng token (ví dụ: 'login', 'reset-password', '2fa').
 * @param {string} expiresIn - Thời gian hiệu lực của token (ví dụ: '10m', '2h', '1d').
 *
 * @returns {string} - Chuỗi JWT token đã được ký với SECRET_KEY.
 *
 * @example
 * createJWT('user123', 'login', '2h'); // Token đăng nhập có hiệu lực 2 giờ
 * createJWT('user456', 'reset-password', '10m');  // Token OTP có hiệu lực 10 phút
 * createJWT('user789', 'invite', '7d'); // Token mời tham gia có hiệu lực 7 ngày
 *
 * @note
 * Token được ký bằng SECRET_KEY và có thời hạn tùy theo mục đích sử dụng.
 * Đảm bảo `expiresIn` phù hợp với UX và mức độ bảo mật yêu cầu.
 */
const createJWT = (userId, purpose, expiresIn) => {
    return jwt.sign({ userId, purpose }, SECRET_KEY, { expiresIn }); // Token có hiệu lực 10 phút
};

const authenticateJWT = (token) => {
    return jwt.verify(token, SECRET_KEY);
};



module.exports = {
    createJWT,
    authenticateJWT,
};
