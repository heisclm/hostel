
require("dotenv").config();
const axios = require("axios");

async function verify() {
  const collectionKey = process.env.MOMO_COLLECTION_SUBSCRIPTION_KEY;
  const disbursementKey = process.env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY;

  console.log("\n Checking your subscription keys...\n");
  console.log(`Collection Key: "${collectionKey}"`);
  console.log(`  Length: ${collectionKey?.length || 0} characters`);
  console.log(`  Has spaces: ${collectionKey?.includes(" ") ? "YES ⚠️" : "No ✅"}`);
  console.log(`  Has quotes: ${collectionKey?.includes('"') || collectionKey?.includes("'") ? "YES REMOVE THEM" : "No ✅"}`);
  console.log();
  console.log(`Disbursement Key: "${disbursementKey}"`);
  console.log(`  Length: ${disbursementKey?.length || 0} characters`);
  console.log(`  Has spaces: ${disbursementKey?.includes(" ") ? "YES ⚠️" : "No ✅"}`);
  console.log(`  Has quotes: ${disbursementKey?.includes('"') || disbursementKey?.includes("'") ? "YES REMOVE THEM" : "No ✅"}`);

  if (collectionKey?.length !== 32) {
    console.log(`\nCollection key length is ${collectionKey?.length}. Expected 32 characters.`);
    console.log("   Make sure you copied the FULL key without extra spaces.");
  }

  if (disbursementKey?.length !== 32) {
    console.log(`\nDisbursement key length is ${disbursementKey?.length}. Expected 32 characters.`);
  }

  console.log("\n\n📡 Testing Collection subscription key...");
  try {
    const testId = require("uuid").v4();
    await axios.post(
      "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser",
      { providerCallbackHost: "webhook.site" },
      {
        headers: {
          "X-Reference-Id": testId,
          "Ocp-Apim-Subscription-Key": collectionKey,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("Collection key is VALID!\n");
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Collection key is INVALID\n");
      console.log("   Possible reasons:");
      console.log("   1. You haven't subscribed to the Collection product");
      console.log("   2. The key was copied incorrectly (check for extra spaces)");
      console.log("   3. The key is from a different product");
      console.log("   4. Your subscription expired\n");
    } else if (error.response?.status === 409) {
    
      console.log("Collection key is VALID! (got 409 which means it works)\n");
    } else {
      console.log(`Unexpected response: ${error.response?.status}`);
      console.log(error.response?.data);
    }
  }

  console.log("Testing Disbursement subscription key...");
  try {
    const testId = require("uuid").v4();
    await axios.post(
      "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser",
      { providerCallbackHost: "webhook.site" },
      {
        headers: {
          "X-Reference-Id": testId,
          "Ocp-Apim-Subscription-Key": disbursementKey,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("Disbursement key is VALID!\n");
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Disbursement key is INVALID\n");
      console.log("   Same possible reasons as above.\n");
    } else if (error.response?.status === 409) {
      console.log("Disbursement key is VALID!\n");
    } else {
      console.log(`Unexpected response: ${error.response?.status}`);
      console.log(error.response?.data);
    }
  }
}

verify();