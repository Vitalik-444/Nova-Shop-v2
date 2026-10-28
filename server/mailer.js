const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'ssl' || parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendMail(to, name, subject, html) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured, skipping email send to', to);
        return;
    }

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'NovaShop'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: `"${name}" <${to}>`,
        subject: subject,
        html: html
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
