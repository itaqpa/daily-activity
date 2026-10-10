
(function(){
"use strict";

/* =========================================================
   REFERENCE DATA (untuk validasi awal — verifikasi ke standar resmi)
   ========================================================= */
const NPS = [['1/2"',15],['3/4"',20],['1"',25],['1-1/4"',32],['1-1/2"',40],['2"',50],['2-1/2"',65],['3"',80],['4"',100],['5"',125],['6"',150],['8"',200],['10"',250],['12"',300],['14"',350],['16"',400],['18"',450],['20"',500],['24"',600]];
const A150 = [[88.9,60.3,4,15.9],[98.4,69.9,4,15.9],[108,79.4,4,15.9],[117.5,88.9,4,15.9],[127,98.4,4,15.9],[152.4,120.7,4,19.1],[177.8,139.7,4,19.1],[190.5,152.4,4,19.1],[228.6,190.5,8,19.1],[254,215.9,8,22.2],[279.4,241.3,8,22.2],[342.9,298.5,8,22.2],[406.4,362,12,25.4],[482.6,431.8,12,25.4],[533.4,476.3,12,28.6],[596.9,539.8,16,28.6],[635,577.9,16,31.8],[698.5,635,20,31.8],[812.8,749.3,20,34.9]];
const A300 = [[95.3,66.7,4,15.9],[117.5,82.6,4,19.1],[123.8,88.9,4,19.1],[133.4,98.4,4,19.1],[155.6,114.3,4,22.2],[165.1,127,8,19.1],[190.5,149.2,8,22.2],[209.6,168.3,8,22.2],[254,200,8,22.2],[279.4,235,8,22.2],[317.5,269.9,12,22.2],[381,330.2,12,25.4],[444.5,387.4,16,28.6],[520.7,450.8,16,31.8],[584.2,514.4,20,31.8],[647.7,571.5,20,34.9],[711.2,628.7,24,34.9],[774.7,685.8,24,34.9],[914.4,812.8,24,41.3]];
const asmeRows = t => NPS.map((n,i)=>[n[0]+' (DN'+n[1]+')'].concat(t[i]));
const FL = {
  "ASME B16.5 Class 150": asmeRows(A150),
  "ASME B16.5 Class 300": asmeRows(A300),
  "JIS B2220 10K": [['DN25',125,90,4,19],['DN40',140,105,4,19],['DN50',155,120,4,19],['DN65',175,140,4,19],['DN80',185,150,8,19],['DN100',210,175,8,19],['DN125',250,210,8,23],['DN150',280,240,8,23],['DN200',330,290,12,23],['DN250',400,355,12,25],['DN300',445,400,16,25],['DN350',490,445,16,25],['DN400',560,510,16,27],['DN450',620,565,20,27],['DN500',675,620,20,27],['DN600',795,730,24,33]],
  "EN 1092 / DIN PN10": [['DN25',115,85,4,14],['DN40',150,110,4,18],['DN50',165,125,4,18],['DN65',185,145,8,18],['DN80',200,160,8,18],['DN100',220,180,8,18],['DN125',250,210,8,18],['DN150',285,240,8,22],['DN200',340,295,8,22],['DN250',395,350,12,22],['DN300',445,400,12,22],['DN350',505,460,16,22],['DN400',565,515,16,26],['DN450',615,565,20,26],['DN500',670,620,20,26],['DN600',780,725,20,30]],
  "EN 1092 / DIN PN16": [['DN25',115,85,4,14],['DN40',150,110,4,18],['DN50',165,125,4,18],['DN65',185,145,8,18],['DN80',200,160,8,18],['DN100',220,180,8,18],['DN125',250,210,8,18],['DN150',285,240,8,22],['DN200',340,295,12,22],['DN250',405,355,12,26],['DN300',460,410,12,26],['DN350',520,470,16,26],['DN400',580,525,16,30],['DN450',640,585,20,30],['DN500',715,650,20,33],['DN600',840,770,20,36]]
};
/* ASME B16.20 SWG untuk flange B16.5 (inch): inner ring ID, winding ID, winding OD (Class 150), centering ring OD Class 150 & 300 */
const SWGT = [[.56,.75,1.25,1.88,2.12],[.81,1.00,1.56,2.25,2.62],[1.06,1.25,1.88,2.62,2.88],[1.50,1.88,2.38,3.00,3.25],[1.75,2.12,2.75,3.38,3.75],[2.19,2.75,3.38,4.12,4.38],[2.62,3.25,3.88,4.88,5.12],[3.19,4.00,4.75,5.38,5.88],[4.19,5.00,5.88,6.88,7.12],[5.19,6.12,7.00,7.75,8.50],[6.19,7.19,8.25,8.75,9.88],[8.50,9.19,10.38,11.00,12.12],[10.56,11.31,12.50,13.38,14.25],[12.50,13.38,14.75,16.13,16.62],[13.75,14.63,16.00,17.75,19.12],[15.75,16.63,18.25,20.25,21.25],[17.69,18.69,20.75,21.62,23.50],[19.69,20.69,22.75,23.88,25.75],[23.75,24.75,27.00,28.25,30.50]];
const PACK_STD = [3,4,5,6,6.5,8,9.5,10,11,12,12.5,13,14,15,16,17.5,19,20,22,24,25];
const RUBBER = ['EPDM','NBR','Neoprene (CR)','Natural rubber','Butyl (IIR)','Hypalon (CSM)','Viton (FKM)','Tidak diketahui'];
const RUBBER_T = {'EPDM':120,'NBR':100,'Neoprene (CR)':100,'Natural rubber':70,'Butyl (IIR)':120,'Hypalon (CSM)':110,'Viton (FKM)':200};
const INS_T = {'Glass wool':450,'Mineral / rock wool':650,'Ceramic fiber':1100,'Aerogel':650};
const SHAPES = ['Bulat','Kotak (rectangular)','Reducer konsentris','Reducer eksentris','Offset','Elbow / mitered','Oval','Lainnya'];
const CUSTOM = 'Custom (spesifikasi / drawing client)';

/* ---------- conditions ---------- */
const isKotak = f => /Kotak|Oval|Rectangular/.test(f.bentuk||'');
const isRound = f => !isKotak(f);
const isRed = f => /Reducer/.test(f.bentuk||'');
const isFl = f => f.koneksi==='Flange';
const isAsme = f => /^ASME/.test(f.fl_std||'');
const hasInner = f => /CGI|RIR/.test(f.g_type||'');
const hasOuter = f => /^CG/.test(f.g_type||'');
const isCustom = f => f.acuan===CUSTOM;

/* ---------- section builders ---------- */
const sel = (k,l,o,x) => Object.assign({k,l,ty:'sel',o},x||{});
const num = (k,l,u,x) => Object.assign({k,l,ty:'num',u},x||{});
const txt = (k,l,x) => Object.assign({k,l},x||{});

function S_IDENT(extra, qtyLabel){
  return {id:'ident',t:'Identifikasi',f:[
    txt('tag','Tag number',{crit:1}), {k:'day',l:'Hari survey',ty:'day'},
    txt('line','Line / sistem / equipment'), txt('posisi','Posisi / lokasi pemasangan',{crit:1,ph:'mis. discharge pompa P-101A'})
  ].concat(extra||[],[
    num('qty',qtyLabel||'Jumlah','pcs',{crit:1}), num('spare','Spare','pcs'),
    txt('merek','Merek / pabrikan lama'), txt('tipe_lama','Tipe / marking lama'),
    sel('alasan','Alasan penggantian',['Rusak / bocor','Umur pakai','Preventive (shutdown)','Upgrade','Instalasi baru','Lainnya'],{crit:1})
  ])};
}
function S_ACUAN(stds){
  return {id:'acuan',t:'Acuan & validasi',helper:'validate',f:[
    sel('acuan','Acuan data',stds.concat([CUSTOM]),{crit:1,rr:1}),
    txt('acuan_doc','No. dokumen / drawing acuan',{show:isCustom,crit:1}),
    num('tol','Toleransi ukur','mm',{ph:'default 3'})
  ]};
}
function S_PROSES(o){
  o=o||{}; const pu=o.pu||'bar';
  let f=[txt('media','Media / fluida',{crit:!o.mediaOpt,ph:'mis. air laut, steam, flue gas'}), txt('konsentrasi','Konsentrasi (jika kimia)'),
    num('p_op','Tekanan operasi',pu,{crit:!o.pOpt}), num('p_des','Tekanan design',pu), num('p_test','Tekanan test',pu),
    num('t_op','Temperatur operasi','°C',{crit:1}), num('t_des','Temperatur design / maks','°C')];
  if(o.vakum) f=f.concat([sel('vakum','Kondisi vakum',['Tidak','Ya'],{crit:1}), txt('vakum_val','Nilai vakum',{ph:'mis. -0,5 bar'})]);
  f=f.concat(o.extra||[]);
  f.push(sel('lingkungan','Lingkungan luar',['Indoor','Outdoor','Outdoor dekat laut','Area bahan kimia']));
  f.push(sel('sumber','Sumber data proses',['Operator / engineer plant','Datasheet','Gauge di lokasi','Asumsi surveyor']));
  return {id:'proses',t:'Kondisi operasi',f};
}
function S_GEOM(extra){
  return {id:'dimensi',t:'Bentuk & dimensi',f:[
    sel('bentuk','Bentuk',SHAPES,{crit:1,rr:1}),
    sel('koneksi','Koneksi',['Flange','Clamp','Welded'],{crit:1,rr:1}),
    txt('size1','Ukuran nominal',{ph:'mis. DN200 / 8"',crit:1,show:isRound}),
    num('id1','Diameter dalam (ID)','mm',{show:isRound}),
    txt('size2','Ukuran sisi 2',{crit:1,show:isRed}),
    num('ecc','Offset eksentris','mm',{show:f=>/eksentris/.test(f.bentuk||'')}),
    num('dim_p','Dimensi dalam sisi P','mm',{crit:1,show:isKotak}),
    num('dim_l','Dimensi dalam sisi L','mm',{crit:1,show:isKotak}),
    num('radius','Radius sudut dalam','mm',{show:f=>/Kotak/.test(f.bentuk||'')}),
    txt('dim_2','Dimensi sisi 2 jika transisi (P × L)',{show:isKotak}),
    num('elbow','Sudut elbow','°',{show:f=>/Elbow/.test(f.bentuk||'')}),
    num('offs','Besar offset','mm',{show:f=>f.bentuk==='Offset'}),
    num('ftf','Panjang terpasang (face-to-face)','mm',{crit:1}),
    num('ftf_lama','Panjang joint lama (bebas)','mm'),
    sel('orientasi','Orientasi',['Horizontal','Vertikal','Miring'])
  ].concat(extra||[])};
}
const S_FLANGE = {id:'flange',t:'Koneksi: flange',helper:'flange',show:isFl,f:[
  sel('std','Standar flange',Object.keys(FL).concat(['Non-standar / custom','Tidak diketahui']),{crit:1,show:isRound,rr:1}),
  num('f_od','Diameter luar flange (OD)','mm',{crit:1,show:isRound}),
  num('pcd','PCD (bolt circle)','mm',{crit:1,show:isRound}),
  num('n_bolt','Jumlah lubang baut','lubang',{crit:1,show:isRound}),
  num('hole','Diameter lubang baut','mm',{crit:1,show:isRound}),
  num('fr_w','Lebar flange / frame','mm',{crit:1,show:isKotak}),
  num('fr_np','Jumlah lubang sisi P','lubang',{crit:1,show:isKotak}),
  num('fr_nl','Jumlah lubang sisi L','lubang',{crit:1,show:isKotak}),
  num('fr_hole','Diameter lubang','mm',{crit:1,show:isKotak}),
  num('fr_pitch','Jarak antar lubang (pitch)','mm',{show:isKotak}),
  txt('fr_bc','Jarak pusat lubang P × L (bolt centre)',{show:isKotak}),
  num('f_thk','Tebal flange / frame','mm'),
  sel('face','Tipe face mating flange',['Flat face','Raised face']),
  txt('bolt','Ukuran baut',{ph:'mis. M20 / 3/4"'}), num('bolt_len','Panjang baut','mm'),
  {k:'flange2',l:'Data flange sisi 2 (reducer / berbeda)',ty:'area',show:isRed}
]};
const S_CLAMP = {id:'clamp',t:'Koneksi: clamp',show:f=>f.koneksi==='Clamp',f:[
  num('cl_od','OD pipa / duct','mm',{crit:1}), num('cl_len','Panjang cuff / sleeve','mm',{crit:1}),
  sel('cl_type','Tipe clamp',['Hose clamp / band','Clamp bar (bolted)','Quick clamp','Lainnya'],{crit:1}),
  num('cl_w','Lebar band / bar','mm'), num('cl_qty','Jumlah clamp per sisi','pcs'),
  sel('cl_mat','Material clamp',['SS304','SS316','Carbon steel galvanis','Lainnya'])
]};
const S_WELD = {id:'weld',t:'Koneksi: welded',show:f=>f.koneksi==='Welded',f:[
  num('w_od','OD pipa / duct','mm',{crit:1}), txt('w_thk','Tebal dinding / schedule',{crit:1,ph:'mis. SCH 40 / 6 mm'}),
  txt('w_mat','Material pipa / duct',{crit:1,ph:'mis. A106 Gr.B'}),
  sel('w_prep','Persiapan ujung',['Bevel 37,5°','Square end','Lainnya']), num('w_len','Panjang weld end / nipple','mm')
]};
function S_MOVE(extra){
  return {id:'movement',t:'Pergerakan',helper:'gap',f:[
    num('ax_c','Kompresi aksial','mm'), num('ax_e','Ekstensi aksial','mm'), num('lat','Lateral','mm'), num('ang','Angular','°'),
    num('ang_mis','Misalignment angular terukur','°'), num('lat_mis','Misalignment lateral terukur','mm')
  ].concat(extra||[],[sel('mov_src','Sumber data pergerakan',['Data design','Pengukuran lapangan','Estimasi'])])};
}
const S_INSTAL = {id:'instalasi',t:'Kondisi instalasi',f:[
  sel('anchor','Anchor terdekat',['Ada','Tidak ada','Tidak jelas']), num('anchor_jarak','Jarak ke anchor','mm'),
  sel('guide','Guide / support',['Memadai','Kurang','Tidak ada']), num('clear','Ruang kerja (clearance)','mm'),
  sel('mating','Kondisi mating flange / ujung',['Baik','Korosi ringan','Korosi berat','Tidak rata']),
  sel('akses','Akses lokasi',['Mudah','Perlu tangga','Perlu scaffolding','Confined space']), txt('shutdown','Jadwal shutdown')
]};
const S_KONDISI = {id:'kondisi',t:'Kondisi existing',helper:'fail',f:[num('umur','Umur pakai','tahun'),{k:'kondisi_ket',l:'Keterangan kondisi',ty:'area'}]};
const S_KOM = {id:'komersial',t:'Kebutuhan komersial',f:[
  txt('sertifikat','Sertifikat diminta',{ph:'mis. mill cert, hydrotest, PMI'}),
  sel('approval','Perlu approval drawing',['Ya','Tidak']), txt('delivery','Target delivery'),
  sel('pasang','Jasa pemasangan',['Termasuk','Tidak termasuk','Belum ditentukan']), {k:'ket',l:'Catatan item',ty:'area'}
]};
const S_FOTO = {id:'foto',t:'Foto',helper:'photo',f:[]};
const G_FLANGE = (show) => ({id:'gflange',t:'Data flange',show,f:[
  sel('fl_std','Standar flange',['ASME B16.5','ASME B16.47 Series A','ASME B16.47 Series B','EN 1092-1','JIS B2220','Non-standar / custom'],{crit:1,rr:1}),
  sel('nps','Ukuran (NPS)',NPS.map(n=>n[0]).concat(['26" ke atas','Lainnya']),{crit:1,show:isAsme}),
  sel('cls','Class',['150','300','400','600','900','1500','2500'],{crit:1,show:isAsme}),
  txt('dn','Ukuran (DN)',{crit:1,show:f=>!isAsme(f),ph:'mis. DN150'}),
  txt('pn','Rating',{crit:1,show:f=>!isAsme(f),ph:'mis. PN16 / 10K'}),
  sel('facing','Tipe facing',['Raised face (RF)','Flat face (FF)','Tongue & groove (TG)','Male-female (MF)','Lainnya'],{crit:1}),
  txt('bolt','Ukuran baut'), num('bolt_qty','Jumlah baut','pcs'),
  sel('fl_cond','Kondisi permukaan flange',['Baik','Goresan ringan','Goresan dalam / pitting','Perlu refacing'])
]});
function S_BOX(stemLabel, extra){
  return {id:'box',t:'Dimensi stuffing box',helper:'box',f:[
    num('d_shaft',stemLabel,'mm',{crit:1}), num('d_bore','Diameter bore stuffing box','mm',{crit:1}),
    num('depth','Kedalaman stuffing box','mm',{crit:1})
  ].concat(extra||[])};
}

/* =========================================================
   PRODUCTS
   ========================================================= */
const P = {
 EJR:{name:'Expansion Joint Rubber',grp:'Expansion joint',
  std:['FSA-PSJ-701','EN / DIN','JIS'],
  fails:['Retak','Blister / menggelembung','Swelling / mengembang','Mengeras / getas','Erosi bagian dalam','Bocor','Pecah (burst)','Arch berubah bentuk','Ring / baut berkarat'],
  cols:['tag','posisi','bentuk','koneksi','size1','ftf','media','p_op','t_op','rubber','qty'],
  secs:[S_IDENT(),S_ACUAN(['FSA-PSJ-701','EN / DIN','JIS']),
   S_PROSES({vakum:1,extra:[sel('abrasif','Partikel abrasif',['Tidak ada','Sedikit','Tinggi']),sel('getaran','Getaran / pulsasi',['Tidak ada','Ringan','Tinggi'])]}),
   S_GEOM([sel('arch','Tipe arch',['Single arch','Double arch','Triple arch','Filled arch','Spherical','Tanpa arch'],{crit:1}),num('arch_h','Tinggi arch','mm'),num('arch_w','Lebar arch','mm')]),
   S_FLANGE,S_CLAMP,S_WELD,S_MOVE(),
   {id:'material',t:'Material & konstruksi',f:[
    sel('rubber','Material rubber (tube)',RUBBER,{crit:1}), sel('cover','Material cover',RUBBER), num('shore','Kekerasan terukur','Shore A'),
    sel('reinf','Reinforcement',['Nylon','Polyester','Steel wire','Tidak diketahui']),
    sel('f_type','Tipe flange joint',['Integral rubber flange + retaining ring','Floating steel flange','Lainnya'],{crit:1,show:isFl}),
    sel('ring','Material retaining ring / flange',['Carbon steel galvanis','Carbon steel cat','SS304','SS316','Tidak ada']),
    sel('rod','Control rod',['Tidak ada','Ada'],{crit:1}), num('rod_qty','Jumlah control rod','pcs'), num('rod_dia','Diameter control rod','mm'),
    sel('liner','Lining / liner',['Tidak ada','PTFE lining','Flow liner (sleeve)','Lainnya']),
    sel('vring','Vacuum ring',['Tidak ada','Ada'])]},
   S_INSTAL,S_KONDISI,S_KOM,S_FOTO]},
 EJM:{name:'Expansion Joint Metal',grp:'Expansion joint',
  std:['EJMA 10th Edition','ASME B31.3 Appendix X','EN 14917'],
  fails:['Retak bellows','Korosi / pitting','Squirm / tidak stabil','Convolution penyok','Liner rusak','Tie rod / hinge bengkok','Bocor','Insulasi rusak'],
  cols:['tag','posisi','bentuk','koneksi','bel_type','size1','ftf','p_des','t_des','bel_mat','cycles','qty'],
  secs:[S_IDENT(),S_ACUAN(['EJMA 10th Edition','ASME B31.3 Appendix X','EN 14917']),
   S_PROSES({vakum:1,extra:[sel('fase','Fase fluida',['Cair','Gas / uap','Dua fase']),num('vel','Kecepatan aliran','m/s'),sel('getaran','Getaran / pulsasi',['Tidak ada','Ringan','Tinggi'])]}),
   S_GEOM([sel('bel_type','Tipe expansion joint',['Single','Universal','Tied universal','Hinged','Gimbal','Pressure balanced','Lainnya'],{crit:1}),num('conv','Jumlah convolution','pcs'),num('bel_od','OD bellows','mm')]),
   S_FLANGE,S_CLAMP,S_WELD,S_MOVE([num('cycles','Jumlah siklus design','siklus',{crit:1}),txt('life','Umur design',{ph:'mis. 20 tahun'})]),
   {id:'material',t:'Material & konstruksi',f:[
    sel('bel_mat','Material bellows',['SS304','SS316L','SS321','Inconel 625','Incoloy 825','Hastelloy C-276','Lainnya'],{crit:1}),
    num('plies','Jumlah ply','ply'), num('bel_thk','Tebal per ply','mm'), txt('end_mat','Material flange / weld end',{crit:1,ph:'mis. A105, SS304'}),
    sel('liner','Internal liner',['Tidak ada','Ada'],{crit:1}), txt('liner_mat','Material liner'),
    sel('coverm','External cover',['Tidak ada','Ada']),
    sel('hardware','Hardware',['Tidak ada','Tie rod','Limit rod','Hinge','Gimbal','Lainnya'],{crit:1}),
    sel('insul','Insulasi eksternal',['Tidak ada','Ada'])]},
   S_INSTAL,S_KONDISI,S_KOM,S_FOTO]},
 EJF:{name:'Expansion Joint Fabric',grp:'Expansion joint',
  std:['ESCA / FSA Fabric Expansion Joint Guide','EJMA (frame & duct)'],
  fails:['Sobek / berlubang','Hangus / terbakar','Mengeras / getas','Bocor gas','Korosi frame','Kondensat / asam','Insulasi pillow rusak','Baut / backing bar lepas'],
  cols:['tag','posisi','bentuk','koneksi','dim_p','dim_l','size1','breach','t_op','p_op','outer','qty'],
  secs:[S_IDENT(),S_ACUAN(['ESCA / FSA Fabric Expansion Joint Guide','EJMA (frame & duct)']),
   S_PROSES({pu:'mbar',extra:[num('t_exc','Temperatur excursion (sesaat)','°C'),sel('dust','Kandungan debu',['Rendah','Sedang','Tinggi']),sel('dew','Potensi kondensasi asam',['Tidak','Ya']),txt('flow','Laju aliran gas')]}),
   S_GEOM([sel('belt','Tipe belt',['Flat belt','U-belt / omega','Flanged belt (L)','Lainnya'],{crit:1}),num('breach','Breach opening (celah duct)','mm',{crit:1}),num('fr_h','Tinggi frame','mm')]),
   S_FLANGE,S_CLAMP,S_WELD,S_MOVE(),
   {id:'material',t:'Material & konstruksi',f:[
    sel('outer','Layer luar',['PTFE-coated glass fabric','Silicone-coated glass fabric','Fluoroelastomer (FKM) fabric','EPDM fabric','Lainnya'],{crit:1}),
    sel('seal','Gas seal',['PTFE film','SS foil','Tidak ada']), num('layers','Jumlah layer','layer'),
    sel('insul_mat','Insulasi',['Tidak ada','Glass wool / mat','Ceramic fiber','Lainnya']),
    sel('pillow','Insulation pillow',['Tidak ada','Ada'],{crit:1}), sel('baffle','Baffle / flow liner',['Tidak ada','Ada']),
    sel('frame_mat','Material frame',['Carbon steel','SS304','SS316','Corten','Lainnya']), txt('backing','Backing bar (lebar × tebal)')]},
   S_INSTAL,S_KONDISI,S_KOM,S_FOTO]},
 SWG:{name:'Spiral Wound Gasket',grp:'Gasket',
  std:['ASME B16.20','EN 1514-2','JIS B2404'],
  fails:['Winding buckling / masuk bore','Filler hilang / terkikis','Outer ring korosi','Over-compressed','Bocor','Salah ukuran'],
  cols:['tag','line','fl_std','nps','cls','dn','pn','g_type','wind','filler','qty'],
  secs:[S_IDENT(),S_ACUAN(['ASME B16.20','EN 1514-2','JIS B2404']),
   S_PROSES({extra:[sel('siklus','Siklus termal',['Tidak','Ya'])]}),
   G_FLANGE(),
   {id:'gasket',t:'Konstruksi gasket',f:[
    sel('g_type','Tipe',['CG (outer ring)','CGI (inner & outer ring)','R (winding saja)','RIR (inner ring)','Heat exchanger (dengan rib)'],{crit:1,rr:1}),
    sel('wind','Material winding',['SS304','SS316L','SS321','Inconel 600','Monel 400','Lainnya'],{crit:1}),
    sel('filler','Filler',['Flexible graphite','PTFE','Mica','Ceramic','Lainnya'],{crit:1}),
    sel('ir_mat','Material inner ring',['SS304','SS316L','SS321','Inconel','Lainnya'],{show:hasInner,crit:1}),
    sel('or_mat','Material outer ring',['Carbon steel','SS304','SS316'],{show:hasOuter,crit:1}),
    sel('g_thk','Tebal',['4,5 mm','3,2 mm','6,4 mm','Lainnya'])]},
   {id:'gdim',t:'Dimensi terukur',f:[
    num('d_ir','ID inner ring','mm',{show:hasInner}), num('d_wid','ID winding','mm',{crit:1}),
    num('d_wod','OD winding','mm',{crit:1}), num('d_or','OD outer ring','mm',{show:hasOuter,crit:1})]},
   S_KONDISI,S_KOM,S_FOTO]},
 GMG:{name:'Grooved Metal Gasket',grp:'Gasket',
  std:['ASME B16.20 (kammprofile)','EN 1514-6','TEMA (heat exchanger)'],
  fails:['Facing rusak / hilang','Core korosi','Rib patah','Deformasi','Bocor','Salah ukuran'],
  cols:['tag','line','app','g_shape','d_id','d_od','g_p','g_l','core','facing','qty'],
  secs:[S_IDENT(),S_ACUAN(['ASME B16.20 (kammprofile)','EN 1514-6','TEMA (heat exchanger)']),
   S_PROSES({extra:[sel('siklus','Siklus termal',['Tidak','Ya'])]}),
   {id:'app',t:'Aplikasi',f:[sel('app','Aplikasi',['Flange pipa','Heat exchanger','Vessel / manhole','Lainnya'],{crit:1,rr:1}),txt('eq_tag','Tag equipment'),{k:'app_ket',l:'Keterangan aplikasi',ty:'area'}]},
   G_FLANGE(f=>f.app==='Flange pipa'),
   {id:'gasket',t:'Konstruksi & dimensi gasket',f:[
    sel('g_shape','Bentuk',['Bulat','Bulat dengan rib (pass partition)','Oval','Kotak','Lainnya'],{crit:1,rr:1}),
    sel('g_type','Tipe',['Integral outer ring','Loose outer ring','Tanpa outer ring'],{crit:1,rr:1}),
    sel('core','Material core',['SS304','SS316L','SS321','Duplex','Inconel','Lainnya'],{crit:1}),
    sel('facing','Facing',['Flexible graphite','PTFE','Mica','Silver','Lainnya'],{crit:1}),
    num('core_thk','Tebal core','mm'),
    num('d_id','ID gasket','mm',{crit:1,show:f=>!/Oval|Kotak/.test(f.g_shape||'')}),
    num('d_od','OD sealing / core','mm',{crit:1,show:f=>!/Oval|Kotak/.test(f.g_shape||'')}),
    num('g_p','Dimensi P (luar)','mm',{crit:1,show:f=>/Oval|Kotak/.test(f.g_shape||'')}),
    num('g_l','Dimensi L (luar)','mm',{crit:1,show:f=>/Oval|Kotak/.test(f.g_shape||'')}),
    num('g_w','Lebar sealing','mm',{show:f=>/Oval|Kotak/.test(f.g_shape||'')}),
    num('d_or','OD outer ring','mm',{show:f=>/outer ring/.test(f.g_type||'')&&!/Tanpa/.test(f.g_type||''),crit:1}),
    num('rib_n','Jumlah rib','pcs',{show:f=>/rib/.test(f.g_shape||''),crit:1}),
    num('rib_w','Lebar rib','mm',{show:f=>/rib/.test(f.g_shape||'')}),
    {k:'rib_note',l:'Layout rib (keterangan / referensi foto)',ty:'area',show:f=>/rib/.test(f.g_shape||'')}]},
   S_KONDISI,S_KOM,S_FOTO]},
 RTI:{name:'Removable Thermal Insulation',grp:'Insulasi',
  std:['ASTM C1055 (suhu permukaan)','ASTM C680 (heat loss)','CINI'],
  fails:['Jacket sobek','Basah / terkontaminasi oli','Insulasi hangus','Fastener rusak','Tidak ada insulasi (bare)'],
  cols:['tag','comp','size','comp_l','comp_h','t_op','t_target','ins_mat','ins_thk','qty'],
  secs:[S_IDENT(),S_ACUAN(['ASTM C1055 (suhu permukaan)','ASTM C680 (heat loss)','CINI']),
   {id:'komponen',t:'Komponen yang diinsulasi',f:[
    sel('comp','Jenis komponen',['Valve gate','Valve globe','Valve ball','Control valve','Pasangan flange','Strainer','Pump casing','Turbine casing','Expansion joint','Elbow','Tee','Pipa lurus','Heat exchanger head','Lainnya'],{crit:1}),
    txt('size','Ukuran pipa',{crit:1,ph:'mis. 6" / DN150'}), txt('rating','Rating / class'),
    num('comp_l','Panjang komponen','mm',{crit:1}), num('comp_h','Tinggi total','mm',{crit:1}), num('comp_w','Lebar maksimum','mm'),
    num('fl_od','OD flange','mm'), sel('hw','Handwheel / aktuator',['Di luar jacket','Di dalam jacket','Tidak ada']),
    num('clr','Clearance sekitar','mm'), sel('pattern','Pola / sketsa dibuat',['Ya','Belum'],{crit:1})]},
   {id:'proses',t:'Kondisi termal',f:[
    num('t_op','Temperatur permukaan operasi','°C',{crit:1}), num('t_des','Temperatur maksimum','°C'),
    num('t_amb','Temperatur ambient','°C'), num('t_target','Target suhu permukaan jacket','°C',{crit:1}),
    txt('media','Media dalam pipa'), sel('lingkungan','Lingkungan',['Indoor','Outdoor','Outdoor dekat laut','Area bahan kimia']),
    sel('tujuan_ins','Tujuan insulasi',['Keselamatan personel','Hemat energi','Proses (jaga suhu)','Kebisingan'])]},
   {id:'desain',t:'Desain jacket',f:[
    sel('ins_mat','Material insulasi',['Glass wool','Mineral / rock wool','Ceramic fiber','Aerogel','Lainnya'],{crit:1}),
    num('ins_thk','Tebal insulasi','mm',{crit:1}),
    sel('inner','Fabric dalam',['SS mesh','Silica cloth','Fiberglass cloth','Lainnya']),
    sel('outer','Fabric luar',['PTFE-coated glass','Silicone-coated glass','Fiberglass','Lainnya'],{crit:1}),
    sel('fasten','Pengikat',['Velcro','Lacing hook & kawat','Buckle strap','Kombinasi']),
    num('pieces','Jumlah potongan per jacket','pcs'), sel('drain','Lubang drain',['Tidak','Ya']), sel('tagplate','Tag plate',['Tidak','Ya'])]},
   S_KONDISI,S_KOM,S_FOTO]},
 GPP:{name:'Gland Packing',grp:'Packing',
  std:['API 622 (valve)','API 624','ISO 15848-1','Rekomendasi pabrikan equipment'],
  fails:['Bocor berlebih','Shaft / sleeve aus beralur','Packing terbakar / mengeras','Ekstrusi','Gland miring'],
  cols:['tag','eq_type','motion','d_shaft','d_bore','depth','new_mat','qty'],
  secs:[S_IDENT([],'Jumlah set'),S_ACUAN(['API 622 (valve)','API 624','ISO 15848-1','Rekomendasi pabrikan equipment']),
   {id:'equip',t:'Equipment',f:[
    sel('eq_type','Jenis equipment',['Pompa sentrifugal','Pompa reciprocating','Valve','Agitator / mixer','Soot blower','Lainnya'],{crit:1}),
    txt('eq_tag','Tag equipment'), txt('eq_merk','Merek / model equipment'),
    sel('motion','Jenis gerakan',['Rotary','Reciprocating','Statis (valve)'],{crit:1,rr:1}),
    num('rpm','Putaran shaft','rpm',{crit:1,show:f=>f.motion==='Rotary'})]},
   S_PROSES({extra:[num('ph','pH','pH'),sel('abrasif','Partikel abrasif',['Tidak ada','Sedikit','Tinggi'])]}),
   S_BOX('Diameter shaft / stem',[sel('lantern','Lantern ring',['Tidak ada','Ada'],{rr:1}),num('lantern_w','Lebar lantern ring','mm',{show:f=>f.lantern==='Ada'}),num('lantern_pos','Posisi lantern (setelah ring ke-)','',{show:f=>f.lantern==='Ada'}),sel('flush','Flushing',['Tidak','Ya']),txt('sleeve','Material shaft / sleeve')]),
   {id:'packing',t:'Packing',f:[
    txt('old_mat','Packing terpasang'), num('old_sec','Penampang packing lama','mm'), num('old_n','Jumlah ring lama','ring'),
    sel('new_mat','Material packing baru',['Graphite','Graphite + carbon','PTFE','PTFE + graphite (GFO)','Aramid','Hybrid / kombinasi','Lainnya'],{crit:1}),
    sel('form','Bentuk suplai',['Ring die-cut (siap pasang)','Gulungan (spool)'])]},
   S_KONDISI,S_KOM,S_FOTO]},
 DFG:{name:'Die Formed Graphite',grp:'Packing',
  std:['API 622','API 624','ISO 15848-1','Rekomendasi pabrikan valve'],
  fails:['Bocor stem','Stem korosi / pitting','Ring retak / hancur','Ekstrusi','Gland miring'],
  cols:['tag','eq_type','d_shaft','d_bore','depth','r_id','r_od','r_h','r_n','grade','qty'],
  secs:[S_IDENT([],'Jumlah set'),S_ACUAN(['API 622','API 624','ISO 15848-1','Rekomendasi pabrikan valve']),
   {id:'equip',t:'Equipment',f:[
    sel('eq_type','Jenis equipment',['Valve gate','Valve globe','Valve ball','Valve lainnya','Pompa','Lainnya'],{crit:1}),
    txt('eq_tag','Tag equipment'), txt('eq_merk','Merek / model'), txt('eq_rating','Size & rating valve')]},
   S_PROSES(),
   S_BOX('Diameter stem / shaft'),
   {id:'ring',t:'Ring graphite',f:[
    num('r_id','ID ring','mm',{crit:1}), num('r_od','OD ring','mm',{crit:1}), num('r_h','Tinggi per ring','mm',{crit:1}), num('r_n','Jumlah ring per set','ring',{crit:1}),
    sel('density','Densitas',['1,4 g/cm³','1,6 g/cm³','1,8 g/cm³','Lainnya']), sel('grade','Grade',['Industrial ≥98%','High purity ≥99,5%','Nuclear grade']),
    sel('inhib','Inhibitor oksidasi',['Tidak','Ya']), sel('split','Bentuk ring',['Solid','Split (dipotong)']),
    sel('endring','End ring anti-ekstrusi',['Tidak ada','Braided end ring'],{rr:1}), num('endring_n','Jumlah end ring','ring',{show:f=>f.endring==='Braided end ring'}), num('endring_h','Tinggi end ring','mm',{show:f=>f.endring==='Braided end ring'})]},
   S_KONDISI,S_KOM,S_FOTO]}
};
const PCODES = Object.keys(P);
PCODES.forEach(c=>{ const m={}; P[c].secs.forEach(s=>s.f.forEach(f=>{ if(!m[f.k]) m[f.k]=f; })); P[c].fmap=m; });

const INFO = [
  {k:'client',l:'Nama client / perusahaan',crit:1},{k:'plant',l:'Plant / area'},{k:'lokasi',l:'Alamat lokasi'},
  {k:'tanggal',l:'Tanggal mulai',ty:'date'},{k:'surveyor',l:'Nama surveyor / tim'},{k:'pic',l:'PIC client'},
  {k:'pic_kontak',l:'Kontak PIC',ph:'No. HP / email'},{k:'ref',l:'No. inquiry / referensi'},
  {k:'tujuan',l:'Tujuan survey',ty:'area',ph:'mis. survey shutdown 2027: expansion joint, gasket, dan packing unit 2'}
];
const ALL=null;
const TOOLS = [
 ['Alat ukur umum',[['meteran','Meteran baja 5–8 m',ALL],['caliper','Jangka sorong 150 & 300 mm',ALL],['pitape','Pi tape / circumference tape',ALL],['rule','Penggaris baja 30 cm & 1 m',ALL],['laser','Laser distance meter',ALL]]],
 ['Alat ukur khusus',[['caliper600','Jangka sorong besar 600 mm+',['EJR','EJM','SWG','GMG']],['meteran30','Meteran panjang 10–30 m',['EJF','RTI']],['feeler','Feeler gauge / taper gauge',['EJR','EJM','EJF','SWG','GMG']],['angle','Inclinometer / busur digital',['EJR','EJM','EJF']],['level','Waterpass & unting-unting',['EJR','EJM','EJF']],['template','Kertas karton (template flange / gasket)',['EJR','EJM','EJF','SWG','GMG']],['telescopic','Telescopic / bore gauge, inside-outside caliper',['GPP','DFG']],['depth','Depth gauge',['GPP','DFG']],['tacho','Tachometer (rpm)',['GPP']],['flextape','Meteran jahit / flexible tape',['RTI']],['pola','Kertas pola, gunting, selotip',['RTI','GMG']]]],
 ['Identifikasi material & kondisi',[['magnet','Magnet (cek CS / SS)',ALL],['thermo','Thermo gun (IR)',ALL],['thread','Thread gauge metrik & inch',['EJR','EJM','EJF','SWG','GMG']],['durometer','Durometer Shore A',['EJR']],['thermcam','Thermal camera (opsional)',['RTI','EJF','EJM']],['utg','Ultrasonic thickness gauge (opsional)',['EJM','EJF']],['pmi','PMI / XRF analyzer (opsional)',['EJM','SWG','GMG']],['ph','Kertas pH (opsional)',['GPP']]]],
 ['Dokumentasi',[['hp','HP terisi penuh + powerbank',ALL],['senter','Senter',ALL],['spidol','Spidol / kapur marker',ALL],['clip','Clipboard & alat tulis',ALL]]],
 ['K3 / APD',[['helm','Helm safety',ALL],['sepatu','Safety shoes',ALL],['sarung','Sarung tangan',ALL],['sarungpanas','Sarung tangan tahan panas',['RTI','EJF','EJM']],['kacamata','Kacamata safety',ALL],['earplug','Earplug',ALL],['masker','Masker debu',['EJF','RTI']],['harness','Full body harness (jika di ketinggian)',ALL],['gasdet','Gas detector (jika confined space)',ALL]]]
];
const DOCS = [['permit','Work permit / izin masuk area',ALL],['induksi','Safety induction plant',ALL],['janji','Janji temu dengan PIC client',ALL],['surat','Surat tugas',ALL],['proses','Data proses (tekanan, temperatur, media)',ALL],['shutdown_info','Info jadwal shutdown',ALL],['datasheet','Datasheet / drawing existing',ALL],['pid','P&ID / isometric',['EJR','EJM','EJF']],['duct','Data ducting & flue gas',['EJF']],['linelist','Line list / flange list',['SWG','GMG']],['hx','Datasheet heat exchanger / vessel',['GMG']],['equip','Datasheet pompa / valve',['GPP','DFG']],['komplist','Daftar komponen yang akan diinsulasi',['RTI']]];
const PHASES = [['prep','Persiapan','Scope, jadwal, alat'],['field','Di lapangan','Ukur, validasi, foto'],['notes','Catatan','Temuan & kelengkapan'],['report','Laporan','Ringkasan & unduh']];
const PHOTO_CATS = ['Keseluruhan','Nameplate / marking','Flange / koneksi','Dimensi (dengan meteran)','Kerusakan','Area sekitar','Lainnya'];

/* =========================================================
   HELPERS & STATE
   ========================================================= */
const $ = (s,el)=> (el||document).querySelector(s);
const esc = v => String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const N = v => { const x=parseFloat(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:null; };
const fmt = (x,d) => { if(x==null) return ''; let r=Math.round(x*Math.pow(10,d||0))/Math.pow(10,d||0); if(Object.is(r,-0)) r=0; return r.toLocaleString('id-ID'); };
const sgn = (x,d) => { const r=Math.round(x*Math.pow(10,d||1))/Math.pow(10,d||1); return (r>0?'+':'')+fmt(r,d||1); };
const plain = (x,d) => fmt(x,d).replace(/\./g,'');
const today = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const filled = v => v!=null && String(v).trim()!=='';
const inScope = (list,s) => list===ALL || list.some(p=>scope(s).indexOf(p)>=0);
function toast(msg){ const h=$('#toastHost'); h.innerHTML='<div class="toast" role="status">'+esc(msg)+'</div>'; clearTimeout(toast.t); toast.t=setTimeout(()=>{h.innerHTML='';},3400); }
function keepScroll(fn){ const y=window.scrollY; fn(); try{ window.scrollTo(0,y); }catch(e){} }

const S = { surveys:{}, cur:null, phase:'prep', item:null, open:{ident:true,acuan:true}, filter:'ALL', picker:false };
const LS='rej-survey-v1';
try{ const raw=localStorage.getItem(LS); if(raw){ const d=JSON.parse(raw); S.surveys=d.surveys||{}; S.cur=d.cur||null; S.phase=d.phase||'prep'; } }catch(e){}

function migrate(s){
  if(!s) return s;
  s.info=s.info||{}; s.tools=s.tools||{}; s.docs=s.docs||{}; s.items=s.items||[]; s.notes=s.notes||[]; s.openItems=s.openItems||[];
  if(!s.days||!s.days.length) s.days=[{id:'d'+uid(),date:s.info.tanggal||today(),plan:''}];
  if(!s.activeDay || !s.days.find(d=>d.id===s.activeDay)) s.activeDay=s.days[s.days.length-1].id;
  s.items.forEach(it=>{
    it.f=it.f||{}; it.fail=it.fail||{}; it.photos=it.photos||[]; it.gap=it.gap||{}; it.cref=it.cref||[];
    if(!it.prod){
      it.prod='EJR';
      const f=it.f;
      if(f.std==='ANSI B16.5 Class 150') f.std='ASME B16.5 Class 150';
      if(f.bentuk==='Straight') f.bentuk='Bulat';
      if(f.bentuk==='Rectangular (ducting)') f.bentuk='Kotak (rectangular)';
      if(f.bentuk==='Elbow') f.bentuk='Elbow / mitered';
      if(!f.koneksi) f.koneksi='Flange';
      if(f.acuan && P.EJR.std.indexOf(f.acuan)<0 && f.acuan!==CUSTOM){ f.acuan_doc=f.acuan; f.acuan=''; }
    }
    if(!it.f.day || !s.days.find(d=>d.id===it.f.day)) it.f.day=s.days[0].id;
  });
  s.notes.forEach(n=>{ if(!n.dayId) n.dayId=s.days[0].id; });
  if(!s.info.products){ const ps=[]; s.items.forEach(i=>{ if(ps.indexOf(i.prod)<0) ps.push(i.prod); }); s.info.products=ps.length?ps:[]; }
  s.v=2; return s;
}
Object.values(S.surveys).forEach(migrate);
if(S.cur && !S.surveys[S.cur]) S.cur=null;
if(!S.cur){ const l=sortedSurveys(); if(l.length) S.cur=l[0].id; }

function sortedSurveys(){ return Object.values(S.surveys).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)); }
function cur(){ return S.cur?S.surveys[S.cur]:null; }
function scope(s){ const a=(s.info.products||[]).slice(); s.items.forEach(i=>{ if(a.indexOf(i.prod)<0) a.push(i.prod); }); return PCODES.filter(c=>a.indexOf(c)>=0); }
function visItems(s){ return S.filter==='ALL'?s.items:s.items.filter(i=>i.prod===S.filter); }
function curItem(){ const s=cur(); if(!s||!s.items.length) return null; let it=s.items.find(i=>i.id===S.item); if(!it){ const v=visItems(s); it=v[0]||s.items[0]; S.item=it.id; } return it; }
function newSurvey(){ const t=Date.now(); return migrate({id:'s'+uid(),createdAt:t,updatedAt:t,info:{tanggal:today(),products:[]},tools:{},docs:{},items:[],notes:[],openItems:[],summary:''}); }
function newItem(s,prod,tag){ const n=s.items.filter(i=>i.prod===prod).length+1; return {id:'i'+uid(),prod,f:{tag:tag||(prod+'-'+String(n).padStart(2,'0')),qty:'1',day:s.activeDay},fail:{},photos:[],gap:{},cref:[]}; }
function dayLabel(s,id){ const i=s.days.findIndex(d=>d.id===id); if(i<0) return '—'; const d=s.days[i]; return 'Hari '+(i+1)+(d.date?' ('+fmtDate(d.date)+')':''); }
function fmtDate(d){ try{ const x=new Date(d+'T00:00:00'); return x.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return d; } }
function surveyLabel(s){ return (s.info.client||'Survey tanpa nama')+(s.info.tanggal?' — '+s.info.tanggal:''); }
function visSecs(it){ return P[it.prod].secs.filter(s=>!s.show||s.show(it.f)); }
function visFields(sec,it){ return sec.f.filter(f=>!f.show||f.show(it.f)); }
function critList(it){ const out=[]; visSecs(it).forEach(sec=>visFields(sec,it).forEach(f=>{ if(f.crit) out.push(Object.assign({sec:sec.id,st:sec.t},f)); })); return out; }
function missing(it){ return critList(it).filter(c=>!filled(it.f[c.k])); }
function pct(it){ const c=critList(it); return c.length?Math.round(100*(c.length-missing(it).length)/c.length):100; }
function fdef(it,k){ return P[it.prod].fmap[k]; }
function tolOf(it){ const t=N(it.f.tol); return t==null?3:t; }

/* =========================================================
   PERSISTENCE
   ========================================================= */
let COL=null, ASSETS=null, DL=null, SAMPLE=null, REMOTE=false;
const dirty=new Set(); let timer=null, flushing=false;
function localSave(){ try{ localStorage.setItem(LS, JSON.stringify({surveys:S.surveys,cur:S.cur,phase:S.phase})); }catch(e){ if(!REMOTE) setStatus('err','Penyimpanan perangkat penuh. Kurangi foto.'); } }
function setStatus(kind,msg){ const el=$('#status'); el.className='status'+(kind==='err'?' err':''); el.textContent=msg||({pending:'Perubahan belum tersimpan',saving:'Menyimpan…',saved:'Tersimpan',local:'Tersimpan di perangkat ini'}[kind]||''); }
function touch(){ const s=cur(); if(!s) return; s.updatedAt=Date.now(); dirty.add(s.id); localSave(); setStatus(REMOTE?'pending':'local'); clearTimeout(timer); timer=setTimeout(flush,900); }
async function flush(){
  if(!REMOTE){ dirty.clear(); return; }
  if(flushing){ clearTimeout(timer); timer=setTimeout(flush,700); return; }
  if(!dirty.size) return;
  flushing=true; setStatus('saving'); let failed=null;
  for(const id of Array.from(dirty)){
    dirty.delete(id);
    try{
      const s=S.surveys[id];
      if(!s){ await COL.doc(id).delete(); continue; }
      const body=JSON.parse(JSON.stringify(s));
      if(JSON.stringify(body).length>250000){ failed={code:'too_big'}; dirty.add(id); continue; }
      await COL.doc(id).set(body);
    }catch(e){ failed=e; dirty.add(id); }
  }
  flushing=false;
  if(failed){
    if(failed.code==='too_big') setStatus('err','Survey terlalu besar. Hapus beberapa foto.');
    else if(failed.code==='quota_exceeded') setStatus('err','Kapasitas penuh. Hapus survey lama.');
    else { setStatus('err','Gagal menyimpan, dicoba lagi…'); clearTimeout(timer); timer=setTimeout(flush,5000); }
  } else setStatus('saved');
}
async function connect(){
  if(!(window.claude && typeof window.claude.use==='function')){ setStatus('local'); return; }
  const use = n => window.claude.use(n).catch(()=>null);
  use('downloads').then(d=>{ DL=d; if(S.phase==='report') render(); });
  use('sample').then(x=>{ SAMPLE=x; if(S.phase==='report') render(); });
  use('assets').then(a=>{ ASSETS=a; });
  const [db,user]=await Promise.all([use('db'),use('user')]);
  if(!db||!user){ setStatus('local'); return; }
  let id=null; try{ id=await user.id(); }catch(e){}
  if(!id){ setStatus('local'); return; }
  try{
    COL=db.doc('data/users/'+id+'/profile').collection('surveys');
    const snap=await COL.get(); const remote={};
    snap.docs.forEach(d=>{ if(d.exists) remote[d.id]=JSON.parse(JSON.stringify(d.data())); });
    const merged=Object.assign({},remote);
    Object.values(S.surveys).forEach(ls=>{ const r=remote[ls.id]; if(!r||(ls.updatedAt||0)>(r.updatedAt||0)){ merged[ls.id]=ls; dirty.add(ls.id); } });
    Object.values(merged).forEach(s=>{ const was=s.v; migrate(s); if(was!==2) dirty.add(s.id); });
    S.surveys=merged; REMOTE=true;
    if(!S.cur||!S.surveys[S.cur]){ const l=sortedSurveys(); S.cur=l.length?l[0].id:null; }
    localSave(); render();
    if(dirty.size) flush(); else setStatus('saved');
  }catch(e){ setStatus('local'); }
}

/* =========================================================
   VALIDATION
   ========================================================= */
function flangeRow(std,size){
  const rows=FL[std]; if(!rows||!filled(size)) return null;
  const norm=x=>String(x).replace(/\s/g,'').toUpperCase(), sz=norm(size);
  return rows.find(x=>{ const m=x[0].match(/\((.*)\)/); return sz===norm(x[0])||sz===norm(x[0].split(' ')[0])||(m&&sz===norm(m[1])); })||null;
}
function validate(it){
  const f=it.f, out=[], tol=tolOf(it), prod=it.prod;
  const add=(l,m)=>out.push({l,m});
  const cmp=(label,meas,ref,src,t)=>{ const v=N(meas); if(v==null||ref==null) return; const d=v-ref, tt=t==null?tol:t;
    add(Math.abs(d)<=tt?'ok':'err', label+' '+fmt(v,1)+' mm vs '+src+' '+fmt(ref,1)+' mm (selisih '+sgn(d,1)+', toleransi ±'+fmt(tt,1)+')'); };
  // acuan
  if(!filled(f.acuan)) add('warn','Acuan data belum dipilih.');
  else if(isCustom(f) && !filled(f.acuan_doc)) add('warn','Acuan custom: isi nomor dokumen / drawing client.');
  // proses
  const pO=N(f.p_op), pD=N(f.p_des), tO=N(f.t_op), tD=N(f.t_des);
  if(pO!=null&&pD!=null&&pD<pO) add('err','Tekanan design lebih kecil dari tekanan operasi.');
  if(tO!=null&&tD!=null&&tD<tO) add('err','Temperatur design lebih kecil dari temperatur operasi.');
  const T = tD!=null?tD:tO;
  // flange (EJ)
  if(P[prod].fmap.std && isFl(f)){
    if(isRound(f)){
      const od=N(f.f_od), pcd=N(f.pcd), n=N(f.n_bolt);
      if(od!=null&&pcd!=null&&pcd>=od) add('err','PCD tidak mungkin lebih besar atau sama dengan OD flange.');
      if(n!=null&&n%4!==0) add('warn','Jumlah lubang baut '+n+' bukan kelipatan 4, cek ulang.');
      if(FL[f.std]){
        const r=flangeRow(f.std,f.size1);
        if(!r) add('warn','Ukuran "'+(f.size1||'')+'" tidak ditemukan di tabel '+f.std+'. Gunakan "Cari standar yang cocok".');
        else { const src=f.std+' '+r[0]; cmp('OD flange',f.f_od,r[1],src); cmp('PCD',f.pcd,r[2],src);
          if(n!=null) add(n===r[3]?'ok':'err','Jumlah lubang '+n+' vs standar '+r[3]+'.');
          cmp('Lubang baut',f.hole,r[4],src,Math.min(tol,1.5)); }
      }
    } else {
      const pitch=N(f.fr_pitch); if(pitch!=null&&pitch>200) add('warn','Pitch baut '+fmt(pitch)+' mm cukup besar, cek potensi kebocoran pada frame.');
    }
  }
  if(f.koneksi==='Clamp' && pO!=null && pO>(prod==='EJF'?350:6)) add('warn','Koneksi clamp umumnya untuk tekanan rendah; cek kelayakan pada '+f.p_op+(prod==='EJF'?' mbar':' bar')+'.');
  if(isRed(f)&&!filled(f.size2)&&P[prod].fmap.size2) add('warn','Bentuk reducer: ukuran sisi 2 belum diisi.');
  // product-specific
  if(prod==='EJR'){
    const lim=RUBBER_T[f.rubber]; if(lim&&T!=null) add(T>lim?'err':'ok','Temperatur '+fmt(T)+' °C vs batas umum '+f.rubber+' ±'+lim+' °C.');
    if(/minyak|oil|solar|diesel|bbm|hydrocarbon|hidrokarbon|lube/i.test(f.media||'') && /EPDM|Natural|Butyl/.test(f.rubber||'')) add('err',f.rubber+' tidak cocok untuk media berbasis minyak. Pertimbangkan NBR atau FKM.');
    if(f.vakum==='Ya' && f.vring!=='Ada') add('warn','Ada kondisi vakum: pertimbangkan vacuum ring / reinforcement tambahan.');
    if(f.abrasif==='Tinggi' && (f.liner||'Tidak ada')==='Tidak ada') add('warn','Media abrasif tinggi: pertimbangkan tube tebal atau liner.');
    if(N(f.lat)>0 && f.rod==='Tidak ada') add('warn','Ada pergerakan lateral tanpa control rod, cek kebutuhan anchor / control rod.');
  }
  if(prod==='EJM'){
    if(!filled(f.cycles)) add('warn','Jumlah siklus diperlukan untuk desain fatigue (EJMA).');
    if(N(f.vel)!=null && f.liner!=='Ada') add('warn','Kecepatan aliran '+f.vel+' m/s tanpa liner: cek kebutuhan internal liner sesuai EJMA.');
    if(f.bel_type==='Single' && N(f.lat)>0) add('warn','Pergerakan lateral pada tipe single terbatas; pertimbangkan universal / tied universal.');
    if(/SS304|SS316L|SS321/.test(f.bel_mat||'') && /chlor|klor|air laut|seawater/i.test(f.media||'')) add('warn','Media mengandung klorida: risiko stress corrosion pada '+f.bel_mat+'. Pertimbangkan Incoloy 825 / Inconel 625.');
  }
  if(prod==='EJF'){
    if(tO!=null && tO>260 && f.pillow!=='Ada') add('warn','Temperatur '+fmt(tO)+' °C di atas batas PTFE (±260 °C): perlu insulation pillow.');
    if(f.dew==='Ya' && f.seal!=='PTFE film') add('warn','Potensi kondensasi asam: gunakan gas seal PTFE.');
    const b=N(f.breach), ftf=N(f.ftf); if(b!=null&&ftf!=null&&b>ftf) add('err','Breach opening lebih besar dari panjang terpasang.');
  }
  if(prod==='SWG'||prod==='GMG'){
    const fac=prod==='SWG'?f.filler:f.facing;
    if(/PTFE/.test(fac||'') && T!=null && T>260) add('err',fac+' melebihi batas temperatur ±260 °C.');
    if(/graphite/i.test(fac||'') && T!=null && T>450) add('warn','Graphite di atas ±450 °C pada lingkungan oksidasi: cek grade / inhibitor.');
  }
  if(prod==='SWG'){
    if(/PTFE/.test(f.filler||'') && !hasInner(f)) add('warn','Filler PTFE: ASME B16.20 mensyaratkan inner ring.');
    if(N(f.cls)>=900 && !hasInner(f)) add('warn','Class '+f.cls+': cek kewajiban inner ring sesuai ASME B16.20.');
    const wid=N(f.d_wid), wod=N(f.d_wod), ir=N(f.d_ir), or=N(f.d_or);
    if(wid!=null&&wod!=null&&wid>=wod) add('err','ID winding harus lebih kecil dari OD winding.');
    if(ir!=null&&wid!=null&&ir>=wid) add('err','ID inner ring harus lebih kecil dari ID winding.');
    if(or!=null&&wod!=null&&or<=wod) add('err','OD outer ring harus lebih besar dari OD winding.');
    if(f.fl_std==='ASME B16.5' && /ASME B16\.20/.test(f.acuan||'')){
      const i=NPS.findIndex(n=>n[0]===f.nps);
      if(i>=0 && (f.cls==='150'||f.cls==='300')){
        const r=SWGT[i].map(x=>x*25.4), src='B16.20 '+f.nps+' Cl.'+f.cls, t=Math.min(tol,1.5);
        if(f.cls==='150'){ cmp('ID inner ring',f.d_ir,r[0],src,t); cmp('ID winding',f.d_wid,r[1],src,t); cmp('OD winding',f.d_wod,r[2],src,t); cmp('OD outer ring',f.d_or,r[3],src,t); }
        else { cmp('OD outer ring',f.d_or,r[4],src,t); add('warn','Class 300: tabel aplikasi hanya memuat OD outer ring. Verifikasi ID/OD winding ke ASME B16.20.'); }
      } else if(i>=0) add('warn','Tabel aplikasi memuat Class 150 & 300. Verifikasi Class '+(f.cls||'?')+' ke ASME B16.20.');
    }
  }
  if(prod==='GMG'){
    const id=N(f.d_id), od=N(f.d_od), or=N(f.d_or);
    if(id!=null&&od!=null&&id>=od) add('err','ID gasket harus lebih kecil dari OD.');
    if(or!=null&&od!=null&&or<=od) add('err','OD outer ring harus lebih besar dari OD sealing.');
  }
  if(prod==='RTI'){
    const tg=N(f.t_target); if(tg!=null) add(tg>60?'warn':'ok','Target suhu permukaan '+fmt(tg)+' °C'+(tg>60?' di atas batas kontak aman umum ±60 °C (ASTM C1055).':' memenuhi batas kontak aman umum (≤60 °C).'));
    const lim=INS_T[f.ins_mat]; if(lim&&T!=null) add(T>lim?'err':'ok','Temperatur '+fmt(T)+' °C vs batas umum '+f.ins_mat+' ±'+lim+' °C.');
    if(tg!=null&&tO!=null&&tg>=tO) add('err','Target suhu permukaan harus lebih rendah dari temperatur operasi.');
  }
  if(prod==='GPP'||prod==='DFG'){
    const b=boxCalc(it);
    if(b){
      if(b.sec<=0) add('err','Diameter bore harus lebih besar dari diameter shaft / stem.');
      else add('ok','Penampang packing terhitung '+fmt(b.sec,2)+' mm'+(prod==='GPP'?' → ukuran standar terdekat '+fmt(b.std,1)+' mm.':'.'));
      if(prod==='GPP'){
        const os=N(f.old_sec); if(os!=null&&b.sec>0&&Math.abs(os-b.sec)>0.8) add('warn','Penampang packing lama '+fmt(os,1)+' mm berbeda dari hasil hitung '+fmt(b.sec,1)+' mm.');
        if(b.v!=null){ const vl=/PTFE/.test(f.new_mat||'')&&!/graphite/i.test(f.new_mat||'')?8:20; add(b.v>vl?'warn':'ok','Kecepatan permukaan shaft '+fmt(b.v,1)+' m/s'+(b.v>vl?' melebihi batas umum ±'+vl+' m/s untuk '+(f.new_mat||'material ini')+'.':'.')); }
        if(/PTFE/.test(f.new_mat||'')&&!/graphite/i.test(f.new_mat||'')&&T!=null&&T>260) add('err','PTFE melebihi batas temperatur ±260 °C.');
      }
      if(prod==='DFG'){
        const rid=N(f.r_id), rod=N(f.r_od), rh=N(f.r_h), rn=N(f.r_n), dep=N(f.depth);
        cmp('ID ring',f.r_id,N(f.d_shaft),'diameter stem',0.5);
        cmp('OD ring',f.r_od,N(f.d_bore),'bore',0.5);
        if(rh!=null&&rn!=null&&dep!=null){ const eh=f.endring==='Braided end ring'?(N(f.endring_n)||0)*(N(f.endring_h)||0):0, st=rh*rn+eh;
          add(st>dep?'err':(st<0.7*dep?'warn':'ok'),'Tinggi susunan '+fmt(st,1)+' mm vs kedalaman box '+fmt(dep,1)+' mm'+(st>dep?' (melebihi).':st<0.7*dep?' (terlalu pendek, gland bisa bottoming).':'.')); }
        if(T!=null&&T>450&&f.inhib!=='Ya') add('warn','Temperatur di atas ±450 °C: gunakan graphite dengan inhibitor oksidasi.');
      }
    }
  }
  // custom refs
  (it.cref||[]).forEach(r=>{ if(!r.k) return; const fd=fdef(it,r.k); const ref=N(r.val); if(ref==null) return; const v=N(f[r.k]);
    if(v==null){ add('warn',(fd?fd.l:r.k)+': acuan custom '+fmt(ref,1)+' tetapi nilai terukur kosong.'); return; }
    const t=N(r.tol)!=null?N(r.tol):tol, d=v-ref;
    add(Math.abs(d)<=t?'ok':'err',(fd?fd.l:r.k)+' '+fmt(v,1)+' vs acuan custom '+fmt(ref,1)+(fd&&fd.u?' '+fd.u:'')+' (selisih '+sgn(d,1)+', toleransi ±'+fmt(t,1)+')'); });
  return out;
}
function vcount(it){ const v=validate(it); return {err:v.filter(x=>x.l==='err').length,warn:v.filter(x=>x.l==='warn').length,ok:v.filter(x=>x.l==='ok').length}; }
function vbadge(it){ const c=vcount(it); if(!c.err&&!c.warn) return c.ok?'<span class="vbadge good">Validasi lolos</span>':'<span class="vbadge muted">Belum ada validasi</span>'; return '<span class="vbadge '+(c.err?'warn':'')+'" style="color:'+(c.err?'var(--bad)':'#B07800')+'">'+(c.err?c.err+' error':'')+(c.err&&c.warn?' · ':'')+(c.warn?c.warn+' peringatan':'')+'</span>'; }
function boxCalc(it){
  const f=it.f, d=N(f.d_shaft), b=N(f.d_bore), dep=N(f.depth); if(d==null||b==null) return null;
  const sec=(b-d)/2; if(sec<=0) return {sec};
  const std=PACK_STD.reduce((a,x)=>Math.abs(x-sec)<Math.abs(a-sec)?x:a,PACK_STD[0]);
  const lw=f.lantern==='Ada'?(N(f.lantern_w)||0):0;
  const rings=dep!=null?Math.floor((dep-lw)/std):null;
  const L=Math.PI*(d+std);
  const rpm=N(f.rpm); const v=(it.prod==='GPP'&&f.motion==='Rotary'&&rpm!=null)?Math.PI*d*rpm/60000:null;
  const sets=N(f.qty)||1;
  return {sec,std,rings,L,v,total:rings!=null?rings*L*sets*1.05/1000:null};
}

/* =========================================================
   RENDER
   ========================================================= */
function fieldHTML(fd,val,ns,s){
  const id=ns+'_'+fd.k, b=ns+'.'+fd.k, v=val==null?'':val;
  const cls='fld'+(fd.ty==='area'?' wide':'')+(fd.crit&&!filled(v)?' empty-crit':'');
  let ctl;
  if(fd.ty==='sel'){ ctl='<select id="'+id+'" data-b="'+b+'"><option value="">Pilih…</option>'+fd.o.map(o=>'<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>').join('')+(v&&fd.o.indexOf(v)<0?'<option selected>'+esc(v)+'</option>':'')+'</select>'; }
  else if(fd.ty==='day'){ ctl='<select id="'+id+'" data-b="'+b+'">'+s.days.map(d=>'<option value="'+d.id+'"'+(d.id===v?' selected':'')+'>'+esc(dayLabel(s,d.id))+'</option>').join('')+'</select>'; }
  else if(fd.ty==='area'){ ctl='<textarea id="'+id+'" data-b="'+b+'" placeholder="'+esc(fd.ph||'')+'">'+esc(v)+'</textarea>'; }
  else { const t=fd.ty==='date'?'date':'text', im=fd.ty==='num'?' inputmode="decimal"':''; ctl='<input id="'+id+'" type="'+t+'"'+im+' data-b="'+b+'" value="'+esc(v)+'" placeholder="'+esc(fd.ph||'')+'" autocomplete="off">'; }
  return '<div class="'+cls+'"><label for="'+id+'">'+esc(fd.l)+(fd.crit?'<span class="req" title="Data utama"></span>':'')+'</label><div class="inp">'+ctl+(fd.u?'<span class="u">'+esc(fd.u)+'</span>':'')+'</div></div>';
}
function renderTop(){
  const sel=$('#surveyPick'), list=sortedSurveys();
  sel.innerHTML=list.length?list.map(s=>'<option value="'+s.id+'"'+(s.id===S.cur?' selected':'')+'>'+esc(surveyLabel(s))+'</option>').join(''):'<option>Belum ada survey</option>';
  sel.disabled=!list.length;
  $('#phases').innerHTML=PHASES.map((p,i)=>'<button data-act="phase" data-p="'+p[0]+'"'+(S.phase===p[0]?' aria-current="page"':'')+'><span class="n">'+(i+1)+'</span><span class="t">'+p[1]+'<small>'+p[2]+'</small></span></button>').join('');
  $('#phases').style.display=cur()?'':'none';
}
function render(){
  renderTop();
  const m=$('#main'), s=cur();
  if(!s){ m.innerHTML='<div class="empty"><h2>Mulai survey pertama Anda</h2><p>Satu survey mencakup satu kunjungan ke client, bisa beberapa hari dan beberapa produk GTE sekaligus: expansion joint, gasket, insulasi, dan packing.</p><button class="btn hv" data-act="newSurvey">Buat survey baru</button></div>'; return; }
  m.innerHTML=({prep:renderPrep,field:renderField,notes:renderNotes,report:renderReport}[S.phase]||renderPrep)(s);
  if(S.phase==='field') updateHelpers();
}
const pb = c => '<span class="pbadge">'+c+'</span>';

/* ---------- 1. Persiapan ---------- */
function renderPrep(s){
  const sc=scope(s), tools=[]; TOOLS.forEach(g=>g[1].forEach(t=>{ if(inScope(t[2],s)) tools.push(t); }));
  const docs=DOCS.filter(d=>inScope(d[2],s)), tDone=tools.filter(t=>s.tools[t[0]]).length, dDone=docs.filter(d=>s.docs[d[0]]).length;
  let h='<h2>Persiapan survey</h2><p class="lead">Tentukan produk yang disurvey, jadwal hari, dan daftar item. Checklist alat dan dokumen menyesuaikan produk yang dipilih.</p>';
  h+='<section class="card"><h3>Info proyek</h3><div class="grid">'+INFO.map(f=>fieldHTML(f,s.info[f.k],'info',s)).join('')+'</div></section>';
  h+='<section class="card"><h3>Produk dalam scope <span class="muted">'+sc.length+' dari 8</span></h3><div class="checks">'+PCODES.map(c=>{ const n=s.items.filter(i=>i.prod===c).length; return '<label class="chk"><input type="checkbox" data-prod="'+c+'"'+(sc.indexOf(c)>=0?' checked':'')+(n?' disabled':'')+'><span><b>'+c+'</b> '+esc(P[c].name)+(n?' <span class="muted">('+n+' item)</span>':'')+'</span></label>'; }).join('')+'</div></section>';
  h+='<section class="card"><h3>Jadwal survey <span class="muted">'+s.days.length+' hari</span></h3><div class="tablewrap"><table class="out"><thead><tr><th>Hari</th><th>Tanggal</th><th>Rencana / area</th><th>Item</th><th></th></tr></thead><tbody>'+
    s.days.map((d,i)=>{ const n=s.items.filter(it=>it.f.day===d.id).length; return '<tr><td><b>'+(i+1)+'</b>'+(d.id===s.activeDay?'<br><span class="muted">aktif</span>':'')+'</td><td><div class="inp"><input type="date" data-dday="'+d.id+'" value="'+esc(d.date||'')+'" aria-label="Tanggal hari '+(i+1)+'"></div></td><td><div class="inp"><input data-dplan="'+d.id+'" value="'+esc(d.plan||'')+'" placeholder="mis. Unit 2 cooling water, EJR & SWG" aria-label="Rencana hari '+(i+1)+'"></div></td><td>'+n+'</td><td>'+(n||s.days.length===1?'':'<button class="btn danger sm" data-act="delDay" data-id="'+d.id+'">Hapus</button>')+'</td></tr>'; }).join('')+
    '</tbody></table></div><div class="row" style="margin-top:10px"><button class="btn ghost" data-act="addDay">Tambah hari</button></div></section>';
  h+='<section class="card"><h3>Item yang akan disurvey <span class="muted">'+s.items.length+' item</span></h3>'+
    (s.items.length?'<div class="tablewrap"><table class="out" style="margin-bottom:12px"><thead><tr><th>Produk</th><th>Tag</th><th>Posisi</th><th>Hari</th><th></th></tr></thead><tbody>'+s.items.map(it=>'<tr><td>'+pb(it.prod)+'</td><td><b>'+esc(it.f.tag||'(tanpa tag)')+'</b></td><td>'+esc(it.f.posisi||'')+'</td><td>'+esc(dayLabel(s,it.f.day))+'</td><td style="text-align:right"><button class="btn ghost sm" data-act="goItem" data-id="'+it.id+'">Buka</button></td></tr>').join('')+'</tbody></table></div>':'<p class="muted">Daftarkan tag dari P&ID, line list, atau inquiry. Item bisa ditambah lagi di lapangan.</p>')+
    '<div class="row"><div class="inp" style="min-width:150px"><select id="newProd" aria-label="Produk">'+PCODES.map(c=>'<option value="'+c+'"'+(sc[0]===c?' selected':'')+'>'+c+' — '+esc(P[c].name)+'</option>').join('')+'</select></div><div class="inp" style="flex:1;min-width:160px"><input id="newTag" placeholder="Tag number, mis. EJ-101" aria-label="Tag number baru"></div><button class="btn" data-act="addItemPrep">Tambah item</button></div></section>';
  h+='<section class="card"><h3>Peralatan <span class="muted">'+tDone+' dari '+tools.length+' siap</span></h3>'+(sc.length?'':'<p class="muted">Pilih produk dalam scope agar alat khusus ikut muncul.</p>')+'<div class="bar hvbar" style="margin-bottom:14px"><i style="width:'+(tools.length?Math.round(100*tDone/tools.length):0)+'%"></i></div>'+
    TOOLS.map(g=>{ const its=g[1].filter(t=>inScope(t[2],s)); if(!its.length) return ''; return '<div class="group-t">'+esc(g[0])+'</div><div class="checks">'+its.map(t=>'<label class="chk"><input type="checkbox" data-tool="'+t[0]+'"'+(s.tools[t[0]]?' checked':'')+'><span>'+esc(t[1])+(t[2]?' <span class="muted">'+t[2].filter(p=>sc.indexOf(p)>=0).join(', ')+'</span>':'')+'</span></label>').join('')+'</div>'; }).join('')+
    '<div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="toolsAll">Tandai semua siap</button><button class="btn ghost sm" data-act="toolsNone">Kosongkan</button></div></section>';
  h+='<section class="card"><h3>Dokumen & izin <span class="muted">'+dDone+' dari '+docs.length+'</span></h3><div class="checks">'+docs.map(d=>'<label class="chk"><input type="checkbox" data-doc="'+d[0]+'"'+(s.docs[d[0]]?' checked':'')+'><span>'+esc(d[1])+'</span></label>').join('')+'</div></section>';
  h+='<section class="card"><h3>Kelola survey</h3><p class="muted">Menghapus survey juga menghapus semua item, catatan, dan fotonya.</p><button class="btn danger sm" data-act="delSurvey">Hapus survey ini</button></section>';
  return h;
}

/* ---------- 2. Di lapangan ---------- */
function renderField(s){
  const sc=scope(s), vi=visItems(s), it=curItem();
  let h='<div class="daybar"><b style="font-family:var(--cond);font-size:20px">Hari aktif</b><div class="inp"><select id="activeDay" aria-label="Hari aktif">'+s.days.map(d=>'<option value="'+d.id+'"'+(d.id===s.activeDay?' selected':'')+'>'+esc(dayLabel(s,d.id))+'</option>').join('')+'</select></div><span class="muted">Item baru dicatat di hari ini.</span><span class="spacer"></span><button class="btn ghost sm" data-act="newDayToday">Mulai hari baru</button></div>';
  h+='<div class="filters" role="group" aria-label="Filter produk"><button data-act="filter" data-p="ALL" aria-pressed="'+(S.filter==='ALL')+'">Semua ('+s.items.length+')</button>'+sc.map(c=>'<button data-act="filter" data-p="'+c+'" aria-pressed="'+(S.filter===c)+'">'+c+' ('+s.items.filter(i=>i.prod===c).length+')</button>').join('')+'</div>';
  h+='<div class="chips" role="group" aria-label="Daftar item">'+vi.map(i=>'<button class="chip" data-act="pickItem" data-id="'+i.id+'" aria-pressed="'+(it&&i.id===it.id)+'"><span>'+i.prod+'</span><b>'+esc(i.f.tag||'(tanpa tag)')+'</b><span>'+pct(i)+'% lengkap</span></button>').join('')+'<button class="chip add" data-act="togglePicker" aria-expanded="'+S.picker+'">+ Item</button></div>';
  if(S.picker||!s.items.length){
    const order=sc.concat(PCODES.filter(c=>sc.indexOf(c)<0));
    h+='<section class="card"><h3>Tambah item: pilih produk</h3><div class="prodgrid">'+order.map(c=>'<button class="prodbtn" data-act="addItem" data-p="'+c+'"><b>'+c+'</b><span>'+esc(P[c].name)+'<br><span class="muted">'+esc(P[c].grp)+(sc.indexOf(c)<0?' · di luar scope':'')+'</span></span></button>').join('')+'</div></section>';
  }
  if(!it||!vi.length) return h+(s.items.length?'<p class="muted">Tidak ada item untuk filter ini.</p>':'');
  const p=pct(it);
  h+='<div class="itemhead"><div class="bigtag"><span class="pbadge" style="font-size:16px;margin-bottom:6px">'+it.prod+' · '+esc(P[it.prod].name)+'</span><br><span id="bigTag">'+esc(it.f.tag||'(tanpa tag)')+'</span><small><span id="itemPct">'+p+'% data utama terisi</span> · <span id="itemV">'+vbadge(it)+'</span></small></div><span class="spacer"></span><div class="row"><button class="btn ghost sm" data-act="dupItem">Duplikat item</button><button class="btn danger sm" data-act="delItem">Hapus item</button></div></div>';
  h+='<div class="bar" style="margin-bottom:16px"><i id="itemBar" style="width:'+p+'%"></i></div>';
  visSecs(it).forEach(sec=>{
    h+='<details class="sec" data-sec="'+sec.id+'"'+(S.open[sec.id]?' open':'')+'><summary><h3>'+esc(sec.t)+'</h3><span class="sb" id="sb_'+sec.id+'">'+secBadge(sec,it)+'</span></summary><div class="secbody">';
    const fs=visFields(sec,it); if(fs.length) h+='<div class="grid">'+fs.map(f=>fieldHTML(f,it.f[f.k],'f',s)).join('')+'</div>';
    if(sec.helper==='flange'&&isRound(it.f)) h+=flangeHelper(it);
    if(sec.helper==='gap'&&isFl(it.f)&&isRound(it.f)) h+=gapHelper(it);
    if(sec.helper==='fail') h+='<div class="helper"><h4>Kondisi yang terlihat</h4><div class="fails">'+P[it.prod].fails.map(fl=>'<label class="chk"><input type="checkbox" data-fail="'+esc(fl)+'"'+(it.fail[fl]?' checked':'')+'><span>'+esc(fl)+'</span></label>').join('')+'</div></div>';
    if(sec.helper==='photo') h+=photoHTML(it);
    if(sec.helper==='box') h+='<div class="helper"><h4>Hasil hitung</h4><div class="out" id="boxOut"></div></div>';
    if(sec.helper==='validate') h+=validateHelper(it);
    h+='</div></details>';
  });
  return h;
}
function secBadge(sec,it){
  if(sec.id==='foto') return it.photos.length+' foto';
  if(sec.id==='acuan') return vbadge(it);
  const fs=visFields(sec,it); let extra='';
  if(sec.id==='kondisi'){ const n=P[it.prod].fails.filter(f=>it.fail[f]).length; if(n) extra=' · '+n+' temuan'; }
  const fl=fs.filter(f=>filled(it.f[f.k])).length, miss=fs.filter(f=>f.crit&&!filled(it.f[f.k])).length;
  return fl+'/'+fs.length+' terisi'+extra+(miss?'<span class="miss">'+miss+' data utama kosong</span>':'');
}
function numFields(it){ const out=[]; P[it.prod].secs.forEach(sec=>sec.f.forEach(f=>{ if(f.ty==='num'&&['qty','spare','tol','umur'].indexOf(f.k)<0) out.push(f); })); return out; }
function validateHelper(it){
  const nf=numFields(it);
  return '<div class="helper"><h4>Hasil validasi</h4><p class="muted" style="margin:0">Dicek terhadap acuan yang dipilih, batas umum material, dan konsistensi data. Tabel standar di aplikasi adalah referensi awal; verifikasi ke dokumen standar resmi.</p><div class="out" id="valOut"></div></div>'+
  '<div class="helper"><h4>Acuan custom (drawing / spesifikasi client)</h4><p class="muted" style="margin:0 0 8px">Tambahkan nilai acuan untuk dibandingkan dengan hasil ukur. Berguna untuk ukuran non-standar atau spesifikasi khusus client.</p>'+
  (it.cref.length?'<div class="tablewrap"><table class="out"><thead><tr><th>Parameter</th><th>Nilai acuan</th><th>Toleransi ±</th><th></th></tr></thead><tbody>'+it.cref.map(r=>'<tr><td><div class="inp"><select data-cr="'+r.id+'" data-crk="k" aria-label="Parameter"><option value="">Pilih…</option>'+nf.map(f=>'<option value="'+f.k+'"'+(f.k===r.k?' selected':'')+'>'+esc(f.l)+(f.u?' ('+esc(f.u)+')':'')+'</option>').join('')+'</select></div></td><td><div class="inp"><input inputmode="decimal" data-cr="'+r.id+'" data-crk="val" value="'+esc(r.val||'')+'" aria-label="Nilai acuan"></div></td><td><div class="inp"><input inputmode="decimal" data-cr="'+r.id+'" data-crk="tol" value="'+esc(r.tol||'')+'" placeholder="'+fmt(tolOf(it),1)+'" aria-label="Toleransi"></div></td><td><button class="btn danger sm" data-act="delCref" data-id="'+r.id+'">Hapus</button></td></tr>').join('')+'</tbody></table></div>':'')+
  '<div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="addCref">Tambah acuan custom</button></div></div>';
}
function valHTML(v){ if(!v.length) return '<span class="muted">Isi data untuk memulai validasi.</span>'; const ic={ok:'✓',warn:'!',err:'✕'}; const ord={err:0,warn:1,ok:2}; return '<ul class="vlist">'+v.slice().sort((a,b)=>ord[a.l]-ord[b.l]).map(x=>'<li><span class="ic '+x.l+'" aria-label="'+({ok:'Sesuai',warn:'Peringatan',err:'Error'}[x.l])+'">'+ic[x.l]+'</span><span>'+esc(x.m)+'</span></li>').join('')+'</ul>'; }
function flangeHelper(it){
  return '<div class="helper"><h4>Cocokkan standar dari hasil ukur</h4><p class="muted" style="margin:0">Isi OD, PCD, dan jumlah lubang, lalu cari.</p><div class="row" style="margin-top:10px"><button class="btn sm" data-act="match">Cari standar yang cocok</button></div><div class="out" id="matchOut"></div><div class="out" id="refOut"></div></div>'+
  '<div class="helper"><h4>Hitung PCD dari jarak lubang bersebelahan</h4><div class="grid"><div class="fld"><label for="pcd_n">Jumlah lubang</label><div class="inp"><input id="pcd_n" inputmode="numeric" value="'+esc(it.f.n_bolt||'')+'"></div></div><div class="fld"><label for="pcd_c">Jarak antar pusat</label><div class="inp"><input id="pcd_c" inputmode="decimal"><span class="u">mm</span></div></div></div><div class="row"><span class="out" id="pcdOut" style="margin:0"></span><span class="spacer"></span><button class="btn ghost sm" data-act="usePcd">Pakai sebagai PCD</button></div></div>';
}
function gapHelper(it){
  const g=it.gap||{}, D=g.D||it.f.f_od||'';
  const inp=(k,l)=>'<div class="fld"><label for="gap_'+k+'">'+l+'</label><div class="inp"><input id="gap_'+k+'" inputmode="decimal" data-b="gap.'+k+'" value="'+esc(k==='D'?D:(g[k]||''))+'"><span class="u">mm</span></div></div>';
  return '<div class="helper"><h4>Ukur celah flange di 4 titik</h4><p class="muted" style="margin:0">Posisi jam 12, 3, 6, dan 9.</p><div class="grid">'+inp('g12','Jam 12')+inp('g3','Jam 3')+inp('g6','Jam 6')+inp('g9','Jam 9')+inp('D','OD flange')+'</div><div class="out" id="gapOut"></div><div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="useGap">Isi panjang terpasang & misalignment</button></div></div>';
}
function photoSrc(p){ return p.data||p.url||(p.aid?'/_blob/'+p.aid:''); }
function photoHTML(it){
  return '<div class="helper"><div class="row"><label class="btn">Ambil foto<input type="file" accept="image/*" capture="environment" hidden data-photo></label><label class="btn ghost">Pilih dari galeri<input type="file" accept="image/*" multiple hidden data-photo></label></div><p class="muted" style="margin:8px 0 0">Sertakan meteran atau penggaris di dalam foto sebagai pembanding ukuran.</p>'+
  (it.photos.length?'<div class="photos">'+it.photos.map(p=>'<div class="ph"><img src="'+esc(photoSrc(p))+'" alt="'+esc(p.cap||p.cat||'Foto')+'" loading="lazy"><div class="pb"><select data-pcat="'+p.id+'" aria-label="Kategori foto">'+PHOTO_CATS.map(c=>'<option'+(c===p.cat?' selected':'')+'>'+c+'</option>').join('')+'</select><input data-pcap="'+p.id+'" value="'+esc(p.cap||'')+'" placeholder="Keterangan" aria-label="Keterangan foto"><button class="btn danger sm" data-act="delPhoto" data-id="'+p.id+'">Hapus</button></div></div>').join('')+'</div>':'')+'</div>';
}
function flangeCandidates(f){
  const od=N(f.f_od), pcd=N(f.pcd), n=N(f.n_bolt), hole=N(f.hole); if(od==null&&pcd==null) return null;
  const res=[]; Object.keys(FL).forEach(std=>FL[std].forEach(r=>{ let sc=0; if(od!=null) sc+=Math.abs(od-r[1]); if(pcd!=null) sc+=2*Math.abs(pcd-r[2]); if(n!=null&&n!==r[3]) sc+=40; if(hole!=null) sc+=Math.abs(hole-r[4]); res.push({std,r,sc}); }));
  return res.sort((a,b)=>a.sc-b.sc).slice(0,4);
}
function gapCalc(it){ const g=it.gap||{}, a=N(g.g12),b=N(g.g3),c=N(g.g6),d=N(g.g9), D=N(filled(g.D)?g.D:it.f.f_od); if([a,b,c,d].some(x=>x==null)||!D) return null; const dv=Math.abs(a-c), dh=Math.abs(b-d); return {avg:(a+b+c+d)/4,dv,dh,ang:Math.atan(Math.sqrt(dv*dv+dh*dh)/D)*180/Math.PI}; }
function pcdCalc(){ const o=$('#pcdOut'); if(!o) return null; const n=N($('#pcd_n').value), c=N($('#pcd_c').value); if(!n||n<3||!c){ o.innerHTML=''; return null; } const p=c/Math.sin(Math.PI/n); o.innerHTML='PCD ≈ <b>'+fmt(p,1)+' mm</b>'; return p; }
function updateHelpers(){
  const it=curItem(); if(!it) return;
  const ro=$('#refOut'); if(ro){ const r=flangeRow(it.f.std,it.f.size1); ro.innerHTML=r?'<p style="margin:10px 0 0">Nilai '+esc(it.f.std)+' '+esc(r[0])+': OD '+fmt(r[1],1)+', PCD '+fmt(r[2],1)+', '+r[3]+' lubang Ø'+fmt(r[4],1)+' mm.</p>':''; }
  const go=$('#gapOut'); if(go){ const r=gapCalc(it); go.innerHTML=r?'Celah rata-rata <b>'+fmt(r.avg,1)+' mm</b> · selisih vertikal '+fmt(r.dv,1)+' mm, horizontal '+fmt(r.dh,1)+' mm · misalignment angular ≈ <b>'+fmt(r.ang,2)+'°</b>':'<span class="muted">Isi keempat titik dan OD flange.</span>'; }
  const bo=$('#boxOut'); if(bo){ const b=boxCalc(it);
    if(!b) bo.innerHTML='<span class="muted">Isi diameter shaft/stem dan bore.</span>';
    else if(b.sec<=0) bo.innerHTML='<span class="warn">Bore harus lebih besar dari shaft/stem.</span>';
    else bo.innerHTML='Penampang = (bore − shaft) / 2 = <b>'+fmt(b.sec,2)+' mm</b>'+(it.prod==='GPP'?' → standar terdekat <b>'+fmt(b.std,1)+' mm</b>':'')+
      (b.rings!=null?'<br>Perkiraan jumlah ring: <b>'+b.rings+'</b>'+(it.f.lantern==='Ada'?' (di luar lantern ring)':''):'')+
      (it.prod==='GPP'?'<br>Panjang potong per ring ≈ π × (d + S) = <b>'+fmt(b.L,0)+' mm</b>'+(b.total!=null?' · total kebutuhan ≈ <b>'+fmt(b.total,2)+' m</b> (termasuk 5% sisa potong)':''):'')+
      (b.v!=null?'<br>Kecepatan permukaan shaft: <b>'+fmt(b.v,1)+' m/s</b>':''); }
  const vo=$('#valOut'); if(vo) vo.innerHTML=valHTML(validate(it));
  const iv=$('#itemV'); if(iv) iv.innerHTML=vbadge(it);
  const sa=$('#sb_acuan'); if(sa) sa.innerHTML=vbadge(it);
  pcdCalc();
}
function refreshItemMeta(){
  const it=curItem(); if(!it) return; const p=pct(it);
  const bt=$('#bigTag'); if(bt) bt.textContent=it.f.tag||'(tanpa tag)';
  const ip=$('#itemPct'); if(ip) ip.textContent=p+'% data utama terisi';
  const ib=$('#itemBar'); if(ib) ib.style.width=p+'%';
  const chip=$('.chip[aria-pressed="true"]'); if(chip) chip.innerHTML='<span>'+it.prod+'</span><b>'+esc(it.f.tag||'(tanpa tag)')+'</b><span>'+p+'% lengkap</span>';
  visSecs(it).forEach(sec=>{ const e=$('#sb_'+sec.id); if(e) e.innerHTML=secBadge(sec,it); });
}

/* ---------- 3. Catatan ---------- */
function renderNotes(s){
  const itemName=id=>{ const i=s.items.find(x=>x.id===id); return i?(i.prod+' '+(i.f.tag||'(tanpa tag)')):null; };
  let h='<h2>Catatan survey</h2><p class="lead">Catat temuan per hari, simpan pertanyaan untuk client, dan cek kelengkapan serta hasil validasi sebelum meninggalkan lokasi.</p>';
  h+='<section class="card"><h3>Catatan lapangan</h3><div class="grid"><div class="fld wide"><label for="noteText">Catatan baru</label><div class="inp"><textarea id="noteText" placeholder="mis. Flange sisi pompa korosi berat, perlu dibersihkan sebelum pasang"></textarea></div></div>'+
    '<div class="fld"><label for="noteDay">Hari</label><div class="inp"><select id="noteDay">'+s.days.map(d=>'<option value="'+d.id+'"'+(d.id===s.activeDay?' selected':'')+'>'+esc(dayLabel(s,d.id))+'</option>').join('')+'</select></div></div>'+
    '<div class="fld"><label for="noteItem">Terkait item</label><div class="inp"><select id="noteItem"><option value="">Umum</option>'+s.items.map(i=>'<option value="'+i.id+'">'+i.prod+' '+esc(i.f.tag||'(tanpa tag)')+'</option>').join('')+'</select></div></div></div>'+
    '<div class="row" style="margin-top:10px"><button class="btn" data-act="addNote">Simpan catatan</button></div>';
  s.days.slice().reverse().forEach(d=>{ const ns=s.notes.filter(n=>n.dayId===d.id); if(!ns.length) return;
    h+='<div class="group-t" style="margin-top:18px">'+esc(dayLabel(s,d.id))+'</div><ul class="notes">'+ns.slice().reverse().map(n=>{ const t=itemName(n.itemId); return '<li class="'+(t?'tagged':'')+'"><div class="meta"><span>'+new Date(n.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+'</span>'+(t?'<b>'+esc(t)+'</b>':'<span>Umum</span>')+'<button data-act="delNote" data-id="'+n.id+'">Hapus</button></div><p>'+esc(n.text)+'</p></li>'; }).join('')+'</ul>'; });
  if(!s.notes.length) h+='<p class="muted" style="margin-top:14px">Belum ada catatan.</p>';
  h+='</section>';
  h+='<section class="card"><h3>Perlu dikonfirmasi ke client <span class="muted">'+s.openItems.filter(o=>!o.done).length+' terbuka</span></h3>'+
    s.openItems.map(o=>'<div class="oi'+(o.done?' done':'')+'"><input type="checkbox" data-oi="'+o.id+'"'+(o.done?' checked':'')+' aria-label="Selesai"><span>'+esc(o.text)+'</span><button data-act="delOi" data-id="'+o.id+'" aria-label="Hapus">✕</button></div>').join('')+
    '<div class="row" style="margin-top:10px"><div class="inp" style="flex:1;min-width:200px"><input id="oiText" placeholder="mis. Konfirmasi design pressure line CW-03" aria-label="Pertanyaan baru"></div><button class="btn" data-act="addOi">Tambah</button></div></section>';
  h+='<section class="card"><h3>Kelengkapan & validasi</h3>';
  if(!s.items.length) h+='<p class="muted">Belum ada item.</p>';
  scope(s).forEach(c=>{ const its=s.items.filter(i=>i.prod===c); if(!its.length) return;
    h+='<div class="group-t">'+c+' · '+esc(P[c].name)+'</div>'+its.map(it=>{ const m=missing(it), p=pct(it); return '<div class="comp"><b>'+esc(it.f.tag||'(tanpa tag)')+'<br><span style="font-family:var(--body);font-size:13px">'+vbadge(it)+'</span></b><div class="bar"><i style="width:'+p+'%'+(p===100?';background:var(--ok)':'')+'"></i></div><div class="misslist">'+(m.length?m.map(x=>'<button data-act="jump" data-item="'+it.id+'" data-sec="'+x.sec+'" data-k="'+x.k+'">'+esc(x.l)+'</button>').join(''):'<span class="good">Semua data utama terisi</span>')+'</div></div>'; }).join(''); });
  h+='</section>';
  return h;
}

/* ---------- 4. Laporan ---------- */
function renderReport(s){
  let h='<div class="noprint"><h2>Laporan survey</h2><p class="lead">Tulis ringkasan, periksa pratinjau, lalu unduh laporan untuk atasan dan data tabel per produk untuk tim design, BOM, dan estimasi.</p>';
  h+='<section class="card"><h3>Ringkasan & rekomendasi</h3><div class="fld"><label for="sumText">Isi ringkasan (bisa diedit)</label><div class="inp"><textarea id="sumText" data-b="summary" style="min-height:220px" placeholder="Ringkasan temuan, rekomendasi awal per produk, dan data yang masih perlu dikonfirmasi.">'+esc(s.summary||'')+'</textarea></div></div>'+
    '<div class="row" style="margin-top:10px">'+(SAMPLE?'<button class="btn" data-act="aiSum" id="aiBtn">Buat draf ringkasan dengan Claude</button>':'')+'<span class="muted" id="aiMsg"></span></div>'+(SAMPLE?'<p class="muted" style="margin:8px 0 0">Periksa kembali draf sebelum dikirim, terutama rekomendasi material.</p>':'')+'</section>';
  const ps=scope(s).filter(c=>s.items.some(i=>i.prod===c));
  h+='<section class="card"><h3>Unduh</h3>'+(DL?'<div class="row"><button class="btn hv" data-act="dlReport">Unduh laporan (HTML)</button><button class="btn ghost" data-act="dlJson">Unduh cadangan (JSON)</button><button class="btn ghost" data-act="print">Cetak</button></div>'+(ps.length?'<p class="muted" style="margin:14px 0 6px">Data item per produk (CSV, siap dibuka di Excel):</p><div class="row">'+ps.map(c=>'<button class="btn ghost sm" data-act="dlCsv" data-p="'+c+'">CSV '+c+'</button>').join('')+'</div>':''):'<p class="muted">Unduhan tidak tersedia di tampilan ini. Buka halaman ini di claude.ai.</p><button class="btn ghost" data-act="print">Cetak</button>')+'</section></div>';
  h+='<div class="rpt-wrap"><div class="rpt">'+reportBody(s)+'</div></div>';
  return h;
}
function reportBody(s,photoMap){
  const I=s.info, sc=scope(s).filter(c=>s.items.some(i=>i.prod===c));
  const kv=arr=>'<table class="kv">'+arr.map(r=>'<tr'+(r[2]?' class="missing"':'')+'><td>'+esc(r[0])+'</td><td>'+(r[1]===''?'—':esc(r[1]))+'</td></tr>').join('')+'</table>';
  const val=(it,fd)=>{ const v=it.f[fd.k]; if(!filled(v)) return ''; if(fd.ty==='day') return dayLabel(s,v); return v+(fd.u?' '+fd.u:''); };
  const period=s.days.length?(fmtDate(s.days[0].date)+(s.days.length>1?' s.d. '+fmtDate(s.days[s.days.length-1].date):'')):'';
  let n=0, h='<h1>Laporan Survey Produk GTE</h1><p class="sub">'+esc(I.client||'—')+(I.plant?', '+esc(I.plant):'')+' · '+esc(period)+' · '+s.days.length+' hari</p>';
  h+='<h2>'+(++n)+'. Informasi survey</h2>'+kv(INFO.map(f=>[f.l,I[f.k]||'']).concat([['Produk yang disurvey',sc.map(c=>c+' ('+P[c].name+')').join(', ')||'']]));
  h+='<h2>'+(++n)+'. Ringkasan & rekomendasi</h2>'+(filled(s.summary)?'<div class="sum">'+esc(s.summary)+'</div>':'<p><i>Belum diisi.</i></p>');
  h+='<h2>'+(++n)+'. Jadwal & progres per hari</h2><div class="tw"><table><thead><tr><th>Hari</th><th>Tanggal</th><th>Rencana</th><th>Item disurvey</th></tr></thead><tbody>'+s.days.map((d,i)=>{ const its=s.items.filter(it=>it.f.day===d.id); return '<tr><td>'+(i+1)+'</td><td>'+esc(fmtDate(d.date))+'</td><td>'+esc(d.plan||'')+'</td><td>'+(its.length?its.map(it=>esc(it.prod+' '+(it.f.tag||''))).join(', '):'—')+'</td></tr>'; }).join('')+'</tbody></table></div>';
  h+='<h2>'+(++n)+'. Rekap per produk</h2>'+(sc.length?'<div class="tw"><table><thead><tr><th>Produk</th><th>Jumlah item</th><th>Total qty</th><th>Kelengkapan rata-rata</th><th>Error validasi</th><th>Peringatan</th></tr></thead><tbody>'+sc.map(c=>{ const its=s.items.filter(i=>i.prod===c); const q=its.reduce((a,i)=>a+(N(i.f.qty)||0),0); const e=its.reduce((a,i)=>a+vcount(i).err,0), w=its.reduce((a,i)=>a+vcount(i).warn,0); return '<tr><td><b>'+c+'</b> '+esc(P[c].name)+'</td><td>'+its.length+'</td><td>'+fmt(q)+'</td><td>'+Math.round(its.reduce((a,i)=>a+pct(i),0)/its.length)+'%</td><td>'+e+'</td><td>'+w+'</td></tr>'; }).join('')+'</tbody></table></div>':'<p><i>Belum ada item.</i></p>');
  sc.forEach(c=>{
    const its=s.items.filter(i=>i.prod===c), cols=P[c].cols.map(k=>P[c].fmap[k]).filter(Boolean);
    h+='<h2>'+(++n)+'. '+c+' — '+esc(P[c].name)+'</h2><div class="tw"><table><thead><tr><th>No</th>'+cols.map(f=>'<th>'+esc(f.l)+(f.u?' ('+esc(f.u)+')':'')+'</th>').join('')+'<th>Lengkap</th><th>Validasi</th></tr></thead><tbody>'+
      its.map((it,i)=>{ const vc=vcount(it); return '<tr><td>'+(i+1)+'</td>'+cols.map(f=>'<td>'+esc(filled(it.f[f.k])?it.f[f.k]:'')+'</td>').join('')+'<td>'+pct(it)+'%</td><td>'+(vc.err?vc.err+' error ':'')+(vc.warn?vc.warn+' peringatan':'')+(!vc.err&&!vc.warn?'OK':'')+'</td></tr>'; }).join('')+'</tbody></table></div>';
    its.forEach((it,i)=>{
      h+='<div class="itemblock"><h3>'+n+'.'+(i+1)+' '+esc(it.f.tag||'(tanpa tag)')+'</h3>';
      visSecs(it).forEach(sec=>{
        if(sec.id==='foto') return;
        const rows=visFields(sec,it).map(f=>[f.l,val(it,f),f.crit&&!filled(it.f[f.k])]).filter(r=>r[1]!==''||r[2]);
        if(sec.id==='kondisi'){ const fl=P[c].fails.filter(x=>it.fail[x]); if(fl.length) rows.unshift(['Temuan kondisi',fl.join(', '),false]); }
        if(sec.id==='movement'){ const g=gapCalc(it); if(g) rows.push(['Celah 4 titik (12/3/6/9)',[it.gap.g12,it.gap.g3,it.gap.g6,it.gap.g9].join(' / ')+' mm',false]); }
        if(sec.id==='box'){ const b=boxCalc(it); if(b&&b.sec>0){ rows.push(['Penampang terhitung',fmt(b.sec,2)+' mm'+(c==='GPP'?' (standar '+fmt(b.std,1)+' mm)':''),false]); if(b.rings!=null) rows.push(['Perkiraan jumlah ring',String(b.rings),false]); if(c==='GPP'&&b.total!=null) rows.push(['Perkiraan kebutuhan packing',fmt(b.total,2)+' m',false]); } }
        if(rows.length) h+='<p style="margin:10px 0 2px;font-weight:600">'+esc(sec.t)+'</p>'+kv(rows);
      });
      if(it.cref.length) h+='<p style="margin:10px 0 2px;font-weight:600">Acuan custom</p>'+kv(it.cref.filter(r=>r.k).map(r=>{ const fd=fdef(it,r.k); return [fd?fd.l:r.k,(r.val||'')+(fd&&fd.u?' '+fd.u:'')+' ± '+(r.tol||fmt(tolOf(it),1)),false]; }));
      const v=validate(it); if(v.length) h+='<p style="margin:10px 0 2px;font-weight:600">Hasil validasi</p><table>'+v.map(x=>'<tr'+(x.l==='err'?' class="missing"':'')+'><td style="width:90px">'+({ok:'Sesuai',warn:'Peringatan',err:'Error'}[x.l])+'</td><td>'+esc(x.m)+'</td></tr>').join('')+'</table>';
      if(it.photos.length) h+='<p style="margin:10px 0 6px;font-weight:600">Foto</p><div class="pgrid">'+it.photos.map(p=>{ const src=(photoMap&&photoMap[p.id]!==undefined)?photoMap[p.id]:photoSrc(p); return '<figure>'+(src?'<img src="'+esc(src)+'" alt="">':'')+'<figcaption>'+esc(p.cat||'')+(p.cap?': '+esc(p.cap):'')+'</figcaption></figure>'; }).join('')+'</div>';
      h+='</div>';
    });
  });
  h+='<h2>'+(++n)+'. Catatan lapangan</h2>'+(s.notes.length?'<table><thead><tr><th>Hari</th><th>Item</th><th>Catatan</th></tr></thead><tbody>'+s.notes.map(x=>{ const i=s.items.find(y=>y.id===x.itemId); return '<tr><td>'+esc(dayLabel(s,x.dayId))+'</td><td>'+esc(i?i.prod+' '+i.f.tag:'Umum')+'</td><td style="white-space:pre-wrap">'+esc(x.text)+'</td></tr>'; }).join('')+'</tbody></table>':'<p><i>Tidak ada.</i></p>');
  h+='<h2>'+(++n)+'. Perlu dikonfirmasi ke client</h2>'+(s.openItems.length?'<table><thead><tr><th>Status</th><th>Item</th></tr></thead><tbody>'+s.openItems.map(o=>'<tr><td>'+(o.done?'Selesai':'Terbuka')+'</td><td>'+esc(o.text)+'</td></tr>').join('')+'</tbody></table>':'<p><i>Tidak ada.</i></p>');
  const miss=s.items.map(it=>[it.prod+' '+(it.f.tag||'(tanpa tag)'),missing(it).map(c=>c.l)]).filter(x=>x[1].length);
  h+='<h2>'+(++n)+'. Data utama yang belum lengkap</h2>'+(miss.length?'<table><thead><tr><th>Item</th><th>Data kosong</th></tr></thead><tbody>'+miss.map(m=>'<tr class="missing"><td>'+esc(m[0])+'</td><td>'+esc(m[1].join(', '))+'</td></tr>').join('')+'</tbody></table>':'<p>Semua data utama sudah terisi.</p>');
  h+='<div class="foot">Disusun oleh '+esc(I.surveyor||'surveyor')+' · dibuat '+new Date().toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'})+'. Tabel standar pada validasi adalah referensi awal; verifikasi ke dokumen standar resmi sebelum design final.</div>';
  return h;
}
function reportCSS(){ let css=''; for(const sh of document.styleSheets){ try{ for(const r of sh.cssRules){ if(r.selectorText&&/(^|,\s*)\.rpt/.test(r.selectorText)) css+=r.cssText+'\n'; } }catch(e){} } return css; }
async function blobToDataURL(b){ return await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b); }); }
function fileBase(s){ return ('Survey-GTE-'+(s.info.client||'tanpa-nama')+'-'+(s.info.tanggal||today())).replace(/[^\w\-]+/g,'_'); }
async function save(name,data){
  if(!DL){ toast('Unduhan tidak tersedia di tampilan ini.'); return; }
  try{ const r=await DL.save({filename:name,data}); if(r&&r.status==='saved') toast('Tersimpan: '+name); }
  catch(e){ if(e&&e.code&&!/cancel|declin/.test(e.code)) toast('Gagal mengunduh ('+e.code+').'); }
}
async function downloadReport(){
  const s=cur(); toast('Menyiapkan laporan…'); const map={};
  for(const it of s.items) for(const p of it.photos){ if(p.data){ map[p.id]=p.data; continue; } try{ const r=await fetch(photoSrc(p)); if(!r.ok) throw 0; map[p.id]=await blobToDataURL(await r.blob()); }catch(e){ map[p.id]=''; } }
  const html='<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Laporan Survey '+esc(s.info.client||'')+'</title><link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet"><style>:root{--body:\'Barlow\',system-ui,sans-serif;--cond:\'Barlow Condensed\',\'Arial Narrow\',sans-serif}body{margin:0;background:#fff}'+reportCSS()+'.rpt{max-width:960px;margin:0 auto}@media print{.rpt{padding:0}}</style></head><body><div class="rpt">'+reportBody(s,map)+'</div></body></html>';
  await save(fileBase(s)+'.html',html);
}
function downloadCsv(prod){
  const s=cur(), fields=[]; P[prod].secs.forEach(sec=>sec.f.forEach(f=>{ if(!fields.some(x=>x.k===f.k)) fields.push(f); }));
  const q=v=>{ const t=String(v==null?'':v); return /[;"\n\r]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t; };
  const head=['Client','Produk'].concat(fields.map(f=>f.l+(f.u?' ('+f.u+')':'')),['Temuan kondisi','Jumlah foto','Kelengkapan (%)','Error validasi','Peringatan validasi']);
  const rows=s.items.filter(i=>i.prod===prod).map(it=>{ const vc=vcount(it); return [s.info.client||'',prod].concat(fields.map(f=>f.ty==='day'?dayLabel(s,it.f[f.k]):(it.f[f.k]||'')),[P[prod].fails.filter(x=>it.fail[x]).join(', '),it.photos.length,pct(it),vc.err,vc.warn]); });
  save(fileBase(s)+'-'+prod+'.csv','\ufeff'+[head].concat(rows).map(r=>r.map(q).join(';')).join('\r\n'));
}
async function aiSummary(){
  const s=cur(), btn=$('#aiBtn'), msg=$('#aiMsg'), ta=$('#sumText'); if(!SAMPLE||!btn) return;
  const data={info:s.info,hari:s.days.map((d,i)=>({hari:i+1,tanggal:d.date,rencana:d.plan})),items:s.items.map(it=>{ const o={produk:it.prod+' ('+P[it.prod].name+')'}; visSecs(it).forEach(sec=>visFields(sec,it).forEach(f=>{ if(filled(it.f[f.k])&&f.ty!=='day') o[f.l]=it.f[f.k]+(f.u?' '+f.u:''); })); o['Temuan kondisi']=P[it.prod].fails.filter(x=>it.fail[x]); o['Hasil validasi']=validate(it).filter(v=>v.l!=='ok').map(v=>v.m); o['Data utama kosong']=missing(it).map(c=>c.l); return o; }),catatan:s.notes.map(n=>n.text),perlu_konfirmasi:s.openItems.filter(o=>!o.done).map(o=>o.text)};
  const prompt='Anda adalah application engineer untuk produk sealing & expansion joint (EJR, EJM, EJF, spiral wound gasket, grooved metal gasket, removable thermal insulation, gland packing, die formed graphite). Berdasarkan data survey lapangan berikut (JSON), tulis draf bagian "Ringkasan & rekomendasi" laporan untuk atasan, dalam Bahasa Indonesia yang ringkas dan profesional.\n\nFormat: teks polos tanpa markdown (jangan pakai #, *, atau tabel). Empat bagian berjudul huruf biasa:\n1. Ringkasan temuan (jumlah hari, produk, item, kondisi umum)\n2. Rekomendasi awal per produk dan per item yang penting (material, konstruksi, tipe) beserta alasan singkat berdasarkan kondisi operasi dan hasil validasi\n3. Data yang masih perlu dikonfirmasi\n4. Catatan untuk tim design, BOM, dan estimasi harga\n\nJangan mengarang angka yang tidak ada. Tandai rekomendasi berbasis asumsi dengan kata "asumsi". Maksimal sekitar 550 kata.\n\nDATA:\n'+JSON.stringify(data);
  btn.disabled=true; msg.textContent='Menyusun draf…'; const before=ta.value;
  try{
    const r=await SAMPLE(prompt,{cache:false,onText:({text})=>{ ta.value=text; msg.textContent='Menulis…'; }});
    ta.value=r.text; s.summary=r.text; touch(); msg.textContent=r.truncated?'Draf terpotong, lengkapi secara manual.':'Draf selesai. Periksa dan sesuaikan.';
    const rp=$('.rpt'); if(rp) rp.innerHTML=reportBody(s);
  }catch(e){ ta.value=e&&e.text?e.text:before; msg.textContent=e&&e.code==='not_granted'?'Izin untuk Claude tidak diberikan.':e&&e.code==='rate_limited'?'Terlalu banyak permintaan, coba sebentar lagi.':'Draf gagal dibuat. Tulis ringkasan secara manual.'; }
  btn.disabled=false;
}

/* ---------- photos ---------- */
async function resize(file,max,q){
  const url=URL.createObjectURL(file);
  try{ const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)); const c=document.createElement('canvas'); c.width=Math.round(img.naturalWidth*k); c.height=Math.round(img.naturalHeight*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height); return await new Promise(res=>c.toBlob(b=>res(b),'image/jpeg',q));
  } finally { URL.revokeObjectURL(url); }
}
async function addPhotos(files){
  const it=curItem(); if(!it||!files.length) return; toast('Menyimpan '+files.length+' foto…');
  for(const file of files){
    try{
      if(ASSETS){ const blob=await resize(file,1600,0.82); const r=await ASSETS.upload(blob,{type:'image/jpeg'}); it.photos.push({id:'p'+uid(),aid:r.id,url:r.url,cat:it.photos.length?'Lainnya':'Keseluruhan',cap:''}); }
      else { const blob=await resize(file,640,0.6); it.photos.push({id:'p'+uid(),data:await blobToDataURL(blob),cat:it.photos.length?'Lainnya':'Keseluruhan',cap:''}); }
    }catch(e){ toast('Satu foto gagal disimpan'+(e&&e.code?' ('+e.code+')':'')+'.'); }
  }
  touch(); S.open.foto=true; render(); const f=$('details[data-sec="foto"]'); if(f) f.scrollIntoView({block:'start'});
}

