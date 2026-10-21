const rateLimit = require('express-rate-limit');

// Rate limiter chung cho toàn bộ website
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tối đa 1000 requests mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.'
});

// Rate limiter nghiêm ngặt cho đăng nhập, đăng ký phòng chống brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 lần thử
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error_msg', 'Bạn đã thử đăng nhập/đăng ký quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.');
    res.redirect('/auth/login');
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
