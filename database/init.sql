-- ===================================================
-- VNnettruyen Database Initialization Script
-- Hệ thống cơ sở dữ liệu cho Diễn Đàn Đọc & Viết Truyện
-- Chuẩn hóa mã hóa Tiếng Việt UTF-8 (utf8mb4_unicode_ci)
-- ===================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

CREATE DATABASE IF NOT EXISTS `vnnettruyen_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `vnnettruyen_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `forum_announcements`;
DROP TABLE IF EXISTS `daily_checkins`;
DROP TABLE IF EXISTS `reading_history`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `chapters`;
DROP TABLE IF EXISTS `story_genres`;
DROP TABLE IF EXISTS `stories`;
DROP TABLE IF EXISTS `genres`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Bảng người dùng (users)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('reader', 'author', 'admin') NOT NULL DEFAULT 'reader',
  `coins` INT DEFAULT 50,
  `bio` TEXT NULL,
  `avatar` VARCHAR(255) DEFAULT '/public/images/default-avatar.png',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng thể loại truyện (genres)
CREATE TABLE `genres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `slug` VARCHAR(60) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  INDEX `idx_genres_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng truyện (stories)
CREATE TABLE `stories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `author_id` INT NOT NULL,
  `description` TEXT NOT NULL,
  `cover_image` VARCHAR(255) DEFAULT '/public/images/default-cover.png',
  `status` ENUM('ongoing', 'completed') NOT NULL DEFAULT 'ongoing',
  `views` INT DEFAULT 0,
  `is_featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_stories_slug` (`slug`),
  INDEX `idx_stories_author` (`author_id`),
  INDEX `idx_stories_featured` (`is_featured`),
  INDEX `idx_stories_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng liên kết truyện và thể loại (story_genres)
