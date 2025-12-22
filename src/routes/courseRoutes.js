/**
 * Course Routes
 * API endpoints for course management
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes (Admin only)
router.post('/', auth, adminOnly, courseController.createCourse);
router.put('/:id', auth, adminOnly, courseController.updateCourse);
router.delete('/:id', auth, adminOnly, courseController.deleteCourse);

module.exports = router;
