# HƯỚNG DẪN ĐƯA TRUYỆN VÀ CÁC TẬP VÀO DIỄN ĐÀN VNNETTRUYEN

Thư mục này dùng để bạn **thả file Word (.docx) hoặc file Text (.txt)** chứa tác phẩm và các chương vào, hệ thống sẽ tự động đọc và xuất bản lên website!

---

### CÁCH ĐẶT NỘI DUNG TRONG FILE WORD / TEXT:

Mỗi file Word (.docx) hoặc Text (.txt) bạn viết theo cấu trúc cực kỳ đơn giản sau:

```text
Tiêu đề: Thăng Long Kiếm Hiệp Ký
Tác giả: Meovangnho   (tên tài khoản sở hữu truyện)
Thể loại: Kiếm Hiệp
Mô tả: Câu chuyện kiếm khách chốn kinh kỳ Thăng Long thời loạn thế, hành hiệp trượng nghĩa bảo vệ giang sơn.

## Chương 1: Sương Mù Bến Đông Bộ Đầu
Nội dung của chương 1 viết ở đây...
Bạn có thể viết nhiều đoạn văn tùy thích.

## Chương 2: Tiếng Kiếm Rung Trong Đêm
Nội dung của chương 2 viết ở đây...
...
```

---

### CÁC THỂ LOẠI ĐƯỢC HỖ TRỢ:
1. **Truyện Ngắn**
2. **Tình Cảm**
3. **Dị Giới**
4. **Xuyên Không**
5. **Đô Thị**
6. **Kiếm Hiệp**

---

### CÁCH ĐẨY LÊN WEBSITE:
Sau khi bạn thả file Word `.docx` hoặc `.txt` vào thư mục `stories_import/` này, bạn chỉ cần báo cho trợ lý AI:
> *"Tôi vừa bỏ file truyện vào rồi, bạn đẩy lên web giúp tôi nhé."*

Hoặc bạn có thể tự chạy lệnh:
```bash
docker exec vnnettruyen-webapp npm run import-stories
```
Hệ thống sẽ tự động đọc file Word, tách từng chương và lưu vào cơ sở dữ liệu MySQL thật của website ngay lập tức!
