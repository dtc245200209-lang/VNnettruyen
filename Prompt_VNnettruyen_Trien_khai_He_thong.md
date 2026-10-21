# PROMPT TRIỂN KHAI DỰ ÁN VNnettruyen -- DIỄN ĐÀN ĐỌC VÀ VIẾT TRUYỆN VIỆT NAM

Bạn hãy đóng vai **Senior Full-stack Developer kiêm DevOps Engineer**,
hướng dẫn và triển khai hoàn chỉnh đồ án môn **Triển khai và Quản trị hệ
thống phần mềm** theo **Đề 15: Diễn đàn/Cộng đồng (Forum)**.

## 1. Tên và định hướng dự án

-   **Tên dự án:** VNnettruyen -- Cộng đồng đọc và sáng tác truyện Việt
    Nam.
-   **Mô hình:** Website cộng đồng dành cho người đọc truyện và tác giả
    Việt Nam.
-   **Tham khảo trải nghiệm:** Có thể tham khảo cách tổ chức danh mục,
    danh sách truyện, trang đọc truyện và tương tác cộng đồng thường
    thấy ở các website đọc truyện như NetTruyen, nhưng phải **thiết kế
    giao diện, nội dung, tên gọi và mã nguồn riêng**. Không sao chép
    nguyên giao diện, logo, dữ liệu truyện, hình ảnh, nội dung có bản
    quyền hoặc mã nguồn của website khác.
-   **Mục tiêu đồ án:** Xây dựng website có chức năng thực tế và triển
    khai được; đồng thời đáp ứng đầy đủ yêu cầu quản lý mã nguồn,
    container hóa, reverse proxy, giám sát, tập trung log và hardening.

## 2. Công nghệ bắt buộc

Ưu tiên stack đơn giản, dễ cài đặt, dễ trình bày và phù hợp sinh viên:

-   Backend: **Node.js + Express**.
-   Frontend: HTML, CSS, JavaScript; dùng EJS hoặc template engine đơn
    giản nếu cần.
-   Database: **MySQL**.
-   Quản trị database: **phpMyAdmin**.
-   Reverse proxy: **Nginx**.
-   Container: **Docker và Docker Compose**.
-   Giám sát: **Prometheus + Grafana**.
-   Thu thập và truy vấn log: **Loki + Promtail**, sử dụng LogQL.
-   Quản lý mã nguồn: **Git + GitHub**.
-   Triển khai trên máy Linux/Ubuntu hoặc môi trường máy ảo được cung
    cấp.

Không tự ý thay các công nghệ bắt buộc bằng công nghệ khác. Nếu một
thành phần có vấn đề tương thích phiên bản, hãy giải thích và chọn phiên
bản ổn định, tương thích với toàn bộ hệ thống.

## 3. Chức năng website VNnettruyen

### 3.1. Người dùng và tài khoản

-   Đăng ký tài khoản bằng tên hiển thị, email và mật khẩu.
-   Đăng nhập, đăng xuất.
-   Mã hóa mật khẩu bằng bcrypt hoặc giải pháp băm mật khẩu an toàn
    tương đương.
-   Chỉnh sửa thông tin hồ sơ cá nhân.
-   Phân quyền tối thiểu gồm: khách, thành viên/độc giả, tác giả và quản
    trị viên.
-   Kiểm tra dữ liệu đầu vào và thông báo lỗi dễ hiểu.
-   Không lưu mật khẩu dạng văn bản thuần.

### 3.2. Khám phá và đọc truyện

-   Trang chủ hiển thị truyện mới cập nhật, truyện nổi bật và truyện mới
    đăng.
-   Danh sách truyện có phân trang.
-   Tìm kiếm truyện theo tên truyện hoặc tên tác giả.
-   Lọc truyện theo thể loại, trạng thái (đang ra/đã hoàn thành) và thứ
    tự cập nhật.
-   Trang chi tiết truyện: tên truyện, mô tả, tác giả, thể loại, trạng
    thái, danh sách chương và thông tin cập nhật.
-   Trang đọc chương truyện, có nút chương trước/chương sau và quay lại
    trang chi tiết.
-   Thành viên có thể đánh dấu truyện yêu thích hoặc thêm vào tủ sách cá
    nhân.
-   Có thể lưu lịch sử đọc ở mức cơ bản nếu phù hợp với thời gian triển
    khai.

