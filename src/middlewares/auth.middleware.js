/** @format */

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants/constant.js";

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      message: "Unauthorized - No token provided" 
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Ensure role is always uppercase
    decoded.role = decoded.role?.toUpperCase();
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid Token" 
    });
  }
};

// Role Checker Middleware
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Convert role to uppercase to match Prisma enum
    const userRole = req.user.role?.toUpperCase();
    const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());

    if (!allowedRolesUpper.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action. Required role: ${allowedRoles.join(' or ')}`,
        userRole: userRole
      });
    }

    next();
  };
};

export { authenticate, restrictTo };
