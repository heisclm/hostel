const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

const ensureUploadDir = () => {
  const uploadDir = path.join(__dirname, "tmp/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Upload directory created");
  }
};

const startServer = async () => {
  await connectDB();

  ensureUploadDir();

  const server = app.listen(PORT, () => {
    console.log(`HostelHub API Server`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err.message);
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  });

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("\nSIGINT received. Shutting down gracefully...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
};

startServer();
