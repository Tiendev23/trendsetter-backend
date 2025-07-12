const User = require('../models/userModel');
const { createJWT } = require('../utils/jwt');
const Bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Sai email / tên đăng nhập hoặc mật khẩu' });
        }
        const isMatch = await Bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Sai email / tên đăng nhập hoặc mật khẩu' });
        };
        const token = createJWT(user._id);
        user.password = undefined;
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.signup = async (req, res) => {
    try {
        const { username, password, email, fullName, role } = req.body;

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