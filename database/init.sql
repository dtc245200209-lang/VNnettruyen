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
DROP TABLE IF EXISTS `forum_replies`;
DROP TABLE IF EXISTS `forum_posts`;
DROP TABLE IF EXISTS `forum_categories`;
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
  `coins` INT DEFAULT 0,
  `bio` TEXT NULL,
  `avatar` VARCHAR(255) DEFAULT '/public/images/default-avatar.png',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng thể loại truyện (genres - 6 thể loại chuẩn, bỏ Tiên Hiệp)
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
  `pen_name` VARCHAR(100) NULL,
  `description` TEXT NOT NULL,
  `cover_image` VARCHAR(255) DEFAULT '/public/images/cover-1.jpg',
  `status` ENUM('ongoing', 'completed') DEFAULT 'ongoing',
  `views` INT DEFAULT 0,
  `is_featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_stories_slug` (`slug`),
  INDEX `idx_stories_views` (`views`),
  INDEX `idx_stories_status` (`status`),
  INDEX `idx_stories_author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng liên kết nhiều-nhiều truyện & thể loại (story_genres)
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
  `status` ENUM('published', 'draft') DEFAULT 'published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_story_chapter` (`story_id`, `chapter_number`),
  INDEX `idx_chapters_story` (`story_id`),
  INDEX `idx_chapters_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng bình luận truyện (comments)
CREATE TABLE `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `story_id` INT NOT NULL,
  `chapter_id` INT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_comments_story` (`story_id`),
  INDEX `idx_comments_chapter` (`chapter_id`),
  INDEX `idx_comments_user` (`user_id`),
  INDEX `idx_comments_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng truyện yêu thích / Tủ sách (favorites)
CREATE TABLE `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_favorite` (`user_id`, `story_id`),
  INDEX `idx_fav_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng lịch sử đọc truyện (reading_history)
CREATE TABLE `reading_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `chapter_id` INT NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_story_history` (`user_id`, `story_id`),
  INDEX `idx_history_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng thông báo diễn đàn (forum_announcements)
CREATE TABLE `forum_announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `color` VARCHAR(20) DEFAULT '#e67e22',
  `display_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng lưu trữ Session cho Express Session
CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` INT(11) UNSIGNED NOT NULL,
  `data` MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng chuyên mục diễn đàn (forum_categories)
CREATE TABLE `forum_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `icon` VARCHAR(10) DEFAULT '💬',
  `display_order` INT DEFAULT 0,
  INDEX `idx_forum_cat_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng bài viết / chủ đề diễn đàn (forum_posts)
CREATE TABLE `forum_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `content` MEDIUMTEXT NOT NULL,
  `views` INT DEFAULT 0,
  `is_pinned` TINYINT(1) DEFAULT 0,
  `is_locked` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `forum_categories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_forum_posts_cat` (`category_id`),
  INDEX `idx_forum_posts_user` (`user_id`),
  INDEX `idx_forum_posts_pinned` (`is_pinned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng bình luận / phản hồi bài viết diễn đàn (forum_replies)
CREATE TABLE `forum_replies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_forum_replies_post` (`post_id`),
  INDEX `idx_forum_replies_user` (`user_id`),
  INDEX `idx_forum_replies_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- DỮ LIỆU MẪU KHỞI TẠO (SEED DATA)
-- Mật khẩu mặc định: 123456
-- ===================================================

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `coins`, `bio`) VALUES
(1, 'admin', 'admin@vnnettruyen.vn', '$2a$10$hUDBVbJCiwdiA4Okox8qtOmrpnpSulIm.Hcl7oXSHSGM.t9rj4cD6', 'admin', 0, 'Quản trị viên diễn đàn VNnettruyen - Hỗ trợ cộng đồng sáng tác'),
(2, 'ThanhPhongKiemKhach', 'thanhphong@vnnettruyen.vn', '$2a$10$hUDBVbJCiwdiA4Okox8qtOmrpnpSulIm.Hcl7oXSHSGM.t9rj4cD6', 'author', 0, 'Tác giả sáng tác dã sử, kiếm hiệp và huyền huyễn Việt Nam'),
(3, 'MinhNguyetDocGia', 'minhnguyet@vnnettruyen.vn', '$2a$10$hUDBVbJCiwdiA4Okox8qtOmrpnpSulIm.Hcl7oXSHSGM.t9rj4cD6', 'author', 0, 'Độc giả thân thiết & nhà phê bình văn học tại VNnettruyen'),
(4, 'Meovangnho', 'Nami241@gmail.com', '$2a$10$hUDBVbJCiwdiA4Okox8qtOmrpnpSulIm.Hcl7oXSHSGM.t9rj4cD6', 'author', 0, 'Thành viên cộng đồng đam mê đọc và thảo luận truyện');

