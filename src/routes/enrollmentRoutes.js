/**
 * Enrollment Routes
 * API endpoints for course enrollment
 */

const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.get('/', auth, enrollmentController.getUserEnrollments);
router.post('/', auth, enrollmentController.enrollCourse);
router.delete('/:courseId', auth, enrollmentController.unenrollCourse);

module.exports = router;