/* =========================================================
   EVENTS
   ========================================================= */
document.addEventListener('input',e=>{
  const el=e.target, d=el.dataset||{}, s=cur();
  if(el.id==='pcd_n'||el.id==='pcd_c'){ pcdCalc(); return; }
  if(!s) return;
  if(d.dday){ const x=s.days.find(y=>y.id===d.dday); if(x){ x.date=el.value; touch(); } return; }
  if(d.dplan){ const x=s.days.find(y=>y.id===d.dplan); if(x){ x.plan=el.value; touch(); } return; }
  if(d.cr){ const it=curItem(); const r=it.cref.find(x=>x.id===d.cr); if(r){ r[d.crk]=el.value; touch(); updateHelpers(); } return; }
  const b=d.b; if(!b) return;
  const i=b.indexOf('.'), ns=b.slice(0,i), k=b.slice(i+1);
  if(ns==='info'){ s.info[k]=el.value; if(k==='client'||k==='tanggal') renderTop(); }
  else if(b==='summary'){ s.summary=el.value; }
  else if(ns==='f'){ const it=curItem(); if(!it) return; it.f[k]=el.value; const fd=fdef(it,k);
    if(fd&&fd.rr){ touch(); keepScroll(render); return; }
    const fl=el.closest('.fld'); if(fl&&fd&&fd.crit) fl.classList.toggle('empty-crit',!filled(el.value));
    refreshItemMeta(); updateHelpers(); if(k==='n_bolt'){ const pn=$('#pcd_n'); if(pn&&!pn.value) pn.value=el.value; } }
  else if(ns==='gap'){ const it=curItem(); if(!it) return; it.gap[k]=el.value; updateHelpers(); }
  touch();
});
document.addEventListener('change',e=>{
  const el=e.target, s=cur();
  if(el.id==='surveyPick'){ S.cur=el.value; S.item=null; S.filter='ALL'; localSave(); render(); return; }
  if(!s) return;
  if(el.id==='activeDay'){ s.activeDay=el.value; touch(); return; }
  const d=el.dataset;
  if(d.tool){ s.tools[d.tool]=el.checked; touch(); keepScroll(render); }
  else if(d.doc){ s.docs[d.doc]=el.checked; touch(); keepScroll(render); }
  else if(d.prod){ const a=s.info.products||[]; s.info.products=el.checked?a.concat([d.prod]):a.filter(x=>x!==d.prod); touch(); keepScroll(render); }
  else if(d.fail){ curItem().fail[d.fail]=el.checked; touch(); refreshItemMeta(); }
  else if(d.oi){ const o=s.openItems.find(x=>x.id===d.oi); if(o){ o.done=el.checked; touch(); el.closest('.oi').classList.toggle('done',el.checked); } }
  else if(d.pcat){ const p=curItem().photos.find(x=>x.id===d.pcat); if(p){ p.cat=el.value; touch(); } }
  else if(d.pcap!==undefined){ const p=curItem().photos.find(x=>x.id===d.pcap); if(p){ p.cap=el.value; touch(); } }
  else if(d.photo!==undefined){ const files=Array.from(el.files||[]); el.value=''; addPhotos(files); }
});
document.addEventListener('toggle',e=>{ const t=e.target; if(t.matches&&t.matches('details.sec')) S.open[t.dataset.sec]=t.open; },true);
document.addEventListener('keydown',e=>{ if(e.key!=='Enter') return; if(e.target.id==='newTag'){ e.preventDefault(); act('addItemPrep'); } if(e.target.id==='oiText'){ e.preventDefault(); act('addOi'); } });
let armed=null;
function confirmTwice(btn,key,label){ if(armed===key){ armed=null; return true; } armed=key; const old=btn.textContent; btn.textContent=label; setTimeout(()=>{ if(armed===key){ armed=null; if(btn.isConnected) btn.textContent=old; } },3500); return false; }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(!b) return; act(b.dataset.act,b); });

