/** @format */

import express from "express";
import {
  createJournal,
  getAllJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  publishJournal,
} from "../controllers/journal.js";
import {
  uploadMiddleware,
  uploadToCloudinary,
} from "../middlewares/uploadMiddleware.js";
import { authenticate, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/journal/create:
 *   post:
 *     summary: Create a new journal entry
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - taggedStudents
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *               mediaType:
 *                 type: string
 *                 enum: [IMAGE, VIDEO]
 *               taggedStudents:
 *                 type: array
 *                 items:
 *                   type: string
 *               publish_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Journal created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access only
 */
router.post(
  "/create",
  authenticate,
  restrictTo("teacher"),
  uploadMiddleware,
  uploadToCloudinary,
  createJournal
);

/**
 * @swagger
 * /api/journal:
 *   get:
 *     summary: Get all journals
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all journals
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getAllJournals);

/**
 * @swagger
 * /api/journal/{id}:
 *   get:
 *     summary: Get a specific journal by ID
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal ID
 *     responses:
 *       200:
 *         description: Journal details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Journal not found
 */
router.get("/:id", authenticate, getJournalById);

/**
 * @swagger
 * /api/journal/{id}:
 *   put:
 *     summary: Update a journal
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *               mediaType:
 *                 type: string
 *                 enum: [IMAGE, VIDEO]
 *               taggedStudents:
 *                 type: array
 *                 items:
 *                   type: string
 *               publish_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Journal updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access only
 *       404:
 *         description: Journal not found
 */
router.put(
  "/:id",
  authenticate,
  restrictTo("teacher"),
  uploadMiddleware,
  uploadToCloudinary,
  updateJournal
);

/**
 * @swagger
 * /api/journal/{id}:
 *   delete:
 *     summary: Delete a journal
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal ID
 *     responses:
 *       200:
 *         description: Journal deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access only
 *       404:
 *         description: Journal not found
 */
router.delete("/:id", authenticate, restrictTo("teacher"), deleteJournal);

/**
 * @swagger
 * /api/journal/{id}/publish:
 *   post:
 *     summary: Publish a journal with optional scheduled date
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publish_at:
 *                 type: string
 *                 format: date-time
 *                 description: Optional ISO date for scheduled publishing
 *     responses:
 *       200:
 *         description: Journal published successfully
 *       400:
 *         description: Invalid publish date format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access only
 *       404:
 *         description: Journal not found
 */
router.post(
  "/:id/publish",
  authenticate,
  restrictTo("teacher"),
  publishJournal
);

export default router;
