const jwt = require('../utils/jwt');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(403).json({ message: 'Không có token' });

  try {
    const decoded = jwt.authenticateJWT(token);
    req.userId = decoded.userId; // Thêm userId vào request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = { verifyToken };
