const axios = require("axios");

const sendEmail = async ({ to, toName, subject, textContent, htmlContent }) => {
  try {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.warn("Mailjet not configured. Skipping email.");
      return { success: false, error: "Mailjet not configured" };
    }

    const response = await axios.post(
      "https://api.mailjet.com/v3.1/send",
      {
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL || "noreply@hostelhub.com",
              Name: process.env.MAILJET_FROM_NAME || "HostelHub",
            },
            To: [
              {
                Email: to,
                Name: toName || to,
              },
            ],
            Subject: subject,
            TextPart: textContent,
            HTMLPart: htmlContent,
          },
        ],
      },
      {
        auth: {
          username: process.env.MAILJET_API_KEY,
          password: process.env.MAILJET_SECRET_KEY,
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`Email sent to ${to}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
