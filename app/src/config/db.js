const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'vnnettruyen_user',
  password: process.env.DB_PASSWORD || 'VNnet_DbPass_2026!',
  database: process.env.DB_NAME || 'vnnettruyen_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

// Kiểm tra kết nối ban đầu
pool.getConnection()
  .then((conn) => {
    console.log('✅ Đã kết nối thành công tới cơ sở dữ liệu MySQL!');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối MySQL ban đầu:', err.message);
  });

module.exports = pool;
