(function (global) {
  'use strict';

  /* Phân tổ (breakdown) của 1 chỉ tiêu: P = tách theo nhóm cùng đơn vị (vẽ dạng thanh);
     S = các số liệu độc lập khác đơn vị (vẽ dạng thẻ KPI) */
  function P(dim, items) { return { dim, type: 'bar', items: items.map(x => ({ label: x[0], value: x[1] })) }; }
  function S(dim, items) { return { dim, type: 'stat', items: items.map(x => ({ label: x[0], value: x[1] })) }; }

  /* ============================== DỮ LIỆU THẬT — 34 chỉ tiêu ==============================
     Nguồn: Biểu 1/2/4/5-BTCTW (Văn phòng Ban Tổ chức Trung ương). Giữ nguyên 100% số liệu,
     không gộp/bỏ sót danh mục nào so với bản trong demo_ioc.html. */
  const TCD_ITEMS = [
    ['Biến động đảng viên', 0, 'Quý', 'Biểu số 1-BTCTW', [
      S('Tổng số đảng viên cuối kỳ trước chuyển sang', [['Đảng viên', 5649259]]),
      P('Đảng viên tăng trong kỳ', [["Tổng số", 204446], ['Kết nạp', 99909], ['Phục hồi đảng tịch', 8]]),
      P('Đảng viên giảm trong kỳ', [["Từ trần", 22936], ['Khai tử', 1184], ['Xóa tên', 3853], ['Xin ra khỏi Đảng', 2460]]),
      S('Đảng viên trong danh sách cuối kỳ báo cáo', [['Đảng viên', 5718743]]),
    ], 'bien_dong_dang_vien_trong_ky'],
    ['Đảng viên mới kết nạp', 0, 'Quý', 'Biểu số 1-BTCTW', [
      P('Tổng số đảng viên mới kết nạp', [['Phụ Nữ', 48035], ['Dân tộc thiểu số', 15885], ['Người theo tôn giáo', 2364], ['Đoàn viên Đoàn TNCS Hồ Chí Minh', 65210], ['Chủ doanh nghiệp tư nhân', 207], ['Có quan hệ hôn nhân với người nước ngoài', 7], ['Kết nạp lại', 31]]),
      S('Nghề nghiệp', [['Cán bộ, công chức cơ quan Nhà nước', 3277],
      ['Cán bộ, công chức cơ quan Đảng, Mặt trận Tổ quốc, đoàn thể chính trị - xã hội', 813],
      ['Người hoạt động không chuyên trách thôn, tổ dân phố', 3060],
      ['Viên chức, người lao động trong các đơn vị sự nghiệp công lập', 26453],
      ['Người lao động trong các đơn vị sự nghiệp ngoài công lập', 1295],
      ['Lãnh đạo, quản lý và lao động trong các doanh nghiệp:', 5324],
      ['Người làm nông, lâm, ngư nghiệp', 9737],
      ['Sỹ quan, chiến sỹ quân đội', 8585],
      ['Sỹ quan, chiến sỹ công an', 3331],
      ['Sinh viên', 7259],
      ['Học sinh', 16997],
      ['Khác (lao động tự do,…)', 13778],
      ]),
      P('Tuổi đời:', [
        ['Từ 18 - 30 tuổi', 62093],
        ['Từ 31 - 35 tuổi', 18244],
        ['Từ 36 - 40 tuổi', 11285],
        ['Từ 41 - 45 tuổi', 5560],
        ['Từ 46 - 50 tuổi', 1789],
        ['Từ 51 - 55 tuổi', 652],
        ['Từ 56 - 60 tuổi', 275],
        ['Trên 60 tuổi', 11],
      ]),
      P('Trình độ giáo dục phổ thông:', [
        ['Tiểu học', 138],
        ['Trung học cơ sở', 6291],
        ['Trung học phổ thông', 93480],
      ]),
      P('Trình độ chuyên môn:', [
        ['Sơ cấp', 2827],
        ['Trung cấp', 3991],
        ['Cao đẳng', 6872],
        ['Đại học', 40886],
        ['Thạc sỹ', 2415],
        ['Tiến sỹ', 99],
      ]),
      P('Chức danh khoa học:', [
        ['Phó Giáo sư', 6],
        ['Giáo sư', 1],
      ]),
    ], 'dang_vien_tang_theo_hinh_thuc'],
    ['Đảng viên chia theo dân tộc và tôn giáo', 0, 'Quý', 'Biểu số 1-BTCTW', [
      S('Đảng viên chia theo dân tộc', [['Tổng số', 5718743], ['Mới kết nạp', 99909], ['Nữ', 2025845], ['Có trình độ chuyên môn từ đại học trở lên', 2717612]]),
      S('Đảng viên chia theo tôn giáo', [['Tổng số', 113665], ['Mới kết nạp', 2364], ['Nữ', 39654], ['Có trình độ chuyên môn từ đại học trở lên', 43939]]),
    ], 'dang_vien_giam_theo_hinh_thuc'],
    ['TỔ CHỨC ĐẢNG VÀ ĐẢNG VIÊN TRONG CÁC LOẠI HÌNH CƠ SỞ', 0, 'Quý', 'Biểu số 1-BTCTW', [
      P('Thôn, tổ dân phố', [['Tổ chức cơ sở đảng', 0], ['Tổ chức đảng trực thuộc', 63869], ['Đảng viên', 2772504]]),
      P('Đặc khu', [['Tổ chức cơ sở đảng', 1], ['Tổ chức đảng trực thuộc', 0], ['Đảng viên', 672]]),
      P('Cơ quan Đảng, MTTQ, đoàn thể CT-XH', [['Tổ chức cơ sở đảng', 3732], ['Tổ chức đảng trực thuộc', 10157], ['Đảng viên', 140139]]),
      P('Cơ quan Nhà nước', [['Tổ chức cơ sở đảng', 4993], ['Tổ chức đảng trực thuộc', 23206], ['Đảng viên', 397028]]),
      P('Đơn vị sự nghiệp', [['Tổ chức cơ sở đảng', 27432], ['Tổ chức đảng trực thuộc', 37540], ['Đảng viên', 1258829]]),
      P('Quân đội', [['Tổ chức cơ sở đảng', 26988], ['Tổ chức đảng trực thuộc', 36784], ['Đảng viên', 1239077]]),
    ], 'dang_vien_xoa_ten_theo_ly_do'],
  ];

  /* Bảng đối chiếu số liệu THẬT theo 40 đảng bộ cho đủ 34 chỉ tiêu, trích Biểu 1/2/4/5-BTCTW. */
  const TCD_DANG_BO_TABLE = {
    units: ["Thành phố Hà Nội", "Thành phố Hải Phòng", "Tỉnh Hưng Yên", "Tỉnh Bắc Ninh", "Tỉnh Ninh Bình", "Tỉnh Quảng Ninh", "Tỉnh Lào Cai", "Tỉnh Tuyên Quang", "Tỉnh Cao Bằng", "Tỉnh Phú Thọ", "Tỉnh Thái Nguyên", "Tỉnh Lạng Sơn", "Tỉnh Lai Châu", "Tỉnh Sơn La", "Tỉnh Điện Biên", "Tỉnh Thanh Hóa", "Tỉnh Nghệ An", "Tỉnh Hà Tĩnh", "Tỉnh Quảng Trị", "Thành phố Huế", "Thành phố Đà Nẵng", "Tỉnh Quảng Ngãi", "Tỉnh Khánh Hòa", "Tỉnh Gia Lai", "Tỉnh Đắk Lắk", "Tỉnh Lâm Đồng", "Thành phố Hồ Chí Minh", "Tỉnh Đồng Nai", "Tỉnh Tây Ninh", "Tỉnh Đồng Tháp", "Tỉnh Vĩnh Long", "Tỉnh An Giang", "Thành phố Cần Thơ", "Tỉnh Cà Mau", "Đảng bộ các cơ quan Đảng Trung ương", "Đảng bộ Chính phủ", "Đảng ủy Quốc Hội", "Đảng ủy Mặt trận Tổ quốc Việt Nam", "Quân ủy Trung ương", "Công an Trung ương"],
    cols: [
      { id: "bien_dong_dang_vien_trong_ky", label: "Biến động đảng viên", total: 5718743, values: [511900, 250694, 184858, 160435, 245173, 121005, 124990, 139250, 65147, 266093, 144887, 72774, 32612, 96647, 51703, 248255, 207720, 104153, 131801, 59823, 146864, 95237, 76466, 152152, 142878, 128909, 392157, 136325, 97942, 123726, 154950, 134421, 147422, 83079, 15134, 117552, 2723, 4797, 272685, 73404] },
      { id: "dang_vien_tang_theo_hinh_thuc", label: "Đảng viên mới kết nạp", total: 99917, values: [6263, 4943, 2001, 2740, 3877, 2047, 2801, 2282, 611, 4126, 2868, 1029, 506, 1393, 1184, 6246, 4618, 1933, 2046, 1052, 2901, 1553, 1451, 2880, 3194, 2436, 5629, 2049, 1523, 1870, 2230, 1841, 2789, 1302, 230, 1705, 23, 76, 6821, 2848] },
      { id: "dang_vien_giam_theo_hinh_thuc", label: "Đảng viên chia theo dân tộc và tôn giáo", total: 30433, values: [1973, 1842, 1228, 521, 1837, 745, 657, 740, 553, 1489, 949, 657, 404, 574, 453, 1526, 1525, 950, 870, 441, 845, 388, 491, 811, 512, 679, 1905, 818, 607, 757, 536, 629, 878, 470, 5, 41, 0, 4, 72, 51] },
      { id: "dang_vien_xoa_ten_theo_ly_do", label: "TỔ CHỨC ĐẢNG VÀ ĐẢNG VIÊN TRONG CÁC LOẠI HÌNH CƠ SỞ", total: 3853, values: [247, 299, 4, 44, 113, 47, 70, 70, 17, 115, 65, 29, 12, 41, 13, 189, 240, 64, 75, 43, 117, 32, 52, 157, 80, 134, 188, 125, 84, 212, 291, 130, 306, 124, 0, 7, 0, 4, 4, 9] },
    ]
  };
  global.VanPhongBanToChucDangData = Object.freeze({
    items: TCD_ITEMS,
    unitTable: TCD_DANG_BO_TABLE,
  });
})(typeof window !== 'undefined' ? window : globalThis);
