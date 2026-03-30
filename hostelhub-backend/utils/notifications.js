const { prisma } = require("../config/db");
const { sendSMS } = require("../config/mnotify");
const { sendEmail } = require("../config/mailjet");

const createNotification = async ({
  userId,
  senderId = null,
  type,
  title,
  message,
  metadata = null,
  sendSMSNotif = false,
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        senderId,
        type,
        title,
        message,
        metadata,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const user = notification.user;

    if (user.email) {
      await sendEmailAlert(user, title, message, type, metadata);
    }

    if (sendSMSNotif && user.phone) {
      await sendSMSAlert(user.phone, message);
    }

    return notification;
  } catch (error) {
    console.error("Create notification failed:", error.message);
    return null;
  }
};

const sendEmailAlert = async (user, title, message, type, metadata) => {
  try {
    const htmlContent = generateEmailTemplate(
      user,
      title,
      message,
      type,
      metadata,
    );

    await sendEmail({
      to: user.email,
      toName: `${user.firstName} ${user.lastName}`,
      subject: `HostelHub - ${title}`,
      textContent: message,
      htmlContent,
    });

    console.log(`Email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error("Email notification failed:", error.message);
    return { success: false, error: error.message };
  }
};

const sendSMSAlert = async (phone, message) => {
  try {
    const smsMessage = `HostelHub: ${message}`.substring(0, 160);
    await sendSMS(phone, smsMessage);
    console.log(`SMS sent to ${phone}`);
    return { success: true };
  } catch (error) {
    console.error("SMS notification failed:", error.message);
    return { success: false, error: error.message };
  }
};

const generateEmailTemplate = (user, title, message, type, metadata) => {
  const templates = {
    BOOKING: generateBookingTemplate,
    PAYMENT: generatePaymentTemplate,
    SYSTEM: generateSystemTemplate,
    MANAGER_VERIFICATION: generateVerificationTemplate,
    HOSTEL_APPROVAL: generateHostelApprovalTemplate,
    COMPLAINT: generateComplaintTemplate,
  };

  const templateFn = templates[type] || generateDefaultTemplate;
  return templateFn(user, title, message, metadata);
};

const generateBookingTemplate = (user, title, message, metadata) => {
  const { bookingReference, roomNumber, bedNumber, hostelName } =
    metadata || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏠 ${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          
          ${
            bookingReference
              ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 25px;">
              <h3 style="color: #3498db; margin: 0 0 15px 0; font-size: 18px;">Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Reference:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">${bookingReference}</td>
                </tr>
                ${
                  hostelName
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Hostel:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${hostelName}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  roomNumber
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Room:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${roomNumber}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  bedNumber
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Bed:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${bedNumber}</td>
                  </tr>
                `
                    : ""
                }
              </table>
            </div>
          `
              : ""
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/bookings" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              View My Bookings
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            If you have any questions, please contact our support team or visit our help center.
          </p>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePaymentTemplate = (user, title, message, metadata) => {
  const {
    amount,
    paymentReference,
    bookingReference,
    hostelName,
    transactionId,
  } = metadata || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #219a52 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💰 ${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          
          ${
            amount
              ? `
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 25px;">
              <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 18px;">Payment Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px;">Amount Paid:</td>
                  <td style="padding: 10px 0; color: #27ae60; font-size: 20px; font-weight: bold;">GHS ${parseFloat(amount).toFixed(2)}</td>
                </tr>
                ${
                  paymentReference
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Payment Reference:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${paymentReference}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  bookingReference
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Booking Reference:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${bookingReference}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  hostelName
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Hostel:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${hostelName}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  transactionId
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Transaction ID:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${transactionId}</td>
                  </tr>
                `
                    : ""
                }
              </table>
            </div>
          `
              : ""
          }
          
          <div style="background-color: #e8f8f0; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
            <p style="color: #27ae60; margin: 0; font-size: 14px;">✓ Payment Confirmed</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/bookings" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #27ae60 0%, #219a52 100%); 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              View Booking Details
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Thank you for your payment! Keep this email as your receipt.
          </p>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateSystemTemplate = (user, title, message, metadata) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📢 ${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Visit HostelHub
            </a>
          </div>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateVerificationTemplate = (user, title, message, metadata) => {
  const { action, rejectionReason } = metadata || {};
  const isApproved = action === "VERIFY";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, ${isApproved ? "#27ae60" : "#e74c3c"} 0%, ${isApproved ? "#219a52" : "#c0392b"} 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${isApproved ? "✅" : "❌"} ${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          
          ${
            isApproved
              ? `
            <div style="background-color: #e8f8f0; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #27ae60; margin: 0 0 15px 0;">You can now:</h3>
              <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>List your hostels on the platform</li>
                <li>Add room types and pricing</li>
                <li>Receive bookings from CUG students</li>
                <li>Manage your hostel operations</li>
              </ul>
            </div>
          `
              : `
            <div style="background-color: #fdf2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c; margin-bottom: 25px;">
              <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Reason for Rejection:</h3>
              <p style="color: #666; margin: 0;">${rejectionReason || "No reason provided"}</p>
            </div>
            <div style="background-color: #fff8e6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #f39c12; margin: 0 0 15px 0;">What you can do:</h3>
              <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Review the rejection reason above</li>
                <li>Update your profile with correct information</li>
                <li>Upload a clearer ID Card image</li>
                <li>Contact our admin team for assistance</li>
              </ul>
            </div>
          `
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${isApproved ? "#27ae60" : "#3498db"} 0%, ${isApproved ? "#219a52" : "#2980b9"} 100%); 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              ${isApproved ? "Login & Get Started" : "Update Profile"}
            </a>
          </div>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateDefaultTemplate = (user, title, message) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">Best regards,<br/>HostelHub Team</p>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateHostelApprovalTemplate = (user, title, message, metadata) => {
  const { hostelName, status, rejectionReason } = metadata || {};
  const isApproved = status === "APPROVED";
  const isSuspended = title.includes("Suspended");

  let bgColor = isApproved ? "#27ae60" : isSuspended ? "#e67e22" : "#e74c3c";
  let bgColorEnd = isApproved ? "#219a52" : isSuspended ? "#d35400" : "#c0392b";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, ${bgColor} 0%, ${bgColorEnd} 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${isApproved ? "🎉" : isSuspended ? "⚠️" : "❌"} ${title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          
          ${
            hostelName
              ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${bgColor}; margin-bottom: 25px;">
              <h3 style="color: ${bgColor}; margin: 0 0 10px 0; font-size: 18px;">Hostel Details</h3>
              <p style="color: #333; margin: 0; font-size: 16px;"><strong>${hostelName}</strong></p>
            </div>
          `
              : ""
          }
          
          ${
            isApproved
              ? `
            <div style="background-color: #e8f8f0; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #27ae60; margin: 0 0 15px 0;">What's Next?</h3>
              <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Your hostel is now visible to students</li>
                <li>Students can start making bookings</li>
                <li>Manage your rooms and bookings from your dashboard</li>
              </ul>
            </div>
          `
              : ""
          }
          
          ${
            rejectionReason
              ? `
            <div style="background-color: #fdf2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c; margin-bottom: 25px;">
              <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Reason:</h3>
              <p style="color: #666; margin: 0;">${rejectionReason}</p>
            </div>
          `
              : ""
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/manager/hostels" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${bgColor} 0%, ${bgColorEnd} 100%); 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              View My Hostels
            </a>
          </div>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateComplaintTemplate = (user, title, message, metadata) => {
  const {
    complaintId,
    hostelName,
    subject,
    category,
    status,
    visibility,
    isResponse = false,
    responseMessage,
    responderName,
    responderRole,
  } = metadata || {};

  const isComplaintOwner = !isResponse && user;
  const statusColors = {
    OPEN: { bg: "#3498db", end: "#2980b9" },
    IN_PROGRESS: { bg: "#f39c12", end: "#e67e22" },
    RESOLVED: { bg: "#27ae60", end: "#219a52" },
    CLOSED: { bg: "#95a5a6", end: "#7f8c8d" },
  };

  const statusColor = statusColors[status] || statusColors.OPEN;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, ${statusColor.bg} 0%, ${statusColor.end} 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isResponse ? "💬" : "📝"} ${title}
          </h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${user.firstName},</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
          
          ${
            subject || hostelName
              ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor.bg}; margin-bottom: 25px;">
              <h3 style="color: ${statusColor.bg}; margin: 0 0 15px 0; font-size: 18px;">
                ${isResponse ? "Response Details" : "Complaint Details"}
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${
                  subject
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Subject:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">${subject}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  hostelName
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Hostel:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${hostelName}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  category
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Category:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${category}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  status
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Status:</td>
                    <td style="padding: 8px 0; font-size: 14px;">
                      <span style="background-color: ${statusColor.bg}20; color: ${statusColor.bg}; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
                        ${status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                `
                    : ""
                }
                ${
                  visibility
                    ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Visibility:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-style: italic; font-size: 12px;">
                      ${visibility === "ADMIN_ONLY" ? "Admin Only" : "Admin & Manager"}
                    </td>
                  </tr>
                `
                    : ""
                }
              </table>
            </div>
          `
              : ""
          }

          ${
            isResponse && responseMessage
              ? `
            <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="color: white; font-weight: bold; font-size: 16px;">
                    ${responderName ? responderName.charAt(0).toUpperCase() : "A"}
                  </span>
                </div>
                <div>
                  <p style="margin: 0; color: #333; font-weight: bold; font-size: 14px;">
                    ${responderName || "Administrator"}
                  </p>
                  <p style="margin: 0; color: #666; font-size: 12px;">
                    ${responderRole ? responderRole.charAt(0) + responderRole.slice(1).toLowerCase() : "Admin"}
                  </p>
                </div>
              </div>
              <p style="color: #555; margin: 0; line-height: 1.6; font-size: 14px;">
                ${responseMessage}
              </p>
            </div>
          `
              : ""
          }

          ${
            isComplaintOwner
              ? `
            <div style="background-color: #fff8e6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
              <p style="color: #f39c12; margin: 0; font-size: 14px; text-align: center;">
                <strong>ℹ️ Note:</strong> 
                ${
                  visibility === "ADMIN_ONLY"
                    ? "This complaint is visible to platform administrators only."
                    : "This complaint is visible to both the hostel manager and platform administrators."
                }
              </p>
            </div>
          `
              : ""
          }

          ${
            status === "RESOLVED" || status === "CLOSED"
              ? `
            <div style="background-color: #e8f8f0; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <p style="color: #27ae60; margin: 0; font-size: 14px;">
                ✓ ${status === "RESOLVED" ? "Issue Resolved" : "Complaint Closed"}
              </p>
            </div>
          `
              : ""
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/complaints/${complaintId}" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${statusColor.bg} 0%, ${statusColor.end} 100%); 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              View Complaint Details
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            ${
              isResponse
                ? "You can reply to this response by viewing the complaint details."
                : "We aim to address all complaints within 24-48 hours. You will receive updates via email and on your dashboard."
            }
          </p>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ecf0f1; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">HostelHub Support</p>
          <p style="color: #bdc3c7; font-size: 12px; margin: 0;">Catholic University of Ghana Hostel Finder</p>
          <p style="color: #95a5a6; font-size: 11px; margin: 10px 0 0 0;">
            Need help? Contact us at support@hostelhub.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const notifyBookingCreated = async (booking, booker, hostel, roomType) => {
  await createNotification({
    userId: hostel.managerId,
    senderId: booker.id,
    title: "New Booking Request",
    message: `A new booking has been made for a ${roomType.occupancyType.replace("IN_", "")} in a room at ${hostel.name}. Booking Reference: ${booking.bookingReference}`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      hostelName: hostel.name,
    },
  });
};

const notifyPaymentSuccess = async (booking, payment) => {
  await createNotification({
    userId: booking.bookerId,
    title: "Payment Successful!",
    message: `Your payment of GHS ${parseFloat(booking.totalAmount).toFixed(2)} for ${booking.hostel.name} has been received. The hostel manager will assign you a room shortly.`,
    type: "PAYMENT",
    metadata: {
      bookingId: booking.id,
      paymentId: payment.id,
      amount: booking.totalAmount,
      paymentReference: payment.paymentReference,
      bookingReference: booking.bookingReference,
      hostelName: booking.hostel.name,
      transactionId: payment.momoTransactionId,
    },
  });

  await createNotification({
    userId: booking.hostel.managerId,
    senderId: booking.bookerId,
    title: "Payment Received - Room Assignment Needed",
    message: `Payment received for booking ${booking.bookingReference}. ${booking.booker.firstName} ${booking.booker.lastName}. Please assign a room.`,
    type: "PAYMENT",
    metadata: {
      bookingId: booking.id,
      amount: booking.baseAmount,
      bookingReference: booking.bookingReference,
      bookerName: `${booking.booker.firstName} ${booking.booker.lastName}`,
    },
  });
};

const notifyRoomAssigned = async (
  booking,
  room,
  hostel,
  managerId,
  bedNumber,
) => {
  const occupantInfo = booking.isBookingForSelf
    ? "You have"
    : `${booking.occupantName} has`;

  await createNotification({
    userId: booking.bookerId,
    senderId: managerId,
    title: "Room Assigned!",
    message: `${occupantInfo} been assigned to Room ${room.roomNumber}${bedNumber ? `, Bed ${bedNumber}` : ""} at ${hostel.name}. Your booking is confirmed!`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      roomNumber: room.roomNumber,
      bedNumber: bedNumber,
      hostelName: hostel.name,
    },
  });
};

const notifyBookingConfirmed = async (
  booking,
  hostel,
  managerId,
  roomNumber,
) => {
  await createNotification({
    userId: booking.bookerId,
    senderId: managerId,
    title: "Booking Confirmed!",
    message: `Your booking at ${hostel.name} has been confirmed. ${roomNumber ? `Room: ${roomNumber}` : ""} Please proceed to check-in.`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      roomNumber: roomNumber,
      hostelName: hostel.name,
    },
  });
};

const notifyCheckIn = async (booking, hostel, room, managerId) => {
  const occupantInfo = booking.isBookingForSelf
    ? "You have"
    : `${booking.occupantName} has`;

  await createNotification({
    userId: booking.bookerId,
    senderId: managerId,
    title: "Checked In!",
    message: `${occupantInfo} been checked into ${hostel.name}, Room ${room.roomNumber}. Welcome!`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      roomNumber: room.roomNumber,
      hostelName: hostel.name,
    },
  });
};

const notifyCheckOut = async (booking, hostel, managerId) => {
  const occupantInfo = booking.isBookingForSelf
    ? "You have"
    : `${booking.occupantName} has`;

  await createNotification({
    userId: booking.bookerId,
    senderId: managerId,
    title: "Checked Out",
    message: `${occupantInfo} been checked out of ${hostel.name}. Thank you for your stay!`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      hostelName: hostel.name,
    },
  });
};

const notifyBookingCancelled = async (
  booking,
  hostel,
  cancelledBy,
  reason,
  userId,
) => {
  const notifyUserId =
    cancelledBy === "booker" ? hostel.managerId : booking.bookerId;

  await createNotification({
    userId: notifyUserId,
    senderId: userId,
    title: "Booking Cancelled",
    message: `Booking ${booking.bookingReference} at ${hostel.name} has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      reason: reason,
      hostelName: hostel.name,
    },
  });
};

const notifyRoomReassigned = async (
  booking,
  oldRoom,
  newRoom,
  hostel,
  managerId,
  bedNumber,
  reason,
) => {
  const occupantInfo = booking.isBookingForSelf
    ? "You have"
    : `${booking.occupantName} has`;

  await createNotification({
    userId: booking.bookerId,
    senderId: managerId,
    title: "Room Reassignment",
    message: `${occupantInfo} been moved from Room ${oldRoom.roomNumber} to Room ${newRoom.roomNumber}${bedNumber ? `, Bed ${bedNumber}` : ""}.${reason ? ` Reason: ${reason}` : ""}`,
    type: "BOOKING",
    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      oldRoom: oldRoom.roomNumber,
      newRoom: newRoom.roomNumber,
      bedNumber: bedNumber,
      hostelName: hostel.name,
    },
  });
};

const notifyManagerVerification = async (manager, action, rejectionReason) => {
  const isApproved = action === "VERIFY";

  const title = isApproved
    ? "Account Verified"
    : "Account Verification Rejected";

  const message = isApproved
    ? `Congratulations ${manager.firstName}! Your hostel manager account has been verified. You can now list your hostels on HostelHub.`
    : `Dear ${manager.firstName}, your hostel manager account verification was rejected. Reason: ${rejectionReason}. Please contact admin for more information or update your details and try again.`;

  await createNotification({
    userId: manager.id,
    type: "MANAGER_VERIFICATION",
    title,
    message,
    metadata: {
      action,
      rejectionReason: rejectionReason || null,
    },
  });
};

const notifyUserStatusChange = async (user, newStatus) => {
  const statusMessages = {
    ACTIVE: {
      title: "Account Activated",
      message:
        "Your HostelHub account has been activated. You can now access all features.",
    },
    SUSPENDED: {
      title: "Account Suspended",
      message:
        "Your HostelHub account has been suspended. Please contact admin for more information.",
    },
    INACTIVE: {
      title: "Account Deactivated",
      message:
        "Your HostelHub account has been deactivated. Contact admin to reactivate.",
    },
  };

  const { title, message } = statusMessages[newStatus];

  await createNotification({
    userId: user.id,
    type: "SYSTEM",
    title,
    message,
    metadata: { newStatus },
  });
};

const notifyHostelApproval = async (
  hostel,
  manager,
  adminId,
  status,
  rejectionReason,
) => {
  const isApproved = status === "APPROVED";

  await createNotification({
    userId: manager.id,
    senderId: adminId,
    title: isApproved ? "Hostel Approved!" : "Hostel Verification Rejected",
    message: isApproved
      ? `Your hostel "${hostel.name}" has been approved and is now visible to students.`
      : `Your hostel "${hostel.name}" verification was rejected. Reason: ${rejectionReason}`,
    type: "HOSTEL_APPROVAL",
    metadata: {
      hostelId: hostel.id,
      hostelName: hostel.name,
      status,
      rejectionReason: rejectionReason || null,
    },
  });
};

const notifyHostelSuspension = async (hostel, manager, adminId, reason) => {
  await createNotification({
    userId: manager.id,
    senderId: adminId,
    title: "Hostel Suspended",
    message: `Your hostel "${hostel.name}" has been suspended.${reason ? ` Reason: ${reason}` : ""} Please contact support for more information.`,
    type: "HOSTEL_APPROVAL",
    metadata: {
      hostelId: hostel.id,
      hostelName: hostel.name,
      reason: reason || null,
    },
  });
};

const notifyComplaintCreated = async (complaint, user, hostel) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      senderId: user.id,
      title: "New Complaint Received",
      message: `${user.firstName} ${user.lastName} has submitted a complaint about ${hostel?.name || "a hostel"}.`,
      type: "COMPLAINT",
      metadata: {
        complaintId: complaint.id,
        subject: complaint.subject,
        hostelName: hostel?.name,
        category: complaint.category,
        status: complaint.status,
        visibility: complaint.visibility,
      },
    });
  }

  if (complaint.visibility === "ADMIN_AND_MANAGER" && hostel?.managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: hostel.managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (manager) {
      await createNotification({
        userId: manager.id,
        senderId: user.id,
        title: "New Complaint About Your Hostel",
        message: `A complaint has been submitted about ${hostel.name}: "${complaint.subject}"`,
        type: "COMPLAINT",
        metadata: {
          complaintId: complaint.id,
          subject: complaint.subject,
          hostelName: hostel.name,
          category: complaint.category,
          status: complaint.status,
          visibility: complaint.visibility,
        },
      });
    }
  }

  await createNotification({
    userId: user.id,
    title: "Complaint Submitted Successfully",
    message: `Your complaint about ${hostel?.name || "the hostel"} has been received. ${complaint.visibility === "ADMIN_ONLY" ? "Only platform administrators" : "The hostel manager and administrators"} have been notified.`,
    type: "COMPLAINT",
    metadata: {
      complaintId: complaint.id,
      subject: complaint.subject,
      hostelName: hostel?.name,
      category: complaint.category,
      status: complaint.status,
      visibility: complaint.visibility,
    },
  });
};

const notifyComplaintResponse = async (
  complaint,
  response,
  responder,
  complaintOwner,
  hostel,
) => {
  await createNotification({
    userId: complaintOwner.id,
    senderId: responder.id,
    title: "New Response to Your Complaint",
    message: `${responder.firstName} ${responder.lastName} has responded to your complaint about ${hostel?.name || "the hostel"}.`,
    type: "COMPLAINT",
    metadata: {
      complaintId: complaint.id,
      subject: complaint.subject,
      hostelName: hostel?.name,
      status: complaint.status,
      visibility: complaint.visibility,
      isResponse: true,
      responseMessage: response.message,
      responderName: `${responder.firstName} ${responder.lastName}`,
      responderRole: responder.role,
    },
  });
};

const notifyComplaintStatusUpdate = async (
  complaint,
  user,
  hostel,
  updatedBy,
  newStatus,
  resolution,
) => {
  const statusTitles = {
    OPEN: "Complaint Reopened",
    IN_PROGRESS: "Complaint Under Review",
    RESOLVED: "Complaint Resolved",
    CLOSED: "Complaint Closed",
  };

  const statusMessages = {
    OPEN: `Your complaint about ${hostel?.name || "the hostel"} has been reopened.`,
    IN_PROGRESS: `Your complaint about ${hostel?.name || "the hostel"} is now being reviewed.`,
    RESOLVED: `Your complaint about ${hostel?.name || "the hostel"} has been resolved.${resolution ? ` Resolution: ${resolution}` : ""}`,
    CLOSED: `Your complaint about ${hostel?.name || "the hostel"} has been closed.${resolution ? ` Note: ${resolution}` : ""}`,
  };

  await createNotification({
    userId: user.id,
    senderId: updatedBy.id,
    title: statusTitles[newStatus],
    message: statusMessages[newStatus],
    type: "COMPLAINT",
    metadata: {
      complaintId: complaint.id,
      subject: complaint.subject,
      hostelName: hostel?.name,
      status: newStatus,
      visibility: complaint.visibility,
      resolution,
    },
  });
};

module.exports = {
  createNotification,
  sendEmailAlert,
  sendSMSAlert,
  notifyBookingCreated,
  notifyPaymentSuccess,
  notifyRoomAssigned,
  notifyBookingConfirmed,
  notifyCheckIn,
  notifyCheckOut,
  notifyBookingCancelled,
  notifyRoomReassigned,
  notifyManagerVerification,
  notifyUserStatusChange,
  notifyHostelApproval,
  notifyHostelSuspension,
  notifyComplaintStatusUpdate,
  notifyComplaintResponse,
  notifyComplaintCreated,
};
