-- ===================================================
-- VNnettruyen Database Initialization Script
-- Hệ thống cơ sở dữ liệu cho Website Đọc & Viết Truyện
-- ===================================================

CREATE DATABASE IF NOT EXISTS `vnnettruyen_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `vnnettruyen_db`;

-- 1. Bảng người dùng (users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('reader', 'author', 'admin') NOT NULL DEFAULT 'reader',
  `bio` TEXT NULL,
  `avatar` VARCHAR(255) DEFAULT '/public/images/default-avatar.png',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng thể loại truyện (genres)
CREATE TABLE IF NOT EXISTS `genres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `slug` VARCHAR(60) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  INDEX `idx_genres_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng truyện (stories)
CREATE TABLE IF NOT EXISTS `stories` (
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
CREATE TABLE IF NOT EXISTS `story_genres` (
  `story_id` INT NOT NULL,
  `genre_id` INT NOT NULL,
  PRIMARY KEY (`story_id`, `genre_id`),
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng chương truyện (chapters)
CREATE TABLE IF NOT EXISTS `chapters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `story_id` INT NOT NULL,
  `chapter_number` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_story_chapter` (`story_id`, `chapter_number`),
  INDEX `idx_chapters_story_status` (`story_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng bình luận (comments)
CREATE TABLE IF NOT EXISTS `comments` (
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
  INDEX `idx_comments_chapter` (`chapter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng tủ sách cá nhân / truyện yêu thích (favorites)
CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `story_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng lịch sử đọc (reading_history)
CREATE TABLE IF NOT EXISTS `reading_history` (
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

-- 9. Bảng báo cáo nội dung (reports)
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reporter_id` INT NOT NULL,
  `target_type` ENUM('story', 'chapter', 'comment') NOT NULL,
  `target_id` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng lưu trữ Session cho Express (sessions)
CREATE TABLE IF NOT EXISTS `sessions` (
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

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `bio`) VALUES
(1, 'admin', 'admin@vnnettruyen.vn', '$2a$10$Nf6M/sI/CvRT6CMOpN0V1O.5qjg6MNu2eFz8kyHuyBw1OZW2tmw7S', 'admin', 'Quản trị viên diễn đàn VNnettruyen'),
(2, 'tacgia_viet', 'author@vnnettruyen.vn', '$2a$10$TsecfGtT9maTbSZN6wxnUO0LFYx0Fm3bPAALcylPssgdnqdKy5ow2', 'author', 'Tác giả sáng tác dã sử, kiếm hiệp và huyền huyễn Việt Nam'),
(3, 'docgia_vn', 'reader@vnnettruyen.vn', '$2a$10$OtEWI1Pj1wge5/A0AQo.qOGPK1.7fsvRtFresEFd71HZlcm21YLX.', 'reader', 'Độc giả đam mê văn học mạng và tiểu thuyết kỳ ảo');

INSERT INTO `genres` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Tiên Hiệp', 'tien-hiep', 'Truyện tu tiên luyện khí, vượt qua giới hạn phàm nhân phi thăng tiên giới'),
(2, 'Kiếm Hiệp', 'kiem-hiep', 'Hành tẩu giang hồ, nghĩa khí võ hiệp và ân oán giang hồ hào hùng'),
(3, 'Dã Sử Việt', 'da-su-viet', 'Khai thác bối cảnh lịch sử hào hùng của dân tộc Việt Nam qua góc nhìn sáng tạo'),
(4, 'Huyền Huyễn', 'huyen-huyen', 'Thế giới ma pháp, dị giới siêu nhiên kỳ bí và pháp bảo vô tận'),
(5, 'Đô Thị', 'do-thi', 'Bối cảnh cuộc sống hiện đại, thương trường, y thuật và siêu năng lực đô thành'),
(6, 'Khoa Huyễn', 'khoa-huyen', 'Khoa học viễn tưởng tương lai, du hành vũ trụ và trí tuệ nhân tạo'),
(7, 'Trinh Thám - Kinh Dị', 'trinh-tham-kinh-di', 'Phá án ly kỳ, giải mã bí ẩn rùng rợn và tâm lý tội phạm sâu sắc');

INSERT INTO `stories` (`id`, `title`, `slug`, `author_id`, `description`, `cover_image`, `status`, `views`, `is_featured`) VALUES
(1, 'Huyền Khí Đại Việt', 'huyen-khi-dai-viet', 2, 'Tại dải đất phương Nam ngàn năm văn hiến, linh khí đất trời thức tỉnh sau ngàn năm phong ấn dưới lòng sông Hồng. Chàng thiếu niên Trần Phong xuất thân thảo dân, kế thừa linh kiếm Thần Lôi, từng bước khám phá những bí ẩn cổ xưa về nguồn gốc sức mạnh dân tộc...', '/public/images/cover-1.jpg', 'ongoing', 1250, 1),
(2, 'Thăng Long Kiếm Ảo', 'thang-long-kiem-ao', 2, 'Kinh thành Thăng Long sầm uất ẩn giấu những môn phái cổ xưa bảo vệ bờ cõi. Một cuộc kỳ ngộ giữa thiếu niên mồ côi và lão kiếm khách ẩn danh đã mở ra trang sử giang hồ đầy kịch tính.', '/public/images/cover-2.jpg', 'ongoing', 890, 1),
(3, 'Bạch Hạc Dạ Hành', 'bach-hac-da-hanh', 2, 'Đất Phong Châu ngút ngàn rừng thiêng nước độc, những vụ mất tích kỳ quái của các đoàn thương buôn đưa bộ đôi hình bộ phán quan vào vòng xoáy ma thuật cổ xưa.', '/public/images/cover-3.jpg', 'completed', 2140, 1),
(4, 'Đô Thị Tiên Phong 2026', 'do-thi-tien-phong-2026', 1, 'Sau khi du học trở về, kỹ sư trẻ Hoàng Nam phát hiện khả năng nhìn thấy các dòng chảy năng lượng trong dữ liệu máy tính, biến anh thành bậc thầy công nghệ siêu phàm.', '/public/images/default-cover.png', 'ongoing', 450, 0);

INSERT INTO `story_genres` (`story_id`, `genre_id`) VALUES
(1, 1), (1, 3), (1, 4),
(2, 2), (2, 3),
(3, 3), (3, 7),
(4, 5), (4, 6);

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

Phán quan Lê Duy vuốt nhẹ chuôi bội đao, ánh mắt nghiêm nghị nhìn vào dấu chân kỳ lạ trên lớp bùn nhão: dấu chân chỉ có ba ngón, to gấp đôi người thường và bốc ra một mùi hương tử đinh hương kỳ quái...', 'published');

INSERT INTO `comments` (`id`, `user_id`, `story_id`, `chapter_id`, `content`) VALUES
(1, 3, 1, 1, 'Mở đầu truyện cuốn hút quá! Bối cảnh dã sử kết hợp tiên hiệp Việt Nam rất sáng tạo, ủng hộ tác giả ra chương đều tay nhé!'),
(2, 2, 1, 1, 'Cảm ơn bạn độc giả đã đón nhận! Mình sẽ cố gắng cập nhật mỗi ngày một chương mới.'),
(3, 3, 2, 3, 'Kiếm hiệp Thăng Long không khí rất hoài cổ, bút lực miêu tả phố cổ ngày mưa rất có thần thái.');

INSERT INTO `favorites` (`user_id`, `story_id`) VALUES
(3, 1),
(3, 2);

INSERT INTO `reading_history` (`user_id`, `story_id`, `chapter_id`) VALUES
(3, 1, 1);
