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

module.exports = {
  uploadCover
};
