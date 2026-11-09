const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Гарантовано завантажуємо .env із кореня проєкту
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function getTransporter() {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const isSecure = process.env.SMTP_SECURE === 'ssl' || process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.SMTP_USER,
            pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
        }
    });
}

// Ледачий проксі для зворотної сумісності (наприклад, scripts/test-mail.js)
const transporter = new Proxy({}, {
    get(target, prop) {
        const t = getTransporter();
        const val = t[prop];
        return typeof val === 'function' ? val.bind(t) : val;
    }
});

async function sendMail(to, name, subject, html) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn('SMTP credentials not configured, skipping real email send to', to);
        return { success: true, simulated: true, to, message: 'SMTP credentials not configured. Email logged to server console.' };
    }

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'NovaShop'}" <${process.env.SMTP_FROM_EMAIL || user}>`,
        to: name ? `"${name}" <${to}>` : to,
        subject: subject,
        html: html
    };

    const currentTransporter = getTransporter();
    const info = await currentTransporter.sendMail(mailOptions);
    return { success: true, simulated: false, to, messageId: info.messageId };
}

module.exports = { sendMail, transporter, getTransporter };
