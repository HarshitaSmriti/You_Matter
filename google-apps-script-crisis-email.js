function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");
  const recipients = Array.isArray(data.to) ? data.to.join(",") : data.to;

  if (!recipients) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Missing recipients" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  MailApp.sendEmail({
    to: recipients,
    subject: data.subject || "Urgent Mental Health Alert",
    htmlBody: `
      <h2>Crisis Alert</h2>
      <p>${data.userName || "A user"} may be experiencing emotional distress.</p>
      <p><strong>Detected Message:</strong></p>
      <blockquote>${data.message || ""}</blockquote>
      <p>Please check on them immediately.</p>
    `,
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
