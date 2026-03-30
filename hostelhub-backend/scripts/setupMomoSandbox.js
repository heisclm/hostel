
require("dotenv").config(); 

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const MOMO_BASE_URL = "https://sandbox.momodeveloper.mtn.com";

async function setupSandboxUser(subscriptionKey, product) {
  const apiUserId = uuidv4();

  console.log(`\n Setting up ${product} API User`);
  console.log(`Generated User ID: ${apiUserId}`);

  try {
   
    await axios.post(
      `${MOMO_BASE_URL}/v1_0/apiuser`,
      {
        providerCallbackHost: "webhook.site",
      },
      {
        headers: {
          "X-Reference-Id": apiUserId,
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("API User created successfully");

    const keyResponse = await axios.post(
      `${MOMO_BASE_URL}/v1_0/apiuser/${apiUserId}/apikey`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      },
    );

    const apiKey = keyResponse.data.apiKey;
    console.log("API Key generated successfully");

    console.log(`\n Copy these to your .env file:`);
    console.log(`MOMO_${product.toUpperCase()}_API_USER=${apiUserId}`);
    console.log(`MOMO_${product.toUpperCase()}_API_KEY=${apiKey}`);

    return { apiUserId, apiKey };
  } catch (error) {
    console.error(
      `Error setting up ${product}:`,
      error.response?.data || error.message,
    );

    if (error.response?.status === 401) {
      console.error(
        "   → Your subscription key is invalid. Check the MoMo Developer Portal.",
      );
    }
    if (error.response?.status === 409) {
      console.error(
        "   → This API user already exists. The script generates new UUIDs each time, so this shouldn't happen. Try again.",
      );
    }
    throw error;
  }
}

async function main() {
  console.log("MTN MoMo Sandbox Setup");
  
  const COLLECTION_SUB_KEY =
    process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY;
  const DISBURSEMENT_SUB_KEY =
    process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY;

  if (!COLLECTION_SUB_KEY || !DISBURSEMENT_SUB_KEY) {
    console.error("Missing subscription keys in your .env file!\n");
    console.error("Make sure your .env has:");
    console.error(
      "   MOMO_COLLECTION_SUBSCRIPTION_KEY=your_key_here",
    );
    console.error(
      "   MOMO_DISBURSEMENT_SUBSCRIPTION_KEY=your_key_here",
    );
    console.error(
      "\nGet these from: https://momodeveloper.mtn.com → Products → Subscribe",
    );
    process.exit(1);
  }

  console.log(
    `Collection Key: ${COLLECTION_SUB_KEY.substring(0, 8)}...`,
  );
  console.log(
    `Disbursement Key: ${DISBURSEMENT_SUB_KEY.substring(0, 8)}...`,
  );

  try {
    const collection = await setupSandboxUser(
      COLLECTION_SUB_KEY,
      "COLLECTION",
    );
    const disbursement = await setupSandboxUser(
      DISBURSEMENT_SUB_KEY,
      "DISBURSEMENT",
    );

 
    console.log("SETUP COMPLETE!");
   
    console.log("\nUpdate your .env file with these values:\n");
    console.log(
      `MOMO_COLLECTION_API_USER=${collection.apiUserId}`,
    );
    console.log(`MOMO_COLLECTION_API_KEY=${collection.apiKey}`);
    console.log(
      `MOMO_DISBURSEMENT_API_USER=${disbursement.apiUserId}`,
    );
    console.log(`MOMO_DISBURSEMENT_API_KEY=${disbursement.apiKey}`);
    console.log("\n========================================");
    console.log(
      "IMPORTANT: Replace the old values in .env, then restart your server!",
    );
    console.log("========================================\n");
  } catch (error) {
    console.error("\nSetup failed. See errors above.");
    console.error(
      "Common fixes: Check your subscription keys on https://momodeveloper.mtn.com",
    );
    process.exit(1);
  }
}

main();