### 3.3. Tác giả và đăng truyện

-   Thành viên có thể tạo truyện của mình và trở thành tác giả theo quy
    tắc đơn giản của hệ thống.
-   Tạo, sửa và quản lý thông tin truyện do mình đăng.
-   Thêm, sửa, xóa chương thuộc truyện của mình.
-   Có trạng thái bản nháp/đã xuất bản nếu khả thi.
-   Tác giả chỉ được sửa hoặc xóa nội dung thuộc quyền sở hữu của mình;
    quản trị viên có quyền quản lý nội dung toàn hệ thống.
-   Kiểm tra dữ liệu và quyền trước khi thực hiện thao tác.

### 3.4. Bình luận và cộng đồng

-   Thành viên đã đăng nhập có thể bình luận ở trang truyện hoặc chương
    truyện.
-   Hiển thị tên người bình luận, thời gian và nội dung.
-   Người dùng có thể sửa/xóa bình luận của mình theo quy tắc được quy
    định.
-   Quản trị viên có thể ẩn hoặc xóa bình luận vi phạm.
-   Có thể thêm chức năng báo cáo nội dung nếu không làm dự án quá phức
    tạp.
-   Chống nội dung rỗng, giới hạn độ dài bình luận và xử lý đầu vào để
    giảm nguy cơ XSS.

### 3.5. Quản trị viên

-   Trang quản trị riêng, chỉ tài khoản có quyền admin được truy cập.
-   Quản lý tài khoản người dùng và vai trò.
-   Quản lý truyện, chương, thể loại và bình luận.
-   Xem số lượng người dùng, truyện, chương và bình luận ở mức thống kê
    cơ bản.
-   Có thông báo xác nhận trước thao tác xóa quan trọng.

### 3.6. Giao diện

-   Thiết kế responsive cho máy tính và điện thoại.
-   Phong cách website truyện hiện đại, dễ đọc, có thanh điều hướng, ô
    tìm kiếm, danh mục thể loại, thẻ truyện và phân trang.
-   Tông màu và bố cục nhất quán; ưu tiên trải nghiệm đọc truyện.
-   Có trạng thái rỗng khi chưa có dữ liệu, trang 404 và thông báo lỗi
    dễ hiểu.
-   Tạo dữ liệu mẫu tự viết để kiểm thử; không sử dụng trái phép nội
    dung truyện có bản quyền.
-   Không chỉ tạo giao diện tĩnh: các nút, biểu mẫu, tìm kiếm, đăng
    nhập, CRUD và phân quyền phải hoạt động thực tế.

## 4. Thiết kế cơ sở dữ liệu MySQL

Thiết kế database có khóa chính, khóa ngoại, kiểu dữ liệu phù hợp và
ràng buộc cần thiết. Tối thiểu cân nhắc các bảng:

1.  `users`: tài khoản, email, mật khẩu đã băm, vai trò, thời gian tạo.
2.  `genres`: thể loại truyện.
3.  `stories`: thông tin truyện, tác giả, mô tả, trạng thái, thời gian
    tạo/cập nhật.
4.  `story_genres`: bảng liên kết truyện và thể loại nếu một truyện có
    nhiều thể loại.
5.  `chapters`: chương truyện, số chương, tiêu đề, nội dung, trạng thái
    xuất bản.
6.  `comments`: bình luận của người dùng, truyện/chương liên quan, thời
    gian tạo.
7.  `favorites` hoặc `bookshelf`: danh sách truyện yêu thích của người
    dùng.
8.  `reading_history`: lịch sử đọc nếu triển khai.
9.  `reports`: báo cáo nội dung nếu triển khai.

Hãy giải thích quan hệ giữa các bảng và tạo file SQL khởi tạo database,
bảng, khóa ngoại, chỉ mục cần thiết cùng dữ liệu mẫu. Bảo đảm email duy
nhất, số chương phù hợp trong từng truyện và không để người dùng thao
tác lên dữ liệu không thuộc quyền của mình. Cung cấp hướng dẫn import
SQL bằng phpMyAdmin.

## 5. Yêu cầu kiến trúc và Docker

Triển khai các thành phần bằng Docker Compose. Kiến trúc tối thiểu:

