require("dotenv").config();
const axios = require("axios");

const MOMO_BASE_URL =
  process.env.MOMO_BASE_URL ||
  "https://sandbox.momodeveloper.mtn.com";

async function testCollection() {
  console.log("Testing Collection API...\n");

  const apiUser = process.env.MOMO_COLLECTION_API_USER;
  const apiKey = process.env.MOMO_COLLECTION_API_KEY;
  const subKey = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY;

  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString(
    "base64"
  );

  try {
    const response = await axios.post(
      `${MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Ocp-Apim-Subscription-Key": subKey,
        },
      }
    );

    console.log("✅ Collection token success!");
    console.log("Token:", response.data.access_token.substring(0, 20) + "...\n");
  } catch (error) {
    console.error(
      "❌ Collection failed:",
      error.response?.data || error.message
    );
  }
}

async function testDisbursement() {
  console.log("Testing Disbursement API...\n");

  const apiUser = process.env.MOMO_DISBURSEMENT_API_USER;
  const apiKey = process.env.MOMO_DISBURSEMENT_API_KEY;
  const subKey = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY;

  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString(
    "base64"
  );

  try {
    const response = await axios.post(
      `${MOMO_BASE_URL}/disbursement/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Ocp-Apim-Subscription-Key": subKey,
        },
      }
    );

    console.log("✅ Disbursement token success!");
    console.log("Token:", response.data.access_token.substring(0, 20) + "...\n");
  } catch (error) {
    console.error(
      "❌ Disbursement failed:",
      error.response?.data || error.message
    );
  }
}

async function main() {
  console.log("🔍 MoMo Connection Test\n");
  await testCollection();
  await testDisbursement();
}

main();