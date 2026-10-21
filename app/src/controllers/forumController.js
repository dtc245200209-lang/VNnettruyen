const db = require('../config/db');
const logger = require('../config/logger');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h3', 'h4'],
  allowedAttributes: {
    'a': ['href', 'target', 'rel']
  }
};

// Hàm tạo slug thân thiện
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// 1. Trang chủ Diễn Đàn (Danh sách chuyên mục & thống kê)
exports.getForumHome = async (req, res) => {
  try {
    // Lấy danh sách chuyên mục kèm số bài viết, số bình luận và bài viết mới nhất
    const [categories] = await db.query(`
      SELECT c.*,
             COUNT(DISTINCT p.id) AS total_posts,
             COUNT(DISTINCT r.id) AS total_replies,
             (
               SELECT p2.title 
               FROM forum_posts p2 
               WHERE p2.category_id = c.id 
               ORDER BY p2.created_at DESC 
               LIMIT 1
             ) AS latest_post_title,
             (
               SELECT p2.slug 
               FROM forum_posts p2 
               WHERE p2.category_id = c.id 
               ORDER BY p2.created_at DESC 
               LIMIT 1
             ) AS latest_post_slug,
             (
               SELECT p2.created_at 
               FROM forum_posts p2 
               WHERE p2.category_id = c.id 
               ORDER BY p2.created_at DESC 
               LIMIT 1
             ) AS latest_post_time,
             (
               SELECT u.username 
               FROM forum_posts p2 
               JOIN users u ON p2.user_id = u.id 
               WHERE p2.category_id = c.id 
               ORDER BY p2.created_at DESC 
               LIMIT 1
             ) AS latest_post_author
      FROM forum_categories c
      LEFT JOIN forum_posts p ON c.id = p.category_id
      LEFT JOIN forum_replies r ON p.id = r.post_id
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `);

    // Thống kê diễn đàn
    const [[statUsers]] = await db.query('SELECT COUNT(*) AS count FROM users');
    const [[statPosts]] = await db.query('SELECT COUNT(*) AS count FROM forum_posts');
    const [[statReplies]] = await db.query('SELECT COUNT(*) AS count FROM forum_replies');
    const [[latestUser]] = await db.query('SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 1');

    // Bài viết ghim / nổi bật
    const [hotPosts] = await db.query(`
      SELECT p.id, p.title, p.slug, p.views, p.created_at, p.is_pinned,
             u.username, u.avatar,
             c.name AS category_name, c.slug AS category_slug,
             (SELECT COUNT(*) FROM forum_replies WHERE post_id = p.id) AS reply_count
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      JOIN forum_categories c ON p.category_id = c.id
      ORDER BY p.is_pinned DESC, p.views DESC
      LIMIT 6
    `);

    res.render('pages/forum/index', {
      title: 'Diễn Đàn Thảo Luận - VNnettruyen',
      categories,
      hotPosts,
      stats: {
        totalUsers: statUsers.count,
        totalPosts: statPosts.count,
        totalReplies: statReplies.count,
        newestUser: latestUser ? latestUser.username : 'Chưa có'
      }
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang chủ diễn đàn:', err);
    res.status(500).render('pages/error', {
      title: 'Lỗi máy chủ',
      statusCode: 500,
      message: 'Không thể tải danh sách chuyên mục diễn đàn.'
    });
  }
};

// 2. Danh sách bài viết theo chuyên mục
exports.getCategoryPosts = async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page || '1', 10);
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const [catRows] = await db.query('SELECT * FROM forum_categories WHERE slug = ? LIMIT 1', [slug]);
    if (catRows.length === 0) {
      req.flash('error_msg', 'Chuyên mục diễn đàn không tồn tại!');
      return res.redirect('/forum');
    }
    const category = catRows[0];

    const [[countResult]] = await db.query(
      'SELECT COUNT(*) AS total FROM forum_posts WHERE category_id = ?',
      [category.id]
    );
    const totalPosts = countResult.total;
    const totalPages = Math.ceil(totalPosts / limit) || 1;

    const [posts] = await db.query(`
      SELECT p.id, p.title, p.slug, p.views, p.is_pinned, p.is_locked, p.created_at, p.updated_at,
             u.username, u.avatar, u.role,
             (SELECT COUNT(*) FROM forum_replies WHERE post_id = p.id) AS reply_count,
             (
               SELECT r.created_at 
               FROM forum_replies r 
               WHERE r.post_id = p.id 
               ORDER BY r.created_at DESC 
               LIMIT 1
             ) AS last_reply_time,
             (
               SELECT u2.username 
               FROM forum_replies r 
               JOIN users u2 ON r.user_id = u2.id 
               WHERE r.post_id = p.id 
               ORDER BY r.created_at DESC 
               LIMIT 1
             ) AS last_reply_user
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.category_id = ?
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [category.id, limit, offset]);

    res.render('pages/forum/category', {
      title: `${category.name} - Diễn Đàn VNnettruyen`,
      category,
      posts,
      currentPage: page,
      totalPages,
      totalPosts
    });
  } catch (err) {
    logger.error('Lỗi khi tải chuyên mục diễn đàn:', err);
    res.redirect('/forum');
  }
};

// 3. Hiển thị form tạo bài viết mới
exports.getCreatePost = async (req, res) => {
  const preSelectedCat = req.query.category || '';
  try {
    const [categories] = await db.query('SELECT id, name, slug FROM forum_categories ORDER BY display_order ASC');
    res.render('pages/forum/create-post', {
      title: 'Đăng Bài Viết Mới - Diễn Đàn VNnettruyen',
      categories,
      preSelectedCat
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang tạo bài viết:', err);
    res.redirect('/forum');
  }
};

// 4. Xử lý tạo bài viết mới
exports.postCreatePost = async (req, res) => {
  const userId = req.session.user.id;
  const { title, category_id, content } = req.body;

  if (!title || !category_id || !content) {
    req.flash('error_msg', 'Vui lòng điền đầy đủ tiêu đề, chuyên mục và nội dung bài viết!');
    return res.redirect('/forum/create');
  }

  if (title.trim().length < 5 || title.trim().length > 255) {
    req.flash('error_msg', 'Tiêu đề bài viết phải từ 5 đến 255 ký tự!');
    return res.redirect('/forum/create');
  }

  if (content.trim().length < 10) {
    req.flash('error_msg', 'Nội dung bài viết quá ngắn (tối thiểu 10 ký tự)!');
    return res.redirect('/forum/create');
  }

  try {
    const cleanContent = sanitizeHtml(content.trim(), sanitizeOptions);
    let baseSlug = slugify(title.trim());
    if (!baseSlug) baseSlug = `bai-viet-${Date.now()}`;
    let uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const [result] = await db.query(`
      INSERT INTO forum_posts (category_id, user_id, title, slug, content)
      VALUES (?, ?, ?, ?, ?)
    `, [category_id, userId, title.trim(), uniqueSlug, cleanContent]);

    // Thưởng 2 Xu cho người đăng bài viết mới
    await db.query('UPDATE users SET coins = coins + 2 WHERE id = ?', [userId]);

    logger.info(`Người dùng ${req.session.user.username} đã tạo bài viết diễn đàn mới: ${title.trim()}`);
    req.flash('success_msg', 'Đăng bài viết mới thành công! Bạn nhận được +2 Xu đóng góp diễn đàn.');
    res.redirect(`/forum/posts/${uniqueSlug}`);
  } catch (err) {
    logger.error('Lỗi khi lưu bài viết diễn đàn:', err);
    req.flash('error_msg', 'Đã xảy ra lỗi máy chủ khi đăng bài viết!');
    res.redirect('/forum/create');
  }
};

// 5. Chi tiết bài viết diễn đàn & các bình luận thảo luận
exports.getPostDetail = async (req, res) => {
  const { slug } = req.params;

  try {
    // Tăng lượt xem
    await db.query('UPDATE forum_posts SET views = views + 1 WHERE slug = ?', [slug]);

    const [postRows] = await db.query(`
      SELECT p.*,
             u.username AS author_name, u.avatar AS author_avatar, u.role AS author_role, u.bio AS author_bio, u.coins AS author_coins, u.created_at AS author_joined,
             (SELECT COUNT(*) FROM forum_posts WHERE user_id = u.id) AS author_post_count,
             c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      JOIN forum_categories c ON p.category_id = c.id
      WHERE p.slug = ?
      LIMIT 1
    `, [slug]);

    if (postRows.length === 0) {
      req.flash('error_msg', 'Bài viết không tồn tại hoặc đã bị xóa!');
      return res.redirect('/forum');
    }

    const post = postRows[0];

    // Lấy danh sách bình luận/phản hồi
    const [replies] = await db.query(`
      SELECT r.id, r.content, r.created_at, r.updated_at,
             u.id AS user_id, u.username, u.avatar, u.role, u.coins, u.created_at AS user_joined,
             (SELECT COUNT(*) FROM forum_posts WHERE user_id = u.id) AS user_post_count
      FROM forum_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = ?
      ORDER BY r.created_at ASC
    `, [post.id]);

    res.render('pages/forum/post-detail', {
      title: `${post.title} - Diễn Đàn VNnettruyen`,
      post,
      replies
    });
  } catch (err) {
    logger.error('Lỗi khi xem bài viết diễn đàn:', err);
    res.redirect('/forum');
  }
};

// 6. Gửi bình luận / phản hồi vào bài viết
exports.postReply = async (req, res) => {
  const userId = req.session.user.id;
  const { postId, postSlug, content } = req.body;

  if (!postId || !content || content.trim().length === 0) {
    req.flash('error_msg', 'Nội dung phản hồi không được để trống!');
    return res.redirect(`/forum/posts/${postSlug}`);
  }

  if (content.trim().length < 3) {
    req.flash('error_msg', 'Nội dung phản hồi quá ngắn (tối thiểu 3 ký tự)!');
    return res.redirect(`/forum/posts/${postSlug}`);
  }

  try {
    const cleanContent = sanitizeHtml(content.trim(), sanitizeOptions);

    await db.query(`
      INSERT INTO forum_replies (post_id, user_id, content)
      VALUES (?, ?, ?)
    `, [postId, userId, cleanContent]);

    // Cập nhật updated_at cho post
    await db.query('UPDATE forum_posts SET updated_at = NOW() WHERE id = ?', [postId]);

    // Thưởng 1 Xu cho người tham gia thảo luận
    await db.query('UPDATE users SET coins = coins + 1 WHERE id = ?', [userId]);

    logger.info(`Người dùng ${req.session.user.username} đã phản hồi bài viết ID ${postId}`);
    req.flash('success_msg', 'Gửi phản hồi thành công! Bạn nhận được +1 Xu tương tác.');
    res.redirect(`/forum/posts/${postSlug}#replies`);
  } catch (err) {
    logger.error('Lỗi khi lưu phản hồi bài viết diễn đàn:', err);
    req.flash('error_msg', 'Đã xảy ra lỗi máy chủ khi gửi phản hồi!');
    res.redirect(`/forum/posts/${postSlug}`);
  }
};

