const db = require('../config/db');
const logger = require('../config/logger');
const slugify = require('slugify');

// Hàm tạo slug tiếng Việt chuẩn
function createVietnameseSlug(text) {
  const s = slugify(text || '', {
    lower: true,
    strict: true,
    locale: 'vi'
  });
  return s && s.length > 0 ? s : `tac-pham-${Date.now()}`;
}

// 1. Dashboard Quản lý truyện của Tác giả
exports.getDashboard = async (req, res) => {
  const userId = req.session.user.id;

  try {
    const [stories] = await db.query(`
      SELECT s.*,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) AS chapter_count,
             (SELECT COUNT(*) FROM comments WHERE story_id = s.id) AS comment_count
      FROM stories s
      WHERE s.author_id = ?
      ORDER BY s.updated_at DESC
    `, [userId]);

    res.render('pages/author/dashboard', {
      title: 'Studio Tác Giả - Quản Lý Truyện | VNnettruyen',
      stories
    });
  } catch (err) {
    logger.error('Lỗi khi tải studio tác giả:', err);
    req.flash('error_msg', 'Không thể tải danh sách truyện sáng tác.');
    res.redirect('/');
  }
};

// 2. Giao diện Đăng truyện mới
exports.getCreateStory = async (req, res) => {
  try {
    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');
    res.render('pages/author/create-story', {
      title: 'Đăng Truyện Mới - Studio Tác Giả',
      genres
    });
  } catch (err) {
    logger.error('Lỗi tải trang tạo truyện:', err);
    req.flash('error_msg', 'Lỗi hệ thống');
    res.redirect('/author');
  }
};

