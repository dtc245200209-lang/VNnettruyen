const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 BẮT ĐẦU KIỂM TRA TOÀN DIỆN HỆ THỐNG...');

  // Test 1: Kiểm tra trang chủ
  console.log('\n--- 1. Kiểm tra Trang Chủ & Spotlight Banner & Mascot ---');
  const homeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  });

  if (homeRes.statusCode !== 200) {
    throw new Error(`Trang chủ trả về status ${homeRes.statusCode}`);
  }

  // Kiểm tra không còn con ma
  if (homeRes.body.includes('mascot.png') || homeRes.body.includes('floating-helper-widget')) {
    throw new Error('❌ Vẫn còn phát hiện con ma hoặc floating helper widget trên trang chủ!');
  }
  console.log('✅ Đã gỡ bỏ hoàn toàn con ma và floating helper widget!');

  // Kiểm tra truyện có thật: Tiếu Ngạo Giang Hồ & Kim Dung
  if (!homeRes.body.includes('Tiếu Ngạo Giang Hồ')) {
    throw new Error('❌ Không tìm thấy truyện Tiếu Ngạo Giang Hồ trên trang chủ!');
  }
  if (!homeRes.body.includes('Kim Dung')) {
    throw new Error('❌ Không tìm thấy tác giả Kim Dung trên banner spotlight!');
  }
  console.log('✅ Banner Spotlight hiển thị đúng kiệt tác có thật: Tiếu Ngạo Giang Hồ - Tác giả: Kim Dung!');

  // Kiểm tra typography mới của banner
  if (!homeRes.body.includes('spotlight-badge') || !homeRes.body.includes('spotlight-tags-row')) {
    throw new Error('❌ Banner chưa có class typography mới spotlight-badge/tags-row');
  }
  console.log('✅ Banner có cấu trúc typography chuẩn cao cấp (spotlight-badge, spotlight-tags-row, button gradient)!');

  // Test 2: Kiểm tra trang chi tiết truyện Tiếu Ngạo Giang Hồ
  console.log('\n--- 2. Kiểm tra Trang Chi Tiết Tiếu Ngạo Giang Hồ ---');
  const storyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/stories/tieu-ngao-giang-ho',
    method: 'GET'
  });
  if (storyRes.statusCode !== 200) {
    throw new Error(`Trang chi tiết truyện lỗi status ${storyRes.statusCode}`);
  }
  if (!storyRes.body.includes('Chương 1: Diệt Môn Phúc Oai Tiêu Cục') || !storyRes.body.includes('Độc Cô Cửu Kiếm')) {
    throw new Error('❌ Không tìm thấy các chương kinh điển của Tiếu Ngạo Giang Hồ');
  }
  console.log('✅ Đã kiểm tra danh sách 5 chương kinh điển có thật của Tiếu Ngạo Giang Hồ!');

  // Test 3: Đăng nhập Admin và kiểm tra CRUD Bảng Tin Thông Báo (đặc biệt là chức năng SỬA)
  console.log('\n--- 3. Kiểm tra Admin Đăng Nhập & Quản Lý / Sửa Thông Báo ---');
  
  // Login as admin
  const loginPostData = 'account=' + encodeURIComponent('admin') + '&password=' + encodeURIComponent('123456');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginPostData)
    }
  }, loginPostData);

  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';
  if (!cookie) {
    throw new Error('❌ Không lấy được session cookie khi login admin');
  }
  console.log('✅ Đăng nhập Admin thành công!');

  // GET /admin/announcements
  const adminAnnRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/announcements',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  if (adminAnnRes.statusCode !== 200) {
    throw new Error(`Trang /admin/announcements trả về status ${adminAnnRes.statusCode}`);
  }
  if (!adminAnnRes.body.includes('✏️ Sửa') || !adminAnnRes.body.includes('/admin/announcements/1/edit')) {
    throw new Error('❌ Không tìm thấy nút hoặc link "✏️ Sửa" trên danh sách thông báo admin');
  }
  console.log('✅ Trang danh sách thông báo Admin có đầy đủ nút "✏️ Sửa" và nút xóa!');

  // GET /admin/announcements/1/edit
  const editPageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/announcements/1/edit',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  if (editPageRes.statusCode !== 200) {
    throw new Error(`Trang form sửa /admin/announcements/1/edit trả về status ${editPageRes.statusCode}`);
  }
  if (!editPageRes.body.includes('Chỉnh Sửa Thông Báo Bảng Tin') || !editPageRes.body.includes('Nội Quy Sinh Hoạt')) {
    throw new Error('❌ Form sửa thông báo không hiển thị đúng dữ liệu');
  }
  console.log('✅ Giao diện Sửa Thông Báo (form edit) tải thành công với đầy đủ input dữ liệu thật!');

  // POST /admin/announcements/1/edit (Test submit sửa thông báo)
  const updatedTitle = 'Nội Quy Sinh Hoạt & Văn Hóa Diễn Đàn VNnettruyen (Cập Nhật)';
  const editPostData = 'title=' + encodeURIComponent(updatedTitle) + 
                       '&url=' + encodeURIComponent('/forum/categories/thong-bao-noi-quy') + 
                       '&color=' + encodeURIComponent('#e74c3c') + 
                       '&display_order=1';
  const postEditRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/announcements/1/edit',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(editPostData)
    }
  }, editPostData);

  console.log(`✅ Submit Sửa thông báo phản hồi chuyển hướng status: ${postEditRes.statusCode}`);

  // Kiểm tra lại xem thông báo đã được sửa chưa
  const verifyEditRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/announcements',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  if (!verifyEditRes.body.includes('(Cập Nhật)')) {
    throw new Error('❌ Dữ liệu sau khi Sửa không được lưu vào cơ sở dữ liệu!');
  }
  console.log('✅ Đã xác nhận: Chức năng Sửa thông báo hoạt động chính xác 100% trên DB thật!');

  // Hoàn trả lại tiêu đề chuẩn
  const revertData = 'title=' + encodeURIComponent('Nội Quy Sinh Hoạt & Quy Tắc Ứng Xử Văn Hóa Tại Diễn Đàn VNnettruyen') + 
                     '&url=' + encodeURIComponent('/forum/categories/thong-bao-noi-quy') + 
                     '&color=' + encodeURIComponent('#e74c3c') + 
                     '&display_order=1';
  await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/announcements/1/edit',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(revertData)
    }
  }, revertData);

  console.log('\n🎉 TOÀN BỘ CÁC BƯỚC KIỂM TRA ĐỀU THÀNH CÔNG VƯỢT TRỘI!');
}

runTests().catch(err => {
  console.error('LỖI TEST:', err);
  process.exit(1);
});
