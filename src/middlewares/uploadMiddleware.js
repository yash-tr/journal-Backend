/** @format */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "journal-app",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
    resource_type: "auto",
  },
});

// Create multer upload instance with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov)$/)) {
      return cb(new Error("Only image and video files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Middleware to handle file upload and add media info to request
export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Add the Cloudinary URL and media type to the request body
    req.body.media = req.file.path; // Cloudinary URL is automatically set in path
    req.body.mediaType = req.file.resource_type;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error uploading file to Cloudinary",
      error: error.message,
    });
  }
};

// Export the multer middleware
export const uploadMiddleware = upload.single("media");
