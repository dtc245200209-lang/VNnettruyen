const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn lưu trữ ảnh bìa truyện
const uploadDir = path.join(__dirname, '../../public/uploads/covers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu file trên ổ đĩa
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cover-${uniqueSuffix}${safeExt}`);
  }
});

// Bộ lọc định dạng file hợp lệ
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các tệp hình ảnh (.jpg, .jpeg, .png, .webp, .gif)!'), false);
  }
};

const uploadCover = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn tối đa 5MB
  }
});

// Middleware bọc để bắt lỗi tải file sạch sẽ không bị crash 500
function handleUploadCover(req, res, next) {
  const uploadSingle = uploadCover.single('cover_file');
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash('error_msg', 'Tệp ảnh tải lên quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      } else {
        req.flash('error_msg', `Lỗi tải ảnh: ${err.message}`);
      }
      return res.redirect('back');
    } else if (err) {
      req.flash('error_msg', err.message || 'Lỗi định dạng tệp ảnh!');
      return res.redirect('back');
    }
    next();
  });
}

module.exports = {
  uploadCover,
  handleUploadCover
};
