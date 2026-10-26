/* ============================== cad-data.js ==============================
   Dữ liệu nền + công thức của CAD (điều phối xử lý điểm nghẽn trên GIS) — theo đúng tài liệu nghiệp vụ
   docs/CHUNG/NGHIEP_VU_CAD_DIEU_PHOI_DIEM_NGHEN_2026_10_23.md (mục 4, 5, 7). Chỉ chứa dữ liệu + hàm thuần
   (không đụng DOM, không giữ trạng thái phiên) — trạng thái/thao tác/giao diện nằm ở js/features/gis-cad.js.

   Dữ liệu đơn vị là MÔ PHỎNG: chưa có danh bạ trụ sở thật của PCCC/Công an/Y tế… theo 126 xã/phường, nên
   mỗi đơn vị được đặt quanh tâm xã/phường của nó (tên xã/phường là tên thật, toạ độ tâm là ước tính). */

/* Tâm ƯỚC TÍNH của các xã/phường khu vực nội thành và giáp ranh (nơi có dữ liệu điểm nghẽn GIS) — chỉ số
   xaId là vị trí trong wardNames() (126 xã/phường thật, xem login.js). Điểm nghẽn được gán về xã/phường có tâm
   gần nhất, đơn vị được đặt quanh tâm xã/phường đóng quân. Khi có ranh giới hành chính thật thì thay bảng này. */
const CAD_WARD_CENTERS={
 0:[21.0365,105.8320],1:[21.0005,105.8505],2:[21.0440,105.8740],4:[21.0320,105.7950],5:[21.0235,105.8445],
 6:[20.9790,105.7500],7:[21.0275,105.8185],8:[21.0120,105.8560],9:[21.0300,105.8530],10:[20.9690,105.8420],
 11:[20.9855,105.8590],12:[20.9700,105.7790],13:[21.0460,105.8620],14:[20.9925,105.8160],15:[21.0075,105.8380],
 16:[20.9550,105.7900],17:[21.0330,105.8900],18:[21.0185,105.8075],19:[20.9820,105.8800],20:[21.0450,105.7985],
 21:[21.0400,105.8175],22:[21.0440,105.7600],23:[20.9410,105.7760],24:[21.0870,105.8100],25:[21.0450,105.9220],
 26:[20.9995,105.8345],28:[20.9640,105.8210],29:[20.9965,105.8075],30:[21.0950,105.7400],31:[21.0640,105.8240],
 32:[21.0050,105.7480],33:[21.0710,105.7320],35:[20.9905,105.8450],36:[21.0250,105.7620],37:[21.0590,105.9010],
 38:[21.0255,105.8340],39:[20.9925,105.8810],40:[20.9990,105.8725],41:[21.0300,105.7420],42:[21.0700,105.7850],
 43:[21.0190,105.7920],44:[20.9500,105.7420],45:[20.9700,105.8690],46:[21.0190,105.8260],47:[21.0860,105.7790],
 48:[20.9890,105.7700],49:[20.9830,105.8300],50:[21.0140,105.8285],53:[20.9780,105.9130],61:[21.0080,105.9420],
 99:[20.9400,105.8500],121:[21.1350,105.8450],122:[20.9450,105.8150]
};
const CAD_WARD_IDS=Object.keys(CAD_WARD_CENTERS).map(Number);

/* Loại lực lượng. every = cứ bao nhiêu xã/phường (theo thứ tự CAD_WARD_IDS) thì có 1 đơn vị đóng quân:
   1 = xã/phường nào cũng có (Công an, Trạm Y tế, UBND…), lớn hơn = đơn vị khu vực phụ trách nhiều xã/phường
   (đội PCCC, đội CSGT, xí nghiệp thoát nước…). Đoàn liên ngành ATTP và CSCĐ rất ít đơn vị — đúng thực tế, và
   cũng là nơi dễ gặp trường hợp "hết ứng viên phù hợp" (mục 9.2). */
