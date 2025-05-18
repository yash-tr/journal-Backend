/** @format */

import express from "express";
import { loginUser, registerUser } from "../controllers/user.js";
import { authenticate, restrictTo } from "../middlewares/auth.middleware.js";
import { getStudentFeed, getTeacherFeed } from "../controllers/journal.js";
import prisma from "../config/prisma.js";

const router = express.Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, teacher]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/user/feed:
 *   get:
 *     summary: Get user feed based on role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       400:
 *         description: Invalid user role
 *       401:
 *         description: Unauthorized
 */
router.get("/feed", authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    // First verify the user exists and get their role from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get feed based on database role
    if (user.role === 'TEACHER') {
      const journals = await prisma.journal.findMany({
        where: { teacherId: userId },
        include: {
          teacher: true,
          taggedStudents: true,
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return res.status(200).json({
        success: true,
        message: "Teacher feed fetched successfully",
        journals
      });

    } else if (user.role === 'STUDENT') {
      const journals = await prisma.journal.findMany({
        where: {
          AND: [
            {
              taggedStudents: {
                some: {
                  id: userId
                }
              }
            },
            {
              OR: [
                { publish_at: null },
                { publish_at: { lte: new Date() } }
              ]
            }
          ]
        },
        include: {
          teacher: true,
          taggedStudents: true,
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return res.status(200).json({
        success: true,
        message: "Student feed fetched successfully",
        journals
      });

    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user role. Must be either 'teacher' or 'student'",
        userRole: user.role
      });
    }

  } catch (error) {
    console.error('Feed Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get feed",
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user/teacher:
 *   get:
 *     summary: Get teacher feed (legacy endpoint)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher feed retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access only
 */
router.get("/teacher", authenticate, restrictTo("teacher"), getTeacherFeed);

/**
 * @swagger
 * /api/user/student:
 *   get:
 *     summary: Get student feed (legacy endpoint)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student feed retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access only
 */
router.get("/student", authenticate, restrictTo("student"), getStudentFeed);

export default router;
