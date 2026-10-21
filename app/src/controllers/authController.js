const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../config/logger');

// Hiển thị trang đăng nhập
exports.getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('pages/login', {
    title: 'Đăng nhập - VNnettruyen',
    redirect: req.query.redirect || '/'
  });
};

// Xử lý đăng nhập
exports.postLogin = async (req, res) => {
  const { password, redirect } = req.body;
  const account = req.body.account || req.body.username;

  if (!account || !password) {
    req.flash('error_msg', 'Vui lòng điền đầy đủ tài khoản/email và mật khẩu!');
    return res.redirect('/auth/login');
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [account.trim(), account.trim()]
    );

    if (rows.length === 0) {
      req.flash('error_msg', 'Tài khoản hoặc mật khẩu không chính xác!');
      return res.redirect('/auth/login');
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn(`Đăng nhập thất bại cho tài khoản: ${account}`);
      req.flash('error_msg', 'Tài khoản hoặc mật khẩu không chính xác!');
      return res.redirect('/auth/login');
    }

    // Thiết lập session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '/public/images/default-avatar.png'
    };

    logger.info(`Người dùng đăng nhập thành công: ${user.username} (Role: ${user.role})`);
    req.flash('success_msg', `Chào mừng bạn trở lại, ${user.username}!`);

    const targetUrl = redirect && redirect.startsWith('/') ? redirect : '/';
    return res.redirect(targetUrl);
  } catch (err) {
    logger.error('Lỗi khi xử lý đăng nhập:', err);
    req.flash('error_msg', 'Đã xảy ra lỗi máy chủ trong quá trình đăng nhập!');
    return res.redirect('/auth/login');
  }
};

// Hiển thị trang đăng ký
exports.getRegister = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('pages/register', {
    title: 'Đăng ký tài khoản - VNnettruyen'
  });
};

// Xử lý đăng ký
exports.postRegister = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    req.flash('error_msg', 'Vui lòng điền đầy đủ tất cả các trường thông tin!');
    return res.redirect('/auth/register');
  }

  if (username.length < 3 || username.length > 30) {
    req.flash('error_msg', 'Tên đăng nhập phải từ 3 đến 30 ký tự!');
    return res.redirect('/auth/register');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    req.flash('error_msg', 'Định dạng email không hợp lệ!');
    return res.redirect('/auth/register');
  }

  if (password.length < 6) {
    req.flash('error_msg', 'Mật khẩu phải chứa ít nhất 6 ký tự!');
    return res.redirect('/auth/register');
  }

  if (password !== confirmPassword) {
    req.flash('error_msg', 'Mật khẩu xác nhận không trùng khớp!');
    return res.redirect('/auth/register');
  }

  // Role hợp lệ: reader hoặc author (không cho phép tự chọn admin)
  const assignedRole = role === 'author' ? 'author' : 'reader';

  try {
    const [existing] = await db.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim()]
    );

    if (existing.length > 0) {
      if (existing[0].username.toLowerCase() === username.trim().toLowerCase()) {
        req.flash('error_msg', 'Tên đăng nhập này đã được sử dụng!');
      } else {
        req.flash('error_msg', 'Email này đã được đăng ký!');
      }
      return res.redirect('/auth/register');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username.trim(), email.trim(), hashedPassword, assignedRole]
    );

    logger.info(`Đăng ký tài khoản mới thành công: ${username} (ID: ${result.insertId}, Role: ${assignedRole})`);

    // Tự động đăng nhập sau khi đăng ký
    req.session.user = {
      id: result.insertId,
      username: username.trim(),
      email: email.trim(),
      role: assignedRole,
      avatar: '/public/images/default-avatar.png'
    };

    req.flash('success_msg', 'Đăng ký tài khoản thành công! Chào mừng bạn gia nhập cộng đồng VNnettruyen.');
    return res.redirect('/');
  } catch (err) {
    logger.error('Lỗi khi xử lý đăng ký tài khoản:', err);
    req.flash('error_msg', 'Lỗi hệ thống khi đăng ký tài khoản, vui lòng thử lại sau.');
    return res.redirect('/auth/register');
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  if (req.session.user) {
    const username = req.session.user.username;
    req.session.destroy((err) => {
      if (err) {
        logger.error('Lỗi hủy session khi đăng xuất:', err);
      }
      logger.info(`Người dùng đã đăng xuất: ${username}`);
      res.redirect('/auth/login');
    });
  } else {
    res.redirect('/');
  }
};

