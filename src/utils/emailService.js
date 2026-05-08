import nodemailer from "nodemailer";

const createGmailTransporter = ({ port, secure }) =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const gmailTransporters = [
  createGmailTransporter({ port: 465, secure: true }),
  createGmailTransporter({ port: 587, secure: false }),
];

const escapeHtml = (value = "") =>
  value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendCrisisEmail = async (
  guardianEmail,
  userName,
  message
) => {
  if (!guardianEmail) {
    throw new Error("Guardian email is missing");
  }

  const mailOptions = {
    from: `"YouMatter Support" <${process.env.EMAIL_USER}>`,
    to: guardianEmail,
    subject: "Urgent Mental Health Alert",
    html: `
      <h2>Crisis Alert</h2>

      <p>${escapeHtml(userName)} may be experiencing emotional distress.</p>

      <p><strong>Detected Message:</strong></p>

      <blockquote>${escapeHtml(message)}</blockquote>

      <p>Please check on them immediately.</p>
    `,
  };

  let lastError;

  for (const transporter of gmailTransporters) {
    try {
      const info = await transporter.sendMail(mailOptions);

      console.log("Crisis email sent:", {
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return info;
    } catch (error) {
      lastError = error;
      console.log("Crisis email transporter failed:", error.message);
    }
  }

  throw lastError;
};
