 /* ============================== LĨNH VỰC GIÁO DỤC: port nguyên bản giaoduc_full_dashboard.html ============================== */
 /* Dữ liệu thật 126 đơn vị phường/xã: [tên,số trường,trường CQG,học sinh,lớp học,phòng học,nhân sự,CBQL,giáo viên,biết bơi,tật về mắt,diện chính sách] — nguồn: Tong_hop_so_lieu_giao_duc_cap_nhat_A3_ngang.pdf, cập nhật 07/07/2026 */
 const gdUnitData=[
 ['Phường Ba Đình',17,13,9606,238,239,893,47,678,4555,3447,48],
 ['Phường Bạch Mai',32,20,22876,614,520,2126,94,1650,9137,9648,57],
 ['Phường Bồ Đề',54,23,25543,748,586,2674,149,2062,10138,9389,107],
 ['Phường Chương Mỹ',28,23,22114,428,293,1771,86,1432,3650,3441,159],
 ['Phường Cầu Giấy',38,5,35595,697,638,3320,113,2771,9505,6997,49],
 ['Phường Cửa Nam',18,6,12105,299,216,982,44,785,6802,5524,250],
 ['Phường Dương Nội',30,10,21748,612,295,2390,109,1940,6920,5537,35],
 ['Phường Giảng Võ',23,18,27645,582,592,1979,74,1628,10617,8106,59],
 ['Phường Hai Bà Trưng',26,17,16470,341,239,1340,69,1035,7628,8190,114],
 ['Phường Hoàn Kiếm',19,15,11640,186,171,977,55,753,5126,3638,42],
 ['Phường Hoàng Liệt',14,4,15441,251,204,866,39,692,8989,6271,37],
 ['Phường Hoàng Mai',18,7,15109,692,627,1094,53,864,7654,6310,75],
 ['Phường Hà Đông',84,30,61084,1697,1072,6414,321,5110,21565,16659,163],
 ['Phường Hồng Hà',22,13,9132,335,332,1195,68,911,2364,2767,26],
 ['Phường Khương Đình',24,12,25617,589,569,2115,70,1791,10236,7477,71],
 ['Phường Kim Liên',31,15,19082,431,273,1722,85,1333,7383,5400,49],
 ['Phường Kiến Hưng',19,8,17410,561,504,1676,85,1325,6125,5455,26],
 ['Phường Long Biên',21,17,13001,341,310,1223,73,913,3966,4027,36],
 ['Phường Láng',12,6,6865,195,185,730,31,563,3632,2101,15],
 ['Phường Lĩnh Nam',5,4,3314,76,86,279,19,197,919,472,17],
 ['Phường Nghĩa Đô',34,8,34641,979,989,3856,136,3031,11144,8761,50],
 ['Phường Ngọc Hà',27,13,12710,324,232,1539,77,1156,4887,3200,27],
 ['Phường Phú Diễn',29,12,21634,713,687,2548,81,2087,10127,7380,674],
 ['Phường Phú Lương',17,9,11274,321,275,1030,58,793,4093,3800,63],
 ['Phường Phú Thượng',18,6,10177,257,253,1121,55,856,2698,2958,15],
 ['Phường Phúc Lợi',33,17,22533,587,621,2250,96,1785,6177,6325,54],
 ['Phường Phương Liệt',15,5,7889,346,234,1311,76,969,3324,2262,18],
 ['Phường Sơn Tây',25,18,14721,339,222,1438,65,1080,4601,3818,571],
 ['Phường Thanh Liệt',22,16,16193,413,262,1488,86,1168,6663,5240,721],
 ['Phường Thanh Xuân',48,19,31094,871,775,3666,126,2815,13986,9023,72],
 ['Phường Thượng Cát',11,6,6354,147,165,566,32,437,3534,2438,67],
 ['Phường Tây Hồ',32,16,18076,521,490,2047,82,1496,9043,7315,1981],
 ['Phường Tây Mỗ',21,6,24943,865,509,2928,88,2208,6524,5612,82],
 ['Phường Tây Tựu',16,9,6562,182,169,707,45,522,3384,2416,50],
 ['Phường Tùng Thiện',21,15,10931,266,172,874,52,661,5194,3341,190],
 ['Phường Tương Mai',31,13,23114,667,266,1888,109,1450,10709,8786,90],
 ['Phường Từ Liêm',54,21,53054,1651,782,5584,180,4019,22536,18300,261],
 ['Phường Việt Hưng',47,25,23749,675,379,2223,124,1732,6438,7970,198],
 ['Phường Văn Miếu - Quốc Tử Giám',16,6,4651,171,40,607,39,440,1401,1367,29],
 ['Phường Vĩnh Hưng',18,13,15389,410,350,1296,64,1024,6081,5201,177],
 ['Phường Vĩnh Tuy',24,8,33802,857,598,3363,85,2899,8777,5669,152],
 ['Phường Xuân Phương',24,12,15836,544,559,1820,82,1480,6401,5276,389],
 ['Phường Xuân Đỉnh',15,5,13787,523,475,1616,78,1256,6020,5327,150],
 ['Phường Yên Hòa',53,15,51622,1395,1385,5156,164,4202,16150,12938,48],
 ['Phường Yên Nghĩa',14,11,8433,310,159,969,67,743,1716,1951,33],
 ['Phường Yên Sở',13,6,8063,389,199,823,54,632,3903,2592,27],
 ['Phường Ô Chợ Dừa',17,9,11861,347,282,1061,56,815,5154,3920,66],
 ['Phường Đông Ngạc',20,15,17916,520,444,1730,75,1347,9388,7319,105],
 ['Phường Đại Mỗ',24,8,13314,593,189,2026,94,1595,5348,3573,56],
 ['Phường Định Công',21,7,24388,446,771,2039,57,1688,8402,6180,28],
 ['Phường Đống Đa',19,11,15294,378,261,1221,57,961,6733,5883,504],
 ['Xã An Khánh',33,22,19029,648,380,2263,98,1705,5201,3226,124],
 ['Xã Ba Vì',13,12,4940,144,92,586,36,416,1278,644,1170],
 ['Xã Bát Tràng',18,16,10812,230,227,860,47,647,3772,3359,390],
 ['Xã Bình Minh',28,17,20554,526,550,2358,97,1946,5061,3340,210],
 ['Xã Bất Bạt',14,12,6739,187,155,673,35,491,953,906,144],
 ['Xã Chuyên Mỹ',17,13,7518,197,188,789,42,585,1233,1225,579],
 ['Xã Chương Dương',19,18,9696,267,256,989,55,758,2162,2007,95],
 ['Xã Cổ Đô',25,23,11573,312,249,1208,67,880,3166,2668,310],
 ['Xã Dân Hòa',20,19,10430,265,189,952,55,722,2666,2034,225],
 ['Xã Dương Hòa',20,18,10723,255,243,1026,46,780,3007,2481,87],
 ['Xã Gia Lâm',32,16,32804,853,834,3448,98,2668,10895,9312,50],
 ['Xã Hoài Đức',30,15,19016,446,325,1731,78,1393,4717,4013,84],
 ['Xã Hát Môn',25,16,12477,323,290,1196,64,913,2917,2324,3489],
 ['Xã Hòa Lạc',8,4,4685,168,224,685,28,517,1533,905,56],
 ['Xã Hòa Phú',22,19,9331,225,141,860,53,630,2385,1062,1313],
 ['Xã Hòa Xá',25,21,9026,246,171,1011,57,726,2607,1633,208],
 ['Xã Hưng Đạo',19,17,9407,240,200,938,50,702,2249,2223,568],
 ['Xã Hương Sơn',19,16,7979,215,177,856,51,596,1768,1421,182],
 ['Xã Hạ Bằng',18,12,9721,245,239,872,51,690,2406,1713,155],
 ['Xã Hồng Sơn',23,23,10006,266,274,1104,60,789,1676,1651,321],
 ['Xã Hồng Vân',21,15,11079,304,211,1085,63,826,3497,3117,168],
 ['Xã Kim Anh',13,10,9598,221,190,783,31,605,2534,1279,168],
 ['Xã Kiều Phú',20,18,10445,276,265,1026,51,759,3640,2404,3082],
 ['Xã Liên Minh',15,14,8160,209,181,764,35,580,1919,1446,81],
 ['Xã Minh Châu',4,1,867,27,27,113,7,77,300,44,40],
 ['Xã Mê Linh',19,7,12993,308,241,1122,53,874,2386,2430,161],
 ['Xã Mỹ Đức',22,17,15085,295,249,1355,70,1008,2790,3074,371],
 ['Xã Nam Phù',17,13,9409,256,209,908,47,686,4401,2312,85],
 ['Xã Ngọc Hồi',15,10,12657,265,263,991,54,767,4730,2635,70],
 ['Xã Nội Bài',22,17,16442,387,334,1298,56,1007,6626,3470,336],
 ['Xã Phù Đổng',37,28,20475,482,417,1779,92,1358,7556,6621,142],
 ['Xã Phú Cát',19,14,7028,196,152,809,41,586,2137,832,171],
 ['Xã Phú Nghĩa',20,12,10363,259,265,932,54,705,1877,1521,180],
 ['Xã Phú Xuyên',35,24,16388,419,348,1831,95,1339,3169,3096,763],
 ['Xã Phúc Lộc',25,20,11913,304,210,1173,65,868,2804,2319,240],
 ['Xã Phúc Sơn',20,20,8074,211,195,961,58,670,2407,1383,386],
 ['Xã Phúc Thịnh',27,18,21391,517,598,2089,86,1664,7026,5230,813],
 ['Xã Phúc Thọ',28,22,13255,317,253,1392,71,1060,2776,1600,1925],
 ['Xã Phượng Dực',16,15,9069,253,207,1063,46,787,1306,1140,279],
 ['Xã Quang Minh',26,16,18242,434,278,1462,66,1155,4014,3339,309],
 ['Xã Quảng Bị',16,13,12261,274,224,906,41,716,2894,1664,160],
 ['Xã Quảng Oai',24,17,12887,316,240,1140,60,852,4069,2248,510],
 ['Xã Quốc Oai',25,17,15999,398,322,1506,70,1162,4658,4304,354],
 ['Xã Suối Hai',12,13,8679,226,167,793,39,592,2061,1108,1663],
 ['Xã Sóc Sơn',47,32,30785,653,579,2536,115,1958,10859,6413,2313],
 ['Xã Sơn Đồng',27,14,13102,367,278,1419,72,1059,3662,3097,58],
 ['Xã Tam Hưng',16,10,9609,211,192,790,40,613,2831,2017,122],
 ['Xã Thanh Oai',23,18,11390,296,283,1055,60,793,3542,2123,478],
 ['Xã Thanh Trì',17,12,9705,298,149,1077,77,814,3353,3145,26],
 ['Xã Thiên Lộc',25,14,14890,398,358,1315,68,1029,5878,4255,4877],
 ['Xã Thuận An',18,18,12743,322,286,1126,55,870,4456,3605,50],
 ['Xã Thư Lâm',31,21,19612,486,442,1651,78,1289,7673,6041,3879],
 ['Xã Thường Tín',32,26,19016,451,451,1722,89,1328,6452,4306,168],
 ['Xã Thượng Phúc',16,16,7884,208,168,770,40,593,2294,1269,93],
 ['Xã Thạch Thất',22,17,12867,260,249,1059,59,817,4224,2339,164],
 ['Xã Tiến Thắng',16,13,9689,243,131,868,39,660,2252,1739,216],
 ['Xã Trung Giã',19,18,11731,257,207,1002,49,750,4586,2164,353],
 ['Xã Trần Phú',17,9,10508,230,183,793,42,620,3001,1236,264],
 ['Xã Tây Phương',34,26,20250,516,442,1836,91,1454,4864,5245,351],
 ['Xã Vân Đình',24,19,9654,247,193,1027,60,747,2773,2212,245],
 ['Xã Vĩnh Thanh',16,10,8959,295,312,938,46,725,2869,2154,111],
 ['Xã Vật Lại',18,10,12384,269,225,1082,54,825,3113,1016,704],
 ['Xã Xuân Mai',29,14,16278,435,342,1228,70,972,5863,2138,276],
 ['Xã Yên Bài',12,12,3753,115,100,470,29,335,1114,667,98],
 ['Xã Yên Lãng',23,17,13586,329,286,1248,62,928,2153,2333,218],
 ['Xã Yên Xuân',18,10,6417,167,129,687,47,501,2055,614,269],
 ['Xã Ô Diên',30,26,17367,471,423,1642,76,1273,4027,5698,181],
 ['Xã Đa Phúc',22,20,14748,339,277,1303,59,979,5430,2178,2152],
 ['Xã Đan Phượng',18,16,12429,266,167,1176,48,938,2185,2550,97],
 ['Xã Đoài Phương',11,7,6611,142,127,575,27,434,2845,1054,67],
 ['Xã Đông Anh',42,30,29919,613,608,2798,114,2268,10370,6144,1157],
 ['Xã Đại Thanh',26,20,17184,526,392,1760,102,1334,6401,5055,772],
 ['Xã Đại Xuyên',25,20,12006,301,349,1240,57,943,1988,1552,207],
 ['Xã Ứng Hòa',30,29,9796,255,210,1046,68,729,2151,2273,267],
 ['Xã Ứng Thiên',19,18,8659,225,199,919,48,677,3141,1910,230]
 ];
 /* Drill-down + chi tiết đơn vị cho dashboard Giáo dục — dùng chung 1 nguồn gdUnitData */
 const GD_SOURCE_NOTE='Nguồn: file cập nhật "SỐ LIỆU TRƯỜNG HỌC CÁC ĐƠN VỊ_SỞ GIÁO DỤC.txt" (Sở Giáo dục và Đào tạo), ghép theo tên đơn vị phường/xã với dữ liệu sức khỏe học sinh — cập nhật 07/07/2026.';
 const GD_COL_GET={name:u=>u[0],truong:u=>u[1],cqg:u=>u[2],cqgRate:u=>u[1]?u[2]/u[1]*100:0,hs:u=>u[3],lop:u=>u[4],phong:u=>u[5],nhansu:u=>u[6],cbql:u=>u[7],gv:u=>u[8],boi:u=>u[9],mat:u=>u[10],cs:u=>u[11],hsLop:u=>u[4]?u[3]/u[4]:0,hsGv:u=>u[8]?u[3]/u[8]:0};
 const gdColumns=[
 {label:'Đơn vị',key:'name',align:'left'},{label:'Số trường',key:'truong',align:'right'},{label:'Trường CQG',key:'cqg',align:'right'},{label:'Tỷ lệ CQG',key:'cqgRate',align:'right'},
 {label:'Học sinh',key:'hs',align:'right'},{label:'Lớp học',key:'lop',align:'right'},{label:'Phòng học',key:'phong',align:'right'},{label:'Nhân sự',key:'nhansu',align:'right'},
 {label:'CBQL',key:'cbql',align:'right'},{label:'Giáo viên',key:'gv',align:'right'},{label:'Biết bơi',key:'boi',align:'right'},{label:'Tật về mắt',key:'mat',align:'right'},{label:'Diện chính sách',key:'cs',align:'right'}
 ];
 let gdSort={key:'hs',dir:'desc'};
 function gdFmtVal(key,v){return key==='cqgRate'?v.toFixed(1)+'%':fmt(v);}
 function gdSortedUnits(){
 const {key,dir}=gdSort, get=GD_COL_GET[key];
 return [...gdUnitData].sort((a,b)=>{
 const av=get(a), bv=get(b);
 if(key==='name') return dir==='asc'?av.localeCompare(bv):bv.localeCompare(av);
 return dir==='asc'?av-bv:bv-av;
 });
 }
 function gdSortBy(key){
 gdSort = gdSort.key===key ? {key,dir:gdSort.dir==='asc'?'desc':'asc'} : {key,dir:key==='name'?'asc':'desc'};
 const thead=document.getElementById('gdUnitThead'); if(thead) thead.innerHTML=gdUnitTheadHtml();
 const tbody=document.getElementById('gdUnitTbody'); if(tbody) tbody.innerHTML=gdUnitTableRowsHtml();
 }
 function gdUnitTheadHtml(){
 return `<tr>${gdColumns.map(c=>`<th onclick="gdSortBy('${c.key}')" style="cursor:pointer;text-align:${c.align};white-space:nowrap">${esc(c.label)}${gdSort.key===c.key?(gdSort.dir==='asc'?' ▲':' ▼'):''}</th>`).join('')}</tr>`;
 }
 function gdUnitTableRowsHtml(){
 return gdSortedUnits().map(u=>{
 const nameSafe=u[0].replace(/'/g,"\\'");
 return `<tr onclick="gdOpenUnitDetail('${nameSafe}')">${gdColumns.map(c=>{
 const v=GD_COL_GET[c.key](u);
 return `<td style="text-align:${c.align}">${c.key==='name'?esc(v):gdFmtVal(c.key,v)}</td>`;
 }).join('')}</tr>`;
 }).join('');
 }
 function gdOpenUnitDetail(name){
 const u=gdUnitData.find(x=>x[0]===name); if(!u) return;
 const fields=[['Số trường',u[1]],['Trường chuẩn quốc gia',u[2]],['Số lớp học',u[4]],['Số phòng học',u[5]],['Tổng nhân sự',u[6]],['CBQL',u[7]],['Giáo viên',u[8]],['Học sinh',u[3]],['HS biết bơi',u[9]],['HS có tật về mắt',u[10]],['HS diện chính sách',u[11]]];
 document.getElementById('modalTitle').textContent=name;
 document.getElementById('modalSub').textContent='Sở Giáo dục và Đào tạo · 126 đơn vị phường/xã';
 document.getElementById('modalBody').innerHTML=`
 <div class="kv">${fields.map(f=>`<b>${esc(f[0])}</b><span>${fmt(f[1])}</span>`).join('')}</div>
 <div class="record-update-note" style="margin-top:12px">${GD_SOURCE_NOTE}</div>`;
 openModal();
 }

 /* Xếp hạng cao nhất / thấp nhất theo 1 chỉ số — gộp thẳng vào từng màn chi tiết category, không tách card riêng */
 function gdRankRowHtml(name,valueLabel,pct,color){
 const nameSafe=name.replace(/'/g,"\\'");
 return `<div class="rank-row" style="cursor:pointer" onclick="gdOpenUnitDetail('${nameSafe}')"><div class="rank-row-top"><span class="rank-label">${esc(name)}</span><b class="rank-value">${valueLabel}</b></div><div class="rank-track"><div class="rank-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div></div>`;
 }
 function gdMetricRankHtml(key,label,fmtFn){
 const rows=gdUnitData.map(u=>({name:u[0],v:GD_COL_GET[key](u)}));
 const highest=[...rows].sort((a,b)=>b.v-a.v).slice(0,5);
 const lowest=[...rows].sort((a,b)=>a.v-b.v).slice(0,5);
 const maxAbs=Math.max(...rows.map(r=>r.v),1);
 return `<div class="cat-chart-box">
 <div class="cdl-title">${esc(label)} — cao nhất / thấp nhất</div>
 <p style="font-size:11px;font-weight:800;color:#7fe0a0;margin:8px 0 6px"> Cao nhất</p>
 <div class="rank-list" style="margin-bottom:12px">${highest.map(r=>gdRankRowHtml(r.name,fmtFn(r.v),r.v/maxAbs*100,'#2fb174')).join('')}</div>
 <p style="font-size:11px;font-weight:800;color:#8fc7ea;margin:0 0 6px"> Thấp nhất</p>
 <div class="rank-list">${lowest.map(r=>gdRankRowHtml(r.name,fmtFn(r.v),r.v/maxAbs*100,'#2c9ed2')).join('')}</div>
 </div>`;
 }

 /* Lớp 2: 1 màn chi tiết riêng cho mỗi category (Mạng lưới trường học / Học sinh / Nhân sự) — panel nhỏ ước tính bên trái + xếp hạng 126 đơn vị (data thật) bên phải */
 const GD_CAT_META={
 truong:{
 title:'Mạng lưới trường học', icon:'',
 kpis:[['Số trường','2.963'],['Trường CQG','1.868'],['Tỷ lệ CQG','63,04%'],['Phòng học','41.332']],
 smallCharts:[
 {id:'gdD1',title:'Số trường theo cấp học (ước tính toàn ngành)',type:'bar',labels:['Mầm non','Tiểu học','THCS','THPT','GDTX'],data:[3600,800,400,700,123],color:'#2a78d6'},
 {id:'gdD2',title:'Loại hình trường (ước tính toàn ngành)',type:'doughnut',labels:['Công lập','Tư thục'],data:[2359,3264],color:['#2a78d6','#1baf7a']}
 ],
 rankKey:'truong', rankLabel:'số trường',
 tooltipFields:[['Số trường','truong'],['Trường CQG','cqg'],['Tỷ lệ CQG','cqgRate'],['Phòng học','phong']],
 extraMetrics:[
 {key:'cqgRate',label:'Tỷ lệ trường chuẩn QG',fmt:v=>v.toFixed(1)+'%'},
 {key:'hsLop',label:'Học sinh / lớp',fmt:v=>v.toFixed(1)}
 ]
 },
 hocsinh:{
 title:'Học sinh', icon:'',
 kpis:[['Tổng học sinh','1.918.158'],['Học 2 buổi/ngày (ước tính)','1.902.083'],['HS diện chính sách','51.063']],
 smallCharts:[
 {id:'gdD3',title:'Học sinh theo cấp học (ước tính toàn ngành)',type:'bar',labels:['Tiểu học','THCS','THPT','GDTX'],data:[756790,652108,318317,66450],color:'#1baf7a'},
 {id:'gdD4',title:'Sức khỏe & chính sách (toàn ngành)',type:'bar',labels:['Biết bơi','Tật về mắt','Diện chính sách'],data:[639081,492302,51063],color:'#eda100'}
 ],
 rankKey:'hs', rankLabel:'học sinh',
 tooltipFields:[['Học sinh','hs'],['Biết bơi','boi'],['Tật về mắt','mat'],['Diện chính sách','cs']]
 },
 nhansu:{
 title:'Nhân sự – giáo viên', icon:'',
 kpis:[['Tổng nhân sự','186.401'],['CBQL','8.464'],['Giáo viên','144.292'],['Nhân viên (ước tính)','33.645']],
 smallCharts:[
 {id:'gdD5',title:'Vị trí việc làm (ước tính toàn ngành)',type:'doughnut',labels:['Giáo viên','CBQL','Nhân viên'],data:[144292,8464,33645],color:['#2a78d6','#eda100','#4a3aa7']},
 {id:'gdD6',title:'Giáo viên theo cấp học (ước tính toàn ngành)',type:'bar',labels:['Mầm non','Tiểu học','THCS','THPT','GDTX'],data:[48053,32888,30691,17628,4122],color:'#2a78d6'}
 ],
 rankKey:'nhansu', rankLabel:'nhân sự',
 tooltipFields:[['Tổng nhân sự','nhansu'],['CBQL','cbql'],['Giáo viên','gv']],
 extraMetrics:[
 {key:'hsGv',label:'Học sinh / giáo viên',fmt:v=>v.toFixed(1)}
 ]
 }
 };
 function gdFilterRows(){
 const q=document.getElementById('gd-search-donvi').value.toLowerCase();
 const rows=document.querySelectorAll('#gdUnitTbody tr');
 rows.forEach(function(r){
 const name=r.children[0].textContent.toLowerCase();
 r.style.display = name.indexOf(q)!==-1 ? '' : 'none';
 });
 }
 /* Số liệu thật của Sở Giáo dục (giữ nguyên như bản gdDashboardHtml cũ) — dùng lại trong openCategoryDetail
 để Giáo dục có cùng cấu trúc khung (KPI row + cat-two-col + bấm biểu đồ xem chi tiết) như mọi Sở khác,
 nhưng không mất số liệu thật đã có. */
 const GD_REAL_KPIS=[
 {label:'Số trường',value:'2.963'},{label:'Học sinh',value:'1.918.158'},{label:'Giáo viên',value:'144.292'},
 {label:'Nhân sự',value:'186.401'},{label:'Số lớp',value:'50.523'},{label:'Phòng học',value:'41.332'},
 {label:'Chuẩn QG',value:'63,04%'},{label:'Trường CQG',value:'1.868'}
 ];
 /* Các biểu đồ chi tiết vốn nằm ở "Lớp 2" (drill-down đã tắt) — lôi thẳng ra Lớp 1 để luôn nhìn thấy ngay, không cần bấm xuyên qua trang con nữa. */
 const GD_D1={labels:['Mầm non','Tiểu học','THCS','THPT','GDTX'],data:[3600,800,400,700,123],color:'#2a78d6'};
 const GD_D2={labels:['Công lập','Tư thục'],data:[2359,3264],color:['#2a78d6','#1baf7a']};
 const GD_D3={labels:['Tiểu học','THCS','THPT','GDTX'],data:[756790,652108,318317,66450],color:'#1baf7a'};
 const GD_D4={labels:['Biết bơi','Tật về mắt','Diện chính sách'],data:[639081,492302,51063],color:'#eda100'};
 const GD_D5={labels:['Giáo viên','CBQL','Nhân viên'],data:[144292,8464,33645],color:['#2a78d6','#eda100','#4a3aa7']};
 const GD_D6={labels:['Mầm non','Tiểu học','THCS','THPT','GDTX'],data:[48053,32888,30691,17628,4122],color:'#2a78d6'};
 function gdRankChartBox(id,label){
 return `<div class="cat-chart-box"><div class="cdl-title">Xếp hạng 126 đơn vị theo ${esc(label)} (data thật — bấm 1 cột để xem chi tiết đơn vị)</div><div style="max-height:420px;overflow-y:auto"><div style="position:relative;height:${gdUnitData.length*20}px"><canvas id="${id}"></canvas></div></div></div>`;
 }
 function gdSectionHead(title,desc){return `<p style="font-size:13px;font-weight:800;color:#eaf6ff;margin:4px 0 2px">${esc(title)}</p><p style="font-size:11.5px;color:var(--text-secondary);margin:0 0 2px">${desc}</p>`;}
 function gdChartBox(id,title){return catBoxHtml(title,`<div style="position:relative;height:200px;margin-top:8px"><canvas id="${id}"></canvas></div>`);}
 function gdKpiTilesHtml(){return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:14px">${GD_REAL_KPIS.map(k=>`<div class="cat-chart-box" style="padding:10px 12px"><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">${esc(k.label)}</p><p style="font-size:17px;font-weight:800;color:#fff;margin:0">${esc(k.value)}</p></div>`).join('')}</div>`;}
 function gdMangLuoiSectionHtml(){
 return `<div style="display:grid;gap:10px">
 ${gdSectionHead('Mạng lưới trường học','2.963 trường · 1.868 trường CQG (63,04%) · 41.332 phòng học')}
 ${gdChartBox('gdD1','Số trường theo cấp học (ước tính toàn ngành)')}
 ${gdChartBox('gdD2','Loại hình trường (ước tính toàn ngành)')}
 ${gdRankChartBox('gdRankTruong','số trường')}
 ${gdMetricRankHtml('cqgRate','Tỷ lệ trường chuẩn QG',v=>v.toFixed(1)+'%')}
 ${gdMetricRankHtml('hsLop','Học sinh / lớp',v=>v.toFixed(1))}
 </div>`;
 }
 function gdHocSinhSectionHtml(){
 return `<div style="display:grid;gap:10px">
 ${gdSectionHead('Học sinh','1.918.158 học sinh · 99,2% học 2 buổi/ngày (ước tính)')}
 ${gdChartBox('gdD3','Học sinh theo cấp học (ước tính toàn ngành)')}
 ${gdChartBox('gdD4','Sức khỏe & chính sách (toàn ngành)')}
 ${gdRankChartBox('gdRankHocSinh','học sinh')}
 </div>`;
 }
 function gdNhanSuSectionHtml(){
 return `<div style="display:grid;gap:10px">
 ${gdSectionHead('Nhân sự – giáo viên','186.401 nhân sự · 144.292 giáo viên · 8.464 CBQL')}
 ${gdChartBox('gdD5','Vị trí việc làm (ước tính toàn ngành)')}
 ${gdChartBox('gdD6','Giáo viên theo cấp học (ước tính toàn ngành)')}
 ${gdRankChartBox('gdRankNhanSu','nhân sự')}
 ${gdMetricRankHtml('hsGv','Học sinh / giáo viên',v=>v.toFixed(1))}
 </div>`;
 }
 const GD_SECTION_BUILDERS=[gdMangLuoiSectionHtml,gdHocSinhSectionHtml,gdNhanSuSectionHtml];
 function gdRealBoxesHtml(){
 return `<div style="display:grid;gap:10px">${gdMangLuoiSectionHtml()}${gdHocSinhSectionHtml()}${gdNhanSuSectionHtml()}</div>`;
 }
 let gdCatChartInstances=[];
 function gdInitRankChart(id,rankKey,tooltipFields){
 const canvas=document.getElementById(id); if(!canvas||typeof Chart==='undefined') return;
 const sorted=[...gdUnitData].sort((a,b)=>GD_COL_GET[rankKey](b)-GD_COL_GET[rankKey](a));
 gdCatChartInstances.push(new Chart(canvas,{
 type:'bar',
 data:{labels:sorted.map(u=>u[0]),datasets:[{data:sorted.map(u=>GD_COL_GET[rankKey](u)),backgroundColor:'#2c9ed2',maxBarThickness:14}]},
 options:{
 indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:false,
 plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>{const u=sorted[ctx.dataIndex];return tooltipFields.map(f=>`${f[0]}: ${gdFmtVal(f[1],GD_COL_GET[f[1]](u))}`);}}}},
 onClick:(evt,elements)=>{if(elements.length) gdOpenUnitDetail(sorted[elements[0].index][0]);},
 scales:{y:{ticks:{font:{size:10},color:chartLabelColor()}},x:{ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}}}
 }
 }));
 }
 function initGdRealCharts(){
 gdCatChartInstances.forEach(c=>c&&c.destroy()); gdCatChartInstances=[];
 const defs=[['gdD1','bar',GD_D1],['gdD2','doughnut',GD_D2],['gdD3','bar',GD_D3],['gdD4','bar',GD_D4],['gdD5','doughnut',GD_D5],['gdD6','bar',GD_D6]];
 defs.forEach(([id,type,d])=>{
 const canvas=document.getElementById(id); if(!canvas||typeof Chart==='undefined') return;
 const labels=type==='doughnut'?d.labels.map((l,i)=>`${l}: ${fmt(d.data[i])}`):d.labels;
 gdCatChartInstances.push(new Chart(canvas,{
 type,
 data:{labels,datasets:[{data:d.data,backgroundColor:d.color,borderRadius:type==='bar'?4:0,maxBarThickness:28}]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 plugins:{legend:{display:type==='doughnut',position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:10}}}},
 scales:type==='doughnut'?{}:{y:{beginAtZero:true,ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:10}},grid:{display:false}}}
 }
 }));
 });
 gdInitRankChart('gdRankTruong','truong',GD_CAT_META.truong.tooltipFields);
 gdInitRankChart('gdRankHocSinh','hs',GD_CAT_META.hocsinh.tooltipFields);
 gdInitRankChart('gdRankNhanSu','nhansu',GD_CAT_META.nhansu.tooltipFields);
 }
 function gdRealUnitTableHtml(){
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách 126 đơn vị</div>
 <input id="gd-search-donvi" type="text" placeholder="Tìm tên đơn vị..." oninput="gdFilterRows()" style="width:100%;margin:8px 0 10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" id="gdUnitTable">
 <thead id="gdUnitThead">${gdUnitTheadHtml()}</thead>
 <tbody id="gdUnitTbody">${gdUnitTableRowsHtml()}</tbody>
 </table>
 </div>
 </div>`;
 }

 /* Header CHUẨN dùng chung cho MỌI thẻ .cat-chart-box hiển thị 1 chỉ tiêu — tiêu đề bên trái + dropdown chọn kỳ
 Tháng/Quý/Năm bên phải, cùng 1 hành vi (dropdown chặn nổi bọt để không kích hoạt click-để-xem-chi-tiết của thẻ).
 Áp dụng thống nhất cho cả thẻ chưa có số liệu thật (catItemCardHtml) lẫn các khối đã có số liệu thật riêng theo
 từng lĩnh vực (CUSTOM_CAT_ITEM_BUILDERS) — để cấu trúc/cách hiển thị/chức năng hiển thị giống nhau tuyệt đối. */
 /* Lọc theo ĐÚNG TỪNG THÁNG cụ thể (Tháng 1/2026, Tháng 2/2026...) cho các thẻ chỉ tiêu con CÓ breakdown thật
 (item[4], xem catItemCardHtml nhánh parts.length) — vì là số liệu demo (không có API tách theo từng tháng
 thật), tự chia tổng số Năm ra 12 tháng theo trọng số fake NHƯNG ỔN ĐỊNH (hash theo tên chỉ tiêu, dùng lại
 twProvinceHash() đã có sẵn ở genUnitTableHtml phía dưới) — mỗi tháng ra 1 số khác nhau thật sự (không chia đều
 bằng nhau), cộng dồn đúng 3 tháng = 1 Quý, đúng 12 tháng = Năm. Nhãn có "%" (tỷ lệ) KHÔNG quy đổi vì bản chất
 là tỷ lệ phần trăm, không phụ thuộc kỳ báo cáo. CHỈ áp dụng cho nhánh có breakdown thật — nhánh mô phỏng trạng
 thái xử lý (else bên dưới, dùng cho chỉ tiêu chưa có breakdown) và các CUSTOM_CAT_ITEM_BUILDERS/gdChartBox...
 (catBoxHtml gọi trực tiếp không kèm periodCtx) vẫn giữ nguyên dropdown tĩnh 3 lựa chọn như cũ, không đổi. */
 const CAT_FREQ_PER_YEAR={'Tháng':12,'Quý':4,'Năm':1};
 const CAT_REPORT_YEAR=2026;
 /* Chỉ liệt kê Tháng/Quý ĐÃ QUA hoặc đang diễn ra (không cho chọn kỳ tương lai — số liệu tương lai chưa thể có
 thật) — so theo ngày hệ thống thực tế, không hardcode. */
 function catBucketOptions(){
 const now=new Date(); const curYear=now.getFullYear(), curMonth=now.getMonth()+1;
 const maxMonth=curYear>CAT_REPORT_YEAR?12:(curYear<CAT_REPORT_YEAR?0:curMonth);
 const maxQuarter=Math.ceil(maxMonth/3);
 const opts=[{value:'year',label:`Năm ${CAT_REPORT_YEAR}`}];
 for(let q=1;q<=maxQuarter;q++) opts.push({value:'q'+q,label:`Quý ${['I','II','III','IV'][q-1]}/${CAT_REPORT_YEAR}`});
 for(let m=1;m<=maxMonth;m++) opts.push({value:'m'+m,label:`Tháng ${m}/${CAT_REPORT_YEAR}`});
 return opts;
 }
 /* Biên độ lệch NỚI RỘNG THÊM LẦN NỮA (0.25-1.85 ~7.4 lần vẫn chưa đủ — các mục con dù đổi số nhưng ít khi đổi
 THỨ HẠNG cho nhau khi giá trị gốc cả năm giữa các mục con vốn đã chênh nhau nhiều, nên trục biểu đồ tự co giãn
 theo max làm hình dạng nhìn vẫn "giống giống" giữa các tháng) lên 0.08-2.48 (~31 lần) — đủ mạnh để mục con vốn
 nhỏ hơn có tháng vượt lên mục con vốn lớn hơn, đổi hẳn thứ hạng/hình dạng biểu đồ giữa các tháng, không chỉ
 đổi độ lớn. */
 function catMonthShares(seedKey){
 const weights=Array.from({length:12},(_,m)=>0.08+(twProvinceHash(seedKey+'|m'+m)%1000)/1000*2.4);
 const sum=weights.reduce((a,b)=>a+b,0)||1;
 return weights.map(w=>w/sum);
 }
 /* QUAN TRỌNG: mỗi MỤC CON trong breakdown giờ có đường biến động theo tháng RIÊNG (seed = tên chỉ tiêu + tên
 mục con), không dùng chung 1 hệ số của giá trị chính nữa — trước đây co giãn đồng loạt theo đúng 1 tỷ lệ nên
 HÌNH DẠNG biểu đồ (tỷ lệ giữa các cột màu) gần như y hệt nhau ở mọi tháng, chỉ trục số đổi nhẹ, mắt không nhận
 ra khác biệt. Giờ đổi tháng thì cả độ lớn LẪN tỷ lệ giữa các mục con đều đổi, nhìn rõ là 2 tháng khác nhau. */
 function scaleCatItemForBucket(catId,it,bucketKey){
 const baseFreq=CAT_FREQ_PER_YEAR[it[2]]?it[2]:'Năm';
 const annual=(Number(it[1])||0)*CAT_FREQ_PER_YEAR[baseFreq];
 const monthly=catMonthShares(catId+'|'+it[0]).map(s=>annual*s);
 const bucketOf=(monthlyArr)=>{
 if(bucketKey==='year') return monthlyArr.reduce((a,b)=>a+b,0);
 if(bucketKey[0]==='q'){ const q=Number(bucketKey.slice(1)); return monthlyArr.slice((q-1)*3,q*3).reduce((a,b)=>a+b,0); }
 const m=Number(bucketKey.slice(1)); return monthlyArr[m-1];
 };
 const label=bucketKey==='year'?`Năm ${CAT_REPORT_YEAR}`:bucketKey[0]==='q'?`Quý ${['I','II','III','IV'][Number(bucketKey.slice(1))-1]}/${CAT_REPORT_YEAR}`:`Tháng ${Number(bucketKey.slice(1))}/${CAT_REPORT_YEAR}`;
 const scaledVal=Math.max(0,Math.round(bucketOf(monthly)));
 const parts=(it[4]||[]).map(p=>({dim:p.dim,type:p.type,items:p.items.map(x=>{
 if(isPercentLabel(x.label)) return {label:x.label,value:x.value};
 const xAnnual=Number(x.value)||0;
 const xMonthly=catMonthShares(catId+'|'+it[0]+'|'+x.label).map(s=>xAnnual*s);
 return {label:x.label,value:Math.max(0,Math.round(bucketOf(xMonthly)))};
 })}));
 return [it[0],scaledVal,label,it[3],parts];
 }
 function catItemBreakdownBodyHtml(it){
 const parts=it[4]||[];
 return parts.map(p=>parts.length>1?`<p class="cir-dim-label" style="margin-top:10px">${esc(p.dim)}</p>${phanToDimBodyHtml(p)}`:phanToDimBodyHtml(p)).join('');
 }
 function catItemBodyElId(role,catId,idx){return `cat-item-body-${role}-${catId}-${idx}`;}
 /* Đổi kỳ (dropdown Năm/Quý/Tháng cụ thể) — tính lại số liệu theo scaleCatItemForBucket() rồi vẽ lại ĐÚNG phần
 thân của thẻ đó (không load lại cả drawer), sau đó flushPendingDimCharts() để vẽ nốt biểu đồ Chart.js mới. */
 function onCatItemPeriodChange(role,catId,idx,bucketKey){
 const cat=categorySeedForRole(role).find(c=>c.id===catId); const it=cat?.items?.[idx]; if(!it)return;
 const scaled=scaleCatItemForBucket(catId,it,bucketKey);
 const bodyEl=document.getElementById(catItemBodyElId(role,catId,idx)); if(!bodyEl)return;
 bodyEl.innerHTML=catItemBreakdownBodyHtml(scaled);
 flushPendingDimCharts();
 /* Nếu bảng bên phải (#dimDetailPanel) đang hiện chi tiết của ĐÚNG box vừa đổi kỳ (window.__dimPanelSourceBox,
 gán khi bấm vào box — xem populateDimDetailFromBox) thì làm mới luôn bảng đó theo số liệu mới, không thì giữ
 nguyên (đang hiện danh sách đơn vị hoặc chi tiết của box khác thì không đụng vào). */
 const box=bodyEl.closest('.cat-chart-box');
 if(box&&window.__dimPanelSourceBox===box) populateDimDetailFromBox(box);
 }
 /* Header CHUẨN dùng chung cho MỌI thẻ .cat-chart-box hiển thị 1 chỉ tiêu — tiêu đề bên trái + dropdown chọn kỳ
 bên phải, cùng 1 hành vi (dropdown chặn nổi bọt để không kích hoạt click-để-xem-chi-tiết của thẻ).
 periodCtx (tuỳ chọn, {role,catId,idx,bucketKey}) BẬT chế độ lọc theo đúng tháng/quý/năm cụ thể có đổi số liệu
 thật — chỉ catItemCardHtml (nhánh có breakdown thật) truyền vào; các nơi gọi catBoxHtml khác (không truyền
 periodCtx) vẫn giữ nguyên dropdown tĩnh 3 lựa chọn + toast như trước, không đổi hành vi. */
 function catBoxHeaderHtml(title,freq,periodCtx){
 let periodHtml;
 if(periodCtx){
 /* Dùng ĐÚNG combobox tự dựng dùng chung toàn app (customSelectHtml, xem js/core/assign-task.js) thay vì
 <select> gốc trình duyệt — trước đây dùng <select> khiến bảng lựa chọn hiện theo style mặc định hệ điều
 hành/trình duyệt (dù đã ép color-scheme:dark), KHÁC hẳn hình dạng/viền/bo góc/hiệu ứng hover của mọi
 dropdown khác trong app (đều dùng customSelectHtml). onchangeFn của customSelectHtml chỉ gọi được
 window[tên hàm]() KHÔNG kèm tham số — nên phải tự tạo 1 hàm global riêng cho đúng lá bài (role/catId/idx)
 này, gán ngay lúc dựng HTML (closure), rồi trỏ onchangeFn tới đúng tên hàm đó. */
 const opts=catBucketOptions();
 const selId=`cat-period-sel-${periodCtx.role}-${periodCtx.catId}-${periodCtx.idx}`;
 const fnName=`catPeriodFn_${periodCtx.role}_${periodCtx.catId}_${periodCtx.idx}`.replace(/[^a-zA-Z0-9_]/g,'_');
 window[fnName]=function(){ onCatItemPeriodChange(periodCtx.role,periodCtx.catId,periodCtx.idx,document.getElementById(selId).value); };
 periodHtml=`<div class="cat-item-period-sel">${customSelectHtml(selId,opts,periodCtx.bucketKey,'Chọn kỳ',fnName)}</div>`;
 } else {
 const periodOpts=['Tháng','Quý','Năm'];
 const defaultPeriod=periodOpts.includes(freq)?freq:'Tháng';
 periodHtml=`<select class="cat-item-period" onclick="event.stopPropagation()" onchange="event.stopPropagation();toast('Đang xem theo '+this.value+' (dữ liệu minh họa, chưa có API tách theo từng kỳ)')" style="height:28px;flex:0 0 auto;border:1px solid rgba(87,178,255,.28);background:#061a2f;color:#d0e8f8;border-radius:8px;padding:0 6px;font-size:10.5px">${periodOpts.map(p=>`<option ${p===defaultPeriod?'selected':''}>${p}</option>`).join('')}</select>`;
 }
 return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px"><h4 style="margin:0;flex:1;min-width:0">${esc(title)}</h4>${periodHtml}</div>`;
 }
 function catBoxHtml(title,bodyHtml,freq,extraStyle,periodCtx){
 const bodyWrap=periodCtx?`<div id="${catItemBodyElId(periodCtx.role,periodCtx.catId,periodCtx.idx)}">${bodyHtml}</div>`:bodyHtml;
 return `<div class="cat-chart-box cat-item-row"${extraStyle?` style="${extraStyle}"`:''}>${catBoxHeaderHtml(title,freq,periodCtx)}${bodyWrap}</div>`;
 }
 /* Lớp 2: lưới thẻ nhóm (mỗi chỉ tiêu con = 1 thẻ, có mini-bar cơ cấu trạng thái) */
 function catItemCardHtml(role,catId,idx,it){
 const name=it[0], declared=Number(it[1])||0, freq=it[2], parts=it[4]||[];
 let bodyHtml;
 if(parts.length){
 /* Chỉ tiêu thống kê: hiển thị phân tổ thật (không phải trạng thái xử lý), CÓ lọc theo tháng/quý/năm cụ thể
 (đổi số liệu thật khi đổi dropdown) — mặc định hiện đúng "Năm 2026" ngay từ đầu để khớp với lựa chọn mặc
 định của dropdown (trước đây hiện nguyên giá trị khai báo gốc, không đồng bộ với dropdown). */
 const yearItem=scaleCatItemForBucket(catId,it,'year');
 return catBoxHtml(yearItem[0],catItemBreakdownBodyHtml(yearItem),yearItem[2],undefined,{role,catId,idx,bucketKey:'year'});
 } else {
 /* Chỉ tiêu dạng nhiệm vụ/việc: theo trạng thái xử lý — dùng chung 1 bộ 3 kiểu widget (donut+tổng số kèm danh sách,
 bar xếp hạng, line xu hướng theo tháng) với đúng phong cách/hàm đã dùng trong các lĩnh vực có số liệu thật
 (donutCenterTextPlugin, kpiTileHtml...), để mọi lĩnh vực — kể cả demo — đều cùng 1 chuẩn hiển thị đa dạng,
 không còn luôn là 1 donut 6 màu bằng nhau. Loại widget chọn theo seed tên+idx nên ổn định qua các lần render. */
 const recs=indicatorRecordsFor(role,name);
 const tot=recs.length||declared||1;
 const cnts={}; CAT_ST.forEach(s=>cnts[s.k]=recs.filter(r=>r.status===s.k).length);
 const list=CAT_ST.map(s=>({l:s.l,c:s.c,n:cnts[s.k]||0})).filter(s=>s.n>0);
 const finalList=list.length?list:[{l:'Chưa phân loại',c:'#2c7dd2',n:tot}];
 const seed=[...name].reduce((a,c)=>a+c.charCodeAt(0),0)+idx;
 const variant=seed%3;
 if(variant===0){
 const chartId=chartCanvasId();
 queueDimChart(chartId,'doughnut',finalList.map(s=>s.l),finalList.map(s=>s.n),finalList.map(s=>s.c),{line1:fmt(tot),line2:'bản ghi'});
 const rows=finalList.map(s=>`<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.c};margin-right:6px"></i>${esc(s.l)}</span><b>${fmt(s.n)}</b></div>`).join('');
 bodyHtml=`<div style="position:relative;height:170px;margin-top:8px"><canvas id="${chartId}"></canvas></div><div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${rows}</div>`;
 } else if(variant===1){
 const sorted=finalList.slice().sort((a,b)=>b.n-a.n);
 const chartId=chartCanvasId();
 queueDimChart(chartId,'bar',sorted.map(s=>s.l),sorted.map(s=>s.n),sorted.map(s=>s.c));
 bodyHtml=`<div style="position:relative;height:${Math.max(140,sorted.length*34+20)}px;margin-top:8px"><canvas id="${chartId}"></canvas></div>`;
 } else {
 const chartId=chartCanvasId();
 queueDimChart(chartId,'line',trendMonthLabels(6),trendSeriesFor(tot,seed,6),['#39d5ff']);
 const doneCnt=cnts.done||0, remain=Math.max(0,tot-doneCnt);
 bodyHtml=`<div style="position:relative;height:170px;margin-top:8px"><canvas id="${chartId}"></canvas></div><div class="cir-stat-grid" style="margin-top:10px;margin-bottom:0"><div class="cir-stat-tile"><p>Đã hoàn thành</p><b>${fmt(doneCnt)}</b></div><div class="cir-stat-tile"><p>Đang xử lý/còn lại</p><b>${fmt(remain)}</b></div></div>`;
 }
 }
 return catBoxHtml(name,bodyHtml,freq);
 }
 /* Danh sách 126 đơn vị phường/xã dùng chung cho mọi lĩnh vực (port từ dashboard Giáo dục) —
 lĩnh vực nào chưa có số liệu thật theo đơn vị thì hiển thị mặc định 0, chờ cập nhật dữ liệu thật. */
 const HN_UNIT_NAMES=gdUnitData.map(u=>u[0]);
 /* 34 đơn vị hành chính cấp tỉnh sau sáp nhập (Nghị quyết sáp nhập tỉnh/thành, hiệu lực 01/07/2025) — dùng làm
 danh sách đơn vị breakdown cho các lĩnh vực/chỉ tiêu ở CẤP TRUNG ƯƠNG, thay cho 126 xã/phường Hà Nội (chỉ áp
 dụng từ cấp Thành ủy Hà Nội trở xuống). 6 thành phố trực thuộc trung ương + 28 tỉnh. */
 const TW_PROVINCE_NAMES=[
 'TP. Hà Nội','TP. Hải Phòng','TP. Đà Nẵng','TP. Huế','TP. Hồ Chí Minh','TP. Cần Thơ',
 'Tỉnh Tuyên Quang','Tỉnh Lào Cai','Tỉnh Thái Nguyên','Tỉnh Phú Thọ','Tỉnh Bắc Ninh','Tỉnh Hưng Yên','Tỉnh Ninh Bình',
 'Tỉnh Quảng Ninh','Tỉnh Thanh Hóa','Tỉnh Nghệ An','Tỉnh Hà Tĩnh','Tỉnh Quảng Trị','Tỉnh Quảng Ngãi','Tỉnh Gia Lai',
 'Tỉnh Khánh Hòa','Tỉnh Lâm Đồng','Tỉnh Đắk Lắk','Tỉnh Đồng Nai','Tỉnh Tây Ninh','Tỉnh Vĩnh Long','Tỉnh Đồng Tháp',
 'Tỉnh Cà Mau','Tỉnh An Giang','Tỉnh Cao Bằng','Tỉnh Lạng Sơn','Tỉnh Lai Châu','Tỉnh Điện Biên','Tỉnh Sơn La'
 ];
 /* Chia 1 tổng số (declared value của 1 chỉ tiêu) fake nhưng ỔN ĐỊNH cho 34 tỉnh/thành — trọng số theo hash của
 (tên tỉnh + khoá chỉ tiêu) nên mỗi lần render ra cùng 1 bộ số (không nhảy số ngẫu nhiên mỗi lần mở lại), các
 tỉnh không đều nhau (giống phân bổ thật ngoài đời) nhưng luôn cộng đúng bằng tổng đã khai báo. */
 function twProvinceHash(str){let h=0;for(let i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))>>>0;}return h;}
 function twProvinceSplit(total,unitNames,seedKey){
 total=Number(total)||0;
 const weights=unitNames.map(name=>0.35+(twProvinceHash(name+'|'+seedKey)%1000)/1000*1.3);
 const wsum=weights.reduce((a,b)=>a+b,0)||1;
 const vals=weights.map(w=>Math.round(total*w/wsum));
 const drift=total-vals.reduce((a,b)=>a+b,0);
 if(vals.length) vals[vals.length-1]+=drift;
 return vals;
 }
 function genUnitTableHtml(cat){
 /* Cấp phường/xã (currentXaId!=null) đang xem đúng 1 xã/phường cụ thể — bảng breakdown theo đơn vị không còn ý
 nghĩa (không có "đơn vị con" nào khác để so sánh), nên bỏ qua như cũ. Cấp Trung ương (isTwRole) KHÔNG còn bị
 chặn nữa — chỉ đổi danh sách đơn vị sang 34 tỉnh/thành thay vì 126 xã/phường Hà Nội. */
 if(currentXaId!=null){window.__dimPanelCat=null; return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0"></div>`;}
 window.__dimPanelCat=cat;
 if(cat.id==='ubnd-gddt') return gdRealUnitTableHtml();
 if(cat.id==='ubnd-vhtt' && cat.vhtt && typeof vhttUnitTableHtml==='function') return vhttUnitTableHtml();
 if(cat.id==='ubnd-vpubnd' && cat.vpub && typeof vpubUnitTableHtml==='function') return vpubUnitTableHtml();
 if(cat.id==='ubnd-bqlkcnc' && cat.bql && typeof bqlUnitTableHtml==='function') return bqlUnitTableHtml();
 if(cat.id==='ubnd-dulich' && cat.dl && typeof dlUnitTableHtml==='function') return dlUnitTableHtml();
 if(cat.id==='ubnd-dantoc-tongiao' && cat.dttg && typeof dttgUnitTableHtml==='function') return dttgUnitTableHtml();
 if(cat.id==='ubnd-thanhtra' && cat.ttra && typeof ttraUnitTableHtml==='function') return ttraUnitTableHtml();
 if(cat.id==='ubnd-khcn' && cat.khcn && typeof khcnUnitTableHtml==='function') return khcnUnitTableHtml();
 if(cat.id==='ubnd-nnmt' && cat.nm && typeof nmUnitTableHtml==='function') return nmUnitTableHtml();
 if(cat.id==='ubnd-noivu' && cat.snv && typeof snvUnitTableHtml==='function') return snvUnitTableHtml();
 if(cat.id==='ubnd-yte' && cat.syt && typeof sytUnitTableHtml==='function') return sytUnitTableHtml();
 if(cat.id==='ubnd-congthuong' && cat.sct && typeof sctUnitTableHtml==='function') return sctUnitTableHtml();
 if(cat.id==='ubnd-xaydung' && cat.sxd && typeof sxdUnitTableHtml==='function') return sxdUnitTableHtml();
 const isTw=isTwRole(cat.role);
 const unitNames=isTw?TW_PROVINCE_NAMES:HN_UNIT_NAMES;
 const cols=cat.items.map(it=>it[0]);
 /* Cấp Trung ương: chưa có API tách theo tỉnh thật, nên fake — chia đều có trọng số (twProvinceSplit) từ đúng
 tổng số đã khai báo ở mỗi chỉ tiêu (it[1]), thay vì luôn hiện 0 như trước. Cấp Thành phố (126 xã/phường) giữ
 nguyên hành vi cũ (0 — dữ liệu giáo dục thật port riêng qua gdRealUnitTableHtml, các lĩnh vực khác chưa có). */
 const colSplits=isTw?cat.items.map(it=>twProvinceSplit(it[1],unitNames,cat.id+'|'+it[0])):null;
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c)}</th>`).join('')}</tr>`;
 /* Dòng "Trung ương (tổng số)" — chỉ cấp Trung ương mới có, luôn đứng đầu bảng (trước 34 tỉnh/thành), tô đậm/nổi
 bật khác màu để phân biệt với hàng tỉnh — hiện đúng tổng số ĐÃ KHAI BÁO ở từng chỉ tiêu (it[1]), tức đúng bằng
 tổng cộng của 34 dòng tỉnh/thành bên dưới (twProvinceSplit chỉ chia lại đúng số này, không bịa thêm), để đối
 chiếu nhanh không cần tự cộng tay. */
 const twTotalRow=isTw?`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Trung ương (tổng số)</td>${cat.items.map(it=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${fmt(it[1])}</td>`).join('')}</tr>`:'';
 const rows=unitNames.map((name,ri)=>`<tr><td>${esc(name)}</td>${cols.map((c,ci)=>`<td class="num" style="text-align:right">${fmt(isTw?colSplits[ci][ri]:0)}</td>`).join('')}</tr>`).join('');
 const note=isTw
 ?'Số liệu minh họa (demo), phân bổ ước tính theo tỉnh/thành từ tổng số đã khai báo — chưa đồng bộ dữ liệu thật theo từng đơn vị.'
 :'Lĩnh vực này chưa có số liệu thật theo từng đơn vị — tạm hiển thị 0, chờ cập nhật dữ liệu.';
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${unitNames.length} đơn vị${isTw?' + Trung ương':''}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">${note}</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*110}px"><thead>${thead}</thead><tbody>${twTotalRow}${rows}</tbody></table>
 </div>
 </div>`;
 }
 /* Bấm bất kỳ box/biểu đồ nào bên trái (trong .cat-two-col) -> đọc số liệu thật của box đó (canvas Chart.js hoặc
 ô số liệu/radial) và hiện bảng chi tiết sang ô bên phải (#dimDetailPanel). Áp dụng chung cho mọi lĩnh vực/chỉ
 tiêu, không cần gắn riêng cho từng box. Tách thành hàm riêng (populateDimDetailFromBox) thay vì viết thẳng
 trong listener — để onCatItemPeriodChange() gọi lại được hàm này mỗi khi đổi kỳ, làm mới đúng bảng bên phải
 NẾU nó đang hiện chi tiết của ĐÚNG box vừa đổi kỳ (theo dõi qua window.__dimPanelSourceBox) — trước đây đổi kỳ
 chỉ vẽ lại biểu đồ bên trái, bảng bên phải (đã bấm xem trước đó) vẫn giữ nguyên số liệu cũ tại thời điểm bấm. */
 function populateDimDetailFromBox(box){
 const wrap=box.closest('.cat-two-col'); const panel=wrap&&wrap.querySelector('#dimDetailPanel'); if(!panel) return;
 const titleEl=box.querySelector('.cdl-title,h4');
 const title=titleEl?titleEl.textContent.trim():'Chi tiết';
 let theadHtml,rows;
 const canvas=box.querySelector('canvas');
 const chart=canvas&&typeof Chart!=='undefined'?Chart.getChart(canvas):null;
 if(chart&&chart.data){
 const labels=chart.data.labels||[]; const datasets=chart.data.datasets||[];
 /* Nếu chart tự định nghĩa tooltip.callbacks.label (thường trả nhiều dòng "Trường: giá trị" hơn số cột
 thật trong dataset), gọi lại đúng hàm đó cho từng điểm dữ liệu để bảng chi tiết hiện đủ y như tooltip khi
 hover — áp dụng chung cho mọi biểu đồ có tooltip riêng, không phải chỉ 1 biểu đồ cụ thể nào. */
 const tooltipCb=chart.options?.plugins?.tooltip?.callbacks?.label;
 let multiField=null;
 if(typeof tooltipCb==='function'){
 try{
 const probe=tooltipCb({chart,dataIndex:0,datasetIndex:0,dataset:datasets[0],label:labels[0],raw:datasets[0]?.data?.[0],parsed:datasets[0]?.data?.[0],formattedValue:String(datasets[0]?.data?.[0]??'')});
 if(Array.isArray(probe)&&probe.length>1) multiField=probe.map(line=>String(line).split(':')[0].trim());
 }catch(e){}
 }
 if(multiField){
 theadHtml=`<tr><th>Hạng mục</th>${multiField.map(f=>`<th style="text-align:right">${esc(f)}</th>`).join('')}</tr>`;
 rows=labels.map((l,i)=>{
 let out=[];
 try{ out=tooltipCb({chart,dataIndex:i,datasetIndex:0,dataset:datasets[0],label:l,raw:datasets[0]?.data?.[i],parsed:datasets[0]?.data?.[i],formattedValue:String(datasets[0]?.data?.[i]??'')})||[]; }catch(e){}
 const vals=(Array.isArray(out)?out:[out]).map(line=>String(line).split(':').slice(1).join(':').trim());
 return `<tr><td>${esc(String(l).replace(/:\s*[\d.,]+$/,''))}</td>${vals.map(v=>`<td class="num" style="text-align:right">${esc(v)}</td>`).join('')}</tr>`;
 }).join('');
 } else {
 theadHtml=`<tr><th>Hạng mục</th>${datasets.map(ds=>`<th style="text-align:right">${esc(ds.label||'Giá trị')}</th>`).join('')}</tr>`;
 rows=labels.map((l,i)=>`<tr><td>${esc(String(l).replace(/:\s*[\d.,]+$/,''))}</td>${datasets.map(ds=>`<td class="num" style="text-align:right">${fmt(ds.data[i])}</td>`).join('')}</tr>`).join('');
 }
 } else {
 const kv=[];
 box.querySelectorAll('.cir-stat-tile,.rank-row').forEach(t=>{
 const lbl=t.querySelector('p,.rank-label'), val=t.querySelector('b,.rank-value');
 if(lbl&&val) kv.push({label:lbl.textContent.trim(),value:val.textContent.trim()});
 });
 box.querySelectorAll('.phanto-radial-item').forEach(t=>{
 const lbl=t.querySelector('span'), val=t.querySelector('svg text');
 if(lbl&&val) kv.push({label:lbl.textContent.trim(),value:val.textContent.trim()});
 });
 const numRe=/^[\d.,]+%?$/;
 box.querySelectorAll('div:not(.cir-stat-tile)').forEach(el=>{
 if(el.children.length!==2||el.querySelector('canvas,input,button,table,svg')) return;
 const a=el.children[0],b=el.children[1];
 const bt=b.textContent.trim();
 if(!numRe.test(bt)) return;
 const at=a.textContent.trim(); if(!at) return;
 kv.push({label:at,value:bt});
 });
 if(!kv.length) return;
 theadHtml=`<tr><th>Hạng mục</th><th style="text-align:right">Giá trị</th></tr>`;
 rows=kv.map(x=>`<tr><td>${esc(x.label)}</td><td class="num" style="text-align:right">${esc(x.value)}</td></tr>`).join('');
 }
 const backBtnUnitCount=window.__dimPanelCat?(isTwRole(window.__dimPanelCat.role)?TW_PROVINCE_NAMES.length:HN_UNIT_NAMES.length):0;
 const backBtnHtml=window.__dimPanelCat?`<button class="ghost" style="flex:0 0 auto;margin-bottom:10px;font-size:11.5px;padding:8px 10px" onclick="restoreUnitListPanel()"> Danh sách ${backBtnUnitCount} đơn vị</button>`:'';
 panel.style.display='flex'; panel.style.flexDirection='column'; panel.style.overflow='hidden';
 panel.innerHTML=`${backBtnHtml}<div class="cdl-title" style="margin-bottom:10px;flex:0 0 auto">${esc(title)}</div>
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;overflow-y:auto;flex:1 1 auto">
 <table class="iip-table"><thead>${theadHtml}</thead><tbody>${rows}</tbody></table>
 </div>`;
 window.__dimPanelSourceBox=box;
 }
 document.addEventListener('click',function(e){
 const box=e.target.closest('.cat-two-col .cat-chart-box'); if(!box||box.id==='dimDetailPanel') return;
 /* Dropdown kỳ giờ là combobox tự dựng (.ms-wrap, xem catBoxHeaderHtml) — bấm mở/chọn trong đó không được
 tính là "bấm vào thẻ" (tránh vừa mở dropdown vừa nhảy sang xem chi tiết bên phải), thay cho cách cũ chặn
 bằng event.stopPropagation() ngay trên <select> gốc (không còn dùng <select> gốc ở nhánh này nữa). */
 if(e.target.closest('.ms-wrap')) return;
 populateDimDetailFromBox(box);
 });
 function restoreUnitListPanel(){
 const panel=document.getElementById('dimDetailPanel'); const cat=window.__dimPanelCat; if(!panel||!cat) return;
 panel.outerHTML=genUnitTableHtml(cat);
 window.__dimPanelSourceBox=null;
 syncGenUnitBoxHeight();
 }
 /* Xuất 1 "ô chỉ tiêu" (1 category — VD "Đội ngũ cán bộ lãnh đạo, quản lý (CB.1)") ra file .xlsx, dùng chung cho
 MỌI lĩnh vực trong app (không riêng khối Trung ương) — gọi từ nút "⬇ Xuất Excel" ở drawerHeadActions, xem
 openCategoryDetail() trong subtasks.js. Các sheet trong 1 file:
 1) "Chỉ tiêu": đúng các dòng items[] (tên/giá trị/kỳ/nguồn) hiện trên thẻ.
 2) "Phân tổ": mọi breakdown S()/P() gắn theo từng chỉ tiêu (nếu có) — làm phẳng thành 1 bảng dài (dữ liệu thô,
 phòng khi cần lọc/tính toán lại).
 3) "34 tỉnh thành": CHỈ có ở cấp Trung ương — đúng số liệu đang hiện trong bảng "danh sách N đơn vị + Trung ương"
 bên phải drawer (dùng lại twProvinceSplit() nên xuất ra khớp 100% với những gì đang xem trên màn hình).
 4) "Biểu đồ": CHỤP NGUYÊN từng khung thẻ chỉ tiêu đang mở trên màn hình (tiêu đề + dropdown kỳ + biểu đồ + chú
 thích) thành 1 ảnh/thẻ bằng html2canvas — giữ đúng hình dạng trực quan như đang xem, không quy về bảng số.
 Giới hạn: chỉ chụp được thẻ đang THỰC SỰ hiển thị trong DOM lúc bấm xuất (đúng lĩnh vực đang mở drawer). */
 async function exportCategoryToExcel(role,catId){
 if(typeof ExcelJS==='undefined'||typeof html2canvas==='undefined'){toast('Thư viện xuất Excel chưa tải xong, thử lại sau giây lát.');return;}
 const cat=(categorySeedForRole(role)||[]).find(c=>c.id===catId); if(!cat){toast('Không tìm thấy lĩnh vực này.');return;}
 ensureFakeCategoryItems(role,catId);
 const items=cat.items||[];
 if(!items.length){toast('Lĩnh vực này chưa có chỉ tiêu để xuất.');return;}
 toast('Đang tạo file Excel, vui lòng đợi...');
 const wb=new ExcelJS.Workbook();
 const ws1=wb.addWorksheet('Chỉ tiêu');
 ws1.addRow(['Tên chỉ tiêu','Giá trị','Kỳ báo cáo','Nguồn']).font={bold:true};
 items.forEach(it=>ws1.addRow([it[0],Number(it[1])||0,it[2]||'',it[3]||'']));
 ws1.columns.forEach(c=>c.width=30);
 const breakdownRows=[];
 items.forEach(it=>(it[4]||[]).forEach(p=>(p.items||[]).forEach(x=>breakdownRows.push([it[0],p.dim||'',x.label,Number(x.value)||0]))));
 if(breakdownRows.length){
 const ws2=wb.addWorksheet('Phân tổ');
 ws2.addRow(['Tên chỉ tiêu','Nhóm phân tổ','Hạng mục','Giá trị']).font={bold:true};
 breakdownRows.forEach(r=>ws2.addRow(r));
 ws2.columns.forEach(c=>c.width=28);
 }
 if(isTwRole(role)){
 const unitNames=TW_PROVINCE_NAMES;
 const ws3=wb.addWorksheet('34 tỉnh thành');
 ws3.addRow(['Đơn vị',...items.map(it=>it[0])]).font={bold:true};
 ws3.addRow(['Trung ương (tổng số)',...items.map(it=>Number(it[1])||0)]);
 const colSplits=items.map(it=>twProvinceSplit(it[1],unitNames,cat.id+'|'+it[0]));
 unitNames.forEach((name,ri)=>ws3.addRow([name,...items.map((it,ci)=>colSplits[ci][ri])]));
 ws3.columns.forEach(c=>c.width=22);
 }
 const cards=Array.from(document.querySelectorAll('#drawerBody .cat-item-list .cat-chart-box'));
 if(cards.length){
 const wsImg=wb.addWorksheet('Biểu đồ');
 let rowCursor=0;
 for(const card of cards){
 try{
 const shot=await html2canvas(card,{backgroundColor:null,scale:2});
 const dataUrl=shot.toDataURL('image/png');
 const imgId=wb.addImage({base64:dataUrl,extension:'png'});
 const rect=card.getBoundingClientRect();
 wsImg.addImage(imgId,{tl:{col:0,row:rowCursor},ext:{width:rect.width,height:rect.height}});
 rowCursor+=Math.ceil(rect.height/20)+2;
 }catch(e){}
 }
 } else {
 toast('Không tìm thấy thẻ chỉ tiêu nào đang mở để chụp — mở lại lĩnh vực này rồi thử xuất lại.');
 }
 const buf=await wb.xlsx.writeBuffer();
 const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 const safeName=(cat.name||'chi_tieu').replace(/[\\/:*?"<>|]/g,'').slice(0,80);
 a.href=url; a.download=`Chi_tieu_${safeName}.xlsx`;
 document.body.appendChild(a); a.click(); a.remove();
 URL.revokeObjectURL(url);
 toast('Đã xuất file Excel.');
 }
 function genFilterUnitTable(input){
 const wrap=input.closest('.cat-chart-box'); if(!wrap) return;
 const q=input.value.trim().toLowerCase();
 wrap.querySelectorAll('tbody tr').forEach(r=>{r.style.display=r.children[0].textContent.toLowerCase().includes(q)?'':'none';});
 }
 /* Đo chiều cao thật của cột chỉ tiêu (trái) rồi gán cứng cho khung 126 đơn vị (phải) — tránh vòng lặp
 tính toán của CSS grid/flex khi nội dung bảng 126 dòng không bị giới hạn chiều cao. */
 function syncGenUnitBoxHeight(){
 document.querySelectorAll('.cat-two-col').forEach(wrap=>{
 const left=wrap.children[0], box=wrap.querySelector('.gen-unit-box');
 if(!left||!box) return;
 /* Sàn tối thiểu nâng 320 -> 560px — lĩnh vực chỉ có 1-2 chỉ tiêu (cột trái rất ngắn, VD VTVL.1-4 chỉ 1 dòng)
 trước đây ép khung "danh sách N đơn vị" bên phải xuống còn ~320px, chỉ đủ hiện 5-6 hàng phải cuộn liên tục
 dù nội dung bảng còn rất nhiều đơn vị. Không đổi hành vi khi cột trái cao hơn 560px (vẫn theo Math.max). */
 box.style.height=Math.max(left.offsetHeight,560)+'px';
 });
 }
