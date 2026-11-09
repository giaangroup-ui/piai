/* PiAi P1 – Nhiệm vụ thiết kế (Brief) -> tham số số. Đơn vị mét.
   v2: nhiều loại công trình: "townhouse" (nhà phố/liên kế), "villa" (biệt thự), "tower" (khối đế + tháp).
   Hệ trục: x = ngang, y = sâu (y=0 là mép mặt tiền nhà phố/biệt thự; đường ở phía y<0); khách sạn giữ hệ cũ (y = bắc). */
window.PiBrief=(()=>{
const HOTEL={type:"tower",name:"Khách sạn ven biển",plot:{w:90,d:45},plinth:0.75,
 volumes:[
  {id:"podium",label:"Khối đế",x0:14.8,y0:13.6,x1:74.4,y1:37.5,floors:[6.5,4,4,4,4],color:"#e6dcc6",chamfer:{corner:"SE",dx:7.6,dy:7.9,floorsCut:1}},
  {id:"tower",label:"Tháp",x0:14.8,y0:19.7,x1:64.7,y1:37.5,base:"podium",floors:Array(14).fill(3.3),color:"#fafafa"}],
 site:[{k:"carpark",x0:.5,y0:5,x1:12.9,y1:43},{k:"pond",a:[80.1,18.1],b:[65.8,6.8],w:2.2},{k:"island",x0:13.8,y0:1.5,x1:54.6,y1:8.3},{k:"sidewalk",w:4}],
 streets:[{k:"boulevard",side:"S",w:21},{k:"side",side:"E",w:17}],
 cameras:{corner:{eye:[165,-100,28],target:[48,22,33],fov:52},aerial:{eye:[170,-110,150],target:[45,20,15],fov:50},sea:{eye:[-75,150,40],target:[45,25,33],fov:50},entrance:{eye:[40,-95,1.7],target:[50,25,36],fov:70}},
 style:"contemporary Vietnamese coastal: wave-shaped balconies, bronze louvres, teak, stone podium with Cham lotus bronze screens, rooftop infinity pool on podium, sail-shaped crown"};
const TYPES={townhouse:"Nhà phố / liên kế",villa:"Biệt thự",tower:"Khối đế + tháp (khách sạn, cao tầng)"};
const DIRS={N:"Bắc",NE:"Đông Bắc",E:"Đông",SE:"Đông Nam",S:"Nam",SW:"Tây Nam",W:"Tây",NW:"Tây Bắc"};
const DIR_EN={N:"north",NE:"north-east",E:"east",SE:"south-east",S:"south",SW:"south-west",W:"west",NW:"north-west"};
const CAM_LABEL={corner:"Góc ngã ba / ngã tư",aerial:"Trên cao",sea:"Hướng biển",entrance:"Lối vào (tầm mắt)",front:"Mặt tiền từ vỉa hè đối diện",section:"Mặt cắt phối cảnh (lõi, các sàn – thử nghiệm)",street34:"Góc 3/4 từ đường"};
const r2=x=>Math.round(x*100)/100,clone=o=>JSON.parse(JSON.stringify(o));

/* ---------- SPEC (mức người dùng) -> BRIEF (hình học) ---------- */
const SPEC_TOWNHOUSE={type:"townhouse",name:"Nhà Trục Cây – nhà phố 3 thế hệ",plot:{w:6.75,d:18.5},house:{w:6.75,d:14.9,front:0,side:0},
 levels:[{n:"Trệt",z:.3},{n:"Lửng",z:3.1,mezz:1},{n:"Lầu 1",z:6.1},{n:"Lầu 2",z:9.3},{n:"Sân thượng",z:12.5,roof:1},{n:"Mái",z:15.9,top:1}],
 front:"N",core:{w:3.1,d:4,pos:"back",side:"left",tree:"Lộc Vừng"},roof:{terrace:1,shrine:1,garden:1,pergola:1,solar:0,type:"flat"},garage:1,
 facade:{breeze:1,louvre:1,planter:1},corner:0,street:8,sidewalk:3,light:"day",style:"modern tropical Vietnamese townhouse, terracotta breeze-block screen (gạch bông gió), vertical natural timber louvres, exposed concrete and lime plaster, planter balconies with trailing greenery"};
const SPEC_VILLA={type:"villa",name:"Biệt thự 3 tầng",plot:{w:15,d:22},house:{w:10,d:14,front:4,side:2.5},
 levels:[{n:"Tầng 1",z:.45},{n:"Tầng 2",z:4.05},{n:"Tầng 3",z:7.45},{n:"Mái",z:10.85,top:1}],front:"S",core:null,roof:{terrace:0,type:"flat"},garage:1,facade:{louvre:1,planter:1},
 corner:0,street:10,sidewalk:3,light:"day",style:"modern tropical Vietnamese villa, natural stone base, timber louvres, deep overhangs, large glazing, lush garden"};
const PRESETS={hotel:()=>clone(HOTEL),townhouse:()=>build(clone(SPEC_TOWNHOUSE)),villa:()=>build(clone(SPEC_VILLA))};

function lvNorm(L){L=L.filter(l=>isFinite(l.z)).sort((a,b)=>a.z-b.z);return L}
function build(S){S=clone(S);if(S.type==="tower")return S.brief?clone(S.brief):clone(HOTEL);
 const L=lvNorm(S.levels);const hw=Math.min(S.house.w,S.plot.w),hd=Math.min(S.house.d,S.plot.d);
 const x0=S.type==="villa"?(S.plot.w-hw)/2:0,y0=S.type==="villa"?(S.house.front||0):0,x1=x0+hw,y1=y0+hd;
 const iRoof=L.findIndex(l=>l.roof),iTop=L.findIndex(l=>l.top);const mainTop=iRoof>0?iRoof:(iTop>0?iTop:L.length-1);
 const fl=[],names=[];for(let i=0;i<mainTop;i++){fl.push(r2(L[i+1].z-L[i].z));names.push(L[i].n)}
 const V=[{id:"house",label:S.type==="villa"?"Thân nhà":"Thân nhà",x0,y0,x1,y1,floors:fl,names,color:"#f6efe2"}];
 let core=null;if(S.core&&S.core.w>0&&S.core.d>0){const cw=Math.min(S.core.w,hw-1.5),cd=Math.min(S.core.d,hd-3);
  const cy=S.core.pos==="front"?y0+hd*.3:S.core.pos==="mid"?y0+hd*.5:y0+hd*.63;const cx=S.core.side==="right"?x1-.2-cw/2:S.core.side==="center"?(x0+x1)/2:x0+.2+cw/2;
  core={x0:r2(cx-cw/2),x1:r2(cx+cw/2),y0:r2(cy-cd/2),y1:r2(cy+cd/2),tree:S.core.tree||"",skylight:1}}
 if(iRoof>0&&iTop>iRoof){/* khối mái (phòng thờ/thang) trên sân thượng */
  const ry0=y0+Math.min(1.2,hd*.08),ry1=core?Math.max(ry0+3,core.y0):y0+hd*.5;
  V.push({id:"roof",label:"Khối tum / phòng thờ",x0,y0:r2(ry0),x1,y1:r2(ry1),base:"house",floors:[r2(L[iTop].z-L[iRoof].z)],names:[L[iRoof].n],color:"#f4efe6"})}
 const mz=L.findIndex(l=>l.mezz);
 const B={v:2,type:S.type,name:S.name,plot:{w:S.plot.w,d:S.plot.d},plinth:r2(L[0].z),volumes:V,core,front:S.front||"N",
  mezz:mz>=0&&mz<mainTop?{i:mz,d:r2(core?core.y0-y0:hd*.5)}:null,roof:S.roof||{},garage:!!S.garage,facade:S.facade||{},
  neighbors:[],site:[{k:"sidewalk",w:S.sidewalk||3}],streets:[{k:"street",side:"S",w:S.street||8}],light:S.light||"day",style:S.style||"",spec:S};
 if(S.type==="townhouse"){const H1=fl.length>2?9:6.5;if(!S.corner)B.neighbors.push({x0:x0-7,y0,x1:x0,y1:y0+hd+1,h:H1});B.neighbors.push({x0:x1,y0,x1:x1+7,y1:y0+hd+1,h:Math.max(6.5,fl.reduce((a,b)=>a+b,0)-3.5)});B.party=S.corner?["E"]:["W","E"]}
 B.cameras=cams(B);return B}
function cams(B){const h=B.volumes[0],sw=(B.site.find(s=>s.k=="sidewalk")||{w:3}).w,st=B.streets[0].w,w=h.x1-h.x0,top=resolve(B).top;
 if(B.type==="townhouse")return{
  front:{eye:[h.x0+w*.5-Math.max(2.5,w*.6),h.y0-(sw*2+st)+.8,1.7],auto:1,W:1152,H:1536,ratio:"3:4"},
  aerial:{eye:[h.x0-12,h.y0-(sw+st)-14,top+16],auto:1,W:1536,H:1024,ratio:"3:2"},
  section:{eye:[h.x0-Math.max(h.y1-h.y0,top)*2.1,(h.y0+h.y1)/2,top*.48],auto:1,W:1536,H:1152,ratio:"4:3",section:1}};
 return{street34:{eye:[h.x1+18,h.y0-(sw+st)-10,1.7],auto:1,margin:1.35,W:1536,H:1024,ratio:"3:2"},front:{eye:[(h.x0+h.x1)/2,h.y0-(sw*2+st)-6,1.7],auto:1,W:1536,H:1024,ratio:"3:2"},
  aerial:{eye:[h.x1+22,h.y0-(sw+st)-20,top+22],auto:1,W:1536,H:1024,ratio:"3:2"},section:{eye:[h.x0-Math.max(h.y1-h.y0,top)*2,(h.y0+h.y1)/2,top*.5],auto:1,W:1536,H:1152,ratio:"4:3",section:1}}}

const levels=v=>{let z=0,a=[0];for(const h of v.floors)a.push(z+=h);return a};
function resolve(b){b=clone(b);if(!b.type)b.type="tower";const by={};for(const v of b.volumes){const base=v.base?by[v.base].top:b.plinth;v.lv=levels(v).map(z=>+(z+base).toFixed(2));v.top=v.lv[v.lv.length-1];by[v.id]=v}b.top=Math.max(...b.volumes.map(v=>v.top));
 b.storeys=b.volumes.reduce((s,x)=>s+x.floors.length,0);return b}
function validate(b){const e=[];for(const v of b.volumes){if(!(v.x1>v.x0&&v.y1>v.y0))e.push(v.label+": kích thước sai");if(v.x1>b.plot.w+.01||v.y1>b.plot.d+.01||v.x0<-.01||v.y0<-.01)e.push(v.label+": vượt ranh lô đất");if(!v.floors.length)e.push(v.label+": chưa có tầng");if(v.floors.some(h=>!(h>=2&&h<=12)))e.push(v.label+": chiều cao tầng phải 2–12 m")}
 if(b.core){const h=b.volumes[0];if(b.core.x0<h.x0||b.core.x1>h.x1||b.core.y0<h.y0||b.core.y1>h.y1)e.push("Lõi/giếng trời nằm ngoài thân nhà")}return e}
function cams_of(B){return B.cameras||cams(B)}

/* ---------- Đọc yêu cầu tiếng Việt (viết tắt kiểu người Việt) -> SPEC ---------- */
const NUM="(\\d+(?:\\.\\d+)?)";
function norm(t){return String(t||"").toLowerCase().normalize("NFC").replace(/(\d),(\d)/g,"$1.$2").replace(/×|\*/g,"x").replace(/\s+/g," ")}
function parse(text,prev){const t=norm(text),got=[],assume=[];if(!t.trim())return{ok:false,got,assume};
 const has=re=>re.test(t),m1=re=>{const m=t.match(re);return m?+m[1]:null};
 let type=has(/khách sạn|hotel|cao tầng|chung cư|tháp|podium|khối đế|tầng đế|văn phòng cao/)?"tower":has(/biệt thự|villa|nhà vườn/)?"villa":has(/nhà phố|liên kế|liền kề|nhà ống|townhouse|shophouse|nhà lô/)?"townhouse":null;
 /* kích thước */
 const dimRe=new RegExp(NUM+"\\s*m?\\s*x\\s*"+NUM+"\\s*m?","g");const dims=[...t.matchAll(dimRe)].map(m=>({w:+m[1],d:+m[2],i:m.index}));
 let ng=m1(new RegExp("(?:ngang|mặt tiền rộng|rộng)\\s*"+NUM)),dai=m1(new RegExp("(?:dài|sâu)\\s*"+NUM));
 const isCore=d=>/(lõi|giếng trời|thông tầng|sân trong|lõi cây)[^.;]{0,25}$/.test(t.slice(Math.max(0,d.i-40),d.i));
 const isPlot=d=>/(lô|thửa|đất)[^.;]{0,12}$/.test(t.slice(Math.max(0,d.i-25),d.i));
 const coreDim=dims.find(isCore),plotDim=dims.find(d=>!isCore(d)&&isPlot(d)),bDim=dims.find(d=>!isCore(d)&&!isPlot(d))||plotDim;
 if(bDim){ng=bDim.w;dai=bDim.d}
 if(!type&&ng)type=ng<=8.5?"townhouse":"villa";
 if(!type&&has(/trệt|lửng|lầu|sân thượng/))type="townhouse";
 if(!type)return{ok:false,got,assume,reason:"Chưa rõ loại công trình / kích thước"};
 if(type==="tower"){const b=clone(prev&&prev.type=="tower"?prev:HOTEL);const nd=m1(/(\d+)\s*tầng\s*(?:khối\s*)?đế/)||m1(/đế\s*(\d+)\s*tầng/),nt=m1(/(\d+)\s*tầng\s*(?:khối\s*)?tháp/)||m1(/tháp\s*(\d+)\s*tầng/);
  if(nd){const f=b.volumes[0].floors;b.volumes[0].floors=[f[0]||6.5,...Array(nd-1).fill(f[1]||4)];got.push(`Khối đế ${nd} tầng`)}
  if(nt){b.volumes[1].floors=Array(nt).fill(b.volumes[1].floors[0]||3.3);got.push(`Tháp ${nt} tầng`)}
  if(!nd&&!nt)assume.push("Dùng mẫu khách sạn 5 tầng đế + 14 tầng tháp");
  b.name=b.name||"Khối đế + tháp";const st=styleOf(t);if(st.style)b.style=st.style+"; "+b.style;
  return{ok:true,type,brief:b,got:["Loại: khối đế + tháp",...got],assume,view:viewOf(t,type),spec:null}}
 const S=clone(type==="villa"?SPEC_VILLA:SPEC_TOWNHOUSE);S.name=type==="villa"?"Biệt thự":"Nhà phố";S.core=null;S.facade={};S.roof={terrace:0,type:"flat"};S.garage=0;
 if(ng&&dai){S.house.w=ng;S.house.d=dai;got.push(`Nhà ${fmt(ng)} × ${fmt(dai)} m`)}else assume.push(`Kích thước mặc định ${fmt(S.house.w)} × ${fmt(S.house.d)} m`);
 if(plotDim&&plotDim!==bDim){S.plot={w:plotDim.w,d:plotDim.d};got.push(`Lô đất ${fmt(plotDim.w)} × ${fmt(plotDim.d)} m`)}
 else if(type=="townhouse")S.plot={w:S.house.w,d:+(S.house.d+3.6).toFixed(2)};else S.plot={w:+(S.house.w+5).toFixed(2),d:+(S.house.d+7).toFixed(2)},S.house.front=4,S.house.side=2.5;
 /* tầng */
 const lung=has(/(\d+)\s*lửng|tầng lửng|có lửng|\blửng\b/),thuong=has(/sân thượng|tum|thượng/),nl=m1(/(\d+)\s*lầu/),nt=m1(/(\d+)\s*tầng(?!\s*(?:lửng|hầm))/);
 let up=nl!=null?nl:(nt!=null?Math.max(0,nt-1):(type=="villa"?2:2));if(nl==null&&nt==null)assume.push(`Số tầng mặc định: trệt + ${up} lầu`);
 const H={tret:m1(new RegExp("(?:trệt|tầng 1)\\s*cao\\s*"+NUM))||(type=="villa"?3.6:(lung?2.9:3.6)),lung:2.9,lau:m1(new RegExp("(?:lầu|tầng)\\s*cao\\s*"+NUM))||3.3,thuong:3.0};
 const lab=type=="villa"?(i=>`Tầng ${i+1}`):(i=>i==0?"Trệt":`Lầu ${i}`);
 let L=[],z=type=="villa"?.45:.3;const pl=m1(new RegExp("nền\\s*(?:cao)?\\s*(?:hơn\\s*(?:mặt\\s*)?(?:đường|vỉa hè)\\s*)?\\+?"+NUM+"\\s*m"))??(m1(/(\d+)\s*(?:cấp|bậc)/)?m1(/(\d+)\s*(?:cấp|bậc)/)*.15:null);if(pl!=null){z=pl;got.push(`Nền +${fmt(z)} m`)}
 L.push({n:lab(0),z});z+=H.tret;if(lung){L.push({n:"Lửng",z,mezz:1});z+=H.lung}
 for(let i=1;i<=up;i++){L.push({n:lab(i),z});z+=H.lau}
 if(thuong){L.push({n:"Sân thượng",z,roof:1});z+=H.thuong}L.push({n:"Mái",z,top:1});
 /* cao độ ghi rõ: "trệt +0.30, lửng +3.10, lầu 1 +6.10 ..." */
 const ex=[...t.matchAll(/(trệt|lửng|lầu\s*\d|tầng\s*\d|sân thượng|thượng|tum|mái)\s*[:=]?\s*\(?\s*([+±-]?\s*\d+\.\d+)/g)];
 if(ex.length>=3){const E=ex.map(m=>({k:m[1].replace(/\s+/g," "),z:+m[2].replace(/[±\s]/g,"")}));const L2=[];
  for(const e of E){const k=e.k;const o={z:e.z,n:k=="trệt"?"Trệt":k=="lửng"?"Lửng":/sân thượng|thượng|tum/.test(k)?"Sân thượng":k=="mái"?"Mái":k.replace(/^lầu/,"Lầu").replace(/^tầng/,"Tầng")};
   if(k=="lửng")o.mezz=1;if(/thượng|tum/.test(k))o.roof=1;if(k=="mái")o.top=1;L2.push(o)}
  if(!L2.some(l=>l.top)){const last=L2[L2.length-1];L2.push({n:"Mái",z:r2(last.z+(last.roof?3:1.2)),top:1});assume.push("Cao độ mái suy ra")}
  L=lvNorm(L2);for(let i=assume.length-1;i>=0;i--)if(/^Số tầng mặc định/.test(assume[i]))assume.splice(i,1);got.push("Cao độ: "+L.map(l=>`${l.n} +${l.z.toFixed(2)}`).join(" · "))}
 else{got.push("Tầng: "+L.filter(l=>!l.top).map(l=>l.n).join(" + "));assume.push(`Chiều cao tầng: ${L.slice(0,-1).map((l,i)=>`${l.n} ${fmt(r2(L[i+1].z-l.z))} m`).join(", ")}`)}
 S.levels=L;
 /* hướng */
 const dm=t.match(/hướng\s+(đông bắc|đông nam|tây bắc|tây nam|bắc|nam|đông|tây)/);if(dm){S.front={"bắc":"N","nam":"S","đông":"E","tây":"W","đông bắc":"NE","đông nam":"SE","tây bắc":"NW","tây nam":"SW"}[dm[1]];got.push("Mặt tiền hướng "+DIRS[S.front])}else{S.front=type=="villa"?"S":"N";assume.push("Chưa có hướng – tạm coi mặt tiền hướng "+DIRS[S.front])}
 /* lõi / giếng trời */
 if(has(/lõi|giếng trời|thông tầng|sân trong|trục cây/)){const tree=["lộc vừng","bàng","sứ","cau","phong","lim","sao đen","hoa sữa","bằng lăng","osaka","si","đa"].find(k=>new RegExp("(?:cây|^|\\s)"+k+"(?:\\s|,|\\.|$)").test(t))||"";
  S.core={w:coreDim?coreDim.w:(type=="villa"?4:2.8),d:coreDim?coreDim.d:(type=="villa"?4:3.5),pos:has(/lùi về sau|phía sau|sau nhà/)?"back":has(/giữa/)?"mid":"back",side:type=="villa"?"center":"left",tree:tree?cap(tree):""};
  got.push(`${tree?"Lõi cây "+cap(tree)+" ":/giếng trời/.test(t)?"Giếng trời ":"Lõi thông tầng "}${fmt(S.core.w)} × ${fmt(S.core.d)} m${S.core.pos=="back"?" lùi về sau":""}`);if(!coreDim)assume.push("Kích thước lõi giả định")}
 if(thuong){S.roof={terrace:1,shrine:has(/phòng thờ|thờ/)?1:0,garden:has(/vườn|rau|cây xanh trên/)?1:0,pergola:has(/pergola|giàn|vườn rau/)?1:0,solar:has(/pin mặt trời|năng lượng mặt trời|solar/)?1:0,type:"flat"};
  const r=[S.roof.shrine&&"phòng thờ",S.roof.garden&&"vườn rau",S.roof.pergola&&"pergola",S.roof.solar&&"pin mặt trời"].filter(Boolean);got.push("Sân thượng"+(r.length?": "+r.join(", "):""))}
 if(has(/mái thái|mái ngói|mái dốc/)){S.roof.type="gable";got.push("Mái dốc / mái thái")}
 S.garage=has(/gara|garage|ô tô|ôtô|xe hơi/)||(type=="villa")?1:(type=="townhouse"?1:0);
 S.corner=has(/nhà góc|lô góc|hai mặt tiền|2 mặt tiền/)?1:0;if(S.corner)got.push("Lô góc – một bên thoáng");else if(type=="townhouse")got.push("Hai bên vách chung với nhà liền kề");
 const st=styleOf(t);S.facade=st.facade;if(st.style)S.style=st.style;if(st.list.length)got.push("Vật liệu: "+st.list.join(", "));
 S.light=has(/ban đêm|buổi tối|về đêm|night/)?"night":has(/hoàng hôn|chiều tà|golden/)?"golden":"day";
 const nm=t.match(/(?:nhà|dự án|công trình)\s+"?([^",.;]{3,30})"?/);if(has(/trục cây/))S.name="Nhà Trục Cây";else if(has(/3 thế hệ|ba thế hệ/))S.name="Nhà phố 3 thế hệ";
 const strong=!!(bDim||ng)+(nl!=null||nt!=null||lung||ex.length>=3?1:0);
 return{ok:true,type,strong,spec:S,brief:build(S),got:[`Loại: ${TYPES[type]}`,...got],assume,view:viewOf(t,type)}}
function viewOf(t,type){if(/mặt cắt|cắt dọc|section/.test(t))return"section";if(/trên cao|toàn cảnh|flycam|chim bay|aerial|từ trên/.test(t))return"aerial";if(type=="tower")return/lối vào|tầm mắt/.test(t)?"entrance":/biển/.test(t)?"sea":"corner";if(/góc 3\/4|góc đường|3\/4/.test(t)&&type!="townhouse")return"street34";return"front"}
function styleOf(t){const F={},L=[],E=[];const add=(re,k,vi,en)=>{if(re.test(t)){F[k]=1;L.push(vi);E.push(en)}};
 add(/bông gió/,"breeze","gạch bông gió","terracotta breeze-block screen (gạch bông gió)");add(/lam gỗ|lam đứng|lam/,"louvre","lam gỗ","vertical natural timber louvres in front of glazing");
 add(/bồn cây|ban công cây|cây rủ|xanh rủ/,"planter","bồn cây ban công","planter balconies with trailing greenery");add(/gạch thẻ|gạch nung|gạch trần/,"brick","gạch nung","exposed fired clay brick");
 add(/đá tự nhiên|ốp đá|đá granite|đá/,"stone","đá tự nhiên","natural stone cladding");add(/bê tông trần|bê tông/,"concrete","bê tông trần","fair-faced exposed concrete");add(/mây|tre/,"rattan","mây tre","rattan and bamboo details");add(/kính/,"glass","kính","large clear glazing");
 if(/lõi cây|trục cây|cây xanh|bồn cây/.test(t)&&!F.planter){F.planter=1}
 const mod=/tân cổ điển|cổ điển/.test(t)?"neoclassical Vietnamese":/indochine|đông dương/.test(t)?"Indochine":/nhiệt đới|tropical|thiên nhiên|xanh/.test(t)?"modern tropical Vietnamese":"contemporary Vietnamese";
 return{facade:F,list:L,style:E.length?`${mod} architecture, ${E.join(", ")}, warm lime plaster walls`:""}}
const fmt=x=>String(+(+x).toFixed(2)).replace(".",",");const cap=s=>s.split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
/* tóm tắt tiếng Việt */
function summary(B){B=resolve(B);const h=B.volumes[0];if(B.type=="tower")return B.volumes.map(v=>`${v.label} ${v.floors.length} tầng (${fmt(v.x1-v.x0)}×${fmt(v.y1-v.y0)} m)`).join(" + ")+` · đỉnh +${fmt(B.top)} m`;
 const r=B.volumes.find(v=>v.id=="roof");return `${TYPES[B.type]} ${fmt(h.x1-h.x0)}×${fmt(h.y1-h.y0)} m · ${h.names.join(" + ")}${r?" + "+r.names[0]:""} · đỉnh +${fmt(B.top)} m · mặt tiền hướng ${DIRS[B.front]||"?"}${B.core?` · lõi ${fmt(B.core.x1-B.core.x0)}×${fmt(B.core.y1-B.core.y0)} m`:""}`}
function load(){try{const b=JSON.parse(localStorage.piai_brief);if(b&&b.volumes)return b}catch(_){}return clone(HOTEL)}
return {HOTEL,TYPES,DIRS,DIR_EN,CAM_LABEL,PRESETS,SPEC_TOWNHOUSE,SPEC_VILLA,build,cams:cams_of,resolve,validate,parse,summary,fmt,save:b=>localStorage.piai_brief=JSON.stringify(b),load};
})();
