const db = require('../config/db');
const logger = require('../config/logger');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href']
  }
};

// 1. Trang chủ phong cách Diễn Đàn Sáng Tác & Đọc Truyện (Vnkings Style)
exports.getHome = async (req, res) => {
  try {
    // 1. Top View Tuần (Dải sách ngang trên cùng)
    const [topWeeklyStories] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.views, u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ORDER BY s.views DESC
      LIMIT 10
    `);

    // 2. Tác phẩm tiêu biểu (Spotlight Banner)
    const [spotlightRows] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.description, s.views,
             u.username AS author_name,
             (SELECT name FROM genres g JOIN story_genres sg ON g.id = sg.genre_id WHERE sg.story_id = s.id LIMIT 1) AS primary_genre
      FROM stories s
      JOIN users u ON s.author_id = u.id
      WHERE s.is_featured = 1
      ORDER BY s.views DESC
      LIMIT 1
    `);
    const spotlightStory = spotlightRows.length > 0 ? spotlightRows[0] : topWeeklyStories[0];

    // 3. Thông báo diễn đàn (Bulletin Board)
    const [announcements] = await db.query('SELECT * FROM forum_announcements ORDER BY display_order ASC');

    // 4. Chương mới cập nhật (Cột bên phải của 2-column updates)
    const [latestChapters] = await db.query(`
      SELECT c.id, c.chapter_number, c.title AS chapter_title, c.updated_at,
             s.title AS story_title, s.slug AS story_slug,
             u.username AS author_name,
             (SELECT name FROM genres g JOIN story_genres sg ON g.id = sg.genre_id WHERE sg.story_id = s.id LIMIT 1) AS genre_name
      FROM chapters c
      JOIN stories s ON c.story_id = s.id
      JOIN users u ON s.author_id = u.id
      WHERE c.status = 'published'
      ORDER BY c.updated_at DESC
      LIMIT 8
    `);

    // 5. Hoạt động mới / Bình luận thảo luận (Cột bên trái của 2-column updates)
    const [recentComments] = await db.query(`
      SELECT c.id, c.content, c.created_at,
             u.username, u.avatar,
             s.title AS story_title, s.slug AS story_slug,
             (SELECT name FROM genres g JOIN story_genres sg ON g.id = sg.genre_id WHERE sg.story_id = s.id LIMIT 1) AS genre_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 8
    `);

    // 6. Dòng tin Điểm Danh thành viên (Check-in Ticker)
    const [checkinFeed] = await db.query(`
      SELECT d.coins_earned, d.created_at, u.username
      FROM daily_checkins d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 6
    `);

    // 7. Hoạt động chung cộng đồng (Sidebar Community Stream)
    const [communityActivities] = await db.query(`
      SELECT 'comment' AS type, u.username, u.avatar, s.title AS story_title, s.slug AS story_slug, c.created_at
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 6
    `);

    // 8. Tất cả thể loại phục vụ Mega-Menu & Subnav
    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');

    // 9. Bảng xếp hạng (Rankings sidebar)
    const [rankingStories] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.views, u.username AS author_name
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ORDER BY s.views DESC
      LIMIT 10
    `);

    res.render('pages/index', {
      title: 'VNnettruyen - Diễn Đàn Đọc và Sáng Tác Truyện Việt Nam',
      topWeeklyStories,
      spotlightStory,
      announcements,
      latestChapters,
      recentComments,
      checkinFeed,
      communityActivities,
      rankingStories,
      genres
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang chủ:', err);
    res.status(500).render('pages/error', {
      title: 'Lỗi máy chủ',
      statusCode: 500,
      message: 'Không thể kết nối đến cơ sở dữ liệu diễn đàn.'
    });
  }
};

// 2. Danh sách truyện (Khám phá truyện, tìm kiếm, lọc, phân trang)
exports.getStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = 12;
    const offset = (page - 1) * limit;

    const { q, genre, status, sort } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];

    if (q && q.trim() !== '') {
      whereConditions.push('(s.title LIKE ? OR u.username LIKE ?)');
      queryParams.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    if (status && (status === 'ongoing' || status === 'completed')) {
      whereConditions.push('s.status = ?');
      queryParams.push(status);
    }

    let genreJoin = '';
    if (genre && genre.trim() !== '') {
      genreJoin = 'JOIN story_genres sg_filter ON s.id = sg_filter.story_id JOIN genres g_filter ON sg_filter.genre_id = g_filter.id';
      whereConditions.push('g_filter.slug = ?');
      queryParams.push(genre.trim());
    }

    let orderBy = 's.updated_at DESC';
    if (sort === 'views') orderBy = 's.views DESC';
    if (sort === 'title') orderBy = 's.title ASC';
    if (sort === 'newest') orderBy = 's.created_at DESC';

    const whereClause = whereConditions.join(' AND ');

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

    const storiesSql = `
      SELECT s.id, s.title, s.slug, s.cover_image, s.status, s.views, s.updated_at,
             u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters,
             (SELECT title FROM chapters WHERE story_id = s.id AND status = 'published' ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter_title,
             (SELECT chapter_number FROM chapters WHERE story_id = s.id AND status = 'published' ORDER BY chapter_number DESC LIMIT 1) AS latest_chapter_number,
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
      title: 'Khám Phá & Đọc Truyện - VNnettruyen',
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

    // Danh sách chương
    const [chapters] = await db.query(`
      SELECT id, chapter_number, title, created_at
      FROM chapters
      WHERE story_id = ? AND status = 'published'
      ORDER BY chapter_number ASC
    `, [story.id]);

    // Bình luận
    const [comments] = await db.query(`
      SELECT c.*, u.username, u.avatar, u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.story_id = ?
      ORDER BY c.created_at DESC
      LIMIT 30
    `, [story.id]);

    // Kiểm tra bookmark
    let isBookmarked = false;
    if (req.session.user) {
      const [fav] = await db.query(
        'SELECT 1 FROM favorites WHERE user_id = ? AND story_id = ? LIMIT 1',
        [req.session.user.id, story.id]
      );
      isBookmarked = fav.length > 0;
    }

    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');

    res.render('pages/story-detail', {
      title: `${story.title} - Đọc Truyện Online tại VNnettruyen`,
      story,
      chapters,
      comments,
      isBookmarked,
      genres
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
    const [stories] = await db.query('SELECT id, title, slug FROM stories WHERE slug = ? LIMIT 1', [slug]);
    if (stories.length === 0) {
      return res.status(404).render('pages/error', {
        title: '404',
        statusCode: 404,
        message: 'Truyện không tồn tại.'
      });
    }
    const story = stories[0];

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

    const [allChapters] = await db.query(`
      SELECT id, chapter_number, title 
      FROM chapters 
      WHERE story_id = ? AND status = 'published'
      ORDER BY chapter_number ASC
    `, [story.id]);

    const prevChapter = allChapters.find(c => c.chapter_number === num - 1) || null;
    const nextChapter = allChapters.find(c => c.chapter_number === num + 1) || null;

    if (req.session.user) {
      await db.query(`
        INSERT INTO reading_history (user_id, story_id, chapter_id, read_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE chapter_id = VALUES(chapter_id), read_at = NOW()
      `, [req.session.user.id, story.id, currentChapter.id]);
    }

    const [chapterComments] = await db.query(`
      SELECT c.*, u.username, u.avatar, u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.chapter_id = ?
      ORDER BY c.created_at DESC
    `, [currentChapter.id]);

    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');

    res.render('pages/chapter-reader', {
      title: `${story.title} - ${currentChapter.title} | VNnettruyen`,
      story,
      chapter: currentChapter,
      allChapters,
      prevChapter,
      nextChapter,
      comments: chapterComments,
      genres
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

// 5. Gửi bình luận
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
    req.flash('error_msg', 'Không thể lưu bình luận!');
    res.redirect('back');
  }
};

// 6. Xóa bình luận
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

// 7. Thêm/Hủy yêu thích truyện
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

// 8. Điểm danh nhận Xu hằng ngày (Daily Check-in API)
exports.postDailyCheckin = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để điểm danh!' });
  }

  const userId = req.session.user.id;

  try {
    const [todayCheckin] = await db.query(
      'SELECT id FROM daily_checkins WHERE user_id = ? AND DATE(created_at) = CURDATE() LIMIT 1',
      [userId]
    );

    if (todayCheckin.length > 0) {
      return res.json({ success: false, message: 'Bạn đã điểm danh hôm nay rồi! Hãy quay lại vào ngày mai nhé.' });
    }

    // Tặng ngẫu nhiên từ 3 đến 10 Xu
    const earnedCoins = Math.floor(Math.random() * 8) + 3;

    await db.query('INSERT INTO daily_checkins (user_id, coins_earned) VALUES (?, ?)', [userId, earnedCoins]);
    await db.query('UPDATE users SET coins = COALESCE(coins, 0) + ? WHERE id = ?', [earnedCoins, userId]);

    const [[updatedUser]] = await db.query('SELECT coins FROM users WHERE id = ?', [userId]);

    logger.info(`Người dùng ${req.session.user.username} điểm danh nhận ${earnedCoins} Xu`);
    return res.json({
      success: true,
      earnedCoins,
      totalCoins: updatedUser.coins,
      message: `Điểm danh thành công! Bạn nhận được ${earnedCoins} Xu từ hệ thống VNnettruyen.`
    });
  } catch (err) {
    logger.error('Lỗi điểm danh:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi điểm danh.' });
  }
};
