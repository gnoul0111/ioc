# -*- coding: utf-8 -*-
"""Quy ước xử lý dữ liệu eform cho biểu đồ chỉ tiêu các sở (chốt 13/10/2026, theo phản hồi nhóm triển khai
`bao_cao_bieu_do_cua_cac_so`). Một nguồn dùng chung cho:
  - mục "Quy ước xử lý dữ liệu eform" trong PHẦN "Cách hiển thị trên giao diện IOC" của 12 tài liệu *_MO_TA_CHI_TIEU
    (tools/ctm_display.py gọi QU[spec_id]);
  - tài liệu chung docs/CHUNG/QUY_UOC_XU_LY_EFORM_2026_10_13 (Phần II chép cùng nội dung).
Sửa ở đây thì chạy lại các *_doc_docx.py. Nguyên tắc: KHÔNG thêm trường vào eform."""

NGAY = '13/10/2026'
TAI_LIEU_CHUNG = 'docs/CHUNG/QUY_UOC_XU_LY_EFORM_2026_10_13'

QUY_UOC = [
    '**Không hiện số không có trường trong eform.** Thẻ, biểu đồ cần số mà eform không có trường (kế hoạch, số hộ, tuyến…) thì ẩn; không lấy số từ văn bản, bộ chỉ tiêu cũ hay tự đặt. Mục tiêu Thành phố giao đã công bố được giữ làm mốc, có ghi nguồn văn bản.',
    '**Khóa bản ghi.** Mỗi eform có một khóa (bảng dưới). Bản ghi trùng khóa thì lấy bản gửi sau cùng (thời điểm tạo, sửa bản ghi do hệ thống eform ghi). Bản ghi thiếu trường khóa thì không tính, đếm vào "bản ghi lỗi".',
    '**Số tại thời điểm lấy bản gần nhất.** Kỳ đang xem chưa có báo cáo thì lấy bản gần nhất trước đó, ghi "số tháng …"; cũ hơn 1 kỳ thì ghi "chưa cập nhật", không vẽ.',
    '**Biểu đồ theo tháng.** Bản ghi là sự việc (hoạt động, vụ việc, đợt hỗ trợ, tin bài): có trường ngày phát sinh thì xếp tháng theo ngày đó; không có thì dùng «Tháng» của kỳ báo cáo và ghi "theo tháng báo cáo". Bản ghi là số tổng hợp tháng của một đơn vị thì tháng báo cáo là tháng số liệu.',
    '**Trường tổng do đơn vị tự tính.** Đủ thành phần thì IOC tự cộng; thiếu thành phần thì dùng trường tổng; tổng lệch với cộng thành phần thì dùng cộng thành phần và đánh dấu bản ghi. Không đổi ô trống thành 0. Trường tỷ lệ tự tính không dùng; IOC cộng tử số, mẫu số rồi chia.',
    '**Bản tháng và bản quý** của cùng kỳ không cộng chồng: số phát sinh có bản tháng thì cộng tháng, chỉ có bản quý thì dùng bản quý; số tại thời điểm lấy bản tháng cuối quý, không có thì lấy bản quý. Bản "Không phát sinh" không cộng vào số.',
]

P, T, L = 'Phát sinh trong kỳ (cộng các tháng)', 'Tại thời điểm (bản kỳ đang xem, thiếu thì bản gần nhất)', 'Lũy kế đơn vị đã cộng (bản kỳ đang xem)'

