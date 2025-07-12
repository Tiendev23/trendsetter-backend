const { transporter } = require("../../config");
const path = require('path');
const fs = require("fs").promises;

const sendOtpMail = async (to, otp) => {
    const templatePath = path.join(__dirname, 'templates', 'verifyOtp.html');
    let htmlContent = await fs.readFile(templatePath, "utf8");
    htmlContent = htmlContent.replace("{{OTP}}", otp);

    const mailOptions = {
        from: "Trendsetter <vongprocf@gmail.com>",
        to,
        subject: "Mã OTP xác thực tài khoản",
        html: htmlContent
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendOtpMail;