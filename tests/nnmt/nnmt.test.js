/* Kiểm tra số giả lập Sở Nông nghiệp và Môi trường (10 eform): tổng = cộng bản ghi; bản ghi hợp lệ; bậc độ lớn sát số thật.
   Chạy: node tests/nnmt/nnmt.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/nnmt-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=NM_SUM;this.CT=NM_CT;this.IT=NM_ITEMS;this.DV=NM_DV;this.VDV=VPUB_DV;this.NTM=NM_NTM;this.TH=NM_RUNG_TH;this.TM=NM_RUNG_TM;this.NV=NM_NTM_VON;this.GV=NM_GN_VON;' +
  'this.PC=NM_PCTT;this.HT=NM_HO_TRO;this.BD=NM_BAN_DO;this.KT=NM_KTTV;this.TMKH=NM_TM_KH;', ctx);
const { S, CT, IT, DV, VDV, NTM, TH, TM, NV, GV, PC, HT, BD, KT, TMKH } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const near = (a, b) => Math.abs(a - b) < 0.011;

ok(IT.length === 10 && CT.length === 10, '10 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp NM_CT'));
ok(DV.length === 126 && DV.every((x, i) => x === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
const all = [NTM, TH, TM, NV, GV, PC, HT, BD].every((a) => a.every((r) => DV.indexOf(r.diaBan) >= 0));
ok(all, 'mọi bản ghi có Địa bàn trong danh mục');
// 1. Nông thôn mới
ok(NTM.length === 75 && NTM.every((r) => r.diaBan.indexOf('Xã') === 0), 'chỉ 75 xã thuộc diện xét nông thôn mới');
ok(sum(S.ntm.muc) === 75 && NTM.every((r) => r.muc === 0 || r.tieuChi === 19) && NTM.every((r) => r.tieuChi <= 19 && r.cungKy <= r.tieuChi), 'mức đạt chuẩn và số tiêu chí hợp lệ');
const nc = (S.ntm.muc[1] + S.ntm.muc[2]) / 75;
ok(nc > 0.55 && nc < 0.7, 'tỷ lệ xã nâng cao trở lên ~60% (số thật 229/382 xã)');
// 2, 3. Rừng
ok(near(S.rungTh.ha, sum(TH.map((r) => r.ha))) && near(sum(S.rungTh.nnHa), S.rungTh.ha) && near(sum(S.rungTh.thangHa.map(sum)), S.rungTh.ha), 'rừng thiệt hại: tổng = cộng vụ = cộng nguyên nhân = cộng tháng');
ok(S.rungTh.ha > 1 && S.rungTh.ha < 30, 'rừng thiệt hại cỡ vài ha (trên 18.342 ha rừng)');
ok(TM.every((r) => near(r.luyKe, sum(r.thang)) && r.luyKe <= r.keHoach + 0.01), 'trồng rừng: lũy kế = cộng tháng ≤ kế hoạch');
ok(near(sum(S.rungTm.loaiHa), S.rungTm.ha) && S.rungTm.kh === sum(TMKH) && near(sum(TM.map((r) => r.keHoach)), S.rungTm.kh), 'trồng rừng: theo loại cộng lại khớp, kế hoạch phân đủ');
ok(S.rungTm.lkT.every((v, i) => !i || v >= S.rungTm.lkT[i - 1]) && near(S.rungTm.lkT[8], S.rungTm.ha), 'trồng rừng: lũy kế theo tháng không giảm');
// 4, 5. Chương trình mục tiêu quốc gia
[[NV, S.ntmVon, 'nông thôn mới'], [GV, S.gnVon, 'giảm nghèo']].forEach(([R, V, ten]) => {
  ok(R.every((r) => r.gn9 <= r.keHoach && r.luyKe[8] === r.gn9 && r.luyKe.every((v, m) => !m || v >= r.luyKe[m - 1]) && r.gnKy === r.gn9 - r.luyKe[7]), ten + ': giải ngân hợp lệ');
  ok(V.kh === sum(R.map((r) => r.keHoach)) && V.gn === sum(R.map((r) => r.gn9)) && V.luyKeT[8] === V.gn && sum(V.tt) === R.length, ten + ': tổng khớp');
  ok(R.every((r) => r.tt !== 2 || r.gn9 === 0), ten + ': chưa triển khai thì chưa giải ngân');
});
ok(sum(S.ntmVon.nguonKh) === S.ntmVon.kh && S.ntmVon.nguonKh[0] === 0, 'nông thôn mới: không có vốn NSTW (Hà Nội tự cân đối)');
ok(sum(S.gnVon.ndKh) === S.gnVon.kh && S.gnVon.db < 126, 'giảm nghèo: theo nội dung khớp, chỉ đơn vị còn hộ cận nghèo');
// 6. Khí tượng thủy văn
ok(KT.thang.every((a) => a.length === 9) && S.kttv.tong.every((v, i) => v === sum(KT.thang[i])), 'khí tượng thủy văn: cộng tháng khớp');
// 7. Phòng chống thiên tai
ok(S.pctt.loai[0] === 89 && S.pctt.loai[1] === 0 && near(S.pctt.km, 626.4), '89 hồ chứa, không thủy điện, 626,4 km đê (số thật)');
ok(S.pctt.tt.every((r, i) => sum(r) === S.pctt.loai[i]), 'trạng thái công trình cộng lại = số công trình');
// 8, 9. Hỗ trợ lương thực, gạo
ok(HT.every((r) => r.nguoi >= r.ho && r.gaoKg > 0 && r.ld !== 2), 'hỗ trợ: người ≥ hộ, có gạo, không có giáp hạt');
ok(S.hoTro.ho === sum(S.hoTro.ldHo) && S.hoTro.ho === sum(S.hoTro.thangHo) && near(S.hoTro.gaoTan, sum(S.hoTro.ldGao)), 'hỗ trợ: theo lý do, theo tháng khớp');
// 10. Bản đồ
ok(S.banDo.n === BD.length && sum(S.banDo.loai) === S.banDo.n && sum(S.banDo.thang) === S.banDo.n && sum(S.banDo.tt) === S.banDo.n, 'bản đồ: các phân tổ cộng lại khớp');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
