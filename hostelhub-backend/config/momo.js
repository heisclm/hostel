const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const MOMO_BASE_URL =
  process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

const getCollectionToken = async () => {
  try {
    const credentials = Buffer.from(
      `${process.env.MOMO_COLLECTION_API_USER}:${process.env.MOMO_COLLECTION_API_KEY}`,
    ).toString("base64");

    const response = await axios.post(
      `${MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY,
        },
      },
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      " Collection token failed:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to get MoMo collection access token");
  }
};

const requestToPay = async ({
  amount,
  phone,
  externalId,
  payerMessage,
  payeeNote,
}) => {
  try {
    const accessToken = await getCollectionToken();
    const referenceId = uuidv4();

    let formattedPhone = phone.replace(/\s+/g, "").replace(/-/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "233" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }

    if (process.env.MOMO_ENVIRONMENT === "sandbox") {
      console.log(
        `Sandbox mode: Original phone ${formattedPhone}, using sandbox test number`,
      );
    }

    await axios.post(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: String(amount),
        currency: process.env.MOMO_CURRENCY || "EUR",
        externalId: externalId,
        payer: {
          partyIdType: "MSISDN",
          partyId: formattedPhone,
        },
        payerMessage: payerMessage || "HostelHub Hostel Payment",
        payeeNote: payeeNote || "Hostel booking payment",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": process.env.MOMO_ENVIRONMENT || "sandbox",
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`Payment request sent. Reference: ${referenceId}`);

    return {
      referenceId,
      status: "PENDING",
    };
  } catch (error) {
    console.error(
      " Request to Pay failed:",
      error.response?.data || error.message,
    );
    throw new Error(
      `MoMo payment request failed: ${
        error.response?.data?.message || error.message
      }`,
    );
  }
};

const checkPaymentStatus = async (referenceId) => {
  try {
    const accessToken = await getCollectionToken();

    const response = await axios.get(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Target-Environment": process.env.MOMO_ENVIRONMENT || "sandbox",
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY,
        },
      },
    );

    console.log(`Payment status for ${referenceId}:`, response.data.status);

    return response.data;
  } catch (error) {
    console.error(
      " Check payment status failed:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to check payment status");
  }
};

const getDisbursementToken = async () => {
  try {
    const credentials = Buffer.from(
      `${process.env.MOMO_DISBURSEMENT_API_USER}:${process.env.MOMO_DISBURSEMENT_API_KEY}`,
    ).toString("base64");

    const response = await axios.post(
      `${MOMO_BASE_URL}/disbursement/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
        },
      },
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      " Disbursement token failed:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to get MoMo disbursement access token");
  }
};

const transferToManager = async ({
  amount,
  phone,
  externalId,
  payeeNote,
  payerMessage,
}) => {
  try {
    const accessToken = await getDisbursementToken();
    const referenceId = uuidv4();

    let formattedPhone = phone.replace(/\s+/g, "").replace(/-/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "233" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }

    await axios.post(
      `${MOMO_BASE_URL}/disbursement/v1_0/transfer`,
      {
        amount: String(amount),
        currency: process.env.MOMO_CURRENCY || "EUR",
        externalId: externalId,
        payee: {
          partyIdType: "MSISDN",
          partyId: formattedPhone,
        },
        payerMessage: payerMessage || "HostelHub Disbursement",
        payeeNote: payeeNote || "Hostel booking payment disbursement",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": process.env.MOMO_ENVIRONMENT || "sandbox",
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`Disbursement sent. Reference: ${referenceId}`);

    return {
      referenceId,
      status: "PENDING",
    };
  } catch (error) {
    console.error(" Transfer failed:", error.response?.data || error.message);
    throw new Error(
      `MoMo disbursement failed: ${
        error.response?.data?.message || error.message
      }`,
    );
  }
};

const checkDisbursementStatus = async (referenceId) => {
  try {
    const accessToken = await getDisbursementToken();

    const response = await axios.get(
      `${MOMO_BASE_URL}/disbursement/v1_0/transfer/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Target-Environment": process.env.MOMO_ENVIRONMENT || "sandbox",
          "Ocp-Apim-Subscription-Key":
            process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
        },
      },
    );

    console.log(
      `Disbursement status for ${referenceId}:`,
      response.data.status,
    );

    return response.data;
  } catch (error) {
    console.error(
      " Check disbursement status failed:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to check disbursement status");
  }
};

module.exports = {
  getCollectionToken,
  requestToPay,
  checkPaymentStatus,
  getDisbursementToken,
  transferToManager,
  checkDisbursementStatus,
};
