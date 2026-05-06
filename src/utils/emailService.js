import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendCrisisEmail = async (
  guardianEmail,
  userName,
  message
) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: guardianEmail,
      subject: "Urgent Mental Health Alert",
      html: `
        <h2>Crisis Alert</h2>

        <p>${userName} may be experiencing emotional distress.</p>

        <p><strong>Detected Message:</strong></p>

        <blockquote>${message}</blockquote>

        <p>Please check on them immediately.</p>
      `,
    });

    console.log("Crisis email sent");
  } catch (error) {
    console.log("Email error:", error);
  }
};