CREATE TABLE `story_genres` (
  `story_id` INT NOT NULL,
  `genre_id` INT NOT NULL,
  PRIMARY KEY (`story_id`, `genre_id`),
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng chương truyện (chapters)
CREATE TABLE `chapters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `story_id` INT NOT NULL,
  `chapter_number` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_story_chapter` (`story_id`, `chapter_number`),
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  INDEX `idx_chapters_story_status` (`story_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng bình luận (comments)
CREATE TABLE `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `chapter_id` INT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE SET NULL,
  INDEX `idx_comments_story` (`story_id`),
  INDEX `idx_comments_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng yêu thích / Tủ sách (favorites)
CREATE TABLE `favorites` (
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `story_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng lịch sử đọc (reading_history)
CREATE TABLE `reading_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `chapter_id` INT NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_story_history` (`user_id`, `story_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng điểm danh hằng ngày (daily_checkins)
CREATE TABLE `daily_checkins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `coins_earned` INT DEFAULT 5,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng thông báo diễn đàn (forum_announcements)
CREATE TABLE `forum_announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `color` VARCHAR(20) DEFAULT '#e74c3c',
  `display_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng lưu trữ Session cho Express (sessions)
CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `expires` INT(11) UNSIGNED NOT NULL,
  `data` MEDIUMTEXT COLLATE utf8mb4_bin,
  INDEX `idx_sessions_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- DỮ LIỆU MẪU KHỞI TẠO (SEED DATA)
-- Mật khẩu mặc định:
-- admin: Admin@123456
-- tacgia_viet: Author@123456
-- docgia_vn: Reader@123456
-- ===================================================

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `coins`, `bio`) VALUES
(1, 'admin', 'admin@vnnettruyen.vn', '$2a$10$Nf6M/sI/CvRT6CMOpN0V1O.5qjg6MNu2eFz8kyHuyBw1OZW2tmw7S', 'admin', 500, 'Quản trị viên diễn đàn VNnettruyen - Hỗ trợ cộng đồng sáng tác'),
(2, 'tacgia_viet', 'author@vnnettruyen.vn', '$2a$10$TsecfGtT9maTbSZN6wxnUO0LFYx0Fm3bPAALcylPssgdnqdKy5ow2', 'author', 250, 'Tác giả sáng tác dã sử, kiếm hiệp và huyền huyễn Việt Nam'),
(3, 'docgia_vn', 'reader@vnnettruyen.vn', '$2a$10$OtEWI1Pj1wge5/A0AQo.qOGPK1.7fsvRtFresEFd71HZlcm21YLX.', 'reader', 120, 'Độc giả đam mê văn học mạng và tiểu thuyết kỳ ảo');

-- 20 THỂ LOẠI ĐA DẠNG ĐẶC SẮC (Diễn đàn văn học Việt Nam)
INSERT INTO `genres` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Tiên Hiệp', 'tien-hiep', 'Truyện tu tiên luyện khí, vượt qua giới hạn phàm nhân phi thăng tiên giới'),
(2, 'Kiếm Hiệp', 'kiem-hiep', 'Hành tẩu giang hồ, nghĩa khí võ hiệp và ân oán giang hồ hào hùng'),
(3, 'Dã Sử Việt', 'da-su-viet', 'Khai thác bối cảnh lịch sử hào hùng của dân tộc Việt Nam qua góc nhìn sáng tạo'),
(4, 'Huyền Huyễn', 'huyen-huyen', 'Thế giới ma pháp, dị giới siêu nhiên kỳ bí và pháp bảo vô tận'),
(5, 'Đô Thị', 'do-thi', 'Bối cảnh cuộc sống hiện đại, thương trường, y thuật và siêu năng lực đô thành'),
(6, 'Khoa Huyễn', 'khoa-huyen', 'Khoa học viễn tưởng tương lai, du hành vũ trụ và trí tuệ nhân tạo'),
(7, 'Trinh Thám', 'trinh-tham', 'Phá án ly kỳ, giải mã bí ẩn vụ án hóc búa và tâm lý tội phạm sâu sắc'),
(8, 'Kinh Dị - Ma Bí', 'kinh-di-ma-bi', 'Truyện ma dân gian, hiện tượng tâm linh rùng rợn và nỗi sợ bí ẩn'),
(9, 'Truyện Ngắn', 'truyen-ngan', 'Các tác phẩm ngắn cô đọng, giàu cảm xúc và triết lý nhân sinh'),
(10, 'Tiểu Thuyết', 'tieu-thuyet', 'Các bộ đại tác phẩm văn học trường thiên đa tuyến nhân vật'),
(11, 'Võng Du', 'vong-du', 'Thế giới thực tế ảo, game online thế hệ mới và tranh đoạt thần cấp'),
(12, 'Viễn Tưởng - Kỳ Ảo', 'vien-tuong-ky-ao', 'Thế giới huyền bí, kỳ quan cổ đại và các chủng tộc viễn tưởng'),
(13, 'Tình Cảm - Lãng Mạn', 'tinh-cam', 'Chuyện tình yêu ngọt ngào, sâu lắng, duyên phận cuộc đời'),
(14, 'Phiêu Lưu - Hành Động', 'phieu-luu-hanh-dong', 'Thám hiểm vùng đất cấm, sinh tồn nơi hoang dã và chiến đấu sinh tử'),
(15, 'Truyện Cười', 'truyen-cuoi', 'Những mẩu chuyện hài hước, châm biếm, đem lại tiếng cười sảng khoái'),
(16, 'Xuyên Không', 'xuyen-khong', 'Vượt thời không về quá khứ hoặc đến dị giới bắt đầu cuộc đời mới'),
(17, 'Đồng Nhân', 'dong-nhan', 'Phóng tác dựa trên các tác phẩm, vũ trụ anime hoặc tiểu thuyết kinh điển'),
(18, 'Dị Giới', 'di-gioi', 'Chuyển sinh sang thế giới phép thuật, ma thú và các chủng tộc kỳ lạ'),
(19, 'Góc Tâm Hồn - Tản Văn', 'tan-van', 'Những rung cảm nhẹ nhàng, tản mạn về cuộc sống, ký ức tuổi thơ'),
(20, 'Học Văn - Nghị Luận', 'hoc-van', 'Chia sẻ kiến thức nghị luận văn học, kỹ năng viết và phân tích tác phẩm');

-- 15 TÁC PHẨM ĐA DẠNG ĐẦY ĐỦ THỂ LOẠI (Chuẩn font tiếng Việt không lỗi)
INSERT INTO `stories` (`id`, `title`, `slug`, `author_id`, `description`, `cover_image`, `status`, `views`, `is_featured`) VALUES
(1, 'Huyền Khí Đại Việt', 'huyen-khi-dai-viet', 2, 'Tại dải đất phương Nam ngàn năm văn hiến, linh khí đất trời thức tỉnh sau ngàn năm phong ấn dưới lòng sông Hồng. Chàng thiếu niên Trần Phong xuất thân thảo dân, kế thừa linh kiếm Thần Lôi, từng bước khám phá những bí ẩn cổ xưa về nguồn gốc sức mạnh dân tộc...', '/public/images/cover-1.jpg', 'ongoing', 12520, 1),
(2, 'Thăng Long Kiếm Ảo', 'thang-long-kiem-ao', 2, 'Kinh thành Thăng Long sầm uất ẩn giấu những môn phái cổ xưa bảo vệ bờ cõi. Một cuộc kỳ ngộ giữa thiếu niên mồ côi và lão kiếm khách ẩn danh đã mở ra trang sử giang hồ đầy kịch tính.', '/public/images/cover-2.jpg', 'ongoing', 8940, 1),
(3, 'Bạch Hạc Dạ Hành', 'bach-hac-da-hanh', 2, 'Đất Phong Châu ngút ngàn rừng thiêng nước độc, những vụ mất tích kỳ quái của các đoàn thương buôn đưa bộ đôi hình bộ phán quan vào vòng xoáy ma thuật cổ xưa.', '/public/images/cover-3.jpg', 'completed', 21450, 1),
(4, 'Pháp Mệnh Thiên Tôn', 'phap-menh-thien-ton', 2, 'Ta không muốn bạo lực, càng không muốn xuống tay. Nhưng nếu người đã cố chấp, lại làm hại đến người đó, đừng hỏi tại sao thế gian này tàn nhẫn! Siêu phẩm tiên hiệp huyền huyễn khuấy đảo diễn đàn.', '/public/images/banner-spotlight.jpg', 'ongoing', 110157, 1),
(5, 'Ác Mộng Tập', 'ac-mong-tap', 2, 'Tập hợp những câu chuyện kinh dị có thật chốn thôn quê và các khu chung cư cũ bỏ hoang giữa lòng Hà Nội và Sài Gòn. Mỗi cơn ác mộng đều mang theo một lời cảnh báo từ quá khứ.', '/public/images/cover-2.jpg', 'ongoing', 35860, 1),
(6, 'Dây Tơ Hồng Nối Ngược', 'day-to-hong-noi-nguoc', 3, 'Tôi hay nghe, chúng ta không phải những kẻ đáng thương nhất, mà là họ. Chưa từng có ai hỏi họ có mệt không? Có muốn buông tay hay không... Một câu chuyện tình cảm sâu lắng đầy cảm xúc.', '/public/images/cover-3.jpg', 'ongoing', 19084, 1),
(7, 'Người Trong Giang Hồ (Luận Đàm)', 'nguoi-trong-giang-ho', 2, 'Luận bàn về chữ Tình, chữ Nghĩa và danh lợi chốn võ lâm đương đại. Khi gươm đao gác lại, thứ còn đọng lại trong lòng kiếm khách chỉ là một chén rượu ấm tình bằng hữu.', '/public/images/cover-1.jpg', 'ongoing', 51948, 1),
(8, 'Đất Ma – Quyển 1: Bắc Hành', 'dat-ma-bac-hanh', 2, 'Hành trình vượt qua vùng đất chết phía bắc dãy Trường Sơn. Những cổ trùng, linh thụ ngàn năm và các bộ tộc kỳ bí thời thượng cổ dần hé lộ chân tướng kinh hoàng.', '/public/images/cover-2.jpg', 'ongoing', 133609, 1),
(9, 'Chuyện Hoa, Chuyện Người', 'chuyen-hoa-chuyen-nguoi', 3, 'Tản mạn về những khóm hoa ban tím, về con hẻm nhỏ thơm mùi hoa dạ lý hương và những phận người lặng lẽ đi qua mùa giông bão cuộc đời.', '/public/images/cover-3.jpg', 'completed', 12450, 0),
(10, 'Tản Mạn Về Biên Niên Ký Chim Vặn Dây Cót', 'tan-man-ve-bien-nien-ky', 3, 'Góc nhìn triết học và văn chương về tuyệt phẩm của Haruki Murakami. Khi âm thanh tiếng chim vặn dây cót trở thành hồi chuông thức tỉnh tiềm thức con người.', '/public/images/cover-1.jpg', 'completed', 6720, 0),
(11, 'Thanh Gươm Diệt Quỷ Ngoại Truyện', 'thanh-guom-diet-quy-ngoai-truyen', 2, 'Phóng tác đồng nhân thế giới Kimetsu no Yaiba qua góc nhìn của Thủy Trụ và Lôi Trụ trong những năm tháng rèn luyện gian khổ tại núi Sagiri.', '/public/images/cover-2.jpg', 'ongoing', 42100, 1),
(12, 'Cơm Tấm Sườn Bì Chả Và Tôi', 'com-tam-suon-bi-cha-va-toi', 3, 'Một truyện ngắn đời thường dung dị về khói than nghi ngút góc phố Sài Gòn, dĩa cơm tấm thơm lừng ấm lòng những cô cậu sinh viên xa quê lập nghiệp.', '/public/images/cover-3.jpg', 'completed', 8900, 0),
(13, 'Cấu Trúc Văn Nghị Luận Xã Hội Thực Chiến', 'cau-truc-van-nghi-luan-xa-hoi', 1, 'Cẩm nang phân tích cấu trúc, kỹ thuật lập luận, liên hệ dẫn chứng thực tế cho học sinh và người đam mê viết văn nghị luận hiện đại.', '/public/images/cover-1.jpg', 'completed', 96818, 1),
(14, 'Võng Du: Thần Cấp Trọng Sinh', 'vong-du-than-cap-trong-sinh', 2, 'Trọng sinh về 10 năm trước ngày máy chủ Thần Vực mở cửa, Lâm Tiêu mang theo ký ức của một Thần Cấp Đạo Tặc từng bước độc chiếm tài nguyên thế giới ảo.', '/public/images/cover-2.jpg', 'ongoing', 78500, 1),
(15, 'Đô Thị Tiên Phong 2026', 'do-thi-tien-phong-2026', 1, 'Sau khi du học trở về, kỹ sư trẻ Hoàng Nam phát hiện khả năng nhìn thấy các dòng chảy năng lượng trong dữ liệu máy tính, biến anh thành bậc thầy công nghệ siêu phàm.', '/public/images/cover-1.jpg', 'ongoing', 4500, 0);

-- LIÊN KẾT TRUYỆN VÀ THỂ LOẠI (ĐA THỂ LOẠI)
INSERT INTO `story_genres` (`story_id`, `genre_id`) VALUES
(1, 1), (1, 3), (1, 4),    -- Huyền Khí Đại Việt: Tiên Hiệp, Dã Sử Việt, Huyền Huyễn
(2, 2), (2, 3),             -- Thăng Long Kiếm Ảo: Kiếm Hiệp, Dã Sử Việt
(3, 7), (3, 8),             -- Bạch Hạc Dạ Hành: Trinh Thám, Kinh Dị - Ma Bí
(4, 1), (4, 4),             -- Pháp Mệnh Thiên Tôn: Tiên Hiệp, Huyền Huyễn
(5, 8), (5, 9),             -- Ác Mộng Tập: Kinh Dị - Ma Bí, Truyện Ngắn
(6, 10), (6, 13),           -- Dây Tơ Hồng Nối Ngược: Tiểu Thuyết, Tình Cảm
(7, 2), (7, 19),            -- Người Trong Giang Hồ: Kiếm Hiệp, Tản Văn
(8, 18), (8, 8),            -- Đất Ma: Dị Giới, Kinh Dị
(9, 19), (9, 9),            -- Chuyện Hoa, Chuyện Người: Tản Văn, Truyện Ngắn
(10, 19), (10, 20),         -- Biên Niên Ký: Tản Văn, Học Văn
(11, 17), (11, 14),         -- Thanh Gươm Diệt Quỷ: Đồng Nhân, Hành Động
(12, 9), (12, 19),          -- Cơm Tấm Sườn Bì Chả: Truyện Ngắn, Tản Văn
(13, 20),                   -- Cấu Trúc Văn: Học Văn
(14, 11), (14, 12),         -- Võng Du Thần Cấp: Võng Du, Viễn Tưởng
(15, 5), (15, 6);           -- Đô Thị Tiên Phong: Đô Thị, Khoa Huyễn

-- CÁC CHƯƠNG TRUYỆN MẪU (NỘI DUNG VĂN HỌC TIẾNG VIỆT CHUẨN)
INSERT INTO `chapters` (`id`, `story_id`, `chapter_number`, `title`, `content`, `status`) VALUES
(1, 1, 1, 'Chương 1: Sóng gió bến Bạch Đằng', 
'Ánh chiều tà buông xuống mặt sông mênh mông, từng gợn sóng đỏ rực như dát vàng phản chiếu bầu trời phương Nam. Trần Phong đứng nơi đầu mạn thuyền, ánh mắt chăm chú nhìn về phía dải núi mờ ảo xa xa.

Từ ngày cha mất, Phong một mình lang bạt khắp các bến sông làm nghề kéo lưới. Thế nhưng đêm qua, trong giấc chiêm bao kỳ lạ, một giọng nói trầm hùng như sấm rền vang vọng từ đáy nước, kêu gọi chàng đến bến Bạch Đằng này.

"Ầm!"

Bất chợt, mặt nước phẳng lặng bỗng sôi sục. Những bọt khí khổng lồ nổi lên cuồn cuộn. Một luồng hào quang ngũ sắc từ từ trồi lên khỏi mặt nước, bao bọc lấy một thanh đoản kiếm rỉ sét nhưng toát ra luồng uy áp bức người khiến vạn vật quanh bến sông đều phải nín thở...', 'published'),

(2, 1, 2, 'Chương 2: Thần Lôi Thức Tỉnh', 
'Trần Phong run rẩy vươn tay chạm vào chuôi kiếm. Ngay khoảnh khắc da thịt tiếp xúc với thanh kim loại lạnh lẽo, một luồng điện quang rực rỡ bùng phát, đánh thẳng vào kinh mạch toàn thân chàng!

"Aaa!" 

Chàng thét lên một tiếng dữ dội. Những ký ức không thuộc về chàng ùa về như thác lũ: những trận chiến hào hùng từ ngàn năm trước, tiếng gươm đao va chạm, tiếng voi gầm ngựa hí vang dội non sông. Thanh kiếm này chính là Thần Lôi Kiếm – cổ vật trấn giữ linh mạch Đại Việt ngàn năm trước.

Từ đây, số phận của chàng thiếu niên làng chài chính thức rẽ sang một chương hoàn toàn mới.', 'published'),

(3, 2, 1, 'Chương 1: Đêm mưa phố Hội', 
'Cơn mưa rào mùa hạ xối xả trút xuống những mái ngói rêu phong của đất Thăng Long xưa. Trong quán trà nhỏ nơi ngõ Huyện, tiếng đàn tranh thánh thót hòa cùng tiếng mưa rơi rả rích.

Ngồi bên góc quán là một thiếu niên mặc áo chàm giản dị, trước mặt đặt một chén trà sen thơm ngát. Chàng tên là Lâm Vũ, một thư sinh nghèo nhưng trong ánh mắt lại ẩn giấu vẻ tinh anh sắc bén khác thường...', 'published'),

(4, 3, 1, 'Chương 1: Bí ẩn làng Thổ Tang', 
'Sương mù giăng kín các lối mòn dẫn vào làng Thổ Tang. Ba đêm liền, đàn chó săn của quan phủ đều tru lên từng hồi thê thiết rồi chết bất đắc kỳ tử mà không hề có vết thương bên ngoài.

Phán quan Lê Duy vuốt nhẹ chuôi bội đao, ánh mắt nghiêm nghị nhìn vào dấu chân kỳ lạ trên lớp bùn nhão: dấu chân chỉ có ba ngón, to gấp đôi người thường và bốc ra một mùi hương tử đinh hương kỳ quái...', 'published'),

(5, 4, 1, 'Chương 1: Khởi nguồn Pháp Mệnh',
'Đỉnh núi Côn Lôn quanh năm tuyết phủ trắng xóa. Tiêu Diệp khoanh chân ngồi trên mỏm đá ngàn trượng, từng luồng khí tím lưu chuyển quanh thân thể tạo thành hình ảnh rồng cuộn hổ phục.

Hắn nhìn xuống trần gian vạn trượng, khóe môi khẽ nhếch: "Thiên mệnh đã định thì sao? Nếu trời cản ta, ta chém trời! Nếu đất phụ ta, ta san bằng đất!" Tiếng sấm chớp cuồn cuộn đáp lại lời thề chấn động thiên địa.', 'published'),

(6, 4, 2, 'Chương 2: Cửu Chuyển Luân Hồi',
'Cổ thư ngàn năm rách nát mở ra trước mắt. Những ký tự cổ kim bay lượn trong hư không, dung nhập vào mi tâm của Tiêu Diệp. 

"Pháp mệnh không phải là trói buộc, mà là gánh vác!" Giọng nói cổ xưa như truyền thừa từ thuở hồng hoang vang lên, mở ra tầng cảnh giới thứ chín của Cửu Chuyển Luân Hồi Công.', 'published'),

(7, 5, 1, 'Chương 1: Căn phòng số 404',
'Đó là một căn phòng bỏ trống ở tầng bốn khu tập thể Nghĩa Tân. Cứ đúng 2 giờ 15 phút sáng, tiếng bi ve rơi lộp độp trên sàn nhà lại vang lên đều đặn. 

Không một ai dám lên tầng bốn sau nửa đêm, cho đến khi Minh – một cậu sinh viên mới chuyển đến vì tiền thuê rẻ – quyết định bước chân qua cánh cửa gỗ mục nát...', 'published'),

(8, 6, 1, 'Chương 1: Lời hứa dưới mưa ngâu',
'Tháng Bảy mưa ngâu rả rích khắp những con phố nhỏ Hà Nội. Chiếc ô hoa che không đủ hai người, vai áo em ướt đẫm nhưng nụ cười vẫn trong veo như giọt sương mai.

"Nếu có kiếp sau, anh vẫn sẽ đi tìm em chứ?" Câu hỏi ấy tan vào tiếng còi xe tan tầm, nhưng theo anh suốt mười năm ròng rã giữa dòng đời xô bồ.', 'published'),

(9, 13, 1, 'Phần 1: Khai mở vấn đề và lập luận',
'Trong bài văn nghị luận xã hội, phần mở đoạn không đơn thuần là giới thiệu đề bài, mà là chiếc chìa khóa mở toang tư duy của người chấm. 

Một mở bài ấn tượng cần kết hợp ba yếu tố: Trích dẫn đắt giá, bối cảnh thời đại và quan điểm cá nhân dứt khoát. Hãy tránh lối viết sáo rỗng "từ xưa đến nay", thay vào đó hãy bắt đầu bằng một thực trạng hoặc một câu hỏi khơi gợi suy ngẫm sâu sắc.', 'published'),

(10, 14, 1, 'Chương 1: Trở về vạch xuất phát',
'Ánh sáng chói lòa từ vụ nổ lò phản ứng ma năng từ từ tan biến. Lâm Tiêu mở choàng mắt, phát hiện mình đang ngồi trong căn phòng trọ quen thuộc của mười năm trước, trước mặt là chiếc mũ thực tế ảo đời đầu.

Đồng hồ trên tường chỉ: Ngày 15 tháng 9 năm 2024 – đúng 3 tiếng trước khi máy chủ Thế Giới Thứ Hai mở cửa! Hắn bật cười sảng khoái: Kiếp này, ngai vàng Thần Cấp chỉ có thể thuộc về ta!', 'published');

-- BÌNH LUẬN MẪU TƯƠNG TÁC
INSERT INTO `comments` (`id`, `user_id`, `story_id`, `chapter_id`, `content`) VALUES
(1, 3, 1, 1, 'Mở đầu truyện cuốn hút quá! Bối cảnh dã sử kết hợp tiên hiệp Việt Nam rất sáng tạo, ủng hộ tác giả ra chương đều tay nhé!'),
(2, 2, 1, 1, 'Cảm ơn bạn độc giả đã đón nhận! Mình sẽ cố gắng cập nhật mỗi ngày một chương mới.'),
(3, 3, 2, 3, 'Kiếm hiệp Thăng Long không khí rất hoài cổ, bút lực miêu tả phố cổ ngày mưa rất có thần thái.'),
(4, 3, 4, 5, 'Pháp Mệnh Thiên Tôn đọc cuốn dã man, khí phách nhân vật chính ngút trời!'),
(5, 2, 6, 8, 'Tình cảm nhẹ nhàng mà thấm thía quá, đúng chất văn học mạng thuở đầu.'),
(6, 1, 13, 9, 'Tài liệu hướng dẫn viết nghị luận rất chi tiết và dễ áp dụng cho các bạn học sinh.');

-- TỦ SÁCH YÊU THÍCH
INSERT INTO `favorites` (`user_id`, `story_id`) VALUES
(3, 1),
(3, 2),
(3, 4),
(3, 6);

-- LỊCH SỬ ĐỌC
INSERT INTO `reading_history` (`user_id`, `story_id`, `chapter_id`) VALUES
(3, 1, 1),
(3, 4, 5),
(3, 6, 8);

-- ĐIỂM DANH GẦN ĐÂY
INSERT INTO `daily_checkins` (`id`, `user_id`, `coins_earned`, `created_at`) VALUES
(1, 3, 5, NOW() - INTERVAL 10 MINUTE),
(2, 2, 9, NOW() - INTERVAL 25 MINUTE),
(3, 1, 10, NOW() - INTERVAL 1 HOUR);

-- THÔNG BÁO BẢN TIN DIỄN ĐÀN
INSERT INTO `forum_announcements` (`id`, `title`, `url`, `color`, `display_order`) VALUES
(1, 'Kiếm tiền online: Viết truyện và nhận nhuận bút tại VNnettruyen', '/stories', '#e74c3c', 1),
(2, 'Nội Quy Website & Quy Tắc Ứng Xử Cộng Đồng VNnettruyen.vn', '/stories', '#e67e22', 2),
(3, 'Phản Hồi – Hỏi Đáp – Góp Ý Phát Triển Diễn Đàn', '/stories', '#27ae60', 3),
(4, 'Hướng Dẫn Thành Viên Mới Đăng Tác Phẩm Đầu Tay', '/author/stories/create', '#8e44ad', 4),
(5, 'Hướng Dẫn Đăng Các Chương Mới & Chỉnh Sửa Bản Thảo', '/author', '#2980b9', 5),
(6, 'Những lưu ý và lý do khiến truyện của bạn chưa được duyệt', '/stories', '#d35400', 6);
