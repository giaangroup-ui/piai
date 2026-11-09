/* Pi Agent – điều phối các công cụ trong app: nhận yêu cầu → lập kế hoạch JSON → thực thi tuần tự → ✓/✗ */
(()=>{
const REG=[
 {k:"brief",n:"Render theo Nhiệm vụ thiết kế",kind:"brief",d:"Đọc nhiệm vụ → dựng khối → render khoá hình → tự kiểm (nhà phố, biệt thự, khối đế + tháp)"},
 {k:"bparse",n:"Phân tích nhiệm vụ",kind:"bparse",d:"Đọc loại nhà, kích thước, số tầng, cao độ, hướng, lõi cây"},
 {k:"bmass",n:"Dựng khối 3D",kind:"bmass",d:"Khối chính xác từng tầng, đúng góc nhìn"},
 {k:"brender",n:"Render + tự kiểm ✓/✗",kind:"brender",d:"Prompt khoá hình, AI chấm ảnh, sai thì làm lại, chỉ trừ xu ảnh đạt"},
 {k:"render",n:"Render kiến trúc",kind:"img",d:"Phối cảnh kiến trúc từ ảnh/phác thảo"},
 {k:"interior",n:"Render nội thất",kind:"img",d:"Phối cảnh nội thất"},
 {k:"edit",n:"Chỉnh sửa ảnh",kind:"img",d:"Sửa ảnh theo mô tả"},
 {k:"material",n:"Thay vật liệu",kind:"img",d:"Đổi vật liệu bề mặt"},
 {k:"staging",n:"AI Staging",kind:"img",d:"Bày trí nội thất ảo"},
 {k:"rerender",n:"Re-Render",kind:"img",d:"Làm ảnh cũ chân thực hơn"},
 {k:"txt2img",n:"Tạo thiết kế từ prompt",kind:"img",d:"Sinh ảnh từ mô tả"},
 {k:"up4k",n:"Upscale",kind:"img",d:"Nâng độ phân giải"},
 {k:"sketch",n:"Ảnh thành Sketch",kind:"img",d:"Chuyển ảnh sang sketch"},
 {k:"post",n:"Hậu kỳ ảnh",kind:"img",d:"Sửa ánh sáng / bầu trời"},
 {k:"viewC",n:"Sáng tạo view",kind:"nav",d:"Mở bộ tạo nhiều góc nhìn"},
 {k:"film",n:"Video kiến trúc",kind:"nav",d:"Mở trang tạo video"},
 {k:"estimate",n:"Dự toán",kind:"nav",d:"Mở công cụ dự toán"},
 {k:"quote",n:"Báo giá",kind:"nav",d:"Mở lập báo giá"},
 {k:"history",n:"Lịch sử",kind:"nav",d:"Mở lịch sử ảnh"}
];
const by=Object.fromEntries(REG.map(r=>[r.k,r]));
W.agent={tab:"ext",ic:"🧠",n:"Pi Agent",d:"Điều phối viên: nhận yêu cầu, lập kế hoạch, chỉ huy các công cụ AI trong app hoàn thành việc.",custom:"agent",kind:"txt",s:[],c:"none",p:()=>""};
const st=document.createElement("style");st.textContent=`
.paw{max-width:920px;margin:0 auto;padding:4px 2px 48px}.paw .heroA{background:linear-gradient(135deg,#1a1408,#241808 40%,#0e1a22);border:1px solid #f5a52455;border-radius:18px;padding:18px 20px;margin-bottom:14px}
.paw .heroA h2{margin:0 0 4px;font-size:22px}.paw .heroA p{margin:0;color:var(--m);font-size:14px}
.paw .plan{border:1px solid var(--b);border-radius:14px;padding:12px;margin:10px 0;background:var(--p)}
.paw .plan h4{margin:0 0 8px}.paw .step{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--b)}
.paw .step:first-of-type{border-top:0}.paw .badge{min-width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#222;border:1px solid var(--b);font-size:12px}
.paw .badge.run{background:#f5a524;color:#111;border:0}.paw .badge.ok{background:#2fbf71;color:#fff;border:0}.paw .badge.fail{background:#ff3b30;color:#fff;border:0}
.paw .aglog{max-height:64vh;overflow:auto;padding:8px 0}@media(max-width:700px){.paw .aglog{max-height:none;overflow:visible}.paw .agm{max-width:100%}}.paw details.pck{margin-top:8px;border:1px solid var(--b);border-radius:10px;padding:6px 10px}.paw details.pck summary{cursor:pointer;font-size:14px}.paw .agm{margin:8px 0;padding:10px 12px;border-radius:12px;background:var(--p);border:1px solid var(--b);max-width:92%}
.paw .agm.u{margin-left:auto;background:#f5a52418;border-color:#f5a52444}.paw .agm img.result{max-width:100%;border-radius:10px;margin-top:8px;border:1px solid var(--b)}
.paw .agin{display:flex;gap:8px;align-items:flex-end;margin-top:10px}.paw .agin textarea{flex:1;min-height:52px;border-radius:12px;border:1px solid var(--b);background:var(--bg);color:var(--t);padding:10px}
.paw .demo{background:#ff3b3018;border:1px solid #ff3b30;color:#ffb3ad;border-radius:10px;padding:8px 12px;margin:8px 0;font-size:13px}
.paw .sug{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px}`;document.head.appendChild(st);

let PA=JSON.parse(localStorage.piai_pa||"[]"),busy=false,lastImg=null,lastBrief=null;try{const b=JSON.parse(localStorage.piai_pa_brief||"null");if(b&&b.volumes)lastBrief=b}catch(_){}
const isDemo=()=>!localStorage.piai_key&&!localStorage.piai_okey&&!localStorage.piai_ckey&&!(window.PIAI_CONFIG||{}).SERVER_URL;
const unit=()=>typeof qUnit==="function"?qUnit(1,typeof selImgM==="function"?selImgM():""):10;
const save=()=>{try{if(lastBrief)localStorage.piai_pa_brief=JSON.stringify(lastBrief);localStorage.piai_pa=JSON.stringify(PA.slice(-12))}catch(_){try{localStorage.piai_pa=JSON.stringify(PA.slice(-4).map(m=>({...m,img:null,mass:null})))}catch(_){}}};
const esc=t=>String(t||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

function draw(){const L=$("paLog");if(!L)return;
 L.innerHTML=PA.length?PA.map((m,i)=>`<div class="agm ${m.r}">${m.t?`<div>${esc(m.t).replace(/\n/g,"<br>")}</div>`:""}${m.planHtml||""}${m.mass&&!m.img?`<img class="result" src="${m.mass}" alt="massing" style="max-height:60vh;object-fit:contain;background:#bcd9ee">`:""}${m.img?`<img class="result" src="${m.img}" alt="result" style="max-height:70vh;object-fit:contain">`:""}${m.cards?`<details class="pck"><summary>${esc(m.cardSum||"Bảng tự kiểm")}</summary>${m.cards}</details>`:""}${m.actions||""}</div>`).join(""):
 `<div class="mu" style="text-align:center;padding:28px">Pi Agent nhận yêu cầu bằng tiếng Việt, lập kế hoạch rồi chỉ huy các công cụ trong app (render, nhiệm vụ thiết kế, sửa ảnh, video…). Ảnh sai bị loại, không trừ xu.</div>`;
 L.scrollTop=L.scrollHeight}

function planHtml(steps,status={}){return `<div class="plan"><h4>📋 Kế hoạch (${steps.length} bước)</h4>${steps.map((s,i)=>{const st=status[i]||"wait";const b=st==="run"?"run":st==="ok"?"ok":st==="fail"?"fail":"";const ic=st==="ok"?"✓":st==="fail"?"✗":st==="run"?"…":(i+1);
 return `<div class="step"><div class="badge ${b}">${ic}</div><div><b>${esc(s.title||by[s.tool]?.n||s.tool)}</b><div style="font-size:12px;color:var(--m)">${esc(s.detail||by[s.tool]?.d||"")}</div>${s.note?`<div style="font-size:12px;margin-top:2px">${esc(s.note)}</div>`:""}</div></div>`}).join("")}</div>`}

const SYS=`You are Pi Agent inside PiAi, an architecture AI app for Vietnam. The user writes in Vietnamese. Reply with ONLY a JSON object:
{"reply":"short Vietnamese acknowledgement","steps":[{"tool":"one of ${REG.map(r=>r.k).join("|")}","title":"Vietnamese short title","detail":"what this step does","prompt":"English or Vietnamese image prompt if kind=img/brief, else empty","verify":true/false}]}
Rules: 1-4 steps max. Use "brief" whenever the user describes a building to render (type, dimensions, floors, levels) – it builds an exact massing and verifies the render. Prefer image tools when they want a render. Use nav tools (film,estimate,quote,viewC,history) only to open that screen as last step. verify=true for architecture exterior renders. Never invent tools outside the list.`;

const WANT_EDIT=/sửa ảnh|chỉnh ảnh|đổi vật liệu|thay vật liệu|xóa|bỏ (?:cái|người|xe)|upscale|nâng độ phân giải|sketch|hậu kỳ|bầu trời/i;
const WANT_NAV=/dự toán|báo giá|video|phim|lịch sử/i;
function briefPlan(P,q,note){const ok=P.got.map(x=>"• "+x).join("\n"),as=P.assume.length?"\nGiả định: "+P.assume.join("; "):"";
 return {reply:`Em hiểu yêu cầu như sau:\n${ok}${as}${note?"\n"+note:""}\nEm dựng khối đúng số liệu, render theo khối và tự kiểm trước khi giao.`,brief:P.brief,view:P.view,
  steps:[{tool:"bparse",title:"Phân tích nhiệm vụ",detail:PiBrief.summary(P.brief)},{tool:"bmass",title:"Dựng khối 3D – "+(PiBrief.CAM_LABEL[P.view]||P.view),detail:P.brief.type=="tower"?"Mỗi vạch = 1 tầng; mã màu = khu đất":"Mỗi vạch = 1 tầng; mã màu = vật liệu"},{tool:"brender",title:"Render + tự kiểm ✓/✗",detail:"Tối đa 3 lần; ảnh sai bị loại, không trừ xu",verify:true}]}}
async function readImageBrief(img,q){/* đọc ảnh mặt bằng / concept -> mô tả tiếng Việt để parser hiểu */
 if(isDemo()||!img)return "";try{const sys="You read Vietnamese architectural drawings (floor plans, sections, concept boards). Reply with ONE line in Vietnamese only.";
  const ask='Đọc bản vẽ/ảnh và viết 1 dòng mô tả theo mẫu: "<loại: nhà phố|biệt thự|khách sạn> <rộng>x<sâu>m, <số> trệt <số> lửng <số> lầu [sân thượng], [cao độ: trệt +x.xx, lửng +x.xx, lầu 1 +x.xx ...], [hướng ...], [lõi cây/giếng trời <r>x<s>m lùi về sau], [vật liệu: ...]". Chỉ ghi những gì đọc được, không bịa.';
  const t=await PiPipeline.timeout(callText(sys,ask,await shrink(img,1600)),40000,"timeout");return String(t||"").split("\n")[0].slice(0,400)}catch(_){return ""}}
async function plan(q,img){
 if(VIEWREQ&&lastBrief){const k=VIEWREQ;VIEWREQ=null;return briefPlan({ok:true,brief:lastBrief,got:[PiBrief.summary(lastBrief)],assume:[],view:k},q)}
 if(!WANT_EDIT.test(q)&&!WANT_NAV.test(q)){let P=PiBrief.parse(q,lastBrief);let note="";
  if(img&&/mặt bằng|concept|bản vẽ|mặt cắt|theo (?:ảnh|hình)/i.test(q)){const d=await readImageBrief(img,q);if(d){const P2=PiBrief.parse(q+". "+d,lastBrief);if(P2.ok){P=P2;note="(Đã đọc thêm số liệu từ ảnh đính kèm: "+d+")"}}else if(isDemo())note="(DEMO: cần API key để đọc số liệu từ ảnh; em dùng số liệu trong lời nhắn.)"}
  if(P.ok&&P.type!="tower"&&!P.strong&&lastBrief){P={ok:true,brief:lastBrief,got:["Dùng số liệu công trình đang làm: "+PiBrief.summary(lastBrief)],assume:[],view:P.view}}
  if(!P.ok&&/góc|mặt cắt|trên cao|mặt tiền|render lại/i.test(q)&&lastBrief){P={ok:true,brief:lastBrief,got:[PiBrief.summary(lastBrief)],assume:[],view:PiBrief.parse("nhà phố "+q).view||"front"}}
  if(P.ok)return briefPlan(P,q,note)}
 if(isDemo()){await zz(350);
  const wantEdit=WANT_EDIT.test(q);
  const steps=wantEdit?[{tool:"edit",title:"Chỉnh sửa ảnh",detail:"Sửa theo mô tả",prompt:q,verify:false}]:
   /dự toán/i.test(q)?[{tool:"estimate",title:"Mở dự toán",detail:""}]:
   [{tool:"render",title:"Render kiến trúc",detail:"Tạo phối cảnh",prompt:"Photorealistic architectural photograph: "+q+". Keep composition coherent, high detail, 8k.",verify:true}];
  return {reply:"(DEMO) Pi Agent lập kế hoạch mô phỏng – thêm API key ở ⚙ để lập kế hoạch và render thật. Mẹo: ghi loại nhà + kích thước + số tầng (vd “nhà phố 5x20m 1 trệt 2 lầu sân thượng”) để Pi dựng khối và render đúng.",steps}}
 const hist=PA.filter(m=>m.r==="u"||m.r==="a").slice(-8).map(m=>(m.r==="u"?"User: ":"Agent: ")+(m.raw||m.t||"")).join("\n");
 const im2=img?await shrink(img,1280):null;let txt;
 try{txt=await PiPipeline.timeout(withTask("pro",()=>callText(SYS,hist+"\nUser: "+q+(img?"\n(User attached an image)":""),im2)),25000,"timeout")}
 catch(e){return {reply:"Máy chủ AI lập kế hoạch đang chậm – em làm ngay theo cách phù hợp nhất với yêu cầu.",steps:[img?{tool:"render",title:"Render từ ảnh đính kèm",detail:q,prompt:q,verify:true}:{tool:"txt2img",title:"Tạo phối cảnh từ mô tả",detail:q,prompt:"Photorealistic architectural photograph: "+q,verify:true}]}}
 let j;try{j=JSON.parse(String(txt).replace(/^[^{]*/s,"").replace(/[^}]*$/s,""))}catch(_){j={reply:String(txt).slice(0,500),steps:[{tool:"render",title:"Render",detail:q,prompt:q,verify:false}]}}
 j.steps=(j.steps||[]).filter(s=>by[s.tool]&&!/^b(parse|mass|render)$/.test(s.tool)).slice(0,4);if(!j.steps.length)j.steps=[{tool:"render",title:"Render",detail:q,prompt:q,verify:false}];
 return j}

async function runImg(step,src){
 const prompt=step.prompt||step.detail||step.title||"architectural render";
 if(isDemo()){const base=src||null;const d=await demoImg(base,step.title||"Pi Agent");return {img:d,demo:true,model:"DEMO"}}
 try{const img=await callImage(prompt,src||null,"3:2","2K");return {img,demo:false,model:typeof LAST_IMG_M!=="undefined"?LAST_IMG_M:""}}
 catch(e){const msg=e.message||String(e);if(/429|limit:? ?0|quota|billing/i.test(msg))throw new Error("Hạn mức API ảnh = 0 (thường gặp ở Gemini free tier). Vào Google AI Studio bật Billing, hoặc dùng key OpenAI (GPT Image) đã nạp tiền. Chi tiết: "+msg.slice(0,120));
  throw e}}

async function toJpg(u){return await new Promise((res,rej)=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=Math.min(1280,i.width);c.height=c.width*i.height/i.width;c.getContext("2d").drawImage(i,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.9))};i.onerror=rej;i.src=u})}
async function softCheck(img,step){
 if(!step.verify||isDemo())return {pass:true,rows:[{ok:true,msg:isDemo()?"DEMO – bỏ qua kiểm AI":"Không yêu cầu kiểm"}],html:""};
 try{const sys="You are a strict architectural QA. Reply JSON only.";
  const ask='{"buildings":int,"extra_structures":bool,"looks_like_input_unchanged":bool,"notes":string} Count buildings in the image.';
  const jpg=await toJpg(img);const raw=await callTextM(sys,ask,[jpg]);
  const J=JSON.parse(String(raw).replace(/^[^{]*/s,"").replace(/[^}]*$/s,""));
  const rows=[{ok:J.buildings===1&&!J.extra_structures,msg:`Số công trình: ${J.buildings??"?"}${J.extra_structures?" + thừa":""}`,fix:"exactly one building"},
              {ok:!J.looks_like_input_unchanged,msg:J.looks_like_input_unchanged?"Ảnh giống input (chưa render)":"Ảnh đã được xử lý",fix:"must visibly transform the input"}];
  const pass=rows.every(r=>r.ok);const html=`<div class="pscore" style="margin-top:8px;border:1px solid var(--b);border-radius:10px;padding:8px"><b>${pass?"✅ ĐẠT":"❌ LOẠI"}</b>${rows.map(r=>`<div>${r.ok?"✓":"✗"} ${r.msg}</div>`).join("")}<small style="opacity:.7">${esc(J.notes||"")}</small></div>`;
  return {pass,rows,html,fix:rows.filter(r=>!r.ok).map(r=>r.fix)}}
 catch(e){return {pass:true,rows:[{ok:true,msg:"Không kiểm được ("+e.message.slice(0,60)+") – chấp nhận ảnh"}],html:""}}}