-   Nginx: cổng truy cập từ máy host, làm reverse proxy tới ứng dụng.
-   Web application: Node.js/Express.
-   MySQL: database nội bộ.
-   phpMyAdmin: công cụ quản trị database; không công khai trực tiếp ra
    Internet trong môi trường triển khai thật.
-   Prometheus: thu thập metrics.
-   Grafana: dashboard giám sát.
-   Loki: lưu trữ log tập trung.
-   Promtail: thu thập log container và gửi tới Loki.
-   Có thể bổ sung Node Exporter hoặc cAdvisor nếu cần thu thập metrics
    hệ điều hành/container.

Yêu cầu: - Dùng Docker Compose để khởi động và quản lý toàn bộ dịch
vụ. - Có healthcheck phù hợp và cấu hình phụ thuộc dịch vụ hợp lý. -
Dùng Docker network để tách mạng public/reverse proxy với mạng dữ liệu
nội bộ khi phù hợp. - Chỉ công khai các cổng cần thiết; database không
được mở trực tiếp ra Internet. - Dùng volume để lưu dữ liệu MySQL và dữ
liệu cần giữ lại. - Cấu hình thông tin nhạy cảm qua file `.env`; tạo
`.env.example` không chứa mật khẩu thật. - Thêm `.env`, dữ liệu riêng
tư, chứng chỉ riêng và bí mật vào `.gitignore`. - Không đưa mật khẩu
hoặc khóa bí mật lên GitHub.

## 6. Nginx Reverse Proxy và bảo mật HTTPS

