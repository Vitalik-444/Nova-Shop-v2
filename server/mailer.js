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
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
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

    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromName = process.env.SMTP_FROM_NAME || 'NovaShop';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'nova444shop@gmail.com';

    if (brevoApiKey) {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoApiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: fromName, email: fromEmail },
                    to: [{ email: to, name: name || to }],
                    subject: subject,
                    htmlContent: html
                })
            });
            const data = await response.json();
            if (response.ok && (data.messageId || data.messageIds)) {
                return { success: true, simulated: false, to, messageId: data.messageId || data.messageIds[0] };
            }
            console.warn('Brevo API error:', data);
        } catch (apiErr) {
            console.warn('Brevo request failed:', apiErr.message);
        }
    }

    if (resendApiKey) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: `${fromName} <${fromEmail}>`,
                    to: [to],
                    subject: subject,
                    html: html
                })
            });
            const data = await response.json();
            if (response.ok && data.id) {
                return { success: true, simulated: false, to, messageId: data.id };
            }
            console.warn('Resend API error:', data);
        } catch (apiErr) {
            console.warn('Resend request failed:', apiErr.message);
        }
    }

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn('SMTP credentials not configured, skipping real email send to', to);
        return { success: true, simulated: true, to, message: 'SMTP credentials not configured. Email logged to server console.' };
    }

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: name ? `"${name}" <${to}>` : to,
        subject: subject,
        html: html
    };

    try {
        const currentTransporter = getTransporter();
        const info = await currentTransporter.sendMail(mailOptions);
        return { success: true, simulated: false, to, messageId: info.messageId };
    } catch (err) {
        console.warn('Failed to deliver email to ' + to + ':', err.message);
        return { success: false, simulated: false, to, error: err.message };
    }
}

module.exports = { sendMail, transporter, getTransporter };
