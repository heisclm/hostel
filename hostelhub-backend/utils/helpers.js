const crypto = require("crypto");

const generateBookingReference = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "BK-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePaymentReference = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "PAY-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateDisbursementReference = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "DSB-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSlug = (text) => {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") +
    "-" +
    Date.now().toString(36)
  );
};

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const getPagination = (page = 1, limit = 10) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (currentPage - 1) * itemsPerPage;

  return { skip, take: itemsPerPage, currentPage, itemsPerPage };
};

const buildPaginationResponse = (totalItems, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    totalItems,
    currentPage,
    itemsPerPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

module.exports = {
  generateBookingReference,
  generatePaymentReference,
  generateDisbursementReference,
  generateSlug,
  generateToken,
  getPagination,
  buildPaginationResponse,
};