async function execSteps(steps,seedImg,J){
 const status={},out={img:seedImg};const box=PA[PA.length-1];let BR=J&&J.brief,VIEW=J&&J.view,MASS=null;
 const redraw=()=>{box.planHtml=planHtml(steps,status);box.raw=box.t;draw()};
 for(let i=0;i<steps.length;i++){const s=steps[i],meta=by[s.tool];status[i]="run";redraw();
  try{
   if(meta.kind==="nav"){status[i]="ok";const href=s.tool==="history"?"#/app/history":s.tool==="estimate"?"#/app/estimate":s.tool==="film"?"#/app/film":`#/app/${s.tool}`;s.note="Sẵn sàng mở công cụ";box.actions=(box.actions||"")+`<div style="margin-top:8px"><a class="btn sm" href="${href}">→ Mở ${esc(meta.n)}</a></div>`;redraw();continue}
   if(meta.kind==="bparse"){const e=PiBrief.validate(BR);if(e.length){status[i]="fail";s.note="⚠ "+e.join(" · ");redraw();break}lastBrief=BR;status[i]="ok";s.note="Đã có số liệu";redraw();continue}
   if(meta.kind==="bmass"){const ks=Object.keys(PiBrief.cams(BR));if(!ks.includes(VIEW))VIEW=ks[0];MASS=PiMassing.render(BR,VIEW);box.mass=MASS.url;status[i]="ok";s.note=`${PiBrief.resolve(BR).storeys} tầng · đỉnh +${PiBrief.fmt(PiBrief.resolve(BR).top)} m`;
    box.actions=(box.actions||"")+`<div class="sug" style="margin-top:8px"><a class="btn sm" href="#/app/brief" onclick="PA_OPENBRIEF()">✏️ Chỉnh số liệu</a>${ks.filter(k=>k!==VIEW).map(k=>`<button class="chip" onclick="PA_VIEW('${k}')">Render ${esc(PiBrief.CAM_LABEL[k]||k)}</button>`).join("")}</div>`;redraw();continue}
   if(meta.kind==="brender"){if(!isDemo()&&unit()>bal()){status[i]="fail";s.note=typeof NOXU=="function"?"Không đủ xu":"Không đủ xu";redraw();break}let t0=Date.now(),a=1;const tick=setInterval(()=>{s.note=`⏳ Lần ${a} · ${Math.round((Date.now()-t0)/1000)} giây`;redraw()},1000);let r;
    try{r=await PiPipeline.appRun(BR,VIEW,{tool:"agent",onStep:e=>{if(e.type=="prompt")a=e.a;if(e.type=="check"){box.cards=e.html+(box.cards||"");box.cardSum=(e.sc.pass?"✅ Tự kiểm ĐẠT":"❌ Tự kiểm")+` – ${e.a} lần chấm (bấm để xem)`;if(!e.sc.pass)s.note=`❌ Lần ${e.a} bị loại – đang sửa prompt và render lại…`}redraw()}})}catch(e){r={ok:false,fatal:e.message}}finally{clearInterval(tick)}
    if(r.ok){status[i]="ok";box.img=r.img;s.note=r.demo?"DEMO · 0 xu · ảnh có watermark":`ĐẠT sau ${r.log.length} lần · −${r.cost} xu`;if(r.demo)box.actions=(box.actions||"")+`<div class="demo">DEMO · 0 xu · ảnh có watermark – thêm API key ở ⚙ để render thật</div>`;else{try{wres={type:"img",data:r.img};wTool="agent";histSave(wres)}catch(_){}}}
    else{status[i]="fail";s.note=r.fatal?PiPipeline.fatalVi(r.fatal):"Không có ảnh đạt sau 3 lần – không giao ảnh sai, không trừ xu";box.t+=(box.t?"\n":"")+"⚠ "+s.note+(r.fatal?"\nẢnh khối vẫn dùng được: bấm ✏️ Chỉnh số liệu → ⬇ Ảnh khối.":"")}
    redraw();if(!r.ok)break;continue}
   if(meta.kind==="brief"){const P=PiBrief.parse(PA.filter(m=>m.r==="u").slice(-1)[0]?.raw||"",lastBrief);if(P.ok){const j2=briefPlan(P,"");steps.splice(i,1,...j2.steps);BR=j2.brief;VIEW=j2.view;box.planHtml=planHtml(steps,status);i--;continue}
    if(typeof PiPipeline==="undefined"){status[i]="fail";s.note="Module brief chưa tải";redraw();break}
    status[i]="ok";s.note="Mở tool nhiệm vụ thiết kế để hoàn tất 4 bước";box.actions=(box.actions||"")+`<div style="margin-top:8px"><a class="btn sm" href="#/app/brief">→ Mở Render theo Nhiệm vụ</a></div>`;redraw();continue}
   // image step with retry + no charge on fail
   let ok=false,last=null,emph=[];
   for(let a=1;a<=2;a++){const pr=emph.length?{...s,prompt:(s.prompt||"")+"\nCRITICAL FIXES: "+emph.join("; ")}:s;
    last=await runImg(pr,out.img);const sc=await softCheck(last.img,s);
    if(sc.pass){ok=true;out.img=last.img;box.img=last.img;box.actions=(box.actions||"")+sc.html;
     if(!last.demo){try{spend(unit(),{tool:"agent",tab:"Pi Agent",q:"2K",cnt:1,unit:unit(),m:last.model});wres={type:"img",data:last.img};wTool="agent";histSave(wres)}catch(_){}}
     else{box.actions+=(box.actions||"")+`<div class="demo">DEMO · 0 xu · ảnh có watermark</div>`}
     break}
    emph=sc.fix||[];box.actions=(box.actions||"")+sc.html;s.note=`Lần ${a} loại – thử lại…`}
   if(!ok){status[i]="fail";s.note="Không có ảnh đạt – không trừ xu";redraw();break}
   status[i]="ok";s.note=last.demo?"DEMO · 0 xu":`Đạt · −${unit()} xu`;redraw();
  }catch(e){status[i]="fail";s.note=e.message;redraw();box.t+=(box.t?"\n":"")+"⚠ "+e.message;break}}
 redraw();save()}