-- 6 THỂ LOẠI TRUYỆN CHÍNH (ĐÃ BỎ TIÊN HIỆP THEO YÊU CẦU)
INSERT INTO `genres` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Truyện Ngắn', 'truyen-ngan', 'Các tác phẩm ngắn gọn, súc tích, giàu cảm xúc và triết lý nhân sinh đời thường'),
(2, 'Tình Cảm', 'tinh-cam', 'Chuyện tình yêu ngọt ngào, sâu lắng, duyên phận cuộc đời'),
(3, 'Dị Giới', 'di-gioi', 'Chuyển sinh sang thế giới phép thuật, ma thú và các chủng tộc kỳ lạ'),
(4, 'Xuyên Không', 'xuyen-khong', 'Vượt thời không về quá khứ hoặc đến thế giới khác bắt đầu cuộc đời mới'),
(5, 'Đô Thị', 'do-thi', 'Bối cảnh cuộc sống hiện đại, thương trường, y thuật và năng lực đô thành'),
(6, 'Kiếm Hiệp', 'kiem-hiep', 'Hành tẩu giang hồ, nghĩa khí võ hiệp và ân oán phân minh');

-- CÁC TÁC PHẨM CHỌN LỌC (TẤT CẢ ĐỀU CÓ CHƯƠNG ĐẦY ĐỦ)
INSERT INTO `stories` (`id`, `title`, `slug`, `author_id`, `pen_name`, `description`, `cover_image`, `status`, `views`, `is_featured`) VALUES
(1, 'Huyền Khí Đại Việt', 'huyen-khi-dai-viet', 2, 'Thanh Phong Kiếm Khách', 'Tại dải đất phương Nam ngàn năm văn hiến, linh khí đất trời thức tỉnh sau ngàn năm phong ấn dưới lòng sông Hồng. Chàng thiếu niên Trần Phong xuất thân thảo dân, kế thừa linh kiếm Thần Lôi, từng bước khám phá những bí ẩn cổ xưa về nguồn gốc sức mạnh dân tộc...', '/public/images/cover-1.jpg', 'ongoing', 12520, 1),
(2, 'Thăng Long Kiếm Ảo', 'thang-long-kiem-ao', 2, 'Thanh Phong Kiếm Khách', 'Kinh thành Thăng Long sầm uất ẩn giấu những môn phái cổ xưa bảo vệ bờ cõi. Một cuộc kỳ ngộ giữa thiếu niên mồ côi và lão kiếm khách ẩn danh đã mở ra trang sử giang hồ đầy kịch tính.', '/public/images/cover-2.jpg', 'ongoing', 8940, 1),
(3, 'Bạch Hạc Dạ Hành', 'bach-hac-da-hanh', 2, 'Thanh Phong Kiếm Khách', 'Đất Phong Châu ngút ngàn rừng thiêng nước độc, những vụ mất tích kỳ quái của các đoàn thương buôn đưa bộ đôi hình bộ phán quan vào vòng xoáy ma thuật cổ xưa.', '/public/images/cover-3.jpg', 'completed', 21450, 1),
(4, 'Dây Tơ Hồng Nối Ngược', 'day-to-hong-noi-nguoc', 3, 'Minh Nguyệt Độc Giả', 'Tôi hay nghe, chúng ta không phải những kẻ đáng thương nhất, mà là họ. Chưa từng có ai hỏi họ có mệt không? Có muốn buông tay hay không... Một câu chuyện tình cảm sâu lắng đầy cảm xúc.', '/public/images/cover-3.jpg', 'ongoing', 19084, 1),
(5, 'Ác Mộng Tập', 'ac-mong-tap', 2, 'Thanh Phong Kiếm Khách', 'Tập hợp những câu chuyện kỳ bí có thật chốn thôn quê và các khu chung cư cũ bỏ hoang giữa lòng Hà Nội và Sài Gòn. Mỗi cơn ác mộng đều mang theo một lời cảnh báo từ quá khứ.', '/public/images/cover-2.jpg', 'ongoing', 35860, 1),
(6, 'Cơm Tấm Sườn Bì Chả Và Tôi', 'com-tam-suon-bi-cha-va-toi', 3, 'Minh Nguyệt Độc Giả', 'Một truyện ngắn đời thường dung dị về khói than nghi ngút góc phố Sài Gòn, dĩa cơm tấm thơm lừng ấm lòng những cô cậu sinh viên xa quê lập nghiệp.', '/public/images/cover-3.jpg', 'completed', 8900, 0),
(7, 'Người Trong Giang Hồ', 'nguoi-trong-giang-ho', 2, 'Thanh Phong Kiếm Khách', 'Luận bàn về chữ Tình, chữ Nghĩa và danh lợi chốn võ lâm đương đại. Khi gươm đao gác lại, thứ còn đọng lại trong lòng kiếm khách chỉ là một chén rượu ấm tình bằng hữu.', '/public/images/cover-1.jpg', 'ongoing', 51948, 1),
(8, 'Đô Thị Tiên Phong', 'do-thi-tien-phong', 1, 'Admin VNnettruyen', 'Sau khi du học trở về, kỹ sư trẻ Hoàng Nam phát hiện khả năng nhìn thấy các dòng chảy năng lượng trong dữ liệu máy tính, biến anh thành bậc thầy công nghệ siêu phàm.', '/public/images/cover-1.jpg', 'ongoing', 4500, 0),
(9, 'Võng Du: Thần Cấp Trọng Sinh', 'vong-du-than-cap-trong-sinh', 2, 'Thanh Phong Kiếm Khách', 'Trọng sinh về 10 năm trước ngày máy chủ Thần Vực mở cửa, Lâm Tiêu mang theo ký ức của một Thần Cấp Đạo Tặc từng bước độc chiếm tài nguyên thế giới ảo.', '/public/images/cover-2.jpg', 'ongoing', 78500, 1),
(10, 'Chuyện Hoa, Chuyện Người', 'chuyen-hoa-chuyen-nguoi', 3, 'Minh Nguyệt Độc Giả', 'Tản mạn về những khóm hoa ban tím, về con hẻm nhỏ thơm mùi hoa dạ lý hương và những phận người lặng lẽ đi qua mùa giông bão cuộc đời.', '/public/images/cover-3.jpg', 'completed', 12450, 0);