function focusTag(){ const t=$('#f_tag'); if(t){ t.focus(); t.select(); } }
function act(a,b){
  const s=cur();
  switch(a){
    case 'newSurvey': { const n=newSurvey(); S.surveys[n.id]=n; S.cur=n.id; S.phase='prep'; S.item=null; S.filter='ALL'; touch(); render(); try{ window.scrollTo(0,0); }catch(e){} setTimeout(()=>{ const c=$('#info_client'); if(c) c.focus(); },50); break; }
    case 'phase': S.phase=b.dataset.p; localSave(); render(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'addDay': { const last=s.days[s.days.length-1]; let dt=today(); if(last&&last.date){ const x=new Date(last.date+'T00:00:00'); x.setDate(x.getDate()+1); dt=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); } s.days.push({id:'d'+uid(),date:dt,plan:''}); touch(); keepScroll(render); break; }
    case 'delDay': s.days=s.days.filter(d=>d.id!==b.dataset.id); if(!s.days.find(d=>d.id===s.activeDay)) s.activeDay=s.days[s.days.length-1].id; s.notes.forEach(n=>{ if(n.dayId===b.dataset.id) n.dayId=s.days[0].id; }); touch(); keepScroll(render); break;
    case 'newDayToday': { const t=today(); let d=s.days.find(x=>x.date===t); if(!d){ d={id:'d'+uid(),date:t,plan:''}; s.days.push(d); } s.activeDay=d.id; touch(); keepScroll(render); toast(dayLabel(s,d.id)+' aktif.'); break; }
    case 'addItemPrep': { const inp=$('#newTag'), prod=$('#newProd').value, t=inp.value.trim(); const it=newItem(s,prod,t||null); s.items.push(it); if((s.info.products||[]).indexOf(prod)<0) s.info.products=(s.info.products||[]).concat([prod]); touch(); keepScroll(render); const n=$('#newTag'); if(n) n.focus(); break; }
    case 'goItem': { const it=s.items.find(i=>i.id===b.dataset.id); S.item=it.id; S.filter='ALL'; S.phase='field'; localSave(); render(); try{ window.scrollTo(0,0); }catch(e){} break; }
    case 'toolsAll': TOOLS.forEach(g=>g[1].forEach(t=>{ if(inScope(t[2],s)) s.tools[t[0]]=true; })); touch(); keepScroll(render); break;
    case 'toolsNone': s.tools={}; touch(); keepScroll(render); break;
    case 'delSurvey': if(!confirmTwice(b,'ds','Ketuk lagi untuk menghapus')) return; delete S.surveys[s.id]; dirty.add(s.id); { const l=sortedSurveys(); S.cur=l.length?l[0].id:null; } localSave(); clearTimeout(timer); timer=setTimeout(flush,200); render(); toast('Survey dihapus.'); break;
    case 'filter': S.filter=b.dataset.p; S.item=null; render(); break;
    case 'togglePicker': S.picker=!S.picker; keepScroll(render); break;
    case 'pickItem': S.item=b.dataset.id; render(); break;
    case 'addItem': { const prod=b.dataset.p, it=newItem(s,prod); s.items.push(it); if((s.info.products||[]).indexOf(prod)<0) s.info.products=(s.info.products||[]).concat([prod]); S.item=it.id; S.picker=false; if(S.filter!=='ALL') S.filter=prod; S.open={ident:true,acuan:true}; touch(); render(); focusTag(); break; }
    case 'dupItem': { const src=curItem(), it=newItem(s,src.prod); it.f=JSON.parse(JSON.stringify(src.f)); it.f.tag=(src.f.tag||src.prod)+'-B'; it.f.day=s.activeDay; it.gap=JSON.parse(JSON.stringify(src.gap||{})); it.cref=JSON.parse(JSON.stringify(src.cref||[])); s.items.splice(s.items.indexOf(src)+1,0,it); S.item=it.id; S.open.ident=true; touch(); render(); toast('Item diduplikat tanpa foto. Ganti tag number-nya.'); focusTag(); break; }
    case 'delItem': { if(!confirmTwice(b,'di','Ketuk lagi untuk menghapus')) return; const it=curItem(); s.items=s.items.filter(x=>x!==it); s.notes.forEach(n=>{ if(n.itemId===it.id) n.itemId=''; }); S.item=null; touch(); render(); toast('Item dihapus.'); break; }
    case 'match': { const it=curItem(), c=flangeCandidates(it.f), o=$('#matchOut'); if(!c){ o.innerHTML='<span class="warn">Isi OD flange atau PCD dulu.</span>'; return; }
      o.innerHTML='<div class="tablewrap"><table><thead><tr><th>Standar & ukuran</th><th>OD / PCD</th><th>Lubang</th><th></th></tr></thead><tbody>'+c.map((x,i)=>'<tr><td>'+esc(x.std)+'<br><b>'+esc(x.r[0])+'</b></td><td>'+fmt(x.r[1],1)+' / '+fmt(x.r[2],1)+'</td><td>'+x.r[3]+' × Ø'+fmt(x.r[4],1)+'</td><td><button class="btn ghost sm" data-act="useStd" data-i="'+i+'">Pakai</button></td></tr>').join('')+'</tbody></table></div>'; o._c=c; break; }
    case 'useStd': { const it=curItem(), x=$('#matchOut')._c[+b.dataset.i]; it.f.std=x.std; it.f.size1=x.r[0]; if(!filled(it.f.n_bolt)) it.f.n_bolt=String(x.r[3]); if(!filled(it.f.hole)) it.f.hole=String(x.r[4]).replace('.',','); touch(); keepScroll(render); toast('Standar '+x.std+' '+x.r[0]+' dipakai.'); break; }
    case 'usePcd': { const p=pcdCalc(); if(p==null){ toast('Isi jumlah lubang dan jarak antar pusat.'); return; } const it=curItem(); it.f.pcd=plain(p,1); const el=$('#f_pcd'); if(el){ el.value=it.f.pcd; el.closest('.fld').classList.remove('empty-crit'); } touch(); refreshItemMeta(); updateHelpers(); toast('PCD diisi.'); break; }
    case 'useGap': { const it=curItem(), r=gapCalc(it); if(!r){ toast('Isi keempat titik celah dan OD flange.'); return; } it.f.ftf=plain(r.avg,1); it.f.ang_mis=plain(r.ang,2); if(!filled(it.f.mov_src)) it.f.mov_src='Pengukuran lapangan';
      ['ftf','ang_mis','mov_src'].forEach(k=>{ const el=$('#f_'+k); if(el){ el.value=it.f[k]; const fl=el.closest('.fld'); if(fl) fl.classList.remove('empty-crit'); } }); touch(); refreshItemMeta(); updateHelpers(); toast('Panjang terpasang dan misalignment diisi.'); break; }
    case 'addCref': { const it=curItem(); it.cref.push({id:'c'+uid(),k:'',val:'',tol:''}); S.open.acuan=true; touch(); keepScroll(render); break; }
    case 'delCref': { const it=curItem(); it.cref=it.cref.filter(r=>r.id!==b.dataset.id); touch(); keepScroll(render); break; }
    case 'delPhoto': { if(!confirmTwice(b,'dp'+b.dataset.id,'Ketuk lagi')) return; const it=curItem(), p=it.photos.find(x=>x.id===b.dataset.id); it.photos=it.photos.filter(x=>x!==p); touch(); if(p&&p.aid&&ASSETS) ASSETS.delete(p.aid).catch(()=>{}); keepScroll(render); break; }
    case 'addNote': { const t=$('#noteText').value.trim(); if(!t){ $('#noteText').focus(); return; } s.notes.push({id:'n'+uid(),t:Date.now(),text:t,itemId:$('#noteItem').value,dayId:$('#noteDay').value}); touch(); render(); toast('Catatan disimpan.'); break; }
    case 'delNote': if(!confirmTwice(b,'dn'+b.dataset.id,'Ketuk lagi')) return; s.notes=s.notes.filter(n=>n.id!==b.dataset.id); touch(); keepScroll(render); break;
    case 'addOi': { const inp=$('#oiText'), t=inp.value.trim(); if(!t){ inp.focus(); return; } s.openItems.push({id:'o'+uid(),text:t,done:false}); touch(); keepScroll(render); const n=$('#oiText'); if(n) n.focus(); break; }
    case 'delOi': s.openItems=s.openItems.filter(o=>o.id!==b.dataset.id); touch(); keepScroll(render); break;
    case 'jump': { S.item=b.dataset.item; S.filter='ALL'; S.phase='field'; S.open[b.dataset.sec]=true; localSave(); render(); const el=$('#f_'+b.dataset.k); if(el){ el.scrollIntoView({block:'center'}); el.focus({preventScroll:true}); } break; }
    case 'aiSum': aiSummary(); break;
    case 'dlReport': downloadReport(); break;
    case 'dlCsv': downloadCsv(b.dataset.p); break;
    case 'dlJson': save(fileBase(s)+'.json',JSON.stringify(s,null,2)); break;
    case 'print': try{ window.print(); }catch(e){ toast('Cetak tidak tersedia di sini. Unduh laporan HTML lalu cetak dari browser.'); } break;
  }
}

render(); setStatus('local'); connect();
})();

