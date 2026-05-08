import nodemailer from "nodemailer";
import { resolve4 } from "dns/promises";
import axios from "axios";

const createGmailTransporter = ({ host, port, secure }) =>
  nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      servername: "smtp.gmail.com",
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const getGmailIpv4Host = async () => {
  const addresses = await resolve4("smtp.gmail.com");
  return addresses[0];
};

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

  if (process.env.CRISIS_EMAIL_WEBHOOK_URL) {
    const response = await axios.post(
      process.env.CRISIS_EMAIL_WEBHOOK_URL,
      {
        to: guardianEmail,
        userName,
        message,
        subject: "Urgent Mental Health Alert",
      },
      { timeout: 15000 }
    );

    console.log("Crisis email webhook sent:", response.status);
    return response.data;
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

  const gmailHost = await getGmailIpv4Host();
  const gmailTransporters = [
    createGmailTransporter({ host: gmailHost, port: 465, secure: true }),
    createGmailTransporter({ host: gmailHost, port: 587, secure: false }),
  ];

  console.log("Using Gmail SMTP IPv4 host:", gmailHost);

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
