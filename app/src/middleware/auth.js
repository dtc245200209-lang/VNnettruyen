// Middleware kiểm tra và phân quyền người dùng

function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error_msg', 'Vui lòng đăng nhập để thực hiện thao tác này!');
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error_msg', 'Vui lòng đăng nhập để tiếp tục!');
      return res.redirect('/auth/login');
    }
    const userRole = req.session.user.role;
    if (!roles.includes(userRole)) {
      req.flash('error_msg', 'Bạn không có quyền truy cập vào khu vực này!');
      return res.status(403).render('pages/error', {
        title: 'Truy cập bị từ chối - 403',
        statusCode: 403,
        message: 'Bạn không có quyền hạn cần thiết để truy cập tài nguyên này.'
      });
    }
    next();
  };
}

module.exports = {
  attachUser,
  requireAuth,
  requireRole
};