-- LIÊN KẾT TRUYỆN VÀ THỂ LOẠI (6 THỂ LOẠI CHÍNH)
INSERT INTO `story_genres` (`story_id`, `genre_id`) VALUES
(1, 6), (1, 3),             -- Huyền Khí Đại Việt: Kiếm Hiệp, Dị Giới
(2, 6),                     -- Thăng Long Kiếm Ảo: Kiếm Hiệp
(3, 6), (3, 3),             -- Bạch Hạc Dạ Hành: Kiếm Hiệp, Dị Giới
(4, 2),                     -- Dây Tơ Hồng Nối Ngược: Tình Cảm
(5, 1), (5, 3),             -- Ác Mộng Tập: Truyện Ngắn, Dị Giới
(6, 1), (6, 2),             -- Cơm Tấm Sườn Bì Chả: Truyện Ngắn, Tình Cảm
(7, 6),                     -- Người Trong Giang Hồ: Kiếm Hiệp
(8, 5),                     -- Đô Thị Tiên Phong: Đô Thị
(9, 4), (9, 3),             -- Võng Du Thần Cấp: Xuyên Không, Dị Giới
(10, 1), (10, 2);           -- Chuyện Hoa, Chuyện Người: Truyện Ngắn, Tình Cảm

-- CÁC CHƯƠNG TRUYỆN ĐẦY ĐỦ CHO TẤT CẢ 10 TÁC PHẨM
INSERT INTO `chapters` (`id`, `story_id`, `chapter_number`, `title`, `content`, `status`) VALUES
-- Truyện 1: Huyền Khí Đại Việt
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

