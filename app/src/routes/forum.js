const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { requireAuth } = require('../middleware/auth');

// 1. Trang chủ diễn đàn
router.get('/', forumController.getForumHome);

// 2. Tạo bài viết thảo luận mới
router.get('/create', requireAuth, forumController.getCreatePost);
router.post('/create', requireAuth, forumController.postCreatePost);

// 3. Danh sách bài viết theo chuyên mục
router.get('/categories/:slug', forumController.getCategoryPosts);

// 4. Chi tiết bài viết thảo luận
router.get('/posts/:slug', forumController.getPostDetail);

// 5. Gửi bình luận / phản hồi vào bài viết
router.post('/reply', requireAuth, forumController.postReply);

// 6. Xóa bài viết & xóa bình luận
router.post('/posts/:postId/delete', requireAuth, forumController.deletePost);
router.post('/replies/:replyId/delete', requireAuth, forumController.deleteReply);

module.exports = router;