Cấu hình Nginx để: - Nhận request từ trình duyệt và chuyển tiếp tới ứng
dụng Node.js. - Thiết lập `server_name`, giới hạn kích thước request hợp
lý và timeout phù hợp. - Thiết lập các HTTP security headers như
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` và
`Referrer-Policy`. - Thiết lập Content Security Policy phù hợp với ứng
dụng nếu có thể, tránh cấu hình gây hỏng giao diện. - Cấu hình HTTPS
theo môi trường thực tế: chứng chỉ tự ký cho môi trường thực hành hoặc
chứng chỉ hợp lệ khi có tên miền. - Giải thích cách kiểm tra Nginx
config và cách xem access/error log. - Không tuyên bố HTTPS hoặc bảo mật
đã hoạt động nếu chưa có lệnh kiểm tra xác nhận.

## 7. GitHub và quản lý mã nguồn

Hướng dẫn tạo repository GitHub và quản lý mã nguồn theo tiến độ: - Tổ
chức thư mục dễ hiểu. - Commit theo từng giai đoạn có nội dung rõ
ràng. - Có `README.md` mô tả dự án, kiến trúc, yêu cầu cài đặt, biến môi
trường, cách chạy, cách kiểm thử và cách dừng hệ thống. - Có
`.gitignore` phù hợp. - Hướng dẫn các lệnh `git init`, `git add`,
`git commit`, `git branch`, `git remote add origin` và `git push`. -
Không giả vờ đã tạo repository hoặc push code lên GitHub; chỉ đưa lệnh
và hướng dẫn để người dùng tự thực hiện.

## 8. Prometheus và Grafana

Thiết lập giám sát có thể kiểm chứng: - Ứng dụng Node.js cung cấp
endpoint metrics, ví dụ `/metrics`, nếu sử dụng thư viện phù hợp. -
Prometheus được cấu hình scrape metrics từ ứng dụng và các exporter đã
triển khai. - Grafana được cấu hình datasource Prometheus. - Tạo
dashboard theo dõi trạng thái dịch vụ, request, lỗi HTTP, thời gian phản
hồi và CPU/RAM/container nếu exporter tương ứng có mặt. - Ghi rõ metrics
nào do ứng dụng cung cấp, metrics nào do exporter cung cấp. - Hướng dẫn
mở giao diện, đăng nhập, kiểm tra target ở trạng thái UP và tạo/nhập
dashboard. - Không bịa số liệu hoặc ảnh chụp màn hình kiểm thử.

## 9. Loki, Promtail và LogQL

Thiết lập thu thập log: - Thu thập log của Nginx, ứng dụng và các dịch
vụ cần thiết bằng cấu hình phù hợp với Docker. - Chuyển log tới Loki và
cấu hình Loki làm datasource trong Grafana. - Cung cấp truy vấn LogQL
thực tế để lọc log Nginx, tìm lỗi ứng dụng và kiểm tra HTTP 5xx. Ví dụ
cần điều chỉnh theo đúng label và định dạng log thực tế: -
`{job="nginx"} |= "500"` -
`{job="webapp"} |~ "(ERROR|Exception|Failed)"` - Giải thích cách mở
Explore trong Grafana, chọn Loki và chạy truy vấn. - Kiểm tra label thực
tế trước khi đưa truy vấn vào báo cáo; không khẳng định truy vấn thành
công nếu chưa chạy thử. - Nếu dùng phiên bản mới mà Promtail không còn
được khuyến nghị hoặc không tương thích, nêu rõ vấn đề và ưu tiên bám
theo yêu cầu của đề bài; chỉ đề xuất thay thế khi giải thích rõ và được
chấp nhận.

## 10. Hardening -- gia cố bảo mật

Triển khai và giải thích tối thiểu: - Chạy tiến trình ứng dụng trong
container bằng user không phải root khi khả thi. - Không mở cổng MySQL
ra ngoài. - Tách Docker networks theo chức năng. - Dùng mật khẩu mạnh và
biến môi trường; không lưu bí mật trong mã nguồn. - Cấu hình quyền file
và thư mục ở mức cần thiết. - Cập nhật image/phụ thuộc và dùng phiên bản
ổn định. - Giới hạn quyền tài khoản database theo nhu cầu ứng dụng. -
Kiểm tra dữ liệu đầu vào, phân quyền phía server, băm mật khẩu, quản lý
session/cookie an toàn và xử lý lỗi không làm lộ thông tin nhạy cảm. -
Bật security headers trên Nginx. - Cấu hình UFW hoặc firewall tương ứng:
chỉ cho phép cổng thực sự cần thiết. - Hạn chế truy cập Grafana,
Prometheus, phpMyAdmin và Loki từ bên ngoài; chỉ mở trong môi trường lab
hoặc bảo vệ bằng xác thực/giới hạn mạng. - Không dùng thông tin đăng
nhập mặc định khi triển khai. - Cung cấp checklist kiểm tra bảo mật và
nêu rõ giới hạn của môi trường thực hành.

## 11. Cấu trúc thư mục mong muốn

Hãy tạo cấu trúc dự án rõ ràng, có thể điều chỉnh hợp lý, ví dụ:

``` text
VNnettruyen/
├── app/
│   ├── src/
│   ├── views/
│   ├── public/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql
├── nginx/
│   └── nginx.conf
├── prometheus/
│   └── prometheus.yml
├── grafana/
│   └── provisioning/
├── loki/
│   └── loki-config.yaml
├── promtail/
│   └── promtail-config.yaml
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Cấu trúc cuối cùng phải khớp với các đường dẫn thực tế được tham chiếu
trong Docker Compose và cấu hình. Không tạo file rỗng chỉ để đủ danh
sách.

## 12. Cách thức thực hiện và cách trả lời

Thực hiện theo từng giai đoạn, không được chỉ mô tả ý tưởng:

**Giai đoạn 1 -- Phân tích:** Tóm tắt yêu cầu, chức năng, vai trò người
dùng, kiến trúc và luồng hoạt động.

**Giai đoạn 2 -- Thiết kế:** Trình bày cấu trúc thư mục, sơ đồ kiến trúc
bằng Mermaid, thiết kế database và quan hệ bảng.

**Giai đoạn 3 -- Xây dựng ứng dụng:** Cung cấp mã nguồn đầy đủ theo từng
file, gồm backend, giao diện, xác thực, phân quyền, CRUD truyện/chương,
tìm kiếm, bình luận và trang quản trị. Mỗi file phải có đường dẫn chính
xác và nội dung hoàn chỉnh; không dùng câu như "phần còn lại tự làm",
"tương tự như trên" hoặc bỏ qua các phần quan trọng.

**Giai đoạn 4 -- Container hóa:** Viết đầy đủ Dockerfile,
`docker-compose.yml`, cấu hình biến môi trường mẫu, MySQL và phpMyAdmin.
Các service, network, volume, cổng và đường dẫn phải khớp nhau.

**Giai đoạn 5 -- Reverse proxy:** Viết cấu hình Nginx, hướng dẫn
HTTP/HTTPS và cách kiểm tra.

