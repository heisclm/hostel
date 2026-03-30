const axios = require("axios");

const MNOTIFY_BASE_URL = "https://apps.mnotify.net/smsapi";

const sendSMS = async (to, message) => {
  try {
    let formattedPhone = to.replace(/\s+/g, "").replace(/-/g, "");

    if (formattedPhone.startsWith("0")) {
      formattedPhone = "233" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+233")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }

    const response = await axios.get(MNOTIFY_BASE_URL, {
      params: {
        key: process.env.MNOTIFY_API_KEY,
        to: formattedPhone,
        msg: message,
        sender_id: process.env.MNOTIFY_SENDER_ID || "HostelHub",
      },
    });

    console.log(`SMS sent to ${formattedPhone}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("SMS sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
