/* ============================== SỞ TÀI CHÍNH — DỮ LIỆU THỬ (CHỈ DÙNG KHI PHÁT TRIỂN) ==============================
   Chỉ được nạp khi mở web với ?stcdemo=1 (xem stc-data.js). Đây là số TỰ ĐẶT để kiểm tra giao diện, KHÔNG PHẢI số liệu
   thật của Sở Tài chính; giao diện luôn hiện banner "DỮ LIỆU MẪU" khi ở chế độ này. Dòng dữ liệu đúng dạng API thật
   ({chiTieu, giaTri, loai, quy}, đúng nhãn API) nên cũng kiểm thử luôn các hàm nhận diện dòng.
   Có 2 kỳ: 2026-1 (đủ số) và 2026-2 (số khác, riêng API khách du lịch toàn 0 để thử trạng thái "Chưa có số"). */
(function () {
  function build(q, f, bump, zeroDl) {
    const cur = 'Q' + q + '/2026', prv = 'Q' + q + '/2025';
    const r = (chiTieu, giaTri, loai, quy) => ({ chiTieu: chiTieu, giaTri: giaTri, loai: loai, quy: quy });
    const S = (v) => Math.round(v * f);      // số tiền: nhân hệ số kỳ
    const I = (v) => Math.round((v + bump) * 10) / 10; // chỉ số: cộng độ lệch kỳ
    const D = {};

    D.THU_NGAN_SACH = [];
    [['Thu nội địa', 62400, 55200], ['Thu từ dầu thô', 0, 0], ['Thu từ hoạt động xuất nhập khẩu', 9800, 8700], ['Thu viện trợ', 120, 95]].forEach((t, i) => {
      D.THU_NGAN_SACH.push(r(t[0], S(t[1]), 'Kỳ này', cur));
      /* Cố ý lặp lại lỗi của API thật: dòng "Thu nội địa / Kỳ trước" mang quy = kỳ này */
      D.THU_NGAN_SACH.push(r(t[0], t[2], 'Kỳ trước', i === 0 ? cur : prv));
    });
    D.CHI_NGAN_SACH_DIA_PHUONG = [];
    [['Tổng chi NS ĐP', 28600, 24100], ['Chi đầu tư phát triển', 11200, 8500], ['Chi phát triển thường xuyên', 15900, 14600], ['Chi trả nợ lãi', 620, 540], ['Chi bổ sung quỹ dự trữ tài chính', 12, 10], ['Các nhiệm vụ chi khác', 868, 450]].forEach((t) => {
      D.CHI_NGAN_SACH_DIA_PHUONG.push(r(t[0], S(t[1]), 'Kỳ này', cur));
      D.CHI_NGAN_SACH_DIA_PHUONG.push(r(t[0], t[2], 'Kỳ trước', prv));
    });
    D.VON_DAU_TU = [['Vốn nhà nước', 21500], ['Vốn ngoài nhà nước', 27800], ['Vốn đầu tư trực tiếp nước ngoài', 4300]]
      .map((t) => r('Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', S(t[1]), t[0], cur));
    D.VON_NSNN_DIA_PHUONG = [['Vốn ngân sách Nhà nước cấp thành phố', 9100], ['Vốn ngân sách Nhà nước cấp xã', 3900]]
      .map((t) => r(t[0], S(t[1]), 'Vốn ngân sách Nhà nước cấp', cur));
    D.DA_TRONG_DIEM = [['Nhóm 10 dự án, công trình', 20], ['Dự án 07 cầu vượt sông Hồng', 30], ['Các tuyến đường Vành đai và Giao thông trọng điểm', 10], ['Quy hoạch và Thể chế phát triển Thủ đô', 45], ['Xử lý các dự án ngoài ngân sách chậm triển khai', 50]]
      .map((t) => r(t[0] + ' - Tiến độ hoàn thành', t[1] + (q - 1) * 5, t[0], cur));
    D.CHI_SO_SXCN = [['Toàn ngành công nghiệp', 108.4], ['Khai khoáng', 96.2], ['Công nghiệp chế biến, chế tạo', 109.7], ['Sản xuất và phân phối điện, khí đốt, hơi nước và điều hoà không khí', 106.1], ['Cung cấp nước, hoạt động quản lý và xử lý rác thải, nước thải', 103.5]]
      .map((t) => r(t[0], I(t[1]), t[0], cur));
    D.TONG_HANG_BAN_RA = [['Nhà nước', 96000], ['Ngoài nhà nước', 985000], ['Khu vực có vốn đầu tư nước ngoài', 74000]]
      .map((t) => r('Tổng mức bán ra và doanh thu dịch vụ', S(t[1]), t[0], cur));
    D.TONG_HANG_BAN_LE = [['Nhà nước', 48000], ['Ngoài nhà nước', 232000], ['Khu vực có vốn đầu tư nước ngoài', 40000]]
      .map((t) => r('Tổng mức bán lẻ và doanh thu dịch vụ', S(t[1]), t[0], cur));
    D.DOANH_THU_VAN_TAI = [];
    [['Vận tải hành khách', 12400, 112.3], ['Vận tải hàng hóa', 26800, 108.9], ['Dịch vụ kho bãi và hỗ trợ vận tải', 18900, 115.6], ['Bưu chính, chuyển phát', 5200, 121.4]].forEach((t) => {
      D.DOANH_THU_VAN_TAI.push(r(t[0] + ' Ước tính', S(t[1]), t[0], cur));
      D.DOANH_THU_VAN_TAI.push(r(t[0] + ' so với cùng kỳ', I(t[2]), t[0], cur));
    });
    D.KHACH_DU_LICH_HN = [];
    [['Khách nội địa', 4850, 109.2], ['Khách quốc tế', 1720, 128.5]].forEach((t) => {
      D.KHACH_DU_LICH_HN.push(r('Ước tính quý', zeroDl ? 0 : S(t[1]), t[0], cur));
      D.KHACH_DU_LICH_HN.push(r('So với cùng kỳ', zeroDl ? 0 : I(t[2]), t[0], cur));
    });
    ['KIM_NGACH_XK', 'KIM_NGACH_NK'].forEach((c) => {
      const vals = c === 'KIM_NGACH_XK' ? [['Khu vực kinh tế trong nước', 1450, 104.2], ['Khu vực có vốn đầu tư nước ngoài', 3100, 112.7]] : [['Khu vực kinh tế trong nước', 2700, 101.8], ['Khu vực có vốn đầu tư nước ngoài', 2250, 109.4]];
      D[c] = [];
      vals.forEach((t) => { D[c].push(r('Ước tính', S(t[1]), t[0], cur)); D[c].push(r('So với cùng kỳ', I(t[2]), t[0], cur)); });
    });
    D.CHI_SO_KINH_TE = [['Chỉ số giá tiêu dùng', 103.4], ['Chỉ số giá vàng', 187.2], ['Chỉ số giá đô la Mỹ', 101.9]]
      .map((t) => r(t[0], I(t[1]), t[0], cur));
    D.SP_DIA_BAN = [];
    [['Nông, lâm nghiệp và thủy sản', 6300, 5900], ['Công nghiệp và xây dựng', 74500, 68100], ['Dịch vụ', 152800, 140200], ['Thuế sản phẩm trừ trợ cấp sản phẩm', 21400, 19600]].forEach((t) => {
      D.SP_DIA_BAN.push(r('Theo giá hiện hành', S(t[1]), t[0], cur));
      D.SP_DIA_BAN.push(r('Theo giá so sánh cùng kỳ năm trước', S(t[2]), t[0], cur));
    });
    return D;
  }
  window.STC_DEMO_SNAPSHOT = {
    version: 1,
    demo: true,
    periods: {
      '2026-1': { year: 2026, period: 1, importedAt: '2026-09-21T09:00:00.000Z', source: 'DỮ LIỆU MẪU tự đặt — không phải số liệu thật', data: build(1, 1, 0, false) },
      '2026-2': { year: 2026, period: 2, importedAt: '2026-09-21T09:00:00.000Z', source: 'DỮ LIỆU MẪU tự đặt — không phải số liệu thật', data: build(2, 1.07, 1.2, true) }
    }
  };
})();