**Giai đoạn 6 -- Monitoring:** Viết cấu hình Prometheus, Grafana
provisioning nếu dùng, endpoint metrics và exporter cần thiết.

**Giai đoạn 7 -- Logging:** Viết cấu hình Loki và Promtail phù hợp với
phiên bản đã chọn, các truy vấn LogQL và cách kiểm tra log.

**Giai đoạn 8 -- Hardening:** Cung cấp cấu hình và checklist bảo mật có
thể thực hiện, kèm lệnh kiểm tra.

**Giai đoạn 9 -- Kiểm thử và nghiệm thu:** Cung cấp danh sách test case
cho đăng ký/đăng nhập, phân quyền, tạo/sửa/xóa truyện và chương, bình
luận, database, reverse proxy, metrics, log và bảo mật. Với mỗi test
case, ghi thao tác, kết quả mong đợi và cách xác nhận.

**Giai đoạn 10 -- Báo cáo:** Soạn nội dung báo cáo theo bố cục: 1. Tổng
quan kiến trúc hệ thống và chuẩn bị môi trường. 2. Triển khai ứng dụng
web, cơ sở dữ liệu và reverse proxy. 3. Giám sát hệ thống với
Prometheus, Grafana và Loki. 4. Các biện pháp hardening và đánh giá bảo
mật. 5. Kết luận và hướng phát triển.

Báo cáo cần có chỗ để chèn sơ đồ kiến trúc, ảnh giao diện, ảnh kiểm tra
container, cấu hình Nginx, Prometheus Targets, dashboard Grafana, truy
vấn LogQL và kết quả kiểm thử. Không bịa ảnh chụp hoặc kết quả chạy thực
tế; đánh dấu rõ chỗ cần người triển khai tự chụp.

## 13. Quy tắc bắt buộc khi tạo mã nguồn

-   Ưu tiên giải pháp cơ bản, dễ hiểu, chạy được và dễ thuyết trình.
-   Không chỉ viết code minh họa; phải hướng tới một dự án tích hợp hoàn
    chỉnh.
-   Mỗi bước cần nêu: thực hiện ở thư mục nào, tạo/sửa file nào, nội
    dung file, lệnh chạy và cách kiểm tra.
-   Không tự giả định rằng Docker, Git, Node.js hoặc Ubuntu đã được cài
    đặt; cung cấp bước kiểm tra trước.
-   Không tự tạo thông tin xác thực thật. Dùng giá trị mẫu trong
    `.env.example`, hướng dẫn người dùng tạo `.env` riêng.
-   Khi có lỗi, yêu cầu hoặc sử dụng thông báo lỗi thực tế để xử lý;
    không đoán rằng hệ thống đã chạy thành công.
-   Đảm bảo tên service, cổng, biến môi trường, network, volume, đường
    dẫn cấu hình và tên database nhất quán xuyên suốt.
-   Sau mỗi giai đoạn, cung cấp checklist nghiệm thu trước khi chuyển
    sang giai đoạn tiếp theo.
-   Nếu nội dung quá dài, chia thành nhiều phần liên tiếp và nói rõ phần
    nào đã hoàn thành, phần nào chưa; không cắt bỏ file quan trọng để
    trả lời ngắn.
-   Phân biệt rõ nội dung đã được viết, nội dung đã được kiểm thử và nội
    dung người dùng cần tự thực hiện.
-   Không tuyên bố đã triển khai, kiểm thử, push GitHub hoặc tạo
    dashboard nếu chưa có bằng chứng thực tế.

## 14. Yêu cầu bắt đầu

Trước tiên, hãy trả lời bằng: 1. Tóm tắt yêu cầu dự án VNnettruyen. 2.
Sơ đồ kiến trúc tổng thể bằng Mermaid. 3. Danh sách chức năng theo vai
trò. 4. Thiết kế database và quan hệ các bảng. 5. Cấu trúc thư mục dự
kiến. 6. Lộ trình triển khai theo đúng thứ tự phụ thuộc.

Sau đó bắt đầu triển khai lần lượt từ **Giai đoạn 1**, cung cấp đầy đủ
file và lệnh cần thiết. Không chuyển thẳng sang giao diện đẹp mà bỏ qua
backend, database, Docker, monitoring, logging và hardening.
