const sendMail = require("../utils/email");
const Otp = require('../models/otpModel')
const User = require('../models/userModel');
const path = require("path");
const fs = require("fs").promises;
const jwt = require('../utils/jwt');
const bcrypt = require('bcrypt');

exports.sendOtp = async function (req, res) {
    try {
        const { to } = req.body;

        // Kiểm tra email tồn tại 
        const user = await User.findOne({ email: to });
        if (!user) {
            return res.status(404).json({ status: 0, message: "Email chưa đăng ký tài khoản" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);

        const templatePath = path.join(__dirname, "../utils/VeryfiOtp.html");
        let htmlContent = await fs.readFile(templatePath, "utf8");
        htmlContent = htmlContent.replace("{{OTP}}", otp);

        //Gửi email
        const mailOptions = {
            from: "Trendsetter <vongprocf@gmail.com>",
            to,
            subject: "Mã OTP xác thực tài khoản",
            html: htmlContent
        };
        const existing = await Otp.findOne({ email: to });
        if (existing) {
            return res.status(429).json({ message: "OTP đã gửi, vui lòng đợi trong giây lát" });
        }
        await sendMail.transporter.sendMail(mailOptions);
        const hashedOtp = await bcrypt.hash(otp.toString(), 10);
        //Lưu OTP vào MongoDB với thời gian tự hết hạn ( 2 phút trong schema)
        await Otp.create({ email: to, otp: hashedOtp });

        res.json({ status: 1, message: "Gửi OTP thành công" });
    } catch (err) {
        console.error("Lỗi gửi OTP:", err);
        res.status(500).json({ status: 0, message: "Gửi OTP thất bại" });
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
    const token = jwt.createJWT(user._id);

    res.json({ message: "Xác thực OTP thành công", token });
};