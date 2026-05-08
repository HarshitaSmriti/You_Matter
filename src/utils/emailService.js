import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: guardianEmail,
    subject: "Urgent Mental Health Alert",
    html: `
      <h2>Crisis Alert</h2>

      <p>${escapeHtml(userName)} may be experiencing emotional distress.</p>

      <p><strong>Detected Message:</strong></p>

      <blockquote>${escapeHtml(message)}</blockquote>

      <p>Please check on them immediately.</p>
    `,
  });

  console.log("Crisis email sent");
};
