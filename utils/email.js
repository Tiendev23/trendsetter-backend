const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'vongprocf@gmail.com',
        pass: 'dsao nlvl dmjv gufq'
    }

});


module.exports = { transporter };