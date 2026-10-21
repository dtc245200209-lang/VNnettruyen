const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Bảo vệ toàn bộ khu vực admin: chỉ dành cho role 'admin'
router.use(requireAuth, requireRole(['admin']));

// Dashboard
router.get('/', adminController.getDashboard);

// Quản lý người dùng
router.get('/users', adminController.getUsers);
router.post('/users/:userId/role', adminController.updateUserRole);
router.post('/users/:userId/delete', adminController.deleteUser);

// Quản lý truyện
router.get('/stories', adminController.getStories);
router.post('/stories/:storyId/featured', adminController.toggleFeaturedStory);
router.post('/stories/:storyId/delete', adminController.deleteStoryAdmin);

// Quản lý thể loại
router.get('/genres', adminController.getGenres);
router.post('/genres', adminController.postCreateGenre);
router.post('/genres/:genreId/delete', adminController.deleteGenre);

// Quản lý bình luận
router.get('/comments', adminController.getComments);
router.post('/comments/:commentId/delete', adminController.deleteCommentAdmin);

module.exports = router;