// 3. Xử lý Đăng truyện mới
exports.postCreateStory = async (req, res) => {
  const userId = req.session.user.id;
  const { title, pen_name, description, cover_image, status, genre_ids } = req.body;

  if (!title || !description) {
    req.flash('error_msg', 'Tên truyện và tóm tắt nội dung không được để trống!');
    return res.redirect('/author/stories/create');
  }

  try {
    let slug = createVietnameseSlug(title);
    
    // Kiểm tra xem slug đã trùng chưa, nếu có thì thêm hậu tố
    const [existing] = await db.query('SELECT id FROM stories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Xử lý ảnh bìa: ưu tiên file tải lên từ máy tính, sau đó đến URL
    let finalCover = cover_image && cover_image.trim() !== '' ? cover_image.trim() : '/public/images/default-cover.png';
    if (req.file) {
      finalCover = `/public/uploads/covers/${req.file.filename}`;
    }

    const finalPenName = (pen_name && pen_name.trim() !== '') ? pen_name.trim() : null;

    const [result] = await db.query(`
      INSERT INTO stories (title, slug, author_id, pen_name, description, cover_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      slug,
      userId,
      finalPenName,
      description.trim(),
      finalCover,
      status || 'ongoing'
    ]);

    const storyId = result.insertId;

    // Gán thể loại
    if (genre_ids) {
      const gIds = Array.isArray(genre_ids) ? genre_ids : [genre_ids];
      for (const gid of gIds) {
        await db.query('INSERT IGNORE INTO story_genres (story_id, genre_id) VALUES (?, ?)', [storyId, gid]);
      }
    }

    logger.info(`Tác giả ID ${userId} (${req.session.user.username}) vừa tạo tác phẩm mới: ${title} (Bút danh: ${finalPenName || 'Mặc định'}, ID: ${storyId})`);
    req.flash('success_msg', 'Chúc mừng bạn đã tạo tác phẩm mới thành công! Giờ hãy bắt đầu viết chương 1 nhé.');
    res.redirect(`/author/stories/${storyId}/chapters`);
  } catch (err) {
    logger.error('Lỗi khi tạo truyện:', err);
    req.flash('error_msg', 'Lỗi máy chủ khi tạo truyện!');
    res.redirect('/author/stories/create');
  }
};

// 4. Giao diện Chỉnh sửa truyện
exports.getEditStory = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const [stories] = await db.query('SELECT * FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0) {
      req.flash('error_msg', 'Không tìm thấy truyện!');
      return res.redirect('/author');
    }

    const story = stories[0];
    if (Number(story.author_id) !== Number(userId) && userRole !== 'admin') {
      logger.warn(`Từ chối quyền: User ID ${userId} (${req.session.user.username}) cố gắng truy cập chỉnh sửa truyện ID ${storyId} của tác giả ID ${story.author_id}`);
      req.flash('error_msg', 'Bạn không có quyền chỉnh sửa tác phẩm của tác giả khác!');
      return res.redirect('/author');
    }

    const [genres] = await db.query('SELECT * FROM genres ORDER BY name ASC');
    const [selectedGenres] = await db.query('SELECT genre_id FROM story_genres WHERE story_id = ?', [storyId]);
    const selectedIds = selectedGenres.map(g => g.genre_id);

    res.render('pages/author/edit-story', {
      title: `Chỉnh sửa: ${story.title} - VNnettruyen`,
      story,
      genres,
      selectedIds
    });
  } catch (err) {
    logger.error('Lỗi khi tải thông tin sửa truyện:', err);
    req.flash('error_msg', 'Lỗi hệ thống');
    res.redirect('/author');
  }
};

// 5. Xử lý Chỉnh sửa truyện
exports.postEditStory = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const { title, pen_name, description, cover_image, status, genre_ids } = req.body;

  try {
    const [stories] = await db.query('SELECT * FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0) {
      req.flash('error_msg', 'Truyện không tồn tại!');
      return res.redirect('/author');
    }

    if (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin') {
      logger.warn(`Từ chối cập nhật: User ID ${userId} (${req.session.user.username}) cố gắng sửa truyện ID ${storyId} của tác giả ID ${stories[0].author_id}`);
      req.flash('error_msg', 'Bạn không có quyền chỉnh sửa tác phẩm của người khác!');
      return res.redirect('/author');
    }

    if (!title || title.trim() === '' || !description || description.trim() === '') {
      req.flash('error_msg', 'Tên tác phẩm và tóm tắt giới thiệu không được để trống!');
      return res.redirect(`/author/stories/${storyId}/edit`);
    }

    // Xử lý ảnh bìa: ưu tiên file tải lên từ máy tính
    let finalCover = cover_image && cover_image.trim() !== '' ? cover_image.trim() : (stories[0].cover_image || '/public/images/default-cover.png');
    if (req.file) {
      finalCover = `/public/uploads/covers/${req.file.filename}`;
    }

    const finalPenName = (pen_name && pen_name.trim() !== '') ? pen_name.trim() : null;

    // Cập nhật slug tương ứng nếu tên truyện thay đổi
    let updatedSlug = stories[0].slug;
    if (title.trim() !== stories[0].title) {
      let candidateSlug = createVietnameseSlug(title.trim());
      if (!candidateSlug || candidateSlug === '') {
        candidateSlug = `story-${storyId}`;
      }
      const [existingSlug] = await db.query(
        'SELECT id FROM stories WHERE slug = ? AND id != ? LIMIT 1',
        [candidateSlug, storyId]
      );
      if (existingSlug.length > 0) {
        updatedSlug = `${candidateSlug}-${storyId}`;
      } else {
        updatedSlug = candidateSlug;
      }
    }

    await db.query(`
      UPDATE stories 
      SET title = ?, slug = ?, pen_name = ?, description = ?, cover_image = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title.trim(),
      updatedSlug,
      finalPenName,
      description.trim(),
      finalCover,
      status || 'ongoing',
      storyId
    ]);

    // Cập nhật thể loại
    await db.query('DELETE FROM story_genres WHERE story_id = ?', [storyId]);
    if (genre_ids) {
      const gIds = Array.isArray(genre_ids) ? genre_ids : [genre_ids];
      for (const gid of gIds) {
        await db.query('INSERT IGNORE INTO story_genres (story_id, genre_id) VALUES (?, ?)', [storyId, gid]);
      }
    }

    logger.info(`Đã cập nhật tác phẩm ID ${storyId} ("${title.trim()}") bởi user ${userId} (${req.session.user.username})`);
    req.flash('success_msg', 'Cập nhật thông tin tác phẩm thành công!');
    res.redirect('/author');
  } catch (err) {
    logger.error('Lỗi cập nhật truyện:', err);
    req.flash('error_msg', 'Lỗi khi cập nhật truyện: ' + (err.message || 'Lỗi hệ thống'));
    res.redirect(`/author/stories/${storyId}/edit`);
  }
};

