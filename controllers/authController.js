const { User, Otp, Address } = require('../models');
const { createJWT } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const sendOtpMail = require('../services/nodemailer/nodemailerService');
const { resError, throwError } = require('../helpers/errorHelper');

exports.login = async (req, res) => {
    try {
        const input = String(req.body.emailOrUsername).trim().toLowerCase();
        const password = req.body.password;
        const user = await User.findOne({
            $or: [{ email: input }, { username: input }]
        }).select('+password');

        if (!user)
            throwError("AUTH.LOGIN", "Sai email / tên đăng nhập hoặc mật khẩu", 404);

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            throwError("AUTH.LOGIN", "Sai email / tên đăng nhập hoặc mật khẩu", 404);

        const enrichedUser = user.toObject();
        delete enrichedUser.password;
        enrichedUser.addresses = await Address.find({ user: user._id }).lean();

        const token = createJWT(user._id, 'login', '2h');
        user.password = undefined;
        res.status(200).json({ token, user: enrichedUser });
    } catch (err) {
        resError(res, err, {
            defaultCode: "AUTH.LOG_IN",
            defaultMessage: "Đăng nhập thất bại"
        })
    }
};

exports.signup = async (req, res) => {
    try {
        const { password, fullName, role } = req.body;
        const username = String(req.body.username).trim().toLowerCase();
        const email = String(req.body.email).trim().toLowerCase();

        const existUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existUser)
            throwError("AUTH.SIGNUP", "Tên đăng nhập hoặc email đã tồn tại", 400);

        const user = new User({ username, password, email, fullName, role });
        const savedUser = await user.save();

        const userData = savedUser.toObject();
        delete userData.password;
        res.status(201).json({ data: userData });
    } catch (err) {
        resError(res, err, {
            defaultCode: "AUTH.SIGN_UP",
            defaultMessage: "Đăng ký thất bại"
        })
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id; // dùng thế này vì verify trả về User

        const user = await User.findById(userId).select('+password');
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        const isSame = await user.comparePassword(newPassword);
        if (isSame) return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ' });

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        // resError(res, err, {
        //     defaultCode: "AUTH.CHG_PWD",
        //     defaultMessage: "Đổi mật khẩu thất bại"
        // })
        res.status(500).json({ message: err.message });
    }
};

exports.sendOtp = async function (req, res) {
    try {
        const { to } = req.body;
        // Kiểm tra email tồn tại 
        const user = await User.findOne({ email: to });
        if (!user) {
            return res.status(404).json({ status: 0, message: "Email chưa đăng ký tài khoản" });
        }
        const existing = await Otp.findOne({ email: to });
        if (existing) {
            return res.status(429).json({ message: "OTP đã gửi, vui lòng đợi trong giây lát" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const hashedOtp = await bcrypt.hash(otp.toString(), 10);
        await sendOtpMail(to, otp);
        //Lưu OTP vào MongoDB với thời gian tự hết hạn ( 2 phút trong schema)
        await Otp.create({ email: to, otp: hashedOtp });
        res.json({ message: "Gửi OTP thành công" });
    } catch (err) {
        res.status(500).json({ message: "Gửi OTP thất bại " + err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email });
    if (!record) return res.status(400).json({ message: "Không tìm thấy OTP" });

    const isMatch = await bcrypt.compare(otp.toString(), record.otp);
    if (!isMatch) return res.status(400).json({ message: "OTP không đúng hoặc hết hạn" });
    // OTP đúng
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    //  Xoá OTP sau khi xác thực
    await Otp.deleteMany({ email });
    //  Tạo JWT token
    const token = createJWT(user._id, 'reset-password', '5m');
    res.json({ message: "Xác thực OTP thành công", token });
};

exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId).select('+password');
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        const isSame = await user.comparePassword(newPassword);
        if (isSame) return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ' });

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};