const CAD_FORCE_TYPES={
 PCCC:{name:'PCCC&CNCH',every:3,unit:w=>`Đội PCCC&CNCH khu vực ${w}`},
 CA:{name:'Công an',every:1,unit:(w,t)=>`Công an ${t} ${w}`},
 YTE:{name:'Y tế',every:1,unit:(w,t)=>`Trạm Y tế ${t} ${w}`},
 DL:{name:'Điện lực',every:3,unit:w=>`Điện lực khu vực ${w}`},
 CSCD:{name:'Cảnh sát cơ động',every:18,unit:w=>`Tiểu đoàn CSCĐ khu vực ${w}`},
 UBND:{name:'UBND xã/phường',every:1,unit:(w,t)=>`UBND ${t} ${w}`},
 CSGT:{name:'CSGT',every:4,unit:w=>`Đội CSGT khu vực ${w}`},
 GT:{name:'Giao thông',every:5,unit:w=>`Đội Thanh tra giao thông khu vực ${w}`},
 TN:{name:'Thoát nước',every:5,unit:w=>`Xí nghiệp Thoát nước khu vực ${w}`},
 URENCO:{name:'URENCO',every:5,unit:w=>`URENCO – Xí nghiệp môi trường khu vực ${w}`},
 ATTP:{name:'Liên ngành ATTP',every:16,unit:w=>`Đoàn liên ngành ATTP khu vực ${w}`},
 QLTT:{name:'Quản lý thị trường',every:6,unit:w=>`Đội Quản lý thị trường khu vực ${w}`},
 TTDT:{name:'Đội Trật tự đô thị',every:1,unit:(w,t)=>`Đội Trật tự đô thị ${t} ${w}`},
 PCTT:{name:'Ban chỉ huy PCTT',every:1,unit:(w,t)=>`Ban chỉ huy PCTT ${t} ${w}`},
 CUUHO:{name:'Cứu hộ',every:6,unit:w=>`Đội Cứu hộ cứu nạn khu vực ${w}`}
};

/* Mục 4 tài liệu: 4 lực lượng mỗi nhóm (phần tử đầu = đơn vị chính), khối và thời hạn xác nhận. Khoá là
   bottleneck_code của gis.js ('truso' = Cháy nổ, giữ nguyên mã cũ). */
const CAD_GROUPS={
 truso:{forces:['PCCC','CA','YTE','DL'],emergency:true},
 DISASTER:{forces:['PCTT','UBND','CUUHO','YTE'],emergency:true},
 SECURITY:{forces:['CA','CSCD','YTE','UBND'],emergency:true},
 SOCIAL:{forces:['CA','UBND','YTE','DL'],emergency:true},
 URBAN_ORDER:{forces:['TTDT','CA','UBND','DL'],emergency:false},
 TRAFFIC_JAM:{forces:['CSGT','CA','DL','GT'],emergency:false},
 ENVIRONMENT:{forces:['URENCO','UBND','CA','YTE'],emergency:false},
 FOOD_SAFETY:{forces:['ATTP','QLTT','CA','YTE'],emergency:false},
 URBAN_FLOOD:{forces:['TN','UBND','DL','YTE'],emergency:false}
};
/* Mục 4 + 7.2: thời hạn xác nhận (phút) và ETA tối đa (phút) theo khối. */
const CAD_CONFIRM_MIN={emergency:2,normal:5};
const CAD_ETA_MAX_MIN={emergency:15,normal:30};
/* Mục 7.2: trọng số điểm CAD và hệ số quy đổi. */
const CAD_W={T:60,D:10,S:20,H:10};
const CAD_ROAD_FACTOR=1.3;      // đường chim bay → quãng đường đi (chưa có dữ liệu chỉ đường)
const CAD_MIN_PER_KM=2;         // tốc độ trung bình nội đô 30 km/h
const CAD_H_MIN_TICKETS=5;      // chưa đủ 5 phiếu trong 30 ngày thì độ tin cậy lấy 1

function cadGroup(code){return CAD_GROUPS[code]||CAD_GROUPS.URBAN_ORDER;}
function cadIsEmergency(code){return !!cadGroup(code).emergency;}
function cadConfirmMs(code){return (cadIsEmergency(code)?CAD_CONFIRM_MIN.emergency:CAD_CONFIRM_MIN.normal)*60000;}
function cadEtaMax(code){return cadIsEmergency(code)?CAD_ETA_MAX_MIN.emergency:CAD_ETA_MAX_MIN.normal;}

/* Mục 5: phân mức theo số phản ánh. */
function cadLevel(reportCount){
 const n=Number(reportCount)||1;
 if(n>=5) return {level:'Nghiêm trọng',priority:'Khẩn cấp',sla:5,urgent:true};
 if(n>=3) return {level:'Trung bình',priority:'Cao',sla:15,urgent:false};
 return {level:'Nhẹ',priority:'Thường',sla:15,urgent:false};
}

/* "Phường Hoàng Mai" → {type:'phường',short:'Hoàng Mai',full:'Phường Hoàng Mai'}. */
function cadWardInfo(xaId){
 const full=(typeof wardNames==='function'?wardNames()[xaId]:'')||'Xã/phường';
 const isXa=/^Xã\s/.test(full);
 return {type:isXa?'xã':'phường',short:full.replace(/^(Phường|Xã)\s+/,''),full};
}
function cadIocName(xaId){const w=cadWardInfo(xaId);return `IOC ${w.type} ${w.short}`;}

