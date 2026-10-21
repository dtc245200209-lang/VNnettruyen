const db = require('../config/db');
const logger = require('../config/logger');
const slugify = require('slugify');

// 1. Dashboard tổng quan quản trị
exports.getDashboard = async (req, res) => {
  try {
    const [[{ user_count }]] = await db.query('SELECT COUNT(*) AS user_count FROM users');
    const [[{ story_count }]] = await db.query('SELECT COUNT(*) AS story_count FROM stories');
    const [[{ chapter_count }]] = await db.query('SELECT COUNT(*) AS chapter_count FROM chapters');
    const [[{ comment_count }]] = await db.query('SELECT COUNT(*) AS comment_count FROM comments');

    // Thống kê người dùng theo vai trò
    const [roleStats] = await db.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');

    // Người dùng mới nhất
    const [recentUsers] = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');

    // Bình luận mới nhất
    const [recentComments] = await db.query(`
      SELECT c.id, c.content, c.created_at, u.username, s.title AS story_title, s.slug AS story_slug
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 6
    `);

    res.render('pages/admin/dashboard', {
      title: 'Bảng Điều Khiển Quản Trị - VNnettruyen Admin',
      stats: {
        users: user_count,
        stories: story_count,
        chapters: chapter_count,
        comments: comment_count
      },
      roleStats,
      recentUsers,
      recentComments
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang quản trị:', err);
    req.flash('error_msg', 'Không thể tải bảng điều khiển quản trị!');
    res.redirect('/');
  }
};

// 2. Quản lý Người dùng
exports.getUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    let whereConditions = ['1=1'];
    let params = [];

    if (q && q.trim() !== '') {
      whereConditions.push('(username LIKE ? OR email LIKE ?)');
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    if (role && ['reader', 'author', 'admin'].includes(role)) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    const sql = `
      SELECT id, username, email, role, bio, created_at,
             (SELECT COUNT(*) FROM stories WHERE author_id = users.id) AS stories_count,
             (SELECT COUNT(*) FROM comments WHERE user_id = users.id) AS comments_count
      FROM users
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const [users] = await db.query(sql, params);

    res.render('pages/admin/users', {
      title: 'Quản lý Người Dùng - VNnettruyen Admin',
      users,
      query: { q: q || '', role: role || '' }
    });
  } catch (err) {
    logger.error('Lỗi khi tải danh sách người dùng:', err);
    req.flash('error_msg', 'Lỗi tải người dùng!');
    res.redirect('/admin');
  }
};

// 3. Cập nhật vai trò người dùng
exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentAdminId = req.session.user.id;

  if (!['reader', 'author', 'admin'].includes(role)) {
    req.flash('error_msg', 'Vai trò không hợp lệ!');
    return res.redirect('/admin/users');
  }

  // Không cho phép tự hạ quyền của chính mình
  if (parseInt(userId, 10) === currentAdminId && role !== 'admin') {
    req.flash('error_msg', 'Bạn không thể tự hạ quyền quản trị viên của chính mình!');
    return res.redirect('/admin/users');
  }

  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    logger.info(`Admin ID ${currentAdminId} vừa đổi quyền người dùng ID ${userId} thành ${role}`);
    req.flash('success_msg', 'Cập nhật vai trò người dùng thành công!');
    res.redirect('/admin/users');
  } catch (err) {
    logger.error('Lỗi đổi vai trò:', err);
    req.flash('error_msg', 'Lỗi hệ thống khi cập nhật vai trò!');
    res.redirect('/admin/users');
  }
};

// 4. Xóa người dùng
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const currentAdminId = req.session.user.id;

  if (parseInt(userId, 10) === currentAdminId) {
    req.flash('error_msg', 'Bạn không thể tự xóa tài khoản của chính mình!');
    return res.redirect('/admin/users');
  }

  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    logger.info(`Admin ID ${currentAdminId} vừa xóa người dùng ID ${userId}`);
    req.flash('success_msg', 'Đã xóa người dùng thành công!');
    res.redirect('/admin/users');
  } catch (err) {
    logger.error('Lỗi xóa người dùng:', err);
    req.flash('error_msg', 'Lỗi khi xóa người dùng!');
    res.redirect('/admin/users');
  }
};

// 5. Quản lý toàn bộ Truyện
exports.getStories = async (req, res) => {
  try {
    const { q, status } = req.query;
    let whereConditions = ['1=1'];
    let params = [];

    if (q && q.trim() !== '') {
      whereConditions.push('(s.title LIKE ? OR u.username LIKE ?)');
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    if (status && ['ongoing', 'completed'].includes(status)) {
      whereConditions.push('s.status = ?');
      params.push(status);
    }

    const [stories] = await db.query(`
      SELECT s.*, COALESCE(NULLIF(s.pen_name, ''), u.username) AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) AS chapter_count,
             (SELECT COUNT(*) FROM comments WHERE story_id = s.id) AS comment_count
      FROM stories s
      JOIN users u ON s.author_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY s.updated_at DESC
    `, params);

    res.render('pages/admin/stories', {
      title: 'Quản lý Truyện - VNnettruyen Admin',
      stories,
      query: { q: q || '', status: status || '' }
    });
  } catch (err) {
    logger.error('Lỗi tải danh sách truyện admin:', err);
    req.flash('error_msg', 'Lỗi tải danh sách truyện!');
    res.redirect('/admin');
  }
};

// 6. Đổi trạng thái nổi bật (Toggle Featured)
exports.toggleFeaturedStory = async (req, res) => {
  const { storyId } = req.params;
  try {
    await db.query('UPDATE stories SET is_featured = NOT is_featured WHERE id = ?', [storyId]);
    req.flash('success_msg', 'Đã thay đổi trạng thái nổi bật của truyện!');
    res.redirect('/admin/stories');
  } catch (err) {
    logger.error('Lỗi đổi trạng thái nổi bật:', err);
    req.flash('error_msg', 'Lỗi hệ thống');
    res.redirect('/admin/stories');
  }
};

// 7. Xóa truyện bởi Admin
exports.deleteStoryAdmin = async (req, res) => {
  const { storyId } = req.params;
  try {
    await db.query('DELETE FROM stories WHERE id = ?', [storyId]);
    logger.info(`Admin đã xóa truyện ID ${storyId}`);
    req.flash('success_msg', 'Đã xóa truyện khỏi hệ thống!');
    res.redirect('/admin/stories');
  } catch (err) {
    logger.error('Lỗi xóa truyện bởi admin:', err);
    req.flash('error_msg', 'Lỗi khi xóa truyện!');
    res.redirect('/admin/stories');
  }
};

// 8. Quản lý Thể loại
exports.getGenres = async (req, res) => {
  try {
    const [genres] = await db.query(`
      SELECT g.*, 
             (SELECT COUNT(*) FROM story_genres WHERE genre_id = g.id) AS story_count
      FROM genres g
      ORDER BY name ASC
    `);

    res.render('pages/admin/genres', {
      title: 'Quản lý Thể Loại - VNnettruyen Admin',
      genres
    });
  } catch (err) {
    logger.error('Lỗi tải thể loại admin:', err);
    req.flash('error_msg', 'Lỗi tải thể loại!');
    res.redirect('/admin');
  }
};

// 9. Thêm thể loại mới
exports.postCreateGenre = async (req, res) => {
  const { name, description } = req.body;
  if (!name || name.trim() === '') {
    req.flash('error_msg', 'Tên thể loại không được để trống!');
    return res.redirect('/admin/genres');
  }

  const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

  try {
    await db.query('INSERT INTO genres (name, slug, description) VALUES (?, ?, ?)', [
      name.trim(),
      slug,
      description ? description.trim() : null
    ]);
    req.flash('success_msg', `Đã thêm thể loại "${name.trim()}" thành công!`);
    res.redirect('/admin/genres');
  } catch (err) {
    logger.error('Lỗi tạo thể loại:', err);
    req.flash('error_msg', 'Thể loại hoặc slug này đã tồn tại!');
    res.redirect('/admin/genres');
  }
};

// 10. Xóa thể loại
exports.deleteGenre = async (req, res) => {
  const { genreId } = req.params;
  try {
    await db.query('DELETE FROM genres WHERE id = ?', [genreId]);
    req.flash('success_msg', 'Đã xóa thể loại thành công!');
    res.redirect('/admin/genres');
  } catch (err) {
    logger.error('Lỗi xóa thể loại:', err);
    req.flash('error_msg', 'Lỗi khi xóa thể loại!');
    res.redirect('/admin/genres');
  }
};

// 11. Quản lý Bình luận
exports.getComments = async (req, res) => {
  try {
    const { q } = req.query;
    let whereClause = '1=1';
    let params = [];

    if (q && q.trim() !== '') {
      whereClause = '(c.content LIKE ? OR u.username LIKE ? OR s.title LIKE ?)';
      params.push(`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`);
    }

    const [comments] = await db.query(`
      SELECT c.*, u.username, s.title AS story_title, s.slug AS story_slug,
             ch.chapter_number
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      LEFT JOIN chapters ch ON c.chapter_id = ch.id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT 100
    `, params);

    res.render('pages/admin/comments', {
      title: 'Quản lý Bình Luận - VNnettruyen Admin',
      comments,
      q: q || ''
    });
  } catch (err) {
    logger.error('Lỗi tải bình luận admin:', err);
    req.flash('error_msg', 'Lỗi tải danh sách bình luận!');
    res.redirect('/admin');
  }
};

// 12. Xóa bình luận bởi Admin
exports.deleteCommentAdmin = async (req, res) => {
  const { commentId } = req.params;
  try {
    await db.query('DELETE FROM comments WHERE id = ?', [commentId]);
    req.flash('success_msg', 'Đã xóa bình luận vi phạm!');
    res.redirect('/admin/comments');
  } catch (err) {
    logger.error('Lỗi xóa bình luận:', err);
    req.flash('error_msg', 'Lỗi khi xóa bình luận!');
    res.redirect('/admin/comments');
  }
};
