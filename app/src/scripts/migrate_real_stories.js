const db = require('../config/db');

async function migrate() {
  console.log('🚀 Bắt đầu cập nhật truyện có thật và chuẩn hóa dữ liệu...');

  // 1. Cập nhật Story 9 thành kiệt tác kinh điển: "Tiếu Ngạo Giang Hồ" của Kim Dung
  await db.query(`
    UPDATE stories SET
      title = 'Tiếu Ngạo Giang Hồ',
      slug = 'tieu-ngao-giang-ho',
      pen_name = 'Kim Dung',
      description = 'Tiếu Ngạo Giang Hồ là tác phẩm kiếm hiệp kinh điển đỉnh cao của đại văn hào Kim Dung. Tác phẩm xoay quanh cuộc đời của lãng tử Lệnh Hồ Xung phóng khoáng, trọng nghĩa khinh tài giữa chốn võ lâm đầy mưu mô tranh đoạt pho kiếm phổ Tịch Tà Kiếm Pháp. Giữa chánh tà bất phân, khúc Tiếu Ngạo Giang Hồ vang lên tượng trưng cho khát vọng tự do tuyệt đối của bậc trượng phu.',
      cover_image = '/public/images/cover-1.jpg',
      status = 'completed',
      views = 128500,
      is_featured = 1
    WHERE id = 9
  `);

  // Xóa các chương cũ của story 9 và chèn 5 chương kinh điển có thật
  await db.query('DELETE FROM chapters WHERE story_id = 9');

  const tieuNgaoChapters = [
    {
      num: 1,
      title: 'Chương 1: Diệt Môn Phúc Oai Tiêu Cục',
      content: `Gió thu lạnh lẽo thổi qua trấn Tiên Hà. Phúc Oai Tiêu Cục đất Phúc Kiến vốn uy danh lẫy lừng nhiều đời nay đột nhiên chìm trong biển máu và quỷ dị. Những tiêu sư võ công cao cường lần lượt ngã gục dưới những lưỡi kiếm nhanh như quỷ mị, xuất quỷ nhập thần.

Lâm Chấn Nam – tổng tiêu đầu Phúc Oai Tiêu Cục đứng giữa tiền đường ngập tràn tử khí, gương mặt tái nhợt khi nhận ra môn phái Thanh Thành dưới sự dẫn dắt của Dư Thương Hải đã ra tay tàn sát cả gia tộc chàng chỉ vì một mục đích duy nhất: đoạt lấy gia truyền Tịch Tà Kiếm Phổ.

Thiếu tiêu đầu Lâm Bình Chi may mắn trốn thoát trong đường tơ kẽ tóc, mang theo nỗi huyết hải thâm thù dấn thân vào chốn giang hồ hiểm ác đầy dối trá và lọc lừa...`
    },
    {
      num: 2,
      title: 'Chương 2: Tiếu Ngạo Giang Hồ Khúc Tuyệt Tác',
      content: `Giữa dòng sông lững lờ trôi, trên chiếc thuyền con đơn độc giữa khói sương mờ ảo, tiếng cầm và tiếng tiêu hòa quyện vào nhau tạo nên một khúc nhạc trác tuyệt thiên cổ chưa từng có trong nhân gian.

Đó là cuộc tao ngộ định mệnh giữa Lưu Chính Phong của phái Hành Sơn chánh đạo và Khúc Dương trưởng lão của Nhật Nguyệt Thần Giáo. Hai con người ở hai chiến tuyến thù địch, bất chấp định kiến hẹp hòi của võ lâm chính tà, đã cùng nhau sáng tác nên khúc Tiếu Ngạo Giang Hồ bằng cả tâm huyết và linh hồn của đời mình.

Lệnh Hồ Xung – đại đệ tử phái Hoa Sơn đứng bên bờ nghe tiếng đàn tiêu rung động lòng người, cảm nhận sâu sắc thế nào là tri âm tri kỷ. Trước khi trút hơi thở cuối cùng, hai vị tiền bối đã trao khúc phổ vô giá này cho chàng thiếu niên lãng tử...`
    },
    {
      num: 3,
      title: 'Chương 3: Tư Quá Nhai Ngộ Kỳ Duyên',
      content: `Trên đỉnh Tư Quá Nhai quanh năm mây mù che phủ của núi Hoa Sơn, Lệnh Hồ Xung bị sư phụ Nhạc Bất Quần phạt bế quan sám hối suốt một năm ròng. Trong những ngày tháng cô tịch, chàng tình cờ phát hiện ra mật động cổ xưa chứa đầy những hình vẽ kiếm chiêu tuyệt đỉnh khắc sâu trên vách đá.

Một đêm trăng sáng, một lão nhân râu tóc bạc phơ như tiên ông giáng trần bỗng nhiên xuất hiện. Đó chính là Phong Thanh Dương tiền bối – bậc thầy kiếm thuật thuộc Kiếm tông phái Hoa Sơn đã quy ẩn giang hồ hàng chục năm qua.

Nhìn thấy bản tính cương trực, thông minh phóng khoáng của Lệnh Hồ Xung, Phong tiền bối khẽ mỉm cười gật đầu: "Kiếm chiêu do người nghĩ ra, nếu chết cứng vào chiêu số thì chỉ là hạ thừa. Vô chiêu thắng hữu chiêu mới là cảnh giới tối cao của kiếm thuật!"`
    },
    {
      num: 4,
      title: 'Chương 4: Độc Cô Cửu Kiếm Oai Chấn Võ Lâm',
      content: `Chỉ trong vòng vài ngày ngắn ngủi dưới sự chỉ bảo của Phong Thanh Dương, Lệnh Hồ Xung đã lĩnh hội được tinh hoa của Độc Cô Cửu Kiếm – tuyệt học trấn thế do kiếm ma Độc Cô Cầu Bại sáng tạo ra.

Chín thức kiếm pháp: Tổng Quyết Thức, Phá Kiếm Thức, Phá Đao Thức, Phá Thương Thức, Phá Tiễn Thức, Phá Tiêu Thức, Phá Sách Thức, Phá Chưởng Thức và Phá Khí Thức. Không có bất kỳ chiêu số cố định nào, chỉ chuyên tìm kiếm sơ hở của đối phương để phá giải trong chớp mắt.

Khi đại nội cao thủ Điền Bá Quang và mười lăm thích khách cao thủ tập kích Hoa Sơn, Lệnh Hồ Xung dù bị trọng thương nhưng chỉ với một nhành cành cây trong tay đã liên tiếp điểm mù mắt tất cả thích khách, khiến toàn thể giang hồ bàng hoàng kinh phục!`
    },
    {
      num: 5,
      title: 'Chương 5: Hắc Mộc Nhai Luận Kiếm Trừ Bạo',
      content: `Vách đá Hắc Mộc Nhai cao chọc trời, mây mù bao phủ dày đặc. Lệnh Hồ Xung cùng Nhậm Doanh Doanh, Nhậm Ngã Hành và Hướng Vấn Thiên cùng nhau tiến vào sào huyệt sâu nhất của Nhật Nguyệt Thần Giáo.

Tại đây, họ đối đầu với Đệ Nhất Cao Thủ Đương Thời – Giáo chủ Đông Phương Bất Bại, kẻ đã tu luyện thành công Quỳ Hoa Bảo Điển. Thân pháp của Đông Phương Bất Bại nhanh như tia chớp, một cây kim thêu bé nhỏ trong tay kẻ này hóa thành luồng sát khí cuồng bạo áp đảo cả bốn vị đại cao thủ võ lâm cùng lúc.

Chỉ bằng sự phối hợp xuất thần và sự gan dạ phi thường, Lệnh Hồ Xung mới tìm ra được khoảnh khắc sơ hở của đối phương, chấm dứt triều đại hắc ám của Đông Phương Bất Bại trên đỉnh Hắc Mộc Nhai hùng vĩ...`
    }
  ];

  for (const c of tieuNgaoChapters) {
    await db.query(
      'INSERT INTO chapters (story_id, chapter_number, title, content, status) VALUES (?, ?, ?, ?, ?)',
      [9, c.num, c.title, c.content, 'published']
    );
  }

  // Đảm bảo thể loại của Story 9 là Kiếm Hiệp
  await db.query('DELETE FROM story_genres WHERE story_id = 9');
  await db.query('INSERT INTO story_genres (story_id, genre_id) VALUES (9, 6)'); // 6 = Kiếm Hiệp

  // 2. Chuẩn hóa chapter titles cho các truyện người dùng đã cập nhật
  // Story 1: Xuyên Không Thành Mẹ Kế Ác Độc...
  await db.query(`
    UPDATE chapters 
    SET title = 'Chương 1: Mở Mắt Thành Mẹ Kế Hào Môn, Đối Mặt Bạch Nguyệt Quang'
    WHERE story_id = 1 AND chapter_number = 1
  `);

  // Story 2: Ta Chỉ Là Nhân Vật Nhỏ Trong Truyện Kiếm Hiệp (7 chương)
  const story2Titles = [
    { num: 1, title: 'Chương 1: Ta Chỉ Là Nhân Vật Qua Đường' },
    { num: 2, title: 'Chương 2: Hỏi Về Đại Hiệp Khởi Nghiệp' },
    { num: 3, title: 'Chương 3: Đao Kiếm Giang Hồ Dậy Sóng' },
    { num: 4, title: 'Chương 4: Lâm Thuấn Xuất Thủ, Kinh Biến Lầu Cao' },
    { num: 5, title: 'Chương 5: Chén Thuốc Đắng Và Lời Cảnh Báo' },
    { num: 6, title: 'Chương 6: Tháng Ngày Trôi Qua Như Bóng Câu Qua Cửa' },
    { num: 7, title: 'Chương 7: Hồi Kết Chốn Giang Hồ Bình Lặng' }
  ];
  for (const t of story2Titles) {
    await db.query('UPDATE chapters SET title = ? WHERE story_id = 2 AND chapter_number = ?', [t.title, t.num]);
  }

  // Story 4: Xuyên Thành Vợ Cũ Của Nam Chính Nhà Giàu (5 chương)
  const story4Titles = [
    { num: 1, title: 'Chương 1: Xuyên Thành Vợ Cũ Bị Bỏ Rơi' },
    { num: 2, title: 'Chương 2: Gia Đình Cực Phẩm Của Nam Chính' },
    { num: 3, title: 'Chương 3: Lên Kế Hoạch Đòi Lại Tài Sản' },
    { num: 4, title: 'Chương 4: Vả Mặt Đám Người Hám Lợi' },
    { num: 5, title: 'Chương 5: Bắt Đầu Cuộc Sống Độc Lập Mới' }
  ];
  for (const t of story4Titles) {
    await db.query('UPDATE chapters SET title = ? WHERE story_id = 4 AND chapter_number = ?', [t.title, t.num]);
  }

  // Story 8: Từ Phế Vật Trở Thành Siêu Cấp Cao Thủ Đô Thị (2 chương)
  await db.query(`
    UPDATE chapters SET title = 'Chương 1: Thần Y Tái Thế, Cứu Đại Tiểu Thư' WHERE story_id = 8 AND chapter_number = 1
  `);
  await db.query(`
    UPDATE chapters SET title = 'Chương 2: Y Thuật Thần Thông Khiến Cả Nhà Bái Phục' WHERE story_id = 8 AND chapter_number = 2
  `);

  // Story 10: Nắng Trong Vườn (1 chương)
  await db.query(`
    UPDATE chapters SET title = 'Chương 1: Về Lại Vùng Đất Chôn Nhau Cắt Rốn' WHERE story_id = 10 AND chapter_number = 1
  `);

  // Story 14: Cưới Em Trước Cưng Chiều Em Sau -> cập nhật lượt xem
  await db.query('UPDATE stories SET views = 18200 WHERE id = 14');

  console.log('✅ Đã cập nhật thành công toàn bộ dữ liệu!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Lỗi migration:', err);
  process.exit(1);
});
