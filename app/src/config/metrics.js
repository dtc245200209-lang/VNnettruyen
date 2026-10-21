const client = require('prom-client');

// Khởi tạo Register
const register = new client.Registry();

// Thu thập các metrics mặc định của Node.js runtime
client.collectDefaultMetrics({
  register,
  prefix: 'vnnettruyen_'
});

// Counter đo tổng số HTTP request
const httpRequestsTotal = new client.Counter({
  name: 'vnnettruyen_http_requests_total',
  help: 'Tổng số lượng HTTP request đến ứng dụng VNnettruyen',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Histogram đo thời gian phản hồi (duration) của HTTP request
const httpRequestDurationSeconds = new client.Histogram({
  name: 'vnnettruyen_http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request theo giây',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Gauge đo số người dùng đang online hoặc số truyện
const activeStoriesGauge = new client.Gauge({
  name: 'vnnettruyen_active_stories_total',
  help: 'Số lượng truyện đang hoạt động trong hệ thống',
  registers: [register]
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  activeStoriesGauge
};
