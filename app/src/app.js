const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const db = require('./config/db');
const logger = require('./config/logger');
const { register, httpRequestsTotal, httpRequestDurationSeconds } = require('./config/metrics');
const { attachUser } = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const authorRoutes = require('./routes/author');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cấu hình bảo mật Helmet với CSP phù hợp
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. Trust proxy (vì chạy sau Nginx Reverse Proxy)
app.set('trust proxy', 1);

// 3. Rate limiting chung
app.use(generalLimiter);

// 4. Request Logging với Morgan và Winston
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

// 5. Middleware đo Prometheus Metrics
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    // Loại trừ metrics chính nó để tránh nhiễu
    if (req.path !== '/metrics') {
      httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
      httpRequestDurationSeconds.observe({ method: req.method, route, status_code: statusCode }, durationSeconds);
    }
  });
  next();
});

// 6. Phân tích request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// 7. Cấu hình Session lưu trong MySQL
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 phút
  expiration: 86400000, // 1 ngày
  createDatabaseTable: false,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, db);

app.use(
  session({
    key: 'vnnettruyen_sid',
    secret: process.env.SESSION_SECRET || 'vnnettruyen_default_secret_dev_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Để false trong môi trường HTTP lab hoặc dev, có thể đổi theo HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      sameSite: 'lax'
    }
  })
);

// 8. Flash messages & User context
app.use(flash());
app.use(attachUser);

// 9. Template engine EJS & Static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use('/public', express.static(path.join(__dirname, '../public')));

// 10. Endpoint kiểm tra sức khỏe hệ thống (Healthcheck)
app.get('/health', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 AS healthy');
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: result[0].healthy === 1 ? 'CONNECTED' : 'UNKNOWN'
    });
  } catch (err) {
    logger.error('Healthcheck thất bại:', err);
    res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: err.message
    });
  }
});

// 11. Endpoint Prometheus Metrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// 12. Mount Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/author', authorRoutes);
app.use('/admin', adminRoutes);

// 13. Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Trang không tồn tại - 404',
    statusCode: 404,
    message: 'Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ khác.'
  });
});

// 14. Xử lý lỗi 500 tập trung
app.use((err, req, res, next) => {
  logger.error('Lỗi máy chủ chưa được bắt:', { message: err.message, stack: err.stack });
  res.status(500).render('pages/error', {
    title: 'Lỗi hệ thống - 500',
    statusCode: 500,
    message: 'Đã xảy ra sự cố nội bộ trên máy chủ. Ban quản trị đã ghi nhận để khắc phục.'
  });
});

// 15. Khởi động Server
const server = app.listen(PORT, () => {
  logger.info(`🚀 VNnettruyen Web Application đang chạy tại cổng http://localhost:${PORT}`);
});

// Xử lý Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('Nhận tín hiệu SIGTERM. Đang đóng server gracefully...');
  server.close(() => {
    logger.info('HTTP Server đã đóng.');
    process.exit(0);
  });
});

module.exports = app;