// 6. Xóa truyện
exports.deleteStory = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const [stories] = await db.query('SELECT author_id, title FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0) {
      req.flash('error_msg', 'Không tìm thấy truyện cần xóa!');
      return res.redirect('/author');
    }

    if (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin') {
      logger.warn(`Từ chối xóa: User ID ${userId} (${req.session.user.username}) cố xóa tác phẩm ID ${storyId} của tác giả ID ${stories[0].author_id}`);
      req.flash('error_msg', 'Bạn không có quyền xóa tác phẩm này!');
      return res.redirect('/author');
    }

    await db.query('DELETE FROM stories WHERE id = ?', [storyId]);
    logger.info(`Đã xóa truyện "${stories[0].title}" (ID: ${storyId})`);
    req.flash('success_msg', `Đã xóa truyện "${stories[0].title}" thành công!`);
    res.redirect('/author');
  } catch (err) {
    logger.error('Lỗi khi xóa truyện:', err);
    req.flash('error_msg', 'Lỗi hệ thống khi xóa truyện!');
    res.redirect('/author');
  }
};

// 7. Danh sách chương của truyện
exports.getStoryChapters = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const [stories] = await db.query('SELECT * FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0) {
      req.flash('error_msg', 'Truyện không tồn tại!');
      return res.redirect('/author');
    }

    if (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin') {
      logger.warn(`Từ chối xem chương: User ID ${userId} (${req.session.user.username}) cố truy cập tác phẩm ID ${storyId} của tác giả ID ${stories[0].author_id}`);
      req.flash('error_msg', 'Bạn không có quyền quản lý chương của tác phẩm này!');
      return res.redirect('/author');
    }

    const [chapters] = await db.query(`
      SELECT * FROM chapters 
      WHERE story_id = ? 
      ORDER BY chapter_number ASC
    `, [storyId]);

    res.render('pages/author/chapters', {
      title: `Quản lý chương: ${stories[0].title}`,
      story: stories[0],
      chapters
    });
  } catch (err) {
    logger.error('Lỗi khi tải danh sách chương:', err);
    req.flash('error_msg', 'Lỗi tải chương truyện!');
    res.redirect('/author');
  }
};

// 8. Giao diện Thêm chương mới
exports.getCreateChapter = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const [stories] = await db.query('SELECT id, title, author_id FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0 || (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin')) {
      req.flash('error_msg', 'Bạn không có quyền thêm chương cho tác phẩm này!');
      return res.redirect('/author');
    }

    // Lấy số chương tiếp theo gợi ý
    const [maxChapter] = await db.query(
      'SELECT MAX(chapter_number) AS max_num FROM chapters WHERE story_id = ?',
      [storyId]
    );
    const nextNum = (maxChapter[0].max_num || 0) + 1;

    res.render('pages/author/create-chapter', {
      title: `Thêm chương mới - ${stories[0].title}`,
      story: stories[0],
      suggestedNum: nextNum
    });
  } catch (err) {
    logger.error('Lỗi tải trang tạo chương:', err);
    req.flash('error_msg', 'Lỗi hệ thống');
    res.redirect('/author');
  }
};

// 9. Xử lý Thêm chương mới
exports.postCreateChapter = async (req, res) => {
  const { storyId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const { chapter_number, title, content, status } = req.body;

  if (!chapter_number || !title || title.trim() === '' || !content || content.trim() === '') {
    req.flash('error_msg', 'Vui lòng nhập đầy đủ số chương, tiêu đề và nội dung chương!');
    return res.redirect(`/author/stories/${storyId}/chapters/create`);
  }

  try {
    const [stories] = await db.query('SELECT id, author_id FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0 || (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin')) {
      req.flash('error_msg', 'Từ chối quyền hạn thêm chương!');
      return res.redirect('/author');
    }

    const chapNum = parseInt(chapter_number, 10) || 1;

    // Kiểm tra xem số chương đã tồn tại chưa
    const [existing] = await db.query(
      'SELECT id FROM chapters WHERE story_id = ? AND chapter_number = ? LIMIT 1',
      [storyId, chapNum]
    );
    if (existing.length > 0) {
      req.flash('error_msg', `Số chương ${chapNum} đã tồn tại trong tác phẩm này! Vui lòng chọn số chương khác.`);
      return res.redirect(`/author/stories/${storyId}/chapters/create`);
    }

    await db.query(`
      INSERT INTO chapters (story_id, chapter_number, title, content, status)
      VALUES (?, ?, ?, ?, ?)
    `, [
      storyId,
      chapNum,
      title.trim(),
      content.trim(),
      status || 'published'
    ]);

    // Cập nhật updated_at cho truyện
    await db.query('UPDATE stories SET updated_at = NOW() WHERE id = ?', [storyId]);

    req.flash('success_msg', `Đã xuất bản chương ${chapNum}: "${title.trim()}"!`);
    res.redirect(`/author/stories/${storyId}/chapters`);
  } catch (err) {
    logger.error('Lỗi khi thêm chương mới:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      req.flash('error_msg', `Số chương ${chapter_number} đã tồn tại trong truyện này!`);
    } else {
      req.flash('error_msg', 'Lỗi hệ thống khi lưu chương: ' + (err.message || ''));
    }
    res.redirect(`/author/stories/${storyId}/chapters/create`);
  }
};

