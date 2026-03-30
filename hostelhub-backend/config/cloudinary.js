const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, folder = "cug-hostels") => {
  return new Promise((resolve, reject) => {
   
    if (!buffer) {
      reject(new Error("No file buffer provided for upload"));
      return;
    }

    if (!Buffer.isBuffer(buffer)) {
      reject(new Error("Invalid buffer provided for upload"));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        transformation: [
          { width: 2400, height: 1800, crop: "limit" },
          { quality: "auto:best" },
        ],
        timeout: 60000,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const uploadMultipleToCloudinary = async (files, folder = "cug-hostels") => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map((file) => {
    if (!file || !file.buffer) {
      return Promise.resolve(null);
    }
    return uploadToCloudinary(file.buffer, folder);
  });

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean); 
};

const getOptimizedUrl = (publicId, options = {}) => {
  const { width = 800, height = 600, crop = "fill" } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop, gravity: "auto" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
    secure: true,
  });
};

const getImageUrls = (publicId) => ({
  thumbnail: getOptimizedUrl(publicId, {
    width: 150,
    height: 150,
    crop: "thumb",
  }),
  card: getOptimizedUrl(publicId, { width: 400, height: 300, crop: "fill" }),
  medium: getOptimizedUrl(publicId, { width: 800, height: 600, crop: "fill" }),
  large: getOptimizedUrl(publicId, { width: 1200, height: 900, crop: "limit" }),
  full: getOptimizedUrl(publicId, { width: 1920, height: 1440, crop: "limit" }),
});

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  getImageUrls,
};