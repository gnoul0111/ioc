# Deploy giao diện IOC Thành ủy lên Vercel

Project này là static site thuần (không dùng Next.js/React). `vercel.json` rewrite domain gốc `/` sang `demo_ioc.html`.

## Cách dùng

1. Đảm bảo đã `vercel link` thư mục này với project Vercel đang chạy (`ioc-thanhuy.vercel.app`).
2. Chạy `vercel --prod` để deploy trực tiếp, hoặc đẩy source lên GitHub repo đang kết nối với Vercel để deploy tự động.
3. Mở link Vercel, ví dụ `https://ioc-thanhuy.vercel.app`, giao diện IOC sẽ hiển thị ngay ở trang chủ.

## File đã chỉnh

- `demo_ioc.html`: file HTML giao diện IOC.
- `vercel.json`: rewrite `/` → `demo_ioc.html`, ép `framework: null` để Vercel không cố nhận diện làm project Next.js/React.

## Link trực tiếp HTML

Ngoài link trang chủ, cậu cũng có thể mở trực tiếp:

`/demo_ioc.html`
