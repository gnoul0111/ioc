<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Chỉ tiêu theo eform — quy ước bắt buộc (bản 2.0, 28/10/2026)

Áp dụng cho mọi đơn vị có eform trong "File mô tả đầu vào eform" (Google Sheets `1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k`): 126 xã, phường; 4 trục cấp Thành phố (Đảng ủy, HĐND, MTTQ, UBND); 12 sở, ngành. Bản đầy đủ: `docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28.md` (thư mục `docs/` không lên GitHub).

1. **Eform là nguồn duy nhất.** Chỉ dùng trường có trong eform để dựng chỉ tiêu, cách tính, biểu đồ. Không thêm chỉ tiêu, trường dữ liệu ngoài eform; không lấy số từ văn bản, số công bố, bộ chỉ tiêu cũ, mục tiêu Thành phố giao, dân số, diện tích.
2. **Hiện đủ mọi trường.** Mỗi eform có màn "Dữ liệu đã nhập": mọi bản ghi, đủ mọi trường, đúng thứ tự, tên cột đúng như eform; ô danh mục hiện tên hiển thị.
3. **Số đã nhập là số hiển thị.** Không thay trường tỷ lệ, trường tổng của đơn vị bằng số IOC tự tính. IOC được tính thêm từ trường eform nhưng phải ghi rõ "IOC tính" và công thức theo tên trường; lệch thì đánh dấu bản ghi.
4. **Mọi số lần lại được bản ghi** (bấm số → các bản ghi tạo ra số đó).
5. **Chia cấp:** Trục/Sở → Đơn vị (Ban) → Eform → Nhóm (danh mục của eform) → Dòng số liệu → Bản ghi.
6. **Không có eform:** đơn vị lấy theo API, nguồn khác thì để nguyên; đơn vị trong 4 trục không có eform và chỉ tiêu nguồn khác trong đơn vị có eform thì **ẩn bằng cờ, không xóa**.
7. **Đọc kỹ eform trước khi làm** (lập bản đọc eform, được duyệt rồi mới code). **Chưa rõ thì hỏi ngay**, không tự đoán ý nghĩa trường.
8. **Khung eform sinh từ file, không sửa tay** (`tools/xa_eform_schema.py`, chạy `--check` trước khi phát hành).
9. **Kiểu trường y hệt eform** (trường Chữ có kèm danh sách vẫn là Chữ); **kỳ xem chọn được Tháng / Quý / Năm**; **quyền xem theo cấp** (cấp trên xem được cấp dưới).
10. Dữ liệu mẫu được tự sinh thoải mái, đúng kiểu trường, mã trong danh mục; **không sinh thêm trường**; màn hình ghi "bản ghi mẫu".

Mẫu đã làm theo quy ước: chỉ tiêu xã, phường (`js/features/ctm-xa-units.js`, kiểm thử `tests/ctm/xa-eform.test.js`).
