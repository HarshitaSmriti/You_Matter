import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(async (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("SMTP READY");

    try {
      const info = await transporter.sendMail({
  from: `"YouMatter Support" <${process.env.EMAIL_USER}>`,
  to: guardianEmail,
  subject: "Urgent Mental Health Alert",
  text: "The user may need immediate emotional support.",
});

      console.log("MAIL SENT");
      console.log(info);
    } catch (err) {
      console.log(err);
    }
  }
});