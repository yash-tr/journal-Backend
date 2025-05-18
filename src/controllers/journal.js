/** @format */

import prisma from "../config/prisma.js";

/**
 * Creates a new journal entry
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object from auth middleware
 * @param {string} req.user.userId - ID of the teacher creating the journal
 * @param {Object} req.body - Request body
 * @param {string} req.body.title - Title of the journal
 * @param {string} req.body.content - Content of the journal
 * @param {string[]} [req.body.media] - Array of media URLs
 * @param {string} [req.body.mediaType] - Type of media (e.g., 'IMAGE', 'VIDEO')
 * @param {string[]} req.body.taggedStudents - Array of student IDs to tag
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created journal
 */
export const createJournal = async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, content, media, mediaType, taggedStudents } = req.body;

    // Parse taggedStudents if it's a JSON string
    let parsedTaggedStudents;
    if (typeof taggedStudents === "string") {
      parsedTaggedStudents = JSON.parse(taggedStudents);
    } else {
      parsedTaggedStudents = taggedStudents;
    }

    // Create journal with media URL from Cloudinary (if uploaded)
    const journal = await prisma.journal.create({
      data: {
        title,
        content,
        media: media || [],
        mediaType: mediaType?.toUpperCase(),
        teacherId: userId,
        taggedStudents: {
          connect: parsedTaggedStudents.map((id) => ({ id })),
        },
      },
      include: {
        teacher: true,
        taggedStudents: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Journal created successfully",
      journal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Journal creation failed",
      error: error.message,
    });
  }
};

/**
 * Retrieves all journals
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with all journals
 */
export const getAllJournals = async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      include: {
        teacher: true,
        taggedStudents: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Journals fetched successfully",
      journals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch journals",
      error: error.message,
    });
  }
};

/**
 * Retrieves a specific journal by ID
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Journal ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the requested journal
 */
export const getJournalById = async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        teacher: true,
        taggedStudents: true,
      },
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Journal not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Journal fetched successfully",
      journal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch journal",
      error: error.message,
    });
  }
};

/**
 * Updates an existing journal
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Journal ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.title - Updated title
 * @param {string} req.body.content - Updated content
 * @param {string[]} [req.body.media] - Updated media URLs
 * @param {string} [req.body.mediaType] - Updated media type
 * @param {string[]} req.body.taggedStudents - Updated array of student IDs
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated journal
 */
export const updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, media, mediaType, taggedStudents } = req.body;

    const journal = await prisma.journal.update({
      where: { id },
      data: {
        title,
        content,
        media: media || [],
        mediaType: mediaType?.toUpperCase(),
        taggedStudents: {
          set: taggedStudents.map((id) => ({ id })),
        },
      },
      include: {
        teacher: true,
        taggedStudents: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Journal updated successfully",
      journal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update journal",
      error: error.message,
    });
  }
};

/**
 * Publishes a journal with optional scheduled date
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Journal ID
 * @param {Object} req.body - Request body
 * @param {string} [req.body.publish_at] - ISO date string for scheduled publishing
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with published journal
 */
export const publishJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { publish_at } = req.body;

    // Validate publish_at if provided
    if (publish_at && !isValidISODate(publish_at)) {
      return res.status(400).json({
        success: false,
        message: "Invalid publish_at date format. Must be ISO 8601",
      });
    }

    const journal = await prisma.journal.update({
      where: { id },
      data: {
        publish_at: publish_at ? new Date(publish_at) : new Date(),
      },
      include: {
        teacher: true,
        taggedStudents: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Journal published successfully",
      journal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to publish journal",
      error: error.message,
    });
  }
};

/**
 * Deletes a journal
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Journal ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
export const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.journal.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Journal deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete journal",
      error: error.message,
    });
  }
};

/**
 * Retrieves feed for teachers
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object from auth middleware
 * @param {string} req.user.userId - ID of the teacher
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with teacher's journals
 */
export const getTeacherFeed = async (req, res) => {
  try {
    const { userId } = req.user;
    const journals = await prisma.journal.findMany({
      where: { teacherId: userId },
      include: {
        teacher: true,
        taggedStudents: true,
      },
    });
    res.status(200).json({
      success: true,
      message: "Teacher feed fetched successfully",
      journals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get teacher feed",
      error: error.message,
    });
  }
};

/**
 * Retrieves feed for students
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object from auth middleware
 * @param {string} req.user.userId - ID of the student
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with student's accessible journals
 */
export const getStudentFeed = async (req, res) => {
  try {
    const { userId } = req.user;
    const journals = await prisma.journal.findMany({
      where: {
        AND: [
          {
            taggedStudents: {
              some: {
                id: userId,
              },
            },
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
    });
    res.status(200).json({
      success: true,
      message: "Student feed fetched successfully",
      journals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get student feed",
      error: error.message,
    });
  }
};

/**
 * Validates if a string is a valid ISO date
 * @param {string} dateString - The date string to validate
 * @returns {boolean} True if the string is a valid ISO date
 */
const isValidISODate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString();
};
