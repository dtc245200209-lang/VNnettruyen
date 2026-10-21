const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { requireAuth, requireRole } = require('../middleware/auth');

const { uploadCover } = require('../middleware/upload');

// Bảo vệ toàn bộ router tác giả: yêu cầu đăng nhập và có quyền 'author' hoặc 'admin'
router.use(requireAuth, requireRole(['author', 'admin']));

// Dashboard truyện tác giả
router.get('/', authorController.getDashboard);

// Đăng tác phẩm mới (hỗ trợ upload ảnh bìa từ máy)
router.get('/stories/create', authorController.getCreateStory);
router.post('/stories/create', uploadCover.single('cover_file'), authorController.postCreateStory);

// Sửa tác phẩm (hỗ trợ upload ảnh bìa từ máy & đổi bút danh)
router.get('/stories/:storyId/edit', authorController.getEditStory);
router.post('/stories/:storyId/edit', uploadCover.single('cover_file'), authorController.postEditStory);

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
