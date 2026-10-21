const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { requireAuth } = require('../middleware/auth');
const db = require('../config/db');

// 1. Trang chủ phong cách Diễn Đàn Sáng Tác
router.get('/', storyController.getHome);

// 2. Khám phá truyện (tìm kiếm, lọc, phân trang)
router.get('/stories', storyController.getStories);

// 3. Chi tiết truyện
router.get('/stories/:slug', storyController.getStoryDetail);

// 4. Đọc chương truyện
router.get('/stories/:slug/chapters/:chapterNumber', storyController.getChapter);

// 5. Bình luận (yêu cầu đăng nhập)
router.post('/comments', requireAuth, storyController.postComment);
router.post('/comments/:commentId/delete', requireAuth, storyController.deleteComment);

const authController = require('../controllers/authController');

// 6. Trang hồ sơ cá nhân
router.get('/profile', requireAuth, authController.getProfile);
router.post('/profile', requireAuth, authController.postProfile);

// 8. API Tìm kiếm nhanh gợi ý
router.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json([]);
  }
  try {
    const [rows] = await db.query(
      'SELECT id, title, slug, cover_image FROM stories WHERE title LIKE ? LIMIT 5',
      [`%${q.trim()}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tìm kiếm' });
  }
});

module.exports = router;
