const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const hostelRoutes = require("./routes/hostel.routes");
const adminHostelRoutes = require("./routes/admin.hostel.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminBookingRoutes = require("./routes/admin.booking.routes");
const managerDisbursementRoutes = require("./routes/disbursement.routes");
const reviewRoutes = require("./routes/review.routes");
const complaintRoutes = require("./routes/complaint.routes");
const managerRoutes = require("./routes/manager.routes");
const paymentRoutes = require("./routes/payment.routes");
const savedHostelRoutes = require("./routes/saved-hostel.routes");


const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HostelHub API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/hostels", adminHostelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/disbursements", managerDisbursementRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/reviews", reviewRoutes);

app.use("/api/complaints", complaintRoutes);
app.use("/api/manager", managerRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/saved-hostels", savedHostelRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;
