# ==========================================
# VNnettruyen Web Application Dockerfile
# Base: Node.js 20 Alpine (Lightweight & Secure)
# ==========================================

FROM node:20-alpine

# Cài đặt curl phục vụ healthcheck
RUN apk add --no-cache curl tzdata

# Thiết lập múi giờ Việt Nam
ENV TZ=Asia/Ho_Chi_Minh

# Tạo thư mục làm việc
WORKDIR /usr/src/app

# Sao chép file phụ thuộc
COPY package*.json ./

# Cài đặt các gói production (bỏ qua devDependencies)
RUN npm ci --only=production

# Sao chép toàn bộ mã nguồn
COPY . .

# Tạo thư mục logs và phân quyền cho user không phải root (node)
RUN mkdir -p logs && chown -R node:node /usr/src/app

# Hardening: Chuyển sang user 'node' (non-root) để chạy ứng dụng
USER node

# Khai báo cổng
EXPOSE 3000

# Healthcheck nội bộ
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Lệnh khởi chạy
CMD ["node", "src/app.js"]
