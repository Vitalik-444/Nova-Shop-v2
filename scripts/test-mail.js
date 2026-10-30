const nodemailer = require('nodemailer');
const { sendMail } = require('../server/mailer');

async function testEmail() {
    console.log('--- 1. Тест стандартного mailer (без .env або з наявним .env) ---');
    const localResult = await sendMail('user@example.com', 'Покупець', 'Перевірка NovaShop', '<p>Привіт від NovaShop!</p>');
    console.log('Результат локального sendMail:', localResult);

    console.log('\n--- 2. Тест реальної відправки через Ethereal SMTP (Nodemailer test service) ---');
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('Створено тестовий акаунт Ethereal:', testAccount.user);

        const transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        const info = await transporter.sendMail({
            from: '"NovaShop" <noreply@novashop.local>',
            to: '"Іван Шевченко" <ivan@example.com>',
            subject: 'Ваше замовлення #42 успішно оформлено!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #10b981;">Дякуємо за ваше замовлення у NovaShop!</h2>
                    <p>Замовлення <b>#42</b> прийнято в обробку.</p>
                    <p>Сума: <b>$249.99</b></p>
                    <p>Доставка: Нова Пошта, Відділення №1</p>
                </div>
            `
        });

        console.log('✓ Лист успішно надіслано в тестову поштову мережу!');
        console.log('Message ID:', info.messageId);
        console.log('Переглянути лист онлайн (Preview URL):', nodemailer.getTestMessageUrl(info));
        return true;
    } catch (err) {
        console.error('Помилка тестового відправлення:', err.message);
        return false;
    }
}

testEmail();
