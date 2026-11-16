/* PiAi – Hạng dịch vụ (Miễn phí / Cao cấp / Key riêng) + nguồn MIỄN PHÍ không cần key + video miễn phí ngay trên trình duyệt.
   KHÔNG có key nào trong file này. Key của chủ dự án chỉ nằm trong secret của Cloudflare Worker (config.js → WORKER_URL). */
window.PiFree=(()=>{
const S=localStorage,CFG=()=>window.PIAI_CONFIG||{};
const WURL=()=>String(CFG().WORKER_URL||"").trim().replace(/\/+$/,"");
const FREE_DAY=+(CFG().FREE_PER_DAY||12);
const hasOwnKey=()=>!!((S.piai_key&&S.piai_key!=="server")||S.piai_okey||S.piai_ckey);
const fullServer=()=>!!(CFG().SERVER_URL&&CFG().SUPABASE_URL&&CFG().SUPABASE_ANON_KEY);
let WCFG=null;/* /config của Worker: {free:{image,check,text},pro:{enabled,models}} */
async function wcfg(){if(!WURL())return null;if(WCFG)return WCFG;try{const r=await fetchT(WURL()+"/config",{},8000);WCFG=await r.json()}catch(_){WCFG={free:{},pro:{enabled:false},down:true}}return WCFG}
const proReady=()=>!!(WURL()&&S.piai_procode);
function tier(){if(fullServer())return "server";const t=S.piai_tier;
 if(t==="own")return hasOwnKey()?"own":"free";if(t==="pro")return proReady()?"pro":"free";if(t==="free")return "free";return hasOwnKey()?"own":"free"}
const on=()=>tier()==="free"||tier()==="pro";
const setTier=t=>{S.piai_tier=t;try{window.dispatchEvent(new Event("piai-tier"))}catch(_){}};
/* ---- hạn mức miễn phí mỗi ngày (trên máy khách) ---- */
const dkey=()=>"piai_free_"+new Date().toISOString().slice(0,10);
const used=()=>+(S[dkey()]||0),left=()=>Math.max(0,FREE_DAY-used());
const useOne=()=>{S[dkey()]=used()+1};
/* ---- tiện ích ---- */
const zz=ms=>new Promise(r=>setTimeout(r,ms));
function fetchT(u,o={},ms=60000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);return fetch(u,{...o,signal:c.signal}).finally(()=>clearTimeout(t))}
const blob2url=b=>new Promise((r,j)=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=j;f.readAsDataURL(b)});
const url2blob=async u=>(await fetch(u)).blob();
const loadImg=u=>new Promise((r,j)=>{const i=new Image();i.crossOrigin="anonymous";i.onload=()=>r(i);i.onerror=()=>j(new Error("không đọc được ảnh"));i.src=u});
async function fit(u,max=1024,q=.9){const i=await loadImg(u);const k=Math.min(1,max/Math.max(i.width,i.height));const c=document.createElement("canvas");c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext("2d").drawImage(i,0,0,c.width,c.height);return c.toDataURL("image/jpeg",q)}
const ratioWH=(r,base=1024)=>{const m=String(r||"3:2").match(/(\d+(?:\.\d+)?)\s*[:x]\s*(\d+(?:\.\d+)?)/);const a=m?+m[1]/+m[2]:1.5;return a>=1?[base,Math.round(base/a/8)*8]:[Math.round(base*a/8)*8,base]};
/* ---- rút gọn prompt khoá hình (FLUX Kontext/klein đọc tốt ≤ ~1800 ký tự) ---- */
function compact(p,{max=1800,noCode=false}={}){p=String(p||"");const L=p.split("\n").map(s=>s.trim()).filter(Boolean);
 const short=s=>s.replace(/\s*\+[\d.]+ to \+[\d.]+ m \([\d.]+ m\)/g,"").replace(/\s*\(colour[^)]*\)/g,"").replace(/ \(keep height and position, quiet background\)/,"").replace(/STYLE \(surface materials only, never change geometry\):/,"STYLE:");
 const pick=re=>L.filter(s=>re.test(s)).map(short);
 const first=L[0]?L[0].split(/(?<=\.)\s/)[0]:"";
 const parts=noCode?[...pick(/^BUILDING TYPE/),...pick(/^- (Main volume|ONE set-back|ONE building|PODIUM|TOWER|Only the lowest)/),...pick(/^STYLE/),...pick(/^VIEW\/LIGHT/).map(s=>s.replace(/same camera as the massing \(([^)]*)\)/,"$1")),"Photorealistic architectural photograph, sharp, natural colours."]
  :[first.replace(/^Convert the attached/,"Transform this flat-colour"),...pick(/^(MATERIAL CODE|SITE LOCK)/),...pick(/^- (Main volume|ONE set-back|ONE building|PODIUM|TOWER|Only the lowest)/),...pick(/^CRITICAL FIXES/),...pick(/^BUILDING TYPE/),...pick(/^STYLE/),
   "Keep the exact camera, outline, proportions and every floor line of the input image; nothing added or removed. Real materials, sharp photo, no outlines, no flat colours, no text."];
 let s=parts.join(" ").replace(/\s+/g," ");if(s.length>max)s=s.slice(0,max).replace(/\s\S*$/,"");return s}
