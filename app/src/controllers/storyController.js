const db = require('../config/db');
const logger = require('../config/logger');
const sanitizeHtml = require('sanitize-html');

// Helper định dạng cấu hình XSS
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href']
  }
};

// 1. Trang chủ
exports.getHome = async (req, res) => {
  try {
    // Truyện nổi bật
    const [featuredStories] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.views, s.description,
             u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters,
             GROUP_CONCAT(g.name SEPARATOR ', ') AS genres_list
      FROM stories s
      JOIN users u ON s.author_id = u.id
      LEFT JOIN story_genres sg ON s.id = sg.story_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      WHERE s.is_featured = 1
      GROUP BY s.id
      LIMIT 6
    `);

    // Truyện mới cập nhật
    const [latestStories] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.views, s.updated_at,
             u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters,
             (SELECT title FROM chapters WHERE story_id = s.id AND status = 'published' ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter_title,
             (SELECT chapter_number FROM chapters WHERE story_id = s.id AND status = 'published' ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter_number,
             GROUP_CONCAT(g.name SEPARATOR ', ') AS genres_list
      FROM stories s
      JOIN users u ON s.author_id = u.id
      LEFT JOIN story_genres sg ON s.id = sg.story_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      GROUP BY s.id
      ORDER BY s.updated_at DESC
      LIMIT 12
    `);

    // Bảng xếp hạng đọc nhiều (Top Views)
    const [topStories] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.views, u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ORDER BY s.views DESC
      LIMIT 10
    `);

    // Tất cả thể loại
    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');

    res.render('pages/index', {
      title: 'VNnettruyen - Website Đọc và Sáng Tác Truyện Hàng Đầu Việt Nam',
      featuredStories,
      latestStories,
      topStories,
      genres
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang chủ:', err);
    res.status(500).render('pages/error', {
      title: 'Lỗi máy chủ',
      statusCode: 500,
      message: 'Không thể kết nối đến dữ liệu trang chủ.'
    });
  }
};

// 2. Danh sách truyện (Tìm kiếm, lọc thể loại, trạng thái, phân trang)
exports.getStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = 12;
    const offset = (page - 1) * limit;

    const { q, genre, status, sort } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];

    // Tìm kiếm từ khóa
    if (q && q.trim() !== '') {
      whereConditions.push('(s.title LIKE ? OR u.username LIKE ?)');
      queryParams.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    // Lọc theo trạng thái
    if (status && (status === 'ongoing' || status === 'completed')) {
      whereConditions.push('s.status = ?');
      queryParams.push(status);
    }

    // Lọc theo thể loại slug
    let genreJoin = '';
    if (genre && genre.trim() !== '') {
      genreJoin = 'JOIN story_genres sg_filter ON s.id = sg_filter.story_id JOIN genres g_filter ON sg_filter.genre_id = g_filter.id';
      whereConditions.push('g_filter.slug = ?');
      queryParams.push(genre.trim());
    }

    // Sắp xếp
    let orderBy = 's.updated_at DESC';
    if (sort === 'views') orderBy = 's.views DESC';
    if (sort === 'title') orderBy = 's.title ASC';
    if (sort === 'newest') orderBy = 's.created_at DESC';

    const whereClause = whereConditions.join(' AND ');

    // Đếm tổng số
    const countSql = `
      SELECT COUNT(DISTINCT s.id) AS total
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ${genreJoin}
      WHERE ${whereClause}
    `;
    const [countRows] = await db.query(countSql, queryParams);
    const totalStories = countRows[0].total;
    const totalPages = Math.ceil(totalStories / limit) || 1;

    // Lấy dữ liệu truyện
    const storiesSql = `
      SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.views, s.updated_at,
             u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters,
             GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres_list
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ${genreJoin}
      LEFT JOIN story_genres sg ON s.id = sg.story_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      WHERE ${whereClause}
      GROUP BY s.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [stories] = await db.query(storiesSql, [...queryParams, limit, offset]);
    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');

    res.render('pages/stories', {
      title: 'Danh sách truyện - VNnettruyen',
      stories,
      genres,
      currentPage: page,
      totalPages,
      totalStories,
      query: { q: q || '', genre: genre || '', status: status || '', sort: sort || '' }
    });
  } catch (err) {
    logger.error('Lỗi khi tải danh sách truyện:', err);
    res.status(500).render('pages/error', {
      title: 'Lỗi',
      statusCode: 500,
      message: 'Lỗi tải danh sách truyện.'
    });
  }
};

