const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const db = require('../config/db');
const logger = require('../config/logger');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function parseDocument(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else if (ext === '.txt' || ext === '.md') {
    text = fs.readFileSync(filePath, 'utf8');
  } else {
    return null;
  }

  // Phân tích header và các chương
  const lines = text.split(/\r?\n/);
  let title = '';
  let authorName = 'PhongVanKhach';
  let genreName = 'Truyện Ngắn';
  let description = '';
  let coverImage = '/public/images/cover-1.jpg';
  let status = 'ongoing';

  let inHeader = true;
  let chapters = [];
  let currentChapter = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Phát hiện chương mới
    const chapterMatch = line.match(/^(?:##\s*)?(?:Chương|Tập|Hồi)\s*(\d+)[\s:：.-]*(.*)$/i);
    if (chapterMatch) {
      inHeader = false;
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        number: parseInt(chapterMatch[1], 10),
        title: chapterMatch[2].trim() || `Chương ${chapterMatch[1]}`,
        contentLines: []
      };
      continue;
    }

    if (inHeader) {
      if (/^(?:Tiêu đề|Tên truyện|Title)\s*[:：]\s*(.+)$/i.test(line)) {
        title = line.replace(/^(?:Tiêu đề|Tên truyện|Title)\s*[:：]\s*/i, '').trim();
      } else if (/^(?:Tác giả|Author)\s*[:：]\s*(.+)$/i.test(line)) {
        authorName = line.replace(/^(?:Tác giả|Author)\s*[:：]\s*/i, '').trim();
      } else if (/^(?:Thể loại|Genre)\s*[:：]\s*(.+)$/i.test(line)) {
        genreName = line.replace(/^(?:Thể loại|Genre)\s*[:：]\s*/i, '').trim();
      } else if (/^(?:Mô tả|Tóm tắt|Giới thiệu|Description|Summary)\s*[:：]\s*(.+)$/i.test(line)) {
        description = line.replace(/^(?:Mô tả|Tóm tắt|Giới thiệu|Description|Summary)\s*[:：]\s*/i, '').trim();
      } else if (/^(?:Ảnh bìa|Cover)\s*[:：]\s*(.+)$/i.test(line)) {
        coverImage = line.replace(/^(?:Ảnh bìa|Cover)\s*[:：]\s*/i, '').trim();
      } else if (!title && line.length > 0 && !line.includes(':')) {
        // Dòng đầu tiên không chứa dấu hai chấm có thể là tiêu đề
        title = line;
      }
    } else {
      if (currentChapter) {
        currentChapter.contentLines.push(lines[i]);
      }
    }
  }

  if (currentChapter) {
    chapters.push(currentChapter);
  }

  if (!title) {
    title = path.basename(filePath, ext);
  }

  return {
    title,
    authorName,
    genreName,
    description: description || `Tác phẩm ${title} do tác giả ${authorName} sáng tác và xuất bản trên diễn đàn VNnettruyen.`,
    coverImage,
    status,
    chapters: chapters.map(c => ({
      number: c.number,
      title: c.title,
      content: c.contentLines.join('\n').trim()
    }))
  };
}

