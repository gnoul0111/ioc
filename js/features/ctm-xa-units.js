/* ============================== 126 XÃ, PHƯỜNG — HÀM DÙNG CHUNG CỦA CHỈ TIÊU THEO EFORM ==============================
   Từ 31/10/2026 chỉ tiêu 12 eform xã, phường dựng trên khung chung js/features/ctm-eform.js (một khung cho xã, 4 trục, các sở), khai báo
   ở js/features/ctm-xa-eform.js theo bản đọc docs/BAN_DOC_EFORM/XA_* (duyệt 30/10/2026). File này giữ các hàm dùng chung (nạp TRƯỚC
   ctm-eform.js): xã, phường đang xem; đọc mã, tên hiển thị danh mục, ngày, đơn vị; đổi chữ "phường" ↔ "xã".
   Đặt CTM_XA_ALL_TAB = false để bỏ tab "Tất cả" của tài khoản xã, phường (indicators.js, login.js, sidebar-org.js). */
const CTM_XA_ALL_TAB = true;
/* Tài khoản xã, phường chỉ xem số của chính mình — không có bảng, hạng 126 xã, phường (chốt 27/10/2026). */
const CTM_XA_SO_SANH = false;

/* Xã, phường đang xem (currentXaId là số thứ tự trong wardNames(), login.js) */
function ctmCurrentXaUnit() {
  if (typeof currentXaId === 'undefined' || currentXaId == null) return null;
  const names = typeof wardNames === 'function' ? wardNames() : null;
  const nm = names ? names[Number(currentXaId)] : null;
  return nm ? ctmXaByName(nm) : null;
}
function ctmXaWord(ctx) { return ctx && ctx.xa && ctx.xa.k === 'X' ? 'xã' : 'phường'; }
/* Tên đơn vị trong danh mục ghi "phường" cho mọi nơi — đổi thành "xã" khi đang xem một xã */
function ctmXaLoc(s, ctx) { const w = ctmXaWord(ctx); return String(s == null ? '' : s).replace(/phường/g, w).replace(/Phường/g, w === 'xã' ? 'Xã' : 'Phường'); }
function ctmXaOf(u) { return (u.k === 'P' ? 'phường ' : 'xã ') + u.short; }

/* ============================== ĐỌC GIÁ TRỊ THEO KHUNG EFORM ============================== */
/* Mã chuẩn như tools/xa_eform_schema.py: bỏ ký tự ẩn, bỏ dấu, đ → d (mã "hạn_xử_lý", "chitieuh​oi"… trong file eform) */
function xaEfNorm(s) { return String(s == null ? '' : s).replace(/[​-‏⁠﻿]/g, '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
/* Tên hiển thị dùng chung khi một eform để trống tên của mã (Kỳ báo cáo, Quý của Văn hóa, Nội vụ, Kinh tế xã hội) */
const XA_EF_DM_CHUNG = {};
XA_EFORM.forEach((ef) => ef.fields.forEach((f) => (f.dm || []).forEach((o) => { if (o.l && !XA_EF_DM_CHUNG[f.c + '|' + o.v]) XA_EF_DM_CHUNG[f.c + '|' + o.v] = o.l; })));
/* Tên hiển thị của một mã danh mục; null = mã không có trong danh mục của trường */
function xaEfLb(f, v) {
  if (v == null || v === '') return '';
  if (!f || f.t !== 'dm' || !f.dm.length) return String(v);
  const o = f.dm.find((x) => x.v === v);
  return o ? (o.l || XA_EF_DM_CHUNG[f.c + '|' + v] || '') : null;
}
function xaEfIsNum(v) { return typeof v === 'number' && isFinite(v); }
/* Ngày: 'YYYY-MM-DD' hoặc số sê-ri Excel → 'dd/mm/yyyy' */
function xaEfDate(v) {
  if (typeof v === 'number' && isFinite(v)) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear(); }
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}
/* Chữ hiện trong ô của màn Dữ liệu đã nhập: đúng giá trị đã nhập, danh mục ra tên hiển thị */
function xaEfCell(f, v) {
  if (v == null || v === '') return '';
  if (f.t === 'dm') { const l = xaEfLb(f, v); return l === null ? String(v) : l; }
  if (f.t === 'so') { if (!xaEfIsNum(v)) return String(v); const s = String(v), d = s.indexOf('.') >= 0 ? Math.min(3, s.split('.')[1].length) : 0; return f.c === 'nam' ? s : ctmF(v, d); }
  if (f.t === 'ngay') return xaEfDate(v) || String(v);
  return String(v);
}
/* Đơn vị đọc từ tên trường hoặc tên đơn vị tính (dùng chung với bản ghi mẫu): "Tỷ đồng" → "tỷ đồng", "Học sinh" → "học sinh" */
function xaEfU(text) {
  const u = xaEfUnitOf(text);
  if (u) return u;
  const t = String(text || '').trim();
  return t && /^[A-ZĐ][a-zà-ỹ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
function xaEfHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }
