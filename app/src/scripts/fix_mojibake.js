const db = require('../config/db');

async function fixMojibake() {
  console.log('Bắt đầu dọn dẹp và chuẩn hóa dữ liệu UTF-8 trong MySQL...');

  // 1. Sửa story 1 và chapter 1
  await db.query(
    `UPDATE stories 
     SET title = ?, slug = ?, pen_name = ?, cover_image = ?, description = ? 
     WHERE id = 1`,
    [
      'Huyền Khí Đại Việt',
      'huyen-khi-dai-viet',
      'Thanh Phong Kiếm Khách',
      '/public/images/cover-1.jpg',
      'Dưới triều đại phong kiến Đại Việt ngập tràn huyền tích, yêu ma quấy nhiễu khắp bờ cõi. Thiếu niên mang trong mình dòng máu Long Tộc bước lên con đường trừ yêu diệt ma cứu thế gian.'
    ]
  );

  await db.query(
    'UPDATE chapters SET title = ? WHERE id = 1',
    ['Chương 1: Long Mạch Thức Tỉnh']
  );

  // 2. Sửa pen_name các tác phẩm của Thanh Phong Kiếm Khách (author_id = 2)
  await db.query(
    `UPDATE stories 
     SET pen_name = 'Thanh Phong Kiếm Khách' 
     WHERE author_id = 2 AND id != 13`
  );

  // 3. Sửa tác phẩm id 13 pen_name là Hạ Ánh Tuyết
  await db.query(
    `UPDATE stories 
     SET pen_name = 'Hạ Ánh Tuyết' 
     WHERE id = 13`
  );

  // 4. Sửa các tác phẩm của Minh Nguyệt (author_id = 3)
  await db.query(
    `UPDATE stories 
     SET pen_name = 'Minh Nguyệt Độc Giả' 
     WHERE author_id = 3`
  );

  // 5. Sửa bio users
  await db.query(
    "UPDATE users SET bio = 'Tác giả dã sử & kiếm hiệp, yêu thích văn học dân tộc' WHERE id = 2"
  );
  await db.query(
    "UPDATE users SET bio = 'Độc giả thân thiết & nhà bình luận văn học tại VNnettruyen' WHERE id = 3"
  );
  await db.query(
    "UPDATE users SET bio = 'Thành viên cộng đồng đam mê đọc và thảo luận truyện' WHERE id = 4"
  );

  console.log('✅ Đã cập nhật xong tất cả các bảng dữ liệu.');

  // Kiểm tra lại
  const [stories] = await db.query('SELECT id, title, author_id, pen_name, cover_image FROM stories ORDER BY id ASC');
  console.log('\n--- DANH SÁCH TÁC PHẨM & BÚT DANH (UTF-8 CHUẨN) ---');
  for (const s of stories) {
    console.log(`[ID ${s.id}] ${s.title} | Bút danh: ${s.pen_name} | Bìa: ${s.cover_image}`);
  }

  const [users] = await db.query('SELECT id, username, bio FROM users ORDER BY id ASC');
  console.log('\n--- DANH SÁCH NGƯỜI DÙNG & TIỂU SỬ ---');
  for (const u of users) {
    console.log(`[User ${u.id}] ${u.username} | Bio: ${u.bio}`);
  }

  process.exit(0);
}

fixMojibake().catch(err => {
  console.error('Lỗi khi fix mojibake:', err);
  process.exit(1);
});
