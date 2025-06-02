const User = require('../models/userModel');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, email, fullName, role } = req.body;

        // Kiểm tra username hoặc email tồn tại
        const existUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existUser) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }

        const user = new User({ username, password, email, fullName, role });
        const savedUser = await user.save();
        const userData = savedUser.toObject();
        delete userData.password;
        res.status(201).json(userData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, password, email, fullName, role } = req.body;

        const updateData = { username, email, fullName, role };
        if (password) updateData.password = password; // Mật khẩu sẽ được hash bởi pre save

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        Object.assign(user, updateData);
        const savedUser = await user.save();

        const userData = savedUser.toObject();
        delete userData.password;
        res.json(userData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User không tồn tại' });
        res.json({ message: 'User đã được xóa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('favorites');
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const userId = req.params.id;
    const productId = req.body.productId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });

    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }
    res.json({ message: 'Đã thêm sản phẩm vào yêu thích' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.params.id;
    const productId = req.params.productId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });

    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();
    res.json({ message: 'Đã xóa sản phẩm khỏi yêu thích' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
