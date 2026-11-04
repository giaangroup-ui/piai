/* PiAi P1 – Công cụ "Render theo Nhiệm vụ thiết kế": nhập nhiệm vụ → xem khối → render → bảng ✓/✗ */
(()=>{
const CAMS={corner:"Góc ngã ba / ngã tư",aerial:"Trên cao",sea:"Hướng biển",entrance:"Lối vào (tầm mắt)"};
W.brief={tab:"ext",ic:"📐",n:"Render theo Nhiệm vụ thiết kế",d:"Nhập số liệu → PiAi dựng khối, render và tự kiểm tra số tầng, tỷ lệ, góc nhìn. Ảnh sai bị loại, không trừ xu.",custom:"brief",kind:"local",s:[],c:"none",p:o=>""};
const st=document.createElement("style");st.textContent=`
.nb{max-width:1100px;margin:0 auto;padding:6px 4px 40px}.nb h2{margin:0}.nb .sub{color:var(--m);margin:4px 0 16px}
.nbs{display:flex;gap:6px;margin:0 0 18px;flex-wrap:wrap}.nbs div{flex:1;min-width:150px;padding:10px 12px;border:1px solid var(--b);border-radius:12px;color:var(--m);font-size:13px}.nbs div b{display:block;font-size:15px;color:var(--t)}.nbs .on{border-color:var(--a);background:#f5a52414}.nbs .ok{border-color:#2fbf71}.nbs .ok b:after{content:" ✓";color:#2fbf71}
.nbc{background:var(--p);border:1px solid var(--b);border-radius:16px;padding:18px;margin-bottom:14px}.nbc h3{margin:0 0 12px;font-size:16px}
.nbg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.nbg label,.nbc>label{display:flex;flex-direction:column;font-size:12px;color:var(--m);gap:4px}
.nbc input,.nbc textarea,.nbc select{background:var(--bg);color:var(--t);border:1px solid var(--b);border-radius:9px;padding:8px}.nbc textarea{min-height:64px}
.nbv{border:1px dashed var(--b);border-radius:12px;padding:12px;margin:10px 0}.nbv legend{padding:0 6px;color:var(--a);font-weight:600}
.nbimg{width:100%;border-radius:12px;border:1px solid var(--b);display:block}.nbsum{display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;font-size:14px}.nbsum span b{color:var(--a)}
.nbact{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}.nbdemo{background:#ff3b301a;border:1px solid #ff3b30;color:#ffb3ad;border-radius:10px;padding:8px 12px;margin-bottom:14px;font-size:13px}
.nbres{display:grid;grid-template-columns:1.6fr 1fr;gap:14px}@media(max-width:860px){.nbres{grid-template-columns:1fr}}
.pscore div{padding:3px 0;font-size:14px}.nbbad{opacity:.55;font-size:12px}`;document.head.appendChild(st);
let B=PiBrief.load(),cam="corner",M=null,step=1;
const isDemo=()=>!S.piai_key&&!S.piai_okey&&!(window.PIAI_CONFIG||{}).SERVER_URL;
const unit=()=>qUnit(1,typeof selImgM=="function"?selImgM():"");
function head(){return `<div class="tt"><button class="ghost" onclick="location.hash='#/app/tab/ext'">← Quay lại</button><div><h2>📐 Render theo Nhiệm vụ thiết kế</h2></div></div>
<p class="sub">Một luồng duy nhất: số liệu chuẩn → khối dựng chính xác → ảnh render bám đúng khối → tự kiểm tra trước khi giao.</p>
${isDemo()?`<div class="nbdemo">⚠ Chế độ DEMO – chưa có API key: ảnh render và bảng kiểm tra chỉ là mô phỏng, có watermark, <b>không trừ xu</b>. Thêm key ở ⚙ để render thật.</div>`:""}
<div class="nbs">${["Nhập nhiệm vụ","Xem khối","Render","Kiểm tra ✓/✗"].map((t,i)=>`<div class="${i+1==step?"on":i+1<step?"ok":""}"><small>Bước ${i+1}</small><b>${t}</b></div>`).join("")}</div>`}
function sum(b){b=PiBrief.resolve(b);return `<div class="nbsum">${b.volumes.map(v=>`<span>${v.label}: <b>${v.floors.length} tầng</b> · ${(v.x1-v.x0).toFixed(1)}×${(v.y1-v.y0).toFixed(1)} m</span>`).join("")}<span>Đỉnh: <b>${b.top.toFixed(1)} m</b></span><span>Nền: <b>+${b.plinth} m</b></span></div>`}
function s1(){step=1;window.scrollTo(0,0);const v=B.volumes;$("wbody").innerHTML=`<div class="nb">${head()}<div class="nbc"><h3>1 · Nhiệm vụ thiết kế</h3>
<div class="nbg"><label>Tên dự án<input id="pb_name" value="${B.name}"></label><label>Lô đất rộng (m)<input id="pb_pw" type="number" value="${B.plot.w}"></label><label>Lô đất sâu (m)<input id="pb_pd" type="number" value="${B.plot.d}"></label><label>Nền cao hơn đường (m)<input id="pb_pl" type="number" step=".05" value="${B.plinth}"></label></div>
${v.map((x,i)=>`<fieldset class="nbv"><legend>${x.label}</legend><div class="nbg">${[["x0","Mép tây"],["y0","Mép nam"],["x1","Mép đông"],["y1","Mép bắc"]].map(([k,l])=>`<label>${l} (m)<input data-v="${i}" data-k="${k}" type="number" step=".1" value="${x[k]}"></label>`).join("")}</div>
<label style="margin-top:8px;display:flex;flex-direction:column;font-size:12px;color:var(--m)">Chiều cao từng tầng (m, cách nhau dấu phẩy) – ${x.floors.length} tầng<input data-v="${i}" data-k="floors" value="${x.floors.join(", ")}"></label></fieldset>`).join("")}
<label>Phong cách / vật liệu (chỉ phủ bề mặt, không đổi khối)<textarea id="pb_style">${B.style}</textarea></label>
<div id="nberr" style="color:#ff6b6b"></div><div class="nbact"><button class="ghost" onclick="NB.reset()">Mẫu khách sạn ven biển</button><button class="btn" onclick="NB.toMass()">Dựng khối →</button></div></div></div>`}
function s2(){step=2;window.scrollTo(0,0);M=PiMassing.render(B,B.cameras[cam]);$("wbody").innerHTML=`<div class="nb">${head()}<div class="nbc"><h3>2 · Khối dựng – kiểm tra hình khối trước khi render</h3>
<div class="nbg" style="max-width:420px"><label>Góc nhìn<select id="nbcam" onchange="NB.cam(this.value)">${Object.keys(B.cameras).map(k=>`<option value="${k}" ${k==cam?"selected":""}>${CAMS[k]||k}</option>`).join("")}</select></label></div>
${sum(B)}<img class="nbimg" src="${M.url}" alt="massing"><p class="sub" style="margin-top:8px">Mỗi vạch ngang = 1 tầng. Ảnh này là “khung xương” bắt buộc: AI chỉ được phủ vật liệu lên, không được đổi số tầng, tỷ lệ hay góc nhìn.</p>
<div class="nbact"><button class="ghost" onclick="NB.s1()">← Sửa số liệu</button><button class="btn" id="nbgo" onclick="NB.go()">Render${isDemo()?" (DEMO, 0 xu)":` | ${unit()} xu`} →</button></div></div></div>`}
function s3(){step=3;window.scrollTo(0,0);$("wbody").innerHTML=`<div class="nb">${head()}<div class="nbres"><div class="nbc"><h3>3 · Render</h3><img class="nbimg" id="nbout" src="${M.url}" style="opacity:.45"><div id="nbst" class="sub" style="margin-top:8px">⏳ Đang render…</div></div>
<div class="nbc"><h3>4 · Bảng kiểm tra ✓/✗</h3><div id="nbsc"><p class="sub">Mỗi ảnh được chấm: số tầng, số công trình, tỷ lệ khối, camera, khu đất, sạch viền chữ, phong cách. Sai bất kỳ mục nào → loại và render lại (tối đa 3 lần).</p></div></div></div>
<div class="nbact" id="nbend"></div></div>`}
const toJpg=u=>new Promise(r=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=i.width;c.height=i.height;const x=c.getContext("2d");x.drawImage(i,0,0);r(c.toDataURL("image/jpeg",.92))};i.src=u});
function mockCheck(a){const g={buildings:1,bbox:M.marks.vol,horizon:M.marks.horizon,camera_same:true,site:{carpark:1,pond:1,islands:1,streets_corner:1},extra_structures:false,text_or_outlines:false,style_ok:true,tower_wide_slab:true,ground_corner_chamfer_passage:true,columns_under_corner_or_canopy:false,identical_to_massing:false,notes:"DEMO – kết quả kiểm tra mô phỏng, không phải AI chấm."};for(const v of B.volumes)g["floors_"+v.id]=v.floors.length;if(a==1)g["floors_"+B.volumes[0].id]=Math.max(1,B.volumes[0].floors.length-2);return g}
async function go(){if(!isDemo()&&unit()>bal()){wmsg&&wmsg(NOXU(unit()));return}s3();const demo=isDemo(),mj=await toJpg(M.url);let a=0,t0=Date.now();const tm=setInterval(()=>{const e=$("nbst");if(e&&!/✅|❌/.test(e.textContent))e.textContent=`⏳ Lần ${a} · ${Math.round((Date.now()-t0)/1000)} giây`},500);
 const gen=demo?async()=>{a++;await zz(500);return demoImg(mj,"Render theo nhiệm vụ")}:async p=>{a++;return await callImage(p,mj,"3:2","2K")};
 const check=demo?async()=>{await zz(300);return mockCheck(a)}:async(sys,text,imgs)=>{const r=await callTextM(sys,text+"\nReply with the JSON object only.",await Promise.all(imgs.map(toJpg)));return JSON.parse(String(r).replace(/^[^{]*/s,"").replace(/[^}]*$/s,""))};
 let r;try{r=await PiPipeline.run(B,cam,{gen,check,max:3,charge:()=>spend(unit(),{tool:"brief",tab:"Render theo NV",q:"2K",cnt:1,unit:unit(),m:typeof LAST_IMG_M!="undefined"?LAST_IMG_M:""}),
  onStep:e=>{if(e.type=="check"){$("nbsc").insertAdjacentHTML("afterbegin",e.html);if(!e.sc.pass)$("nbst").textContent=`❌ Lần ${e.a} bị loại – đang sửa prompt và render lại…`}}})}catch(e){r={ok:false};$("nbst").textContent="⚠ "+e.message}
 clearInterval(tm);step=4;document.querySelectorAll(".nbs div").forEach((d,i)=>d.className=i<3?"ok":r.ok?"ok":"on");
 if(r.ok){$("nbout").src=r.img;$("nbout").style.opacity=1;$("nbst").innerHTML=`✅ Ảnh ĐẠT sau ${r.log.length} lần${demo?" · DEMO, 0 xu":` · trừ ${unit()} xu (chỉ ảnh đạt)`}`;try{wres={type:"img",data:r.img};wTool="brief";histSave(wres)}catch(_){}
  $("nbend").innerHTML=`<button class="ghost" onclick="NB.s2()">← Đổi góc nhìn</button><a class="btn" style="display:inline-flex;align-items:center;padding:0 18px;border-radius:10px;text-decoration:none" download="piai-nhiem-vu.jpg" href="${r.img}">⬇ Tải ảnh</a>`}
 else if(r.fatal){$("nbst").innerHTML=`⚠ API key chưa dùng được model tạo ảnh (hạn mức/billing): ${String(r.fatal).slice(0,140)}. Bật billing trong Google AI Studio rồi thử lại – không trừ xu.`;$("nbend").innerHTML=`<button class="btn" onclick="NB.s2()">← Quay lại khối dựng</button>`}
 else{$("nbst").innerHTML=`❌ Không có ảnh đạt sau 3 lần – không giao ảnh sai, không trừ xu. Hãy kiểm tra lại số liệu hoặc giảm bớt mô tả phong cách.`;$("nbend").innerHTML=`<button class="btn" onclick="NB.s2()">← Quay lại khối dựng</button>`}}
window.NB={s1,s2,go,reset(){B=JSON.parse(JSON.stringify(PiBrief.HOTEL));s1()},cam(k){cam=k;s2()},
 toMass(){const nb=PiBrief.readForm($("wbody"),B);const e=PiBrief.validate(nb);if(e.length){$("nberr").textContent="⚠ "+e.join(" · ");return}B=nb;PiBrief.save(B);s2()}};
const _t=toolUI;toolUI=function(k){if(W[k]&&W[k].custom=="brief"){wTool="brief";return s1()}return _t(k)};
})();
/* đưa công cụ lên đầu Kho tiện ích; vẽ lại nếu trang đã render trước khi module tải xong */
(()=>{const _m=modes;modes=function(tab){if(tab!="ext")return _m(tab);const o={...W};const ks=Object.keys(W);for(const k of ks)delete W[k];W.brief=o.brief;for(const k of ks)if(k!="brief")W[k]=o[k];return _m(tab)};
const h=location.hash;if(h=="#/app/brief")toolUI("brief");else if(/#\/app\/tab\/ext/.test(h))modes("ext")})();
