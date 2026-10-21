const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Bảo vệ toàn bộ router tác giả: yêu cầu đăng nhập và có quyền 'author' hoặc 'admin'
router.use(requireAuth, requireRole(['author', 'admin']));

// Dashboard truyện tác giả
router.get('/', authorController.getDashboard);

// Đăng tác phẩm mới
router.get('/stories/create', authorController.getCreateStory);
router.post('/stories/create', authorController.postCreateStory);

// Sửa tác phẩm
router.get('/stories/:storyId/edit', authorController.getEditStory);
router.post('/stories/:storyId/edit', authorController.postEditStory);

// Xóa tác phẩm
router.post('/stories/:storyId/delete', authorController.deleteStory);

// Quản lý chương của truyện
router.get('/stories/:storyId/chapters', authorController.getStoryChapters);
router.get('/stories/:storyId/chapters/create', authorController.getCreateChapter);
router.post('/stories/:storyId/chapters/create', authorController.postCreateChapter);

router.get('/stories/:storyId/chapters/:chapterId/edit', authorController.getEditChapter);
router.post('/stories/:storyId/chapters/:chapterId/edit', authorController.postEditChapter);

router.post('/stories/:storyId/chapters/:chapterId/delete', authorController.deleteChapter);

module.exports = router;