// 10. Giao diện Sửa chương
exports.getEditChapter = async (req, res) => {
  const { storyId, chapterId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const [stories] = await db.query('SELECT id, title, author_id FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0 || (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin')) {
      req.flash('error_msg', 'Từ chối quyền hạn sửa chương!');
      return res.redirect('/author');
    }

    const [chapters] = await db.query('SELECT * FROM chapters WHERE id = ? AND story_id = ?', [chapterId, storyId]);
    if (chapters.length === 0) {
      req.flash('error_msg', 'Chương không tồn tại!');
      return res.redirect(`/author/stories/${storyId}/chapters`);
    }

    res.render('pages/author/edit-chapter', {
      title: `Sửa chương: ${chapters[0].title}`,
      story: stories[0],
      chapter: chapters[0]
    });
  } catch (err) {
    logger.error('Lỗi tải form sửa chương:', err);
    req.flash('error_msg', 'Lỗi hệ thống');
    res.redirect(`/author/stories/${storyId}/chapters`);
  }
};

// 11. Xử lý Sửa chương
exports.postEditChapter = async (req, res) => {
  const { storyId, chapterId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const { chapter_number, title, content, status } = req.body;

  if (!chapter_number || !title || title.trim() === '' || !content || content.trim() === '') {
    req.flash('error_msg', 'Số chương, tiêu đề và nội dung chương không được để trống!');
    return res.redirect(`/author/stories/${storyId}/chapters/${chapterId}/edit`);
  }

  try {
    const [stories] = await db.query('SELECT author_id FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0 || (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin')) {
      req.flash('error_msg', 'Từ chối quyền hạn sửa chương!');
      return res.redirect('/author');
    }

    const chapNum = parseInt(chapter_number, 10) || 1;

    // Kiểm tra xem số chương này đã trùng với một chương khác cùng truyện chưa
    const [existingChap] = await db.query(
      'SELECT id FROM chapters WHERE story_id = ? AND chapter_number = ? AND id != ? LIMIT 1',
      [storyId, chapNum, chapterId]
    );
    if (existingChap.length > 0) {
      req.flash('error_msg', `Số chương ${chapNum} đã tồn tại trong tác phẩm này! Vui lòng chọn số chương khác.`);
      return res.redirect(`/author/stories/${storyId}/chapters/${chapterId}/edit`);
    }

    await db.query(`
      UPDATE chapters 
      SET chapter_number = ?, title = ?, content = ?, status = ?, updated_at = NOW()
      WHERE id = ? AND story_id = ?
    `, [
      chapNum,
      title.trim(),
      content.trim(),
      status || 'published',
      chapterId,
      storyId
    ]);

    await db.query('UPDATE stories SET updated_at = NOW() WHERE id = ?', [storyId]);

    req.flash('success_msg', `Đã cập nhật chương ${chapNum}: "${title.trim()}" thành công!`);
    res.redirect(`/author/stories/${storyId}/chapters`);
  } catch (err) {
    logger.error('Lỗi khi sửa chương:', err);
    req.flash('error_msg', 'Lỗi khi cập nhật chương: ' + (err.message || 'Lỗi hệ thống'));
    res.redirect(`/author/stories/${storyId}/chapters/${chapterId}/edit`);
  }
};

// 12. Xóa chương
exports.deleteChapter = async (req, res) => {
  const { storyId, chapterId } = req.params;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  try {
    const [stories] = await db.query('SELECT author_id FROM stories WHERE id = ?', [storyId]);
    if (stories.length === 0 || (Number(stories[0].author_id) !== Number(userId) && userRole !== 'admin')) {
      req.flash('error_msg', 'Từ chối quyền hạn xóa chương!');
      return res.redirect('/author');
    }

    await db.query('DELETE FROM chapters WHERE id = ? AND story_id = ?', [chapterId, storyId]);
    req.flash('success_msg', 'Đã xóa chương thành công!');
    res.redirect(`/author/stories/${storyId}/chapters`);
  } catch (err) {
    logger.error('Lỗi khi xóa chương:', err);
    req.flash('error_msg', 'Lỗi hệ thống khi xóa chương!');
    res.redirect(`/author/stories/${storyId}/chapters`);
  }
};