async function importAllStories() {
  let importDir = path.resolve(__dirname, '../../stories_import');
  if (!fs.existsSync(importDir)) {
    importDir = path.resolve(__dirname, '../../../stories_import');
  }
  if (!fs.existsSync(importDir)) {
    fs.mkdirSync(importDir, { recursive: true });
    console.log(`Đã tạo thư mục nhập truyện: ${importDir}`);
    return;
  }

  const files = fs.readdirSync(importDir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    const base = path.basename(f, ext).toUpperCase();
    if (base.startsWith('README') || base.startsWith('HUONG_DAN')) return false;
    return ext === '.docx' || ext === '.txt' || ext === '.md';
  });

  if (files.length === 0) {
    console.log(`Không tìm thấy file truyện (.docx, .txt, .md) nào trong ${importDir}`);
    console.log('Hãy đặt các file Word (.docx) hoặc Text (.txt) vào thư mục stories_import/ rồi chạy lại lệnh.');
    return;
  }

  console.log(`Tìm thấy ${files.length} file truyện cần nhập. Bắt đầu xử lý...`);

  for (const file of files) {
    const fullPath = path.join(importDir, file);
    try {
      console.log(`\nĐang đọc file: ${file}...`);
      const parsed = await parseDocument(fullPath);
      if (!parsed) continue;

      console.log(`- Tiêu đề: "${parsed.title}"`);
      console.log(`- Tác giả: ${parsed.authorName}`);
      console.log(`- Thể loại: ${parsed.genreName}`);
      console.log(`- Số chương tìm thấy: ${parsed.chapters.length}`);

      if (parsed.chapters.length === 0) {
        console.log(`⚠️ Cảnh báo: File "${file}" chưa có chương nào được phân định (Cần có dòng "Chương 1: Tiêu đề"). Bỏ qua.`);
        continue;
      }

      // 1. Tìm hoặc tạo tác giả
      let authorId = 2; // Mặc định PhongVanKhach
      const [userRows] = await db.query('SELECT id FROM users WHERE username = ? LIMIT 1', [parsed.authorName]);
      if (userRows.length > 0) {
        authorId = userRows[0].id;
      } else {
        const [newAuthor] = await db.query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [parsed.authorName, `${slugify(parsed.authorName)}@vnnettruyen.vn`, '$2a$10$hUDBVbJCiwdiA4Okox8qtOmrpnpSulIm.Hcl7oXSHSGM.t9rj4cD6', 'author']
        );
        authorId = newAuthor.insertId;
      }

      // 2. Tìm thể loại phù hợp
      let genreId = 1; // Truyện ngắn
      const [allGenres] = await db.query('SELECT id, name, slug FROM genres');
      const matchedGenre = allGenres.find(g => 
        g.name.toLowerCase().includes(parsed.genreName.toLowerCase()) || 
        parsed.genreName.toLowerCase().includes(g.name.toLowerCase()) ||
        g.slug.includes(slugify(parsed.genreName))
      );
      if (matchedGenre) {
        genreId = matchedGenre.id;
      }

      // 3. Tạo hoặc cập nhật truyện
      const storySlug = slugify(parsed.title);
      const [existingStory] = await db.query('SELECT id FROM stories WHERE slug = ? OR title = ? LIMIT 1', [storySlug, parsed.title]);
      
      let storyId;
      if (existingStory.length > 0) {
        storyId = existingStory[0].id;
        await db.query(`
          UPDATE stories 
          SET title = ?, author_id = ?, pen_name = ?, description = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `, [parsed.title, authorId, parsed.authorName, parsed.description, parsed.status, storyId]);
        console.log(`  -> Cập nhật truyện ID: ${storyId} (Tác giả: ${parsed.authorName}, ID: ${authorId})`);
      } else {
        const [insertStory] = await db.query(`
          INSERT INTO stories (title, slug, author_id, pen_name, description, cover_image, status, views, is_featured)
          VALUES (?, ?, ?, ?, ?, ?, ?, 100, 1)
        `, [parsed.title, storySlug, authorId, parsed.authorName, parsed.description, parsed.coverImage, parsed.status]);
        storyId = insertStory.insertId;
        console.log(`  -> Tạo mới truyện ID: ${storyId} (Tác giả: ${parsed.authorName}, ID: ${authorId})`);
      }

      // Gán thể loại
      await db.query('INSERT IGNORE INTO story_genres (story_id, genre_id) VALUES (?, ?)', [storyId, genreId]);

      // 4. Nhập các chương
      for (const chap of parsed.chapters) {
        const [existingChap] = await db.query(
          'SELECT id FROM chapters WHERE story_id = ? AND chapter_number = ? LIMIT 1',
          [storyId, chap.number]
        );

        if (existingChap.length > 0) {
          await db.query(`
            UPDATE chapters 
            SET title = ?, content = ?, status = 'published', updated_at = NOW()
            WHERE id = ?
          `, [chap.title, chap.content, existingChap[0].id]);
          console.log(`    ✓ Cập nhật Chương ${chap.number}: ${chap.title}`);
        } else {
          await db.query(`
            INSERT INTO chapters (story_id, chapter_number, title, content, status)
            VALUES (?, ?, ?, ?, 'published')
          `, [storyId, chap.number, chap.title, chap.content]);
          console.log(`    ✓ Thêm mới Chương ${chap.number}: ${chap.title}`);
        }
      }

      console.log(`✅ Hoàn tất nhập truyện "${parsed.title}" (${parsed.chapters.length} chương)!`);
    } catch (err) {
      console.error(`❌ Lỗi khi xử lý file "${file}":`, err.message);
    }
  }

  console.log('\n🎉 Quá trình nhập truyện từ thư mục stories_import đã hoàn tất!');
  process.exit(0);
}

if (require.main === module) {
  importAllStories().catch(err => {
    console.error('Lỗi nghiêm trọng:', err);
    process.exit(1);
  });
}

module.exports = { importAllStories, parseDocument };