# spec_id → [[eform, khóa bản ghi, loại số, ghi chú]]
QU = {
    'ubnd-vhtt': [
        ['Báo cáo tiến độ Chương trình hành động 08-CT', '«Chỉ tiêu / Nhiệm vụ» + «Đơn vị chủ trì»', T, 'Kế hoạch theo «Thời gian hoàn thành theo Kế hoạch»; thực tế theo bản báo cáo từng tháng. Không tách hoàn thành đúng hạn / chậm (không có ngày hoàn thành thực tế)'],
        ['Cơ cấu dự án NQ 80 giai đoạn 2026–2030', '«Tên công trình» + «Địa bàn»', T, ''],
        ['Quy mô, số người tham gia hoạt động nghệ thuật', '«Mã bản ghi»', P, 'Tháng theo «Ngày bắt đầu»'],
        ['Doanh thu đơn vị nghệ thuật', '«Mã bản ghi»', P, 'Tháng theo «Ngày bắt đầu»; không có kế hoạch doanh thu'],
        ['Số hoạt động nghệ thuật chuyên nghiệp', '«Mã hoạt động»', P + '; chỉ «Trạng thái hoạt động» = Đã diễn ra', 'Tháng theo «Ngày bắt đầu»'],
        ['Điểm thông tin báo chí, mạng xã hội', '«Link bài viết» (không có thì «Mã bản ghi»)', P + '; tương tác lấy theo «Thời gian cập nhật» mới nhất', 'Tháng theo «Ngày đăng»'],
    ],
    'ubnd-vpubnd': [
        ['Chỉ số 27 (văn bản xử lý trên môi trường mạng)', '«Đơn vị báo cáo» + kỳ', P + ' (theo quý)', 'Tỷ lệ Thành phố = cộng tử số, mẫu số cả 2 cấp rồi chia'],
        ['Trợ lý ảo (chỉ số 29)', '«Đơn vị báo cáo» + «Tên ứng dụng trợ lý ảo»', T + ' trong năm', ''],
        ['Nhiệm vụ Chính phủ, Thủ tướng giao (chỉ số 74)', '«Mã nhiệm vụ»', 'Theo «Ngày giao»; trạng thái bản mới nhất', ''],
        ['Hồ sơ thủ tục hành chính (chỉ số 52)', '«Đơn vị báo cáo» + kỳ', P, 'Bắt buộc «Đơn vị báo cáo»; bản tháng và bản quý không cộng chồng'],
        ['Hạ tầng CNTT (chỉ số 11, 12)', '«Đơn vị báo cáo» + «Loại hạ tầng CNTT» + «Tình trạng hoạt động»', T + ' (bản quý mới nhất)', 'Mức độ đáp ứng: một lượt cho mỗi đơn vị × loại hạ tầng'],
    ],
    'ubnd-bqlkcnc': [
        ['Khu công nghiệp, KCX, KKT, Khu CNC', '«Địa bàn» + kỳ', 'Doanh nghiệp, vốn đăng ký, lao động, hạ tầng, môi trường: ' + T + '. Dự án mới, vốn thu hút, thành lập/điều chỉnh, vốn hạ tầng, doanh thu: ' + P,
         'Một địa bàn một bản ghi mỗi kỳ; trùng thì lấy bản gửi sau cùng; thiếu «Địa bàn» không tính'],
    ],
    'ubnd-dulich': [
        ['Khách du lịch nội địa và quốc tế', '«Đơn vị báo cáo» + «Loại điểm du lịch» + kỳ', P, ''],
        ['Doanh thu dịch vụ du lịch', '«Đơn vị báo cáo» + «Loại điểm du lịch» + «Loại doanh thu» + kỳ', P, 'Cơ cấu tổng thu chỉ vẽ khi kỳ có đủ 3 loại doanh thu'],
    ],
    'ubnd-dantoc-tongiao': [
        ['CTMTQG vùng đồng bào DTTS — phần dự án', '«Mã dự án/tiểu dự án/hoạt động» + «Địa bàn» + «Nguồn vốn»', 'Kế hoạch, phân bổ, giải ngân lũy kế, trạng thái: ' + L + '. Giải ngân kỳ này: ' + P, 'Bắt buộc «Địa bàn»'],
        ['Cùng eform — 8 chỉ số cấp xã', '«Địa bàn» + tháng', T, 'Mỗi xã lấy một giá trị từ bản ghi gửi sau cùng có đủ số; không cộng các bản ghi dự án của cùng xã; các bản ghi cùng xã ghi số khác nhau thì đánh dấu'],
    ],
    'ubnd-thanhtra': [
        ['Kiểm tra Chủ tịch UBND xã và người đứng đầu', '«Mã cuộc kiểm tra»', 'Cuộc có hiệu lực trong kỳ; trạng thái bản mới nhất', 'Tháng theo «Ngày quyết định»; không có kế hoạch số cuộc'],
        ['Thanh tra', '«Mã cuộc thanh tra» (theo dõi sau thanh tra: «Số KL thanh tra»)', 'Như trên', ''],
        ['Tiếp công dân, khiếu nại, tố cáo', '«Địa bàn» + tháng, bản tổng hợp', P + '; đơn kỳ trước lấy tháng đầu kỳ, tồn lấy tháng cuối', 'Bản kỳ "Đột xuất" không cộng'],
    ],
    'ubnd-khcn': [
        ['Hạ tầng và thiết bị số', '«Địa bàn» + tháng', T, 'Chỉ bản ghi của UBND phường/xã; một xã nhiều bản ghi cùng tháng thì lấy bản gửi sau cùng; bắt buộc «Địa bàn»'],
        ['Con người và cộng đồng số', '«Địa bàn» + tháng', T, 'Như trên'],
        ['Văn bản, quy trình và dịch vụ công', '«Địa bàn» + tháng', 'Hồ sơ, văn bản: ' + P + '; tiêu chí Có/Không: ' + T, 'Tỷ lệ toàn trình chỉ có dạng %: bình quân có trọng số theo «Tổng hồ sơ TTHC tiếp nhận»'],
    ],
    'ubnd-nnmt': [
        ['Xã đạt chuẩn nông thôn mới', '«Địa bàn» + quý', T, 'Số tiêu chí đã đạt = «Giá trị kỳ này»'],
        ['Rừng bị thiệt hại', '«Địa bàn» + «Tên nội dung/dự án/sự kiện» + tháng', P, 'Theo tháng báo cáo (không có ngày xảy ra)'],
        ['Rừng trồng mới tập trung', '«Địa bàn» + «Tên nội dung/dự án/sự kiện» + «Phân tổ» + tháng', '«Giá trị kỳ này»: ' + P + '; «Giá trị lũy kế»: ' + L, 'Không có kế hoạch («Kế hoạch/chuẩn tham chiếu» là Chữ)'],
        ['CTMTQG nông thôn mới', 'Dự án = «Tên nội dung/dự án/sự kiện» + «Địa bàn»; bản ghi = dự án + «Phân tổ» (nguồn vốn) + tháng', 'Giải ngân: kỳ này ' + P + ', lũy kế ' + L + '; trạng thái: ' + T, 'Đếm dự án, không đếm bản ghi; không có kế hoạch vốn'],
        ['CTMTQG giảm nghèo', 'Như nông thôn mới', 'Như nông thôn mới', 'Không có kế hoạch vốn'],
        ['Khí tượng thủy văn', '«Phân tổ» + tháng', P, 'Số toàn Thành phố'],
        ['Công trình phòng chống thiên tai', '«Tên nội dung/dự án/sự kiện» + «Địa bàn» + «Phân tổ»', T, ''],
        ['Hỗ trợ lương thực', 'Đợt = «Tên nội dung/dự án/sự kiện» + «Địa bàn» + «Phân tổ» + tháng', P + ' (lượt người)', 'Theo tháng báo cáo (không có ngày bắt đầu đợt); không có số hộ'],
        ['Gạo hỗ trợ', 'Như hỗ trợ lương thực', P + ' (kg, hiển thị tấn)', 'Theo tháng báo cáo'],
        ['Bản đồ, ảnh viễn thám', 'Sản phẩm = «Tên nội dung/dự án/sự kiện» + «Phân tổ»', 'Sản phẩm tính một lần theo tháng báo cáo đầu tiên; trạng thái bản mới nhất', 'Đếm sản phẩm, không đếm bản ghi'],
    ],
    'ubnd-congthuong': [
        ['Xuất khẩu, nhập khẩu', '«Tên doanh nghiệp/đơn vị XNK» + tháng', P, 'Tổng kim ngạch: quy ước 5'],
        ['Bán lẻ hàng hóa, doanh thu dịch vụ tiêu dùng', '«Tên cơ sở/doanh nghiệp kinh doanh» + tháng', P, 'Quy ước 5: thiếu bán lẻ hoặc dịch vụ thì dùng «Tổng mức bán lẻ & DV tiêu dùng (đồng)»'],
        ['Thương mại điện tử', '«Địa bàn» + «Đối tượng thống kê» + tháng', T, ''],
        ['Điện năng, xăng dầu, than', '«Tên đơn vị cung ứng/kinh doanh» + «Loại mặt hàng» + «Địa bàn» + tháng', P, 'Quy đổi theo «Đơn vị tính»; không quy đổi được thì bản ghi lỗi, không tính 0'],
        ['Chỉ số sản xuất công nghiệp', '«Tên doanh nghiệp/cơ sở sản xuất» + «Ngành công nghiệp (VSIC)» + tháng', P, 'So kỳ trước, cùng kỳ chỉ trên doanh nghiệp có số cả hai kỳ'],
    ],
    'ubnd-xaydung': [
        ['Nhà ở (chỉ số 20)', '«Đơn vị báo cáo» + «Loại công trình» + «Tình trạng công trình» + tháng', P, 'Số chính chỉ lấy «Tình trạng công trình» = Đã hoàn thành; 4 tình trạng là 4 số riêng, không cộng'],
        ['Vận tải hành khách cấp đơn vị vận tải (chỉ số 24)', '«Đơn vị báo cáo» + «Ngành vận tải» + «Loại hình vận tải» + tháng', P, 'Không có số theo tuyến'],
        ['Nguy cơ sạt lở, úng ngập (chỉ số 84)', '«Tên tuyến đường» + «Tên vị trí / Địa điểm»', T, ''],
        ['Thu thập dữ liệu vận tải (chỉ số 68, 69)', '«Địa bàn» + «Đối tượng vận chuyển» + «Loại hình vận tải» + tháng', P, ''],
    ],
    'ubnd-noivu': [
        ['Bảo hiểm xã hội, y tế, thất nghiệp', '«Địa bàn» + «Mã chỉ tiêu QĐ4795» + tháng (cộng các «Thôn/TDP» của một địa bàn)', 'Mã 27, 28, 29: ' + T + '; mã 30, 31 (thu, chi): ' + P, 'Thu, chi quy về triệu đồng theo «Đơn vị tính»; không quy đổi được thì bản ghi lỗi'],
        ['Lao động, công chức viên chức', '«Địa bàn» + tháng', 'Lực lượng lao động, lao động nước ngoài, biên chế, bồi dưỡng, chữ ký số: ' + T + '; đi làm việc ở nước ngoài, tuyển mới, nghỉ hưu, thôi việc, chuyển công tác: ' + P, ''],
    ],
    'ubnd-yte': [
        ['Ngộ độc thực phẩm', '«Mã bản ghi» (bản mới nhất của mỗi vụ)', P, 'Tháng theo «Ngày phát hiện»'],
        ['Bao phủ bảo hiểm y tế', '«Địa bàn» + «Thôn/TDP» + tháng', T, ''],
        ['Dịch bệnh nhóm A, B', '«Địa bàn» + «Thôn/TDP» + «Tên bệnh» + tháng', P, 'Tháng theo «Ngày phát hiện»'],
        ['Hồ sơ sức khỏe điện tử', '«Địa bàn» + «Thôn/TDP» + tháng', T, ''],
    ],
}