// 3. Chi tiết truyện
exports.getStoryDetail = async (req, res) => {
  const { slug } = req.params;

  try {
    const [stories] = await db.query(`
      SELECT s.*, u.username AS author_name, u.avatar AS author_avatar,
             GROUP_CONCAT(DISTINCT g.name SEPARATOR '||') AS genre_names,
             GROUP_CONCAT(DISTINCT g.slug SEPARATOR '||') AS genre_slugs
      FROM stories s
      JOIN users u ON s.author_id = u.id
      LEFT JOIN story_genres sg ON s.id = sg.story_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      WHERE s.slug = ?
      GROUP BY s.id
      LIMIT 1
    `, [slug]);

    if (stories.length === 0) {
      return res.status(404).render('pages/error', {
        title: 'Không tìm thấy truyện - 404',
        statusCode: 404,
        message: 'Bộ truyện bạn tìm kiếm không tồn tại hoặc đã bị xóa.'
      });
    }

    const story = stories[0];

    // Tăng lượt xem
    await db.query('UPDATE stories SET views = views + 1 WHERE id = ?', [story.id]);

    // Lấy danh sách chương
    const [chapters] = await db.query(`
      SELECT id, chapter_number, title, created_at
      FROM chapters
      WHERE story_id = ? AND status = 'published'
      ORDER BY chapter_number ASC
    `, [story.id]);

    // Lấy bình luận của truyện
    const [comments] = await db.query(`
      SELECT c.*, u.username, u.avatar, u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.story_id = ?
      ORDER BY c.created_at DESC
      LIMIT 30
    `, [story.id]);

    // Kiểm tra xem người dùng hiện tại đã bookmark chưa
    let isBookmarked = false;
    if (req.session.user) {
      const [fav] = await db.query(
        'SELECT 1 FROM favorites WHERE user_id = ? AND story_id = ? LIMIT 1',
        [req.session.user.id, story.id]
      );
      isBookmarked = fav.length > 0;
    }

    res.render('pages/story-detail', {
      title: `${story.title} - Đọc Truyện Online tại VNnettruyen`,
      story,
      chapters,
      comments,
      isBookmarked
    });
  } catch (err) {
    logger.error('Lỗi khi tải chi tiết truyện:', err);
    res.status(500).render('pages/error', {
      title: 'Lỗi',
      statusCode: 500,
      message: 'Lỗi khi tải thông tin chi tiết truyện.'
    });
  }
};

// 4. Trang đọc chương
exports.getChapter = async (req, res) => {
  const { slug, chapterNumber } = req.params;
  const num = parseInt(chapterNumber, 10);

  try {
    // Tìm truyện
    const [stories] = await db.query('SELECT id, title, slug FROM stories WHERE slug = ? LIMIT 1', [slug]);
    if (stories.length === 0) {
      return res.status(404).render('pages/error', {
        title: '404',
        statusCode: 404,
        message: 'Truyện không tồn tại.'
      });
    }
    const story = stories[0];

    // Tìm chương hiện tại
    const [chapters] = await db.query(`
      SELECT * FROM chapters 
      WHERE story_id = ? AND chapter_number = ? AND status = 'published'
      LIMIT 1
    `, [story.id, num]);

    if (chapters.length === 0) {
      return res.status(404).render('pages/error', {
        title: 'Không tìm thấy chương',
        statusCode: 404,
        message: 'Chương truyện này hiện chưa ra mắt hoặc đã bị ẩn.'
      });
    }

    const currentChapter = chapters[0];

    // Lấy danh sách tất cả các chương để phục vụ Menu Chọn Nhanh
    const [allChapters] = await db.query(`
      SELECT id, chapter_number, title 
      FROM chapters 
      WHERE story_id = ? AND status = 'published'
      ORDER BY chapter_number ASC
    `, [story.id]);

    // Tìm chương trước và chương kế tiếp
    const prevChapter = allChapters.find(c => c.chapter_number === num - 1) || null;
    const nextChapter = allChapters.find(c => c.chapter_number === num + 1) || null;

    // Lưu lịch sử đọc nếu đăng nhập
    if (req.session.user) {
      await db.query(`
        INSERT INTO reading_history (user_id, story_id, chapter_id, read_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE chapter_id = VALUES(chapter_id), read_at = NOW()
      `, [req.session.user.id, story.id, currentChapter.id]);
    }

    // Lấy bình luận riêng của chương này
    const [chapterComments] = await db.query(`
      SELECT c.*, u.username, u.avatar, u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.chapter_id = ?
      ORDER BY c.created_at DESC
    `, [currentChapter.id]);

    res.render('pages/chapter-reader', {
      title: `${story.title} - ${currentChapter.title} | VNnettruyen`,
      story,
      chapter: currentChapter,
      allChapters,
      prevChapter,
      nextChapter,
      comments: chapterComments
    });
  } catch (err) {
    logger.error('Lỗi khi tải chương truyện:', err);
    res.status(500).render('pages/error', {
      title: 'Lỗi',
      statusCode: 500,
      message: 'Không thể tải nội dung chương truyện.'
    });
  }
};