/* ===================== NGUỒN ẢNH ===================== */
const HF={kontext:"https://black-forest-labs-flux-1-kontext-dev.hf.space",vl:"https://prithivmlmods-qwen3-vl-outpost.hf.space"};
const hfDown=k=>+(S["piai_hfq_"+k]||0)>Date.now();const hfMark=(k,h=6)=>{S["piai_hfq_"+k]=Date.now()+h*3600e3};
async function gradio(host,fn,data,ms){const r=await fetchT(`${host}/gradio_api/call/${fn}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data})},30000);
 if(!r.ok)throw new Error("HF "+r.status);const {event_id}=await r.json();const s=await fetchT(`${host}/gradio_api/call/${fn}/${event_id}`,{},ms);const t=await s.text();
 const ev=[...t.matchAll(/event: (\w+)\ndata: (.*)/g)];const last=ev[ev.length-1];if(!last)throw new Error("HF: không có phản hồi");
 if(last[1]==="error"){const m=String(last[2]||"");if(/ZeroGPU|quota|limit|null/i.test(m))throw Object.assign(new Error("HF hết lượt GPU miễn phí hôm nay"),{quota:1});throw new Error("HF lỗi: "+m.slice(0,120))}
 return JSON.parse(last[2])}
async function hfUpload(host,dataUrl){const b=await url2blob(dataUrl);const fd=new FormData();fd.append("files",b,"in.jpg");const r=await fetchT(host+"/gradio_api/upload",{method:"POST",body:fd},40000);if(!r.ok)throw new Error("HF upload "+r.status);const [p]=await r.json();return {path:p,meta:{_type:"gradio.FileData"},orig_name:"in.jpg",mime_type:"image/jpeg"}}
const SRC={
 worker:{n:"Cloudflare Workers AI (FLUX.2 klein) qua máy chủ PiAi",locked:true,
  ok:async img=>{const c=await wcfg();return !!(c&&c.free&&c.free.image)},
  run:async(prompt,img,ratio)=>{const [w,h]=ratioWH(ratio,1024);const body={prompt:compact(prompt),width:w,height:h};if(img)body.image=await fit(img,512,.9);
   const r=await fetchT(WURL()+"/free/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)},120000);const j=await r.json().catch(()=>({}));
   if(!r.ok)throw Object.assign(new Error(j.error&&j.error.message||("Worker "+r.status)),{quota:r.status==429});return {url:j.image,model:j.model||"cf-flux",locked:!!img}}},
 kontext:{n:"FLUX.1 Kontext (Hugging Face, miễn phí theo lượt GPU của từng người)",locked:true,
  ok:async img=>!!img&&!hfDown("kontext"),
  run:async(prompt,img)=>{try{const f=await hfUpload(HF.kontext,await fit(img,1024,.92));
   const out=await gradio(HF.kontext,"infer",[f,compact(prompt),Math.floor(Math.random()*1e6),false,2.5,24],170000);const o=out[0];const u=o&&(o.url||(o.path&&HF.kontext+"/gradio_api/file="+o.path));if(!u)throw new Error("HF: không có ảnh");
   return {url:await fit(u,1600,.92),model:"FLUX.1-Kontext-dev (HF)",locked:true}}catch(e){hfMark("kontext",e.quota?6:.34);throw e}}},
 pollinations:{n:"Pollinations.ai (ẩn danh, ảnh ý tưởng – không khoá hình)",locked:false,
  ok:async()=>true,
  run:async(prompt,img,ratio,opt={})=>{const p=(opt.textPrompt||compact(prompt,{max:900,noCode:true})).slice(0,1100);const [w,h]=ratioWH(ratio,1024);let last;
   for(let a=0;a<4;a++){const u=`https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${w}&height=${h}&seed=${Math.floor(Math.random()*1e9)}&nologo=true`;
    try{const r=await fetchT(u,{},90000);const ct=r.headers.get("content-type")||"";if(r.ok&&/image/.test(ct))return {url:await blob2url(await r.blob()),model:"Pollinations (sana)",locked:false};
     const ra=+(r.headers.get("retry-after")||8);last=new Error("Pollinations "+r.status);await zz(Math.min(20,ra+1)*1000)}catch(e){last=e;await zz(3000)}}
   throw last||new Error("Pollinations lỗi")}}};
/* Chuỗi nguồn miễn phí: lỗi thì chuyển nguồn MIỄN PHÍ khác, không bao giờ tự nhảy sang trả phí */
async function image(prompt,img,ratio,opt={}){const order=img?["worker","kontext","pollinations"]:["worker","pollinations"];const errs=[];
 for(const k of order){const s=SRC[k];if(opt.lockedOnly&&!s.locked)continue;if(!(await s.ok(img)))continue;opt.onSrc&&opt.onSrc(k,s.n);
  try{const r=await s.run(prompt,img,ratio,opt);r.src=k;r.srcName=s.n;window.LAST_FREE_M=r.model;return r}catch(e){errs.push(s.n.split(" (")[0]+": "+(e.name==="AbortError"?"quá thời gian":e.message))}}
 throw new Error("Các nguồn miễn phí đang bận/hết lượt: "+errs.join(" · "))}
/* ---- Cao cấp: key của chủ dự án nằm trong Worker; cần mã gói ---- */
async function proImage(prompt,img,ratio){const body={prompt,ratio,image:img?await fit(img,1536,.92):null};
 const r=await fetchT(WURL()+"/pro/image",{method:"POST",headers:{"Content-Type":"application/json","x-piai-pass":S.piai_procode||""},body:JSON.stringify(body)},200000);const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error((j.error&&j.error.message)||("Máy chủ cao cấp "+r.status));return {url:j.image,model:j.model||"pro",locked:!!img,src:"pro",srcName:"Cao cấp"}}
async function proText(sys,text,imgs){const r=await fetchT(WURL()+"/pro/text",{method:"POST",headers:{"Content-Type":"application/json","x-piai-pass":S.piai_procode||""},body:JSON.stringify({sys,text,images:await Promise.all((imgs||[]).filter(Boolean).map(i=>fit(i,1024,.85)))})},120000);const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||("Máy chủ "+r.status));return j.text}
/* ===================== KIỂM ẢNH / VĂN BẢN MIỄN PHÍ ===================== */
async function composite(a,b){const A=await loadImg(a),B=await loadImg(b),H=768;const wa=Math.round(A.width*H/A.height),wb=Math.round(B.width*H/B.height);const c=document.createElement("canvas");c.width=wa+wb+16;c.height=H;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,H);x.drawImage(A,0,0,wa,H);x.drawImage(B,wa+16,0,wb,H);return c.toDataURL("image/jpeg",.88)}
/* trả về chuỗi trả lời (JSON) của model thị giác; ném lỗi {nocheck} nếu không có nguồn kiểm nào */
async function check(sys,text,imgs){const errs=[];
 const c=await wcfg();if(c&&c.free&&c.free.check){try{const r=await fetchT(WURL()+"/free/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sys,text,images:await Promise.all(imgs.map(i=>fit(i,1024,.85)))})},100000);const j=await r.json();if(r.ok&&j.text){window.LAST_FREE_CHECK=j.model||"worker";return j.text}errs.push("Worker: "+((j.error&&j.error.message)||r.status))}catch(e){errs.push("Worker: "+e.message)}}
 if(!hfDown("vl")){try{const comp=imgs.length>1?await composite(imgs[0],imgs[1]):await fit(imgs[0],1024,.88);
  const t=sys+"\nThe picture shows "+(imgs.length>1?"two images side by side: LEFT = IMAGE 1 (the render to inspect), RIGHT = IMAGE 2 (the massing reference). All bbox/horizon fractions refer to the LEFT image only (0 = its left/top edge, 1 = its right/bottom edge).":"IMAGE 1 only.")+"\n"+text+"\nReply with the JSON object only.";
  const out=await gradio(HF.vl,"run_router",["Qwen3-VL-8B-Instruct",t,comp.split(",")[1],700,.2,.9,40,1.05,60],120000);const s=String(out[0]||"");if(/^\[ERROR\]/.test(s))throw new Error(s.slice(0,100));window.LAST_FREE_CHECK="Qwen3-VL-8B (HF)";return s}
  catch(e){hfMark("vl",e.quota?6:.34);errs.push("HF Qwen3-VL: "+e.message)}}
 throw Object.assign(new Error("Chưa có nguồn AI chấm ảnh miễn phí lúc này ("+errs.join(" · ")+")"),{nocheck:1})}
/* văn bản (không ảnh): Pollinations ẩn danh; có ảnh: dùng bộ kiểm thị giác */
async function text(sys,t,img){if(img)return check(sys,t,[img]);
 const c=await wcfg();if(c&&c.free&&c.free.text){try{const r=await fetchT(WURL()+"/free/text",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sys,text:t})},60000);const j=await r.json();if(r.ok&&j.text)return j.text}catch(_){}}
 const r=await fetchT("https://text.pollinations.ai/openai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"openai",messages:[{role:"system",content:sys},{role:"user",content:t}]})},60000);
 const j=await r.json().catch(()=>({}));const s=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!s)throw new Error("Máy AI văn bản miễn phí đang bận");return s}
/* ===================== VIDEO MIỄN PHÍ (canvas + MediaRecorder, chạy trên máy khách) ===================== */
function pickMime(){const L=["video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];for(const m of L)try{if(window.MediaRecorder&&MediaRecorder.isTypeSupported(m))return m}catch(_){}return ""}
async function video(frames,{title="PiAi",sub="",secs=9,onProgress}={}){if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw new Error("Trình duyệt này chưa hỗ trợ ghi video (cần Chrome/Edge/Safari mới).");
 const ims=[];for(const f of frames.filter(Boolean))ims.push(await loadImg(f));if(!ims.length)throw new Error("Chưa có ảnh để dựng video");
 const main=ims[ims.length-1],port=main.height>main.width;const W=port?720:1280,H=port?960:720;const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
 const mime=pickMime();const st=c.captureStream(30);const rec=new MediaRecorder(st,mime?{mimeType:mime,videoBitsPerSecond:5e6}:{});const parts=[];rec.ondataavailable=e=>e.data.size&&parts.push(e.data);
 const cover=(im,z,dx,dy,a=1)=>{const s=Math.max(W/im.width,H/im.height)*z;x.globalAlpha=a;x.drawImage(im,(W-im.width*s)/2+dx,(H-im.height*s)/2+dy,im.width*s,im.height*s);x.globalAlpha=1};
 const seg=ims.length>1?[{im:ims[0],d:1.6},{fade:1.2},{im:main,d:secs-4.2}]:[{im:main,d:secs-1.4}];const T=secs*1000;let t0=0;
 const draw=ms=>{const t=ms/1000;x.fillStyle="#0b0b0f";x.fillRect(0,0,W,H);
  if(ims.length>1){const a=1.6,b=2.8;if(t<a)cover(ims[0],1.04+.02*t/a,0,0);else if(t<b){const k=(t-a)/(b-a);cover(ims[0],1.06,0,0);cover(main,1.0,0,0,k)}else{const k=Math.min(1,(t-b)/(secs-1.4-b));cover(main,1+.12*k,-W*.02*k,-H*.015*k)}}
  else{const k=Math.min(1,t/(secs-1.4));cover(main,1+.14*k,-W*.025*k,-H*.02*k)}
  const g=x.createLinearGradient(0,H-110,0,H);g.addColorStop(0,"#0000");g.addColorStop(1,"#000b");x.fillStyle=g;x.fillRect(0,H-110,W,110);
  x.fillStyle="#fff";x.font=`700 ${port?30:34}px system-ui,sans-serif`;x.fillText(title,28,H-52);x.fillStyle="#f5a524";x.font=`500 ${port?18:20}px system-ui,sans-serif`;x.fillText(sub||"Dựng bởi PiAi · giaangroup",28,H-22);
  if(ims.length>1&&t<2.8){x.fillStyle="#000a";x.fillRect(20,20,port?250:280,40);x.fillStyle="#fff";x.font="600 18px system-ui";x.fillText(t<1.6?"① Khối dựng đúng số liệu":"② Ảnh render",32,47)}
  if(t>secs-1.4){x.fillStyle=`rgba(11,11,15,${Math.min(1,(t-(secs-1.4))/1.2)})`;x.fillRect(0,0,W,H);x.fillStyle="#f5a524";x.font="800 46px system-ui";x.textAlign="center";x.fillText("PiAi",W/2,H/2);x.font="400 18px system-ui";x.fillStyle="#ddd";x.fillText("giaangroup-ui.github.io/piai",W/2,H/2+34);x.textAlign="left"}};
 return await new Promise((res,rej)=>{rec.onstop=()=>{const b=new Blob(parts,{type:(mime||"video/webm").split(";")[0]});res({url:URL.createObjectURL(b),blob:b,mime:b.type,secs})};rec.onerror=e=>rej(e.error||new Error("Lỗi ghi video"));
  rec.start(250);const start=performance.now();const step=()=>{const ms=performance.now()-start;draw(Math.min(ms,T));onProgress&&onProgress(Math.min(1,ms/T));if(ms<T)requestAnimationFrame(step);else setTimeout(()=>rec.stop(),120)};
  /* requestAnimationFrame bị dừng khi tab ẩn → dùng setTimeout dự phòng */
  let iv=setInterval(()=>{const ms=performance.now()-start;if(ms>=T+400){clearInterval(iv);if(rec.state!=="inactive")rec.stop()}else draw(Math.min(ms,T))},1000/30);requestAnimationFrame(step)})}
/* ===================== Gắn vào app: callImage/callText khi đang ở hạng Miễn phí/Cao cấp ===================== */
function install(){try{
 if(typeof callImage==="function"){const _ci=callImage;callImage=async function(prompt,img,ratio,size,extra){const t=tier();if(t==="own"||t==="server")return _ci.apply(this,arguments);
  if(t==="pro"){const r=await proImage(prompt,img,ratio);LAST_IMG_M=r.model;return r.url}
  if(!left())throw new Error(`Đã dùng hết ${FREE_DAY} lượt miễn phí hôm nay. Mai dùng tiếp, hoặc chọn gói Cao cấp / dán key riêng ở ⚙. Không trừ xu.`);
  const r=await image(prompt,img,ratio);useOne();try{LAST_IMG_M=r.model}catch(_){}return r.url}}
 if(typeof callText==="function"){const _ct=callText;callText=async function(sys,t,img){const tt=tier();if(tt==="own"||tt==="server")return _ct.apply(this,arguments);if(tt==="pro")return proText(sys,t,img?[img]:[]);return text(sys,t,img)}}
 if(typeof callTextM==="function"){const _cm=callTextM;callTextM=async function(sys,t,imgs){const tt=tier();if(tt==="own"||tt==="server")return _cm.apply(this,arguments);if(tt==="pro")return proText(sys,t,imgs);return imgs&&imgs.length?check(sys,t,imgs):text(sys,t)}}
 if(typeof goLbl==="function"){const _g=goLbl;goLbl=function(){_g.apply(this,arguments);try{const el=document.getElementById("wgo");if(el&&tier()==="free"&&!/Miễn phí/.test(el.textContent))el.textContent=el.textContent.replace(/\s*\|\s*[\d.,]+[^|]*$/,"")+" | 🆓 Miễn phí"}catch(_){}}}
}catch(e){console.warn("PiFree install",e)}}
install();
/* trang công cụ đã vẽ trước khi file này tải → sửa lại thông báo + nhãn nút */
function refreshTool(){try{const d=document.getElementById("wdemo");if(d&&on()&&!hasOwnKey()){d.hidden=false;d.innerHTML=`🆓 Gói Miễn phí – không cần key, còn ${left()}/${FREE_DAY} lượt hôm nay. Muốn chất lượng cao nhất: <a style="color:var(--a)" href="javascript:openSet()">dán key riêng</a> hoặc chọn gói Cao cấp trong Pi Agent.`}if(document.getElementById("wgo")&&typeof goLbl==="function"&&typeof wTool!=="undefined"&&W[wTool])goLbl()}catch(_){}}
refreshTool();window.addEventListener("hashchange",()=>setTimeout(refreshTool,60));
/* ---- thanh chọn hạng dùng chung ---- */
function bar(){const t=tier(),w=!!WURL();const b=(k,ic,lb,dis,tip)=>`<button class="chip${t===k?" on":""}" ${dis?"disabled":""} title="${tip||""}" onclick="PiFree.pick('${k}')" style="${t===k?"background:#f5a524;color:#111;border-color:#f5a524":""}${dis?";opacity:.55":""}">${ic} ${lb}</button>`;
 const note=t==="free"?`🆓 <b>Miễn phí</b>: không cần key, còn <b>${left()}/${FREE_DAY}</b> lượt ảnh hôm nay. Ảnh khoá hình theo khối khi nguồn GPU miễn phí còn lượt; nếu hết sẽ là <b>ảnh ý tưởng nhanh</b> (ghi rõ). Không trừ xu.`
  :t==="pro"?`💎 <b>Cao cấp</b>: GPT Image / Gemini có tính phí qua máy chủ PiAi, chỉ trừ xu khi ảnh ĐẠT tự kiểm.`:t==="own"?`🔑 <b>Key riêng</b>: dùng key anh/chị đã dán ở ⚙ (chi phí tính vào tài khoản của anh/chị).`:`Chế độ máy chủ (đăng nhập).`;
 return `<div class="tierbar" style="border:1px solid var(--b);border-radius:12px;padding:8px 10px;margin:8px 0;font-size:13px"><div class="sug" style="margin:0 0 6px">${b("free","🆓","Miễn phí")}${b("pro","💎",w?"Cao cấp":"Cao cấp · sắp có",false,w?"":"Máy chủ cao cấp chưa bật")}${b("own","🔑","Key riêng")}</div><div style="color:var(--m)">${note}</div></div>`}
async function pick(k){if(k==="pro"){if(!WURL()){alert("Gói Cao cấp sắp có: chủ dự án đang bật máy chủ PiAi. Hiện anh/chị dùng gói Miễn phí (không cần key) hoặc dán key riêng ở ⚙.");return}
  const c=await wcfg();if(!c||!c.pro||!c.pro.enabled){alert("Gói Cao cấp chưa mở trên máy chủ. Hiện dùng gói Miễn phí.");return}
  if(!S.piai_procode){const v=prompt("Nhập mã gói Cao cấp (do PiAi cấp):");if(!v)return;S.piai_procode=v.trim()}}
 if(k==="own"&&!hasOwnKey()){if(typeof openSet==="function")openSet();alert("Dán Gemini hoặc OpenAI key của anh/chị ở ⚙ rồi chọn lại 🔑 Key riêng.");return}
 setTier(k);try{if(typeof wTool!=="undefined"&&wTool==="agent"&&window.PA_UI)PA_UI();document.querySelectorAll(".tierbar").forEach(e=>e.outerHTML=bar())}catch(_){}}
return {tier,on,setTier,pick,bar,left,used,useOne,FREE_DAY,image,check,text,video,compact,proImage,proText,wcfg,WURL,hasOwnKey,SRC};
})();
