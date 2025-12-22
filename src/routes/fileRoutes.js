/**
 * File Routes
 * API endpoints for file management
 */

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../config/multer');

// Protected routes (must come before parameterized routes)
router.get('/pending/all', auth, adminOnly, fileController.getPendingFiles);

// Public route
router.get('/:courseId', fileController.getCourseFiles);
router.post('/', auth, upload.single('file'), fileController.uploadFile);
router.put('/:id/approve', auth, adminOnly, fileController.approveFile);
router.put('/:id/rename', auth, adminOnly, fileController.renameFile);
router.delete('/:id/reject', auth, adminOnly, fileController.rejectFile);
router.delete('/:id', auth, fileController.deleteFile);

module.exports = router;
