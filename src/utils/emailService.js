import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendCrisisEmail = async (to, message) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "URGENT: Mental Health Alert",
        text: `The user may be in distress.\n\nMessage: ${message}`
    });
};