// 7. Xóa bài viết diễn đàn
exports.deletePost = async (req, res) => {
  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const { postId } = req.params;

  try {
    const [rows] = await db.query('SELECT user_id, category_id FROM forum_posts WHERE id = ?', [postId]);
    if (rows.length === 0) {
      req.flash('error_msg', 'Bài viết không tồn tại!');
      return res.redirect('/forum');
    }

    if (rows[0].user_id !== userId && userRole !== 'admin') {
      req.flash('error_msg', 'Bạn không có quyền xóa bài viết này!');
      return res.redirect('/forum');
    }

    await db.query('DELETE FROM forum_posts WHERE id = ?', [postId]);
    logger.info(`Bài viết ID ${postId} đã bị xóa bởi người dùng ID ${userId}`);
    req.flash('success_msg', 'Đã xóa bài viết thành công.');
    res.redirect('/forum');
  } catch (err) {
    logger.error('Lỗi khi xóa bài viết diễn đàn:', err);
    req.flash('error_msg', 'Lỗi khi xóa bài viết!');
    res.redirect('/forum');
  }
};

// 8. Xóa phản hồi diễn đàn
exports.deleteReply = async (req, res) => {
  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const { replyId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT r.user_id, p.slug AS post_slug 
      FROM forum_replies r 
      JOIN forum_posts p ON r.post_id = p.id 
      WHERE r.id = ?
    `, [replyId]);

    if (rows.length === 0) {
      req.flash('error_msg', 'Bình luận không tồn tại!');
      return res.redirect('/forum');
    }

    const { user_id, post_slug } = rows[0];
    if (user_id !== userId && userRole !== 'admin') {
      req.flash('error_msg', 'Bạn không có quyền xóa bình luận này!');
      return res.redirect(`/forum/posts/${post_slug}`);
    }

    await db.query('DELETE FROM forum_replies WHERE id = ?', [replyId]);
    req.flash('success_msg', 'Đã xóa bình luận thành công.');
    res.redirect(`/forum/posts/${post_slug}#replies`);
  } catch (err) {
    logger.error('Lỗi khi xóa bình luận diễn đàn:', err);
    res.redirect('/forum');
  }
};