// Xem hồ sơ cá nhân
exports.getProfile = async (req, res) => {
  const userId = req.session.user.id;

  try {
    const [userRows] = await db.query('SELECT id, username, email, role, bio, avatar, created_at FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      req.flash('error_msg', 'Không tìm thấy thông tin tài khoản!');
      return res.redirect('/');
    }

    // Lấy tủ sách / truyện yêu thích
    const [favorites] = await db.query(`
      SELECT s.id, s.title, s.slug, s.cover_image, s.status, u.username AS author_name,
             (SELECT COUNT(*) FROM chapters WHERE story_id = s.id AND status = 'published') AS total_chapters
      FROM favorites f
      JOIN stories s ON f.story_id = s.id
      JOIN users u ON s.author_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    // Lấy lịch sử đọc gần nhất
    const [history] = await db.query(`
      SELECT rh.read_at, s.title AS story_title, s.slug AS story_slug, 
             c.chapter_number, c.title AS chapter_title
      FROM reading_history rh
      JOIN stories s ON rh.story_id = s.id
      JOIN chapters c ON rh.chapter_id = c.id
      WHERE rh.user_id = ?
      ORDER BY rh.read_at DESC
      LIMIT 10
    `, [userId]);

    // Nếu là tác giả, lấy số truyện đã viết
    let authorStories = [];
    if (userRows[0].role === 'author' || userRows[0].role === 'admin') {
      const [stories] = await db.query(`
        SELECT id, title, slug, status, views, created_at,
               (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) AS chapter_count
        FROM stories s
        WHERE author_id = ?
        ORDER BY created_at DESC
      `, [userId]);
      authorStories = stories;
    }

    res.render('pages/profile', {
      title: `Hồ sơ cá nhân: ${userRows[0].username} - VNnettruyen`,
      profileUser: userRows[0],
      favorites,
      history,
      authorStories
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang hồ sơ cá nhân:', err);
    req.flash('error_msg', 'Không thể tải thông tin hồ sơ!');
    res.redirect('/');
  }
};

// Cập nhật hồ sơ cá nhân
exports.postProfile = async (req, res) => {
  const userId = req.session.user.id;
  const { bio, avatar, currentPassword, newPassword } = req.body;

  try {
    // Cập nhật thông tin cơ bản
    await db.query(
      'UPDATE users SET bio = ?, avatar = ? WHERE id = ?',
      [bio ? bio.trim() : null, avatar ? avatar.trim() : '/public/images/default-avatar.png', userId]
    );

    // Cập nhật session avatar nếu đổi
    if (avatar) {
      req.session.user.avatar = avatar.trim();
    }

    // Đổi mật khẩu nếu người dùng nhập
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        req.flash('error_msg', 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới!');
        return res.redirect('/profile');
      }

      if (newPassword.length < 6) {
        req.flash('error_msg', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
        return res.redirect('/profile');
      }

      const [userRows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
      const isMatch = await bcrypt.compare(currentPassword, userRows[0].password);
      if (!isMatch) {
        req.flash('error_msg', 'Mật khẩu hiện tại không chính xác!');
        return res.redirect('/profile');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
      req.flash('success_msg', 'Cập nhật hồ sơ và đổi mật khẩu thành công!');
      return res.redirect('/profile');
    }

    req.flash('success_msg', 'Cập nhật thông tin hồ sơ thành công!');
    res.redirect('/profile');
  } catch (err) {
    logger.error('Lỗi cập nhật hồ sơ:', err);
    req.flash('error_msg', 'Lỗi hệ thống khi cập nhật hồ sơ!');
    res.redirect('/profile');
  }
};