// 5. Gửi bình luận (Hỗ trợ chống XSS)
exports.postComment = async (req, res) => {
  const { story_id, chapter_id, content } = req.body;
  const userId = req.session.user.id;

  if (!content || content.trim().length === 0) {
    req.flash('error_msg', 'Nội dung bình luận không được để trống!');
    return res.redirect('back');
  }

  if (content.trim().length > 1000) {
    req.flash('error_msg', 'Bình luận không được dài quá 1000 ký tự!');
    return res.redirect('back');
  }

  // Khử trùng XSS an toàn
  const cleanContent = sanitizeHtml(content.trim(), sanitizeOptions);

  try {
    await db.query(
      'INSERT INTO comments (user_id, story_id, chapter_id, content) VALUES (?, ?, ?, ?)',
      [userId, story_id, chapter_id || null, cleanContent]
    );

    req.flash('success_msg', 'Đã đăng bình luận thành công!');
    res.redirect('back');
  } catch (err) {
    logger.error('Lỗi khi lưu bình luận:', err);
    req.flash('error_msg', 'Không thể lưu bình luận, vui lòng thử lại sau!');
    res.redirect('back');
  }
};

// 6. Xóa bình luận (chỉ tác giả bình luận hoặc admin)
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const user = req.session.user;

  try {
    const [rows] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (rows.length === 0) {
      req.flash('error_msg', 'Bình luận không tồn tại!');
      return res.redirect('back');
    }

    if (rows[0].user_id !== user.id && user.role !== 'admin') {
      req.flash('error_msg', 'Bạn không có quyền xóa bình luận này!');
      return res.redirect('back');
    }

    await db.query('DELETE FROM comments WHERE id = ?', [commentId]);
    req.flash('success_msg', 'Đã xóa bình luận thành công!');
    res.redirect('back');
  } catch (err) {
    logger.error('Lỗi khi xóa bình luận:', err);
    req.flash('error_msg', 'Lỗi hệ thống khi xóa bình luận!');
    res.redirect('back');
  }
};

// 7. Thêm/Hủy yêu thích truyện (Tủ sách)
exports.toggleBookmark = async (req, res) => {
  const { storyId } = req.body;
  const userId = req.session.user.id;

  try {
    const [existing] = await db.query(
      'SELECT 1 FROM favorites WHERE user_id = ? AND story_id = ?',
      [userId, storyId]
    );

    let bookmarked = false;
    if (existing.length > 0) {
      await db.query('DELETE FROM favorites WHERE user_id = ? AND story_id = ?', [userId, storyId]);
      bookmarked = false;
    } else {
      await db.query('INSERT INTO favorites (user_id, story_id) VALUES (?, ?)', [userId, storyId]);
      bookmarked = true;
    }

    // Nếu là AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, bookmarked });
    }

    req.flash('success_msg', bookmarked ? 'Đã thêm vào tủ sách yêu thích!' : 'Đã xóa khỏi tủ sách!');
    res.redirect('back');
  } catch (err) {
    logger.error('Lỗi khi chuyển trạng thái yêu thích:', err);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
    req.flash('error_msg', 'Lỗi thao tác tủ sách!');
    res.redirect('back');
  }
};