-- Truyện 2: Thăng Long Kiếm Ảo
(3, 2, 1, 'Chương 1: Đêm mưa phố Hội', 
'Cơn mưa rào mùa hạ xối xả trút xuống những mái ngói rêu phong của đất Thăng Long xưa. Trong quán trà nhỏ nơi ngõ Huyện, tiếng đàn tranh thánh thót hòa cùng tiếng mưa rơi rả rích.

Ngồi bên góc quán là một thiếu niên mặc áo chàm giản dị, trước mặt đặt một chén trà sen thơm ngát. Chàng tên là Lâm Vũ, một thư sinh nghèo nhưng trong ánh mắt lại ẩn giấu vẻ tinh anh sắc bén khác thường...', 'published'),

(4, 2, 2, 'Chương 2: Kiếm Khí Trấn Hà Thành',
'Ánh chớp rạch ngang bầu trời đêm tối thẫm. Bốn bóng đen bịt mặt từ trên nóc nhà lao xuống, ám khí như mưa rào nhắm thẳng vào lưng lão hòa thượng gác đền.

Lâm Vũ khẽ nhúc nhích ngón tay. Thanh đoản kiếm cài sau lưng bỗng vang lên tiếng rít xé gió, kiếm quang xanh biếc quét thành một vòng cung hoàn mỹ, gạt phăng toàn bộ phi tiêu kim độc rơi lả tả xuống sàn gỗ. "Kinh thành Thăng Long, không phải nơi cho phường ô hợp các ngươi hoành hành!"', 'published'),

-- Truyện 3: Bạch Hạc Dạ Hành
(5, 3, 1, 'Chương 1: Bí ẩn làng Thổ Tang', 
'Sương mù giăng kín các lối mòn dẫn vào làng Thổ Tang. Ba đêm liền, đàn chó săn của quan phủ đều tru lên từng hồi thê thiết rồi chết bất đắc kỳ tử mà không hề có vết thương bên ngoài.

Phán quan Lê Duy vuốt nhẹ chuôi bội đao, ánh mắt nghiêm nghị nhìn vào dấu chân kỳ lạ trên lớp bùn nhão: dấu chân chỉ có ba ngón, to gấp đôi người thường và bốc ra một mùi hương tử đinh hương kỳ quái...', 'published'),

(6, 3, 2, 'Chương 2: Ma Khí Dưới Rừng Thiêng',
'Đêm sâu không một tiếng côn trùng kêu rả rích. Trong miếu cổ bỏ hoang ven rừng, một làn khói tím mờ ảo cuộn tròn quanh bức tượng thần Bạch Hạc bị đứt cánh.

Lê Duy và phó quan nép mình sau hàng cột lim, tim đập thình thịch khi nghe thấy tiếng nhai rào rạo phát ra từ bóng tối. Một đôi mắt đỏ rực như máu từ từ ngẩng lên nhìn thẳng vào vị trí hai người đang ẩn nấp...', 'published'),

-- Truyện 4: Dây Tơ Hồng Nối Ngược
(7, 4, 1, 'Chương 1: Chạm mặt nơi ngã tư đèn đỏ',
'Trời Sài Gòn đổ cơn mưa bất chợt vào giờ tan tầm. Dòng người chen chúc nhau từng chút một nơi ngã tư Hàng Xanh khói bụi. An đứng nép dưới mái hiên của một tiệm sách cũ, chiếc áo sơ mi ướt sũng dán chặt vào vai.

Đúng lúc đó, một chiếc ô màu be khẽ nghiêng qua đầu cô. Mùi hương gỗ đàn hương quen thuộc thoảng qua cánh mũi khiến tim cô thắt lại. Là anh. Người mà cô đã trốn tránh suốt ba năm ròng rã.', 'published'),

(8, 4, 2, 'Chương 2: Tách cà phê còn dang dở',
'Quán cà phê nhỏ trên đường Tú Xương chỉ có tiếng mưa rơi trên mái tôn và tiếng nhạc Trịnh dìu dặt. Hai người ngồi đối diện nhau, tách cà phê sữa đá tan dần bốc lên làn khói lạnh.

"Em sống có tốt không?" - Giọng anh vẫn trầm ấm như những ngày xưa cũ. An khẽ cười, một nụ cười giấu đi biết bao đêm dài thức trắng nơi căn phòng trọ nhỏ.', 'published'),

-- Truyện 5: Ác Mộng Tập
(9, 5, 1, 'Chương 1: Căn phòng số 404', 
'Đó là một căn phòng bỏ trống ở tầng bốn khu tập thể Nghĩa Tân. Cứ đúng 2 giờ 15 phút sáng, tiếng bi ve rơi lộp độp trên sàn nhà lại vang lên đều đặn. 

Không một ai dám lên tầng bốn sau nửa đêm, cho đến khi Minh – một cậu sinh viên mới chuyển đến vì tiền thuê rẻ – quyết định bước chân qua cánh cửa gỗ mục nát...', 'published'),

(10, 5, 2, 'Chương 2: Bóng Người Sau Rèm Cửa',
'Minh giơ cao ngọn đèn pin điện thoại. Không khí trong phòng ẩm mốc và lạnh toát dù ngoài trời đang là đợt nắng nóng đỉnh điểm của tháng Bảy.

Dưới ánh sáng le lói, một tấm rèm hoa cũ kỹ phủ đầy bụi bẩn bỗng lay động nhẹ dù tất cả các cửa sổ đều đóng kín then cài. Sau bức rèm, in hằn một bóng người nhỏ thó đang ngồi bó gối quay lưng lại phía cậu...', 'published'),

-- Truyện 6: Cơm Tấm Sườn Bì Chả Và Tôi
(11, 6, 1, 'Chương 1: Khói than đường Nguyễn Trãi',
'Cứ mỗi độ chiều tà buông xuống, mùi sườn nướng mỡ hành thơm nức mũi từ chiếc lò than ven đường lại níu chân biết bao người qua lại. Với tôi, đĩa cơm tấm bì chả ba mươi ngàn không chỉ là bữa tối qua loa của một thằng sinh viên nghèo, mà là cả một góc trời ấm áp giữa phố thị xa hoa.', 'published'),

(12, 6, 2, 'Chương 2: Nụ cười của má Bảy',
'Má Bảy bán cơm tấm ở góc đường này đã hơn hai mươi năm. Chiếc tạp dề sờn màu, đôi bàn tay thoăn thoắt gắp miếng sườn vàng ươm mọng nước đặt lên đĩa cơm nghi ngút khói. 

"Ráng ăn no nghen con, học hành vất vả mà gầy rộc người đi rồi kìa!" - Câu nói mộc mạc của má làm sống mũi tôi cay cay giữa đêm Sài Gòn se lạnh.', 'published'),

-- Truyện 7: Người Trong Giang Hồ
(13, 7, 1, 'Chương 1: Chén rượu tiễn bạn',
'Rượu nếp thơm nồng đựng trong vò gốm Bát Tràng. Hai kiếm khách từng một thời tung hoành ngang dọc chốn quan trường nay tóc đã điểm bạc ngồi đối ẩm bên gốc đa cổ thụ.

"Bao năm chém giết giành giật hư danh, rốt cuộc tay trắng lại hoàn trắng tay." - Lão kiếm khách thở dài nâng chén.', 'published'),

(14, 7, 2, 'Chương 2: Nhát Đao Cuối Cùng',
'Tiếng ngựa hí vang dội từ phía chân đồi. Ba trăm kỵ binh thiết giáp của triều đình đã bao vây kín con đường độc đạo. Lão kiếm khách đứng dậy, rút thanh trường kiếm đã theo mình bốn mươi năm chinh chiến, mỉm cười quay sang người bạn già: "Uống cạn chén này, chúng ta cùng tiễn biệt một thời thanh xuân!"', 'published'),

-- Truyện 8: Đô Thị Tiên Phong
(15, 8, 1, 'Chương 1: Bản mạch thần kỳ',
'Sau vụ nổ tại phòng thí nghiệm vi mạch bán dẫn khu công nghệ cao Hòa Lạc, Hoàng Nam tỉnh dậy trong bệnh viện với một thị lực kỳ lạ: anh có thể nhìn thấy dòng chảy tín hiệu số và các xung điện từ trường nhảy múa trong không khí như những dải lụa neon phát sáng.', 'published'),

(16, 8, 2, 'Chương 2: Thương Trường Dậy Sóng',
'Trước mắt Nam là màn hình hiển thị thuật toán phòng thủ của tập đoàn công nghệ đa quốc gia đang cố tình thao túng thị trường chứng khoán Việt Nam. Với đôi mắt nhìn thấu mã nhị phân, Nam chỉ cần gõ đúng ba dòng lệnh để lật ngược thế cờ trong vòng sáu mươi giây.', 'published'),

-- Truyện 9: Võng Du: Thần Cấp Trọng Sinh
(17, 9, 1, 'Chương 1: Mười năm quay đầu',
'Cơn đau xé ruột khi bị đồng đội phản bội nơi cửa ải Thần Vực tầng 100 khiến Lâm Tiêu bừng tỉnh. Nhìn chiếc đồng hồ điện tử trên bàn học chỉ ngày 15 tháng 9 năm 2026, anh bàng hoàng nhận ra: mình đã trọng sinh về đúng ngày máy chủ thực tế ảo đầu tiên của nhân loại mở cửa!', 'published'),

(18, 9, 2, 'Chương 2: Danh Hiệu Thần Cấp',
'Bước chân vào tân thủ thôn số 8888, trong khi hàng triệu người chơi khác còn đang loay hoay đánh thỏ nhặt cành cây, Lâm Tiêu đã thẳng tiến vào hẻm núi Quạ Đen để nhận nhiệm vụ ẩn độc quyền chỉ có người từng sống qua mười năm mới biết.', 'published'),

-- Truyện 10: Chuyện Hoa, Chuyện Người
(19, 10, 1, 'Chương 1: Hoa ban tím góc sân',
'Người ta thường nhớ về hoa ban nơi núi rừng Tây Bắc hiểm trở, nhưng ít ai biết giữa lòng thủ đô, cây hoa ban tím trước hiên nhà cũ của bà nội cứ mỗi độ tháng Ba lại trút lá nở hoa rợp trời, phủ tím cả con ngõ nhỏ bình yên.', 'published'),

(20, 10, 2, 'Chương 2: Ký Ức Mùa Sang',
'Bà nội ngồi nhặt từng cánh hoa ban rơi trên mặt bàn gỗ, mỉm cười kể lại những câu chuyện thời bom đạn hào hùng. Năm tháng có thể làm bạc mái đầu người ở lại, nhưng những hồi ức đẹp đẽ thì vẫn vẹn nguyên như hương hoa thoang thoảng trong chiều gió.', 'published');

-- THÔNG BÁO BẢN TIN DIỄN ĐÀN
INSERT INTO `forum_announcements` (`id`, `title`, `url`, `color`, `display_order`) VALUES
(1, 'Nội Quy Sinh Hoạt & Quy Tắc Ứng Xử Văn Hóa Tại Diễn Đàn VNnettruyen', '/forum/categories/thong-bao-noi-quy', '#e74c3c', 1),
(2, 'Hướng Dẫn Thành Viên & Tác Giả Xuất Bản Tác Phẩm Mới', '/author/stories/create', '#2563eb', 2),
(3, 'Kênh Tiếp Nhận Ý Kiến Đóng Góp & Hỗ Trợ Kỹ Thuật Cộng Đồng', '/forum/categories/hoi-dap-gop-y', '#16a34a', 3),
(4, 'Góc Vinh Danh Tác Tác Giả & Tác Phẩm Xuất Sắc Được Yêu Thích', '/forum/categories/thao-luan-truyen', '#d97706', 4);

-- 6 CHUYÊN MỤC DIỄN ĐÀN PHONG PHÚ & CHỈNH CHU
INSERT INTO `forum_categories` (`id`, `name`, `slug`, `description`, `icon`, `display_order`) VALUES
(1, 'Thông Báo & Nội Quy', 'thong-bao-noi-quy', 'Quy tắc sinh hoạt cộng đồng, quyền lợi tác giả và thông báo chính thức từ Ban Quản Trị', '📢', 1),
(2, 'Thảo Luận & Cảm Nhận Truyện', 'thao-luan-truyen', 'Nơi phân tích cốt truyện, luận bàn nhân vật và chia sẻ góc nhìn văn học sâu sắc', '💬', 2),
(3, 'Góc Sáng Tác & Chia Sẻ Bút Lực', 'sang-tac-kinh-nghiem', 'Kinh nghiệm viết văn, cách xây dựng thế giới, thiết lập cao trào và gỡ rối mạch truyện', '✍️', 3),
(4, 'Tìm Truyện & Đề Cử Truyện Hay', 'de-cu-tim-truyen', 'Chia sẻ cảm nhận, review tác phẩm chất lượng và tìm kiếm truyện theo sở thích', '🔍', 4),
(5, 'Trà Quán Giang Hồ', 'tra-quan-giang-ho', 'Góc giao lưu thân mật giữa độc giả và tác giả, tản mạn cuộc sống và kết bạn bốn phương', '☕', 5),
(6, 'Hỏi Đáp & Góp Ý Diễn Đàn', 'hoi-dap-gop-y', 'Giải đáp thắc mắc cách sử dụng website, tiếp nhận ý kiến đóng góp xây dựng cộng đồng', '💡', 6);

-- 12 CHỦ ĐỀ THẢO LUẬN DIỄN ĐÀN CHỈNH CHU & THỰC TẾ
INSERT INTO `forum_posts` (`id`, `category_id`, `user_id`, `title`, `slug`, `content`, `views`, `is_pinned`, `is_locked`) VALUES
(1, 1, 1, '[Nội Quy] Quy định chung khi tham gia thảo luận và sáng tác trên VNnettruyen', 'quy-dinh-chung-khi-tham-gia-thao-luan-va-sang-tac', 
'Chào toàn thể thành viên và tác giả của VNnettruyen,

Để xây dựng một sân chơi văn học trực tuyến văn minh, chất lượng và tôn trọng bản quyền, Ban Quản Trị xin ban hành các quy định cơ bản:
1. Tôn trọng bản quyền tác giả: Nghiêm cấm sao chép nội dung khi chưa có sự đồng ý của tác giả gốc.
2. Ứng xử hòa nhã, lịch sự trong các chủ đề tranh luận. Không công kích cá nhân hay sử dụng ngôn từ phản cảm.
3. Tác phẩm đăng tải phải tuân thủ chuẩn chính tả Tiếng Việt có dấu, trình bày rõ ràng từng chương hồi.

Chúc mọi người có những giờ phút thưởng thức văn học và sáng tác thật thăng hoa!', 2450, 1, 0),

(2, 3, 2, '[Sáng Tác] Làm thế nào để xây dựng một bối cảnh kiếm hiệp thuần Việt sống động?', 'lam-the-nao-de-xay-dung-boi-canh-kiem-hiep-thuan-viet', 
'Chào các bạn đồng nghiệp sáng tác!

Rất nhiều bạn tâm sự với mình rằng khi viết kiếm hiệp, ngòi bút rất dễ bị cuốn theo các địa danh và phong cách Trung Hoa (như Thiếu Lâm, Võ Đang, Tung Sơn...). Để viết một tác phẩm mang đậm phong vị Việt Nam, mình xin chia sẻ 3 kinh nghiệm thực chiến:

1. Dựa trên địa lý và lịch sử nước nhà: Sông Bạch Đằng, dãy Trường Sơn, đất Thăng Long ngàn năm, bến Đông Bộ Đầu hay rừng thiêng Phong Châu.
2. Hệ thống vũ khí và võ học cổ truyền: Kiếm liễu, đao trường, côn nhị khúc, võ thế Nam Huỳnh Đạo hoặc võ Bình Định.
3. Triết lý võ hiệp: Không chỉ là ân oán giang hồ, mà gắn liền với lòng yêu nước thương dân và nghĩa khí hào sảng của cha ông.

Các bạn nghĩ sao về hướng đi này? Rất mong được nghe chia sẻ từ mọi người!', 1820, 1, 0),

(3, 2, 3, '[Cảm Nhận] "Dây Tơ Hồng Nối Ngược" - Nỗi buồn đẹp đẽ của những người từng thương', 'cam-nhan-day-to-hong-noi-nguoc-noi-buon-dep-de', 
'Hôm qua vừa đọc xong hai chương đầu của "Dây Tơ Hồng Nối Ngược", mình thực sự bị ám ảnh bởi câu văn: "Chưa từng có ai hỏi họ có mệt không? Có muốn buông tay hay không...".

Tác giả miêu tả cơn mưa chiều Sài Gòn và sự tái ngộ giữa ngã tư đèn đỏ quá đỗi chân thực. Có những mối tình không phải vì hết thương mà dừng lại, mà là vì cả hai đã đi quá xa trên con đường trưởng thành của riêng mình. Có ai đang theo dõi bộ này không, vào đàm đạo với mình nhé!', 950, 0, 0),

(4, 3, 4, '[Kinh Nghiệm] Cách vượt qua giai đoạn cạn ý tưởng (Writer\'s Block) cho tác giả mới', 'cach-vuot-qua-giai-doan-can-y-tuong-writers-block', 
'Chào mọi người, mình là Meovangnho!

Chắc hẳn ai từng cầm bút viết tiểu thuyết đều trải qua cảm giác ngồi hàng giờ trước màn hình máy tính trắng trơn mà không gõ nổi một chữ. Sau vài lần bị "tắc bút", mình rút ra vài mẹo nhỏ muốn chia sẻ cùng anh em:

- Đừng cố hoàn hảo ngay từ bản nháp đầu tiên: Cứ viết ra hết những gì trong đầu, dù câu từ có lủng củng. Biên tập lại là việc của ngày hôm sau!
- Đi dạo hoặc đổi không gian: Đôi khi ra bờ hồ ngồi uống cà phê ngắm dòng người qua lại lại nảy ra một tình huống đắt giá.
- Đọc lại những chương đầu: Tìm lại cảm xúc và nhiệt huyết thuở ban đầu khi bạn nảy ra ý tưởng câu chuyện.

Anh em tác giả có bí quyết nào nữa không, chỉ giáo cho mình với nha!', 1240, 1, 0),

(5, 4, 3, '[Đề Cử] Top 3 bộ truyện kiếm hiệp và dã sử Việt Nam đáng đọc nhất trên diễn đàn', 'top-3-bo-truyen-kiem-hiep-va-da-su-viet-nam-dang-doc-nhat', 
'Dành cho những ai đang tìm kiếm tác phẩm chất lượng cuối tuần này:
1. "Huyền Khí Đại Việt" - Cốt truyện hoành tráng, lồng ghép truyền thuyết dân tộc cực kỳ mượt mà.
2. "Thăng Long Kiếm Ảo" - Những màn đấu kiếm được miêu tả sắc sảo, nghẹt thở.
3. "Bạch Hạc Dạ Hành" - Phong cách trinh thám cổ trang kết hợp huyền bí rừng thiêng rất lôi cuốn.

Anh em đọc xong nhớ để lại bình luận ủng hộ tác giả nhà mình nha!', 1680, 0, 0),

(6, 5, 4, '[Trà Quán] Sở thích viết lách vào lúc mấy giờ đêm của các bạn?', 'so-thich-viet-lach-vao-luc-may-gio-dem-cua-cac-ban', 
'Mình nhận thấy khung giờ từ 23h đến 2h sáng là lúc tâm trí tĩnh lặng và chữ tuôn ra dạt dào nhất. Kèm theo một ly trà sen ấm hoặc tách cà phê sữa đá là đủ cho một đêm thăng hoa cùng nhân vật.

Còn các bạn thì sao? Bạn thích viết vào sáng sớm tinh mơ hay đêm muộn yên tĩnh?', 620, 0, 0),

(7, 2, 2, '[Luận Bàn] Nghệ thuật xây dựng nhân vật phản diện: Đừng để kẻ ác chỉ đơn giản là điên cuồng', 'nghe-thuat-xay-dung-nhan-vat-phan-dien-co-chieu-sau', 
'Một câu chuyện hay phụ thuộc rất nhiều vào độ sâu của nhân vật đối trọng với nhân vật chính. Một kẻ phản diện xuất sắc thường là người tin rằng hành động của mình là hoàn toàn đúng đắn dựa trên bi kịch quá khứ của họ.

Khi độc giả vừa căm ghét tội ác nhưng lại vừa ngậm ngùi thấu hiểu cho nỗi đau của kẻ phản diện, đó là lúc ngòi bút của bạn đã chạm tới chiều sâu của cảm xúc con người.', 1110, 0, 0),

(8, 6, 3, '[Góp Ý] Đề xuất tính năng tự động lưu bản thảo khi đang sáng tác', 'de-xuat-tinh-nang-tu-dong-luu-ban-thao-khi-dang-sang-tac', 
'Gửi Ban Quản Trị, nhiều khi đang viết truyện hăng say mà lỡ tay tắt trình duyệt hoặc mất điện đột ngột rất dễ mất nội dung vừa gõ. BQT có thể xem xét thêm tính năng auto-save vào bộ nhớ tạm trình duyệt (localStorage) để anh em tác giả yên tâm hơn được không ạ?', 430, 0, 0);

-- PHẢN HỒI THẢO LUẬN DIỄN ĐÀN (30+ REPLIES CHÂN THẬT, SÔI NỔI)
INSERT INTO `forum_replies` (`id`, `post_id`, `user_id`, `content`) VALUES
(1, 1, 2, 'Hoàn toàn ủng hộ nội quy! Sân chơi cần có chuẩn mực để anh em tác giả yên tâm cống hiến tác phẩm.'),
(2, 1, 3, 'Quy định rất rõ ràng. Mong BQT kiên quyết xử lý những trường hợp copy truyện trái phép ạ.'),
(3, 1, 4, 'Tuyệt vời ạ, chúc diễn đàn của chúng ta ngày càng phát triển vững mạnh!'),

(4, 2, 3, 'Đọc phân tích của bác tác giả tâm đắc quá! Em rất thích cách bác đưa bến Bạch Đằng và sông Hồng vào Huyền Khí Đại Việt.'),
(5, 2, 4, 'Ý kiến rất chuẩn! Em thấy dùng các chiêu thức võ Bình Định hay Vovinam đọc cảm giác thân thuộc và tự hào hơn nhiều so với Giáng Long Thập Bát Chưởng.'),
(6, 2, 1, 'BQT đã ghim bài viết này lên đầu chuyên mục Sáng Tác để các tác giả trẻ học hỏi thêm kinh nghiệm.'),

(7, 3, 2, 'Cảm ơn bạn độc giả đã dành tình cảm cho tác phẩm! Chương 3 sẽ sớm lên sóng trong tuần này nhé!'),
(8, 3, 4, 'Đoạn ngã tư Hàng Xanh đọc thấm thía ghê gớm. Ai từng sống ở Sài Gòn đều sẽ thấy hình bóng mình trong đó.'),
(9, 3, 3, 'Hóng chương mới từng ngày bác ơi, viết chắc tay lắm ạ!'),

(10, 4, 2, 'Chuẩn luôn Meovangnho ơi! Nhiều tác giả mới thường mắc bẫy cố chỉnh từng câu từ ngay khi viết khiến câu chuyện bị đứt mạch.'),
(11, 4, 3, 'Kinh nghiệm rất quý giá cho người mới chập chững như em, cảm ơn bạn đã chia sẻ nhiệt tình!'),
(12, 4, 1, 'Cứ viết hết một mạch cho xong bản thô rồi quay lại chuốt câu chữ sau là bí quyết chuẩn xác nhất.'),

(13, 5, 2, 'Rất cảm ơn bạn độc giả đã đề cử cả 3 đứa con tinh thần của mình! Mình sẽ cố gắng giữ vững phong độ.'),
(14, 5, 4, 'Mình vừa cày một lèo 2 chương Huyền Khí Đại Việt, công nhận cốt truyện cuốn hút thật sự.'),
(15, 5, 1, 'Danh sách đề cử rất chất lượng, độc giả mới vào diễn đàn nên đọc qua những bộ này trước.'),

(16, 6, 2, 'Mình cũng là cú đêm chính hiệu! Ban ngày ồn ào rất khó nhập tâm vào thế giới kiếm hiệp cổ phong.'),
(17, 6, 3, 'Em thì lại ngược lại, thích dậy sớm lúc 5h sáng nhâm nhi cà phê rồi viết, đầu óc lúc đó sáng suốt nhất.'),
(18, 6, 4, 'Mỗi người một phong cách, nhưng miễn là có cảm xúc thì giờ nào viết cũng sướng hết anh em nhỉ!'),

(19, 7, 3, 'Đúng vậy ạ! Những nhân vật như Thanos hay Joker ám ảnh là vì họ có lý tưởng và triết lý riêng chứ không phải ác một cách vô cớ.'),
(20, 7, 4, 'Phân tích rất sâu sắc. Trong tác phẩm mới em cũng đang cố gắng xây dựng tuyến nhân vật đối lập có chiều sâu tâm lý hơn.'),

(21, 8, 1, 'Cảm ơn bạn độc giả đã góp ý thiết thực! BQT đã ghi nhận và đang triển khai cơ chế LocalStorage auto-save cho khung soạn thảo chương truyện.');