function cadKm(a,b){
 const R=6371,toR=x=>x*Math.PI/180;
 const dLat=toR(b[0]-a[0]),dLng=toR(b[1]-a[1]);
 const h=Math.sin(dLat/2)**2+Math.cos(toR(a[0]))*Math.cos(toR(b[0]))*Math.sin(dLng/2)**2;
 return 2*R*Math.asin(Math.sqrt(h))*CAD_ROAD_FACTOR;
}
function cadEta(km){return Math.max(1,Math.round(km*CAD_MIN_PER_KM));}

/* Xã/phường có tâm gần điểm (lat,lng) nhất trong bảng tâm ước tính. */
function cadNearestWard(lat,lng){
 let best=CAD_WARD_IDS[0],bd=Infinity;
 CAD_WARD_IDS.forEach(id=>{const c=CAD_WARD_CENTERS[id];const d=(c[0]-lat)**2+(c[1]-lng)**2;if(d<bd){bd=d;best=id;}});
 return best;
}

/* Danh bạ đơn vị (sinh 1 lần, cố định theo seed — không đổi giữa các lần mở trang). Mỗi đơn vị kèm lịch sử
   phản hồi 30 ngày gần nhất (hist.total/hist.ok) để tính H. */
let CAD_UNITS=null;
function cadUnits(){
 if(CAD_UNITS) return CAD_UNITS;
 const rngOf=s=>gisRng(gisSeedNum(s));
 CAD_UNITS=[];
 Object.entries(CAD_FORCE_TYPES).forEach(([type,ft],ti)=>{
  CAD_WARD_IDS.forEach((xaId,wi)=>{
   if(ft.every>1&&(wi+ti)%ft.every!==0) return;
   const r=rngOf('cadunit|'+type+'|'+xaId);
   const c=CAD_WARD_CENTERS[xaId],w=cadWardInfo(xaId);
   const total=Math.floor(r()*16);
   const okRate=0.7+r()*0.3;
   CAD_UNITS.push({id:type+'-'+xaId,type,xaId,name:ft.unit(w.short,w.type),
    lat:c[0]+(r()-0.5)*0.008,lng:c[1]+(r()-0.5)*0.008,
    hist:{total,ok:Math.round(total*okRate)}});
  });
 });
 return CAD_UNITS;
}
function cadUnitById(id){return cadUnits().find(u=>u.id===id);}

/* Mục 7.2 — H: tỷ lệ phiếu được xác nhận đúng hạn trong 30 ngày (lịch sử + phát sinh trong phiên). */
function cadReliability(u,extra){
 const total=u.hist.total+(extra?extra.total:0),ok=u.hist.ok+(extra?extra.ok:0);
 return total<CAD_H_MIN_TICKETS?1:ok/total;
}
/* Mục 7.2 — S: rảnh 1, đang có 1 phiếu chưa hoàn thành 0,3, từ 2 phiếu trở lên 0. */
function cadReadiness(activeCount){return activeCount<=0?1:activeCount===1?0.3:0;}

/* Mục 7.2 — lọc + chấm điểm + xếp hạng. ctx: {incXaId, lat, lng, code, excluded:Set(unitId), busy(unitId)→số phiếu
   đang chạy, extraHist(unitId)→{total,ok}}. Trả về TOÀN BỘ ứng viên phù hợp đã xếp hạng (bên gọi tự lấy 3 đầu). */
function cadRankUnits(type,ctx){
 const etaMax=cadEtaMax(ctx.code);
 return cadUnits().filter(u=>u.type===type&&!ctx.excluded.has(u.id)).map(u=>{
  const km=cadKm([ctx.lat,ctx.lng],[u.lat,u.lng]);
  const eta=cadEta(km);
  const busyN=ctx.busy(u.id);
  const T=Math.max(0,1-eta/etaMax),D=u.xaId===ctx.incXaId?1:0,S=cadReadiness(busyN),H=cadReliability(u,ctx.extraHist(u.id));
  const score=Math.round(CAD_W.T*T+CAD_W.D*D+CAD_W.S*S+CAD_W.H*H);
  return {unit:u,km,eta,sameWard:!!D,busyN,reliability:H,score};
 }).filter(c=>c.eta<=etaMax)
   .sort((a,b)=>b.score-a.score||a.eta-b.eta||(b.sameWard?1:0)-(a.sameWard?1:0));
}
