const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { requireAuth } = require('../middleware/auth');
const db = require('../config/db');

// Trang chủ
router.get('/', storyController.getHome);

// Khám phá truyện (tìm kiếm, lọc, phân trang)
router.get('/stories', storyController.getStories);

// Chi tiết truyện
router.get('/stories/:slug', storyController.getStoryDetail);

// Đọc chương truyện
router.get('/stories/:slug/chapters/:chapterNumber', storyController.getChapter);

// Bình luận (yêu cầu đăng nhập)
router.post('/comments', requireAuth, storyController.postComment);
router.post('/comments/:commentId/delete', requireAuth, storyController.deleteComment);

// Tủ sách cá nhân (yêu cầu đăng nhập)
router.post('/bookmark/toggle', requireAuth, storyController.toggleBookmark);

// API tìm kiếm nhanh gợi ý
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