async function send(){if(busy)return;const q=$("paT").value.trim();if(!q)return;if($("paSug"))$("paSug").style.display="none";const img=lastImg;busy=true;$("paGo").disabled=true;
 PA.push({r:"u",t:q,raw:q,img:img?await shrink(img,320,.7):null});$("paT").value="";lastImg=null;if($("paPv"))$("paPv").hidden=true;draw();
 const ph={r:"a",t:"⏳ Đang phân tích yêu cầu…"};PA.push(ph);draw();
 try{const j=await plan(q,img);ph.t=j.reply||"Đã lập kế hoạch.";ph.raw=j.reply;ph.planHtml=planHtml(j.steps);draw();
  await execSteps(j.steps,img,j);if(!/⚠/.test(ph.t||""))ph.t=(j.reply||"Hoàn tất.")+(isDemo()?"\n(DEMO)":"")}
 catch(e){ph.t="⚠ "+e.message}finally{busy=false;if($("paGo"))$("paGo").disabled=false;save();draw();try{const im=[...document.querySelectorAll("#paLog .agm:last-child img.result")].pop();if(im)im.scrollIntoView({block:"center"})}catch(_){}}}

function ui(){wTool="agent";window.scrollTo(0,0);
 $("wbody").innerHTML=`<div class="paw"><div class="tt"><button class="ghost" onclick="location.hash='#/app/tab/ext'">← Quay lại</button><span class="sp"></span><button class="ghost sm" onclick="PA=[];localStorage.removeItem('piai_pa');ui()">🗑 Xóa hội thoại</button></div>
 <div class="heroA"><h2>🧠 Pi Agent</h2><p>Nói việc cần làm bằng tiếng Việt. Pi Agent lập kế hoạch, giao việc cho các công cụ trong app, tự kiểm ảnh và chỉ giao kết quả đạt.</p></div>
 ${isDemo()?`<div class="demo">⚠ Chế độ DEMO – chưa có API key. Kế hoạch và ảnh chỉ mô phỏng, có watermark, <b>không trừ xu</b>. Thêm Gemini/OpenAI key ở ⚙. Model ảnh Gemini free tier thường <b>limit 0</b> – cần bật Billing.</div>`:""}
 <div class="sug" ${PA.length?'style="display:none"':''} id="paSug">${["Nhà phố 5x20m 1 trệt 1 lửng 2 lầu sân thượng, hướng Tây, lam gỗ, hoàng hôn","Mặt cắt phối cảnh nhà phố 6,75x14,9m 1 trệt 1 lửng 2 lầu sân thượng, lõi cây Lộc Vừng 3,1x4m lùi về sau","Biệt thự 12x15m 3 tầng mái thái, giếng trời, nhìn góc 3/4","Khách sạn 5 tầng đế + 14 tầng tháp","Sửa ảnh: đổi mặt dựng thành đá travertine","Mở dự toán nhà 3 tầng"].map(x=>`<button class="chip" onclick="$('paT').value=this.textContent;PA_SEND()">${x}</button>`).join("")}</div>
 <div class="aglog" id="paLog"></div>
 <div class="agin"><button class="ib" title="Đính kèm ảnh" onclick="$('paF').click()">📎</button><input type="file" id="paF" accept="image/*" hidden><img id="paPv" hidden style="max-height:48px;border-radius:8px"><textarea id="paT" placeholder="Ví dụ: Nhà phố 6,75x14,9m, 1 trệt 1 lửng 2 lầu sân thượng, hướng Bắc, lõi cây Lộc Vừng, bông gió + lam gỗ…"></textarea><button class="btn" id="paGo" onclick="PA_SEND()">➤</button></div></div>`;
 $("paF").onchange=()=>{const f=$("paF").files[0];if(!f)return;const r=new FileReader();r.onload=()=>{lastImg=r.result;$("paPv").src=lastImg;$("paPv").hidden=false};r.readAsDataURL(f)};
 $("paT").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();PA_SEND()}};draw()}

window.PA_SEND=()=>send();
window.PA_OPENBRIEF=()=>{if(lastBrief&&window.NB)NB.load(lastBrief)};
window.PA_VIEW=k=>{if(busy||!lastBrief)return;const t=$("paT");if(t){t.value="Render "+(PiBrief.CAM_LABEL[k]||k).toLowerCase()+" cho công trình vừa rồi";VIEWREQ=k;send()}};let VIEWREQ=null;
window.PA_UI=ui;
const _t=toolUI;toolUI=function(k){if(k==="agent"||(W[k]&&W[k].custom==="agent")){wTool="agent";return ui()}return _t(k)};
/* đưa Pi Agent lên đầu hub + Brief thứ hai */
const _m=modes;modes=function(tab){if(tab!=="ext")return _m(tab);const o={...W};const ks=Object.keys(W);for(const k of ks)delete W[k];if(o.agent)W.agent=o.agent;if(o.brief)W.brief=o.brief;for(const k of ks)if(k!=="agent"&&k!=="brief")W[k]=o[k];return _m(tab)};
const h=location.hash;if(h==="#/app/agent")ui();else if(/#\/app\/tab\/ext/.test(h))modes("ext");
})();
