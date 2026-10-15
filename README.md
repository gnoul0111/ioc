# IOC Thành ủy Hà Nội

Giao diện **Trung tâm điều hành thông minh (IOC)** phục vụ Thành ủy Hà Nội: theo dõi chỉ tiêu của 4 trục (Đảng, HĐND, UBND, MTTQ), các Sở, ngành và 126 xã, phường; bản đồ GIS; giao việc, phối hợp; quản trị tài khoản.

Dự án là **static site thuần HTML/CSS/JS**, không dùng framework và không cần bước build. Một phần số liệu lấy từ API thật, phần còn lại là số mô phỏng để trình diễn.

## Chạy thử trên máy

Cách nhanh nhất là mở trực tiếp file `demo_ioc.html` bằng trình duyệt.

Nên chạy qua một static server để các lệnh gọi API hoạt động đầy đủ:

```bash
npx serve .
```

Nếu mở bằng `file://` mà gặp lỗi CORS khi gọi API thì chạy thêm proxy cục bộ:

```bash
node tools/local-proxy.js
```

### Tài khoản demo

| Tài khoản | Mật khẩu | Phạm vi |
| --- | --- | --- |
| `danguy` | `123456` | Thường trực Thành ủy, xem cả 4 trục |
| `hdnd` | `123456` | HĐND Thành phố |
| `ubnd` | `123456` | UBND Thành phố |
| `mttq` | `123456` | UB MTTQ Thành phố |
| `tw` | `123456` | Cấp Trung ương, tổng hợp 5 khối |

Danh sách đầy đủ, gồm tài khoản các Sở và cấp Trung ương, nằm trong `js/core/data-static.js` và `js/core/central-level.js`.

## Các trang chính

| Trang | Mô tả |
| --- | --- |
| `demo_ioc.html` | Giao diện IOC chính (trang gốc khi deploy) |
| `oua-admin.html` | Quản trị tổ chức, người dùng, phân quyền, nhật ký đăng nhập |
| `mobile-admin/` | Bản quản trị trên điện thoại (PWA) |
| `btctw/` | Dashboard Ban Tổ chức Trung ương |
| `standalone/` | Các trang chỉ tiêu tách riêng, mở độc lập không cần đăng nhập |

## Cấu trúc thư mục

```
demo_ioc.html, oua-admin.html   Trang chính
js/
  core/          Hạ tầng: đăng nhập, phân quyền, GIS, cấu hình từng Sở, nhật ký
  features/      Dashboard, chỉ tiêu theo trục, Sở, xã
  data/          Bản chụp dữ liệu tĩnh
css/             Giao diện: theme sáng, tối, xanh và CSS từng module
lib/             Leaflet và plugin cụm marker
assets/          Logo, ảnh
data/            Dữ liệu cơ cấu tổ chức và tài khoản
api/             Mẫu dữ liệu API các đơn vị (STC, SGD&ĐT, HCC)
docs/            Hướng dẫn deploy (tài liệu nghiệp vụ nội bộ không đưa lên repo)
tests/           Kiểm thử bằng Node cho từng Sở
tools/           Script sinh tài liệu Word, dựng trang độc lập, làm video giới thiệu
```

## Kiểm thử

Chạy bằng Node, mỗi Sở một thư mục, ví dụ:

```bash
node tests/stc/stc-data.test.js
```

## Deploy lên Vercel

```bash
vercel --prod
```

`vercel.json` chuyển `/` về `demo_ioc.html` và chuyển tiếp `/api/ioc/*` sang máy chủ API. Các thư mục nội bộ (`docs/`, `tools/`, `tests/`, `standalone/`) không được deploy, xem `.vercelignore`. Hướng dẫn chi tiết ở [docs/CHUNG/README_DEPLOY_IOC.md](./docs/CHUNG/README_DEPLOY_IOC.md).

## Làm việc nhóm

| Nhánh | Vai trò |
| --- | --- |
| `dev` | Nơi cả nhóm làm việc hằng ngày, đẩy code trực tiếp lên đây |
| `main` | Bản chính thức để deploy. Không đẩy thẳng, chỉ gộp từ `dev` qua Pull Request trên GitHub |

Lần đầu tham gia:

```bash
git clone https://github.com/gnoul0111/ioc.git
cd ioc
git switch dev
```

Hằng ngày (Windows):

1. **Trước khi bắt đầu sửa:** nháy đúp `keo-code.bat` để lấy code mới nhất của mọi người.
2. **Sửa xong:** nháy đúp `day-code.bat`, gõ mô tả thay đổi rồi Enter. File này không cho đẩy lên `main`.
3. **Đưa lên bản chính thức:** vào GitHub, tạo Pull Request từ `dev` vào `main`, xem lại rồi Merge.

Nếu hai người sửa cùng một chỗ trong cùng một file, Git sẽ báo xung đột và dừng lại. Khi đó cần mở file, chọn giữ phần nào, rồi commit lại.

Repo không chứa: video và âm thanh đã dựng trong `tools/video/`, `node_modules/`, bản sao lưu `_backups/`, tài liệu nghiệp vụ nội bộ trong `docs/` và tài liệu đối tác `api/HCC_NEW/`. Muốn dựng video thì vào `tools/video` chạy `npm install`.
