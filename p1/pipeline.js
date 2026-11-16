/* PiAi P1 – Brief -> dựng khối -> prompt khoá -> render -> tự kiểm -> chạy lại (tối đa N). Chỉ trừ xu cho ảnh ĐẠT. */
window.PiPipeline=(()=>{
const FATAL=/429|limit:? ?0|billing|quota|403|401|api key|invalid|permission|verify|verified|organization|hạn mức|quá tải|overload|high demand|503|timeout|hết thời gian/i;
const timeout=(p,ms,msg)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error(msg)),ms))]);
async function run(B,camKey,{gen,check,charge,onStep=()=>{},max=3}={}){
 const m=PiMassing.render(B,camKey);onStep({type:"massing",url:m.url,cam:m.cam});let emph=[],log=[];
 for(let a=1;a<=max;a++){const prompt=PiPrompt.build(B,camKey,emph,m.marks);onStep({type:"prompt",a,prompt});
  let img;try{img=await gen(prompt,m.url,m.cam.ratio||"3:2")}catch(e){const msg=String(e&&e.message||e);log.push({a,err:msg});onStep({type:"error",a,msg});if(FATAL.test(msg)||log.filter(l=>l.err).length>=2)return {ok:false,fatal:msg,massing:m.url,prompt,log};continue}if(!img){log.push({a,err:"no image"});continue}
  let J;try{J=await check(PiVerify.SYS,PiVerify.ask(B,camKey),[img,m.url])}catch(e){log.push({a,err:"check: "+e.message});onStep({type:"error",a,msg:"Không chấm được ảnh: "+e.message});return {ok:false,fatal:"Không chạy được bước tự kiểm ảnh ("+e.message+") – ảnh chưa kiểm không được giao.",massing:m.url,prompt,log,unchecked:img}}
  const sc=PiVerify.score(B,J,m.marks,camKey);log.push({a,sc});onStep({type:"check",a,img,sc,html:PiVerify.card(sc,a)});
  if(sc.pass){charge&&charge(a);return {ok:true,img,sc,massing:m.url,prompt,log}}
  emph=sc.rows.filter(r=>!r.ok).map(r=>r.fix)}
 return {ok:false,massing:m.url,log}}  /* ảnh loại không bao giờ được trả ra làm kết quả, không trừ xu */
/* Bộ gen/check/charge dùng chung cho tool Nhiệm vụ và Pi Agent (DEMO an toàn: 0 xu, watermark) */
const TIER=()=>window.PiFree?PiFree.tier():"own";
const isDemo=()=>false;/* v21: không còn DEMO – không có key thì dùng hạng Miễn phí (nguồn AI miễn phí thật) */
const unit=()=>typeof qUnit=="function"?qUnit(1,typeof selImgM=="function"?selImgM():""):10;
const toJpg=(u,maxW=1600)=>new Promise((r,j)=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");const k=Math.min(1,maxW/i.width);c.width=i.width*k|0;c.height=i.height*k|0;c.getContext("2d").drawImage(i,0,0,c.width,c.height);r(c.toDataURL("image/jpeg",.92))};i.onerror=j;i.src=u});
const parseJ=r=>JSON.parse(String(r).replace(/^[^{]*/s,"").replace(/[^}]*$/s,""));
/* Hạng Miễn phí / Cao cấp: nguồn miễn phí khoá hình (Worker klein → HF Kontext) rồi mới tới ảnh ý tưởng (Pollinations).
   Ảnh không đạt tự kiểm KHÔNG được giao như kết quả; chỉ hiện làm "bản nháp tham khảo" khi không còn nguồn nào tốt hơn. */
async function runFree(B,camKey,{onStep=()=>{},max=3,tool="brief"}={}){const pro=TIER()=="pro";const m=PiMassing.render(B,camKey);onStep({type:"massing",url:m.url,cam:m.cam});
 const massJ=await toJpg(m.url);let emph=[],log=[],draft=null,unlockedTries=0;
 if(!pro&&PiFree.left()<=0)return {ok:false,fatal:`Đã dùng hết ${PiFree.FREE_DAY} lượt miễn phí hôm nay – mai dùng tiếp hoặc chọn gói Cao cấp. Không trừ xu.`,massing:m.url,log};
 if(!pro)PiFree.useOne();
 for(let a=1;a<=max;a++){const prompt=PiPrompt.build(B,camKey,emph,m.marks);onStep({type:"prompt",a,prompt});let g;
  try{g=pro?await timeout(PiFree.proImage(prompt,massJ,m.cam.ratio||"3:2"),200000,"Hết thời gian chờ máy chủ cao cấp"):await PiFree.image(prompt,massJ,m.cam.ratio||"3:2",{lockedOnly:unlockedTries>=2,onSrc:(k,n)=>onStep({type:"src",a,k,n})})}
  catch(e){const msg=String(e&&e.message||e);log.push({a,err:msg});onStep({type:"error",a,msg});if(draft)break;return {ok:false,fatal:msg,massing:m.url,prompt,log,free:!pro}}
  if(!g.locked)unlockedTries++;
  let J;try{J=parseJ(await timeout(PiFree.check(PiVerify.SYS,PiVerify.ask(B,camKey),[g.url,m.url]),110000,"Hết thời gian chờ AI chấm ảnh"))}
  catch(e){log.push({a,err:"check: "+e.message});onStep({type:"error",a,msg:e.message});
   return {ok:false,unchecked:g.url,locked:g.locked,src:g.srcName,model:g.model,why:e.message,massing:m.url,prompt,log,free:!pro}}
  const sc=PiVerify.score(B,J,m.marks,camKey);if(!g.locked){const geo=sc.rows.filter(r=>r.k=="geom"||r.k=="cam");geo.forEach(r=>r.msg+=" (ảnh ý tưởng, không khoá hình)")}
  log.push({a,sc,src:g.src});onStep({type:"check",a,img:g.url,sc,html:PiVerify.card(sc,a)});
  if(sc.pass){if(pro)try{spend(unit(),{tool,tab:"Pi Agent · Cao cấp",q:"2K",cnt:1,unit:unit(),m:g.model})}catch(_){}
   return {ok:true,img:g.url,sc,massing:m.url,prompt,log,src:g.srcName,model:g.model,locked:g.locked,free:!pro,cost:pro?unit():0}}
  if(!draft||(g.locked&&!draft.locked)||sc.rows.filter(r=>r.ok).length>draft.nOk)draft={img:g.url,locked:g.locked,src:g.srcName,model:g.model,nOk:sc.rows.filter(r=>r.ok).length,n:sc.rows.length};
  emph=sc.rows.filter(r=>!r.ok).map(r=>r.fix);if(!g.locked&&unlockedTries>=2&&a>=2)break}
 return {ok:false,draft,massing:m.url,log,free:!pro}}
async function appRun(B,camKey,o={}){if(window.PiFree&&PiFree.on()){const r=await runFree(B,camKey,o);r.demo=false;r.cost=r.cost||0;return r}return appRunKey(B,camKey,o)}
async function appRunKey(B,camKey,{onStep,tool="brief",max=3,extra=[]}={}){const demo=isDemo();let a=0;let massJ=null;
 const gen=demo?async(p,url)=>{a++;await zz(450);massJ=massJ||await toJpg(url);return demoImg(massJ,"Render theo nhiệm vụ")}:async(p,url,ratio)=>{a++;massJ=massJ||await toJpg(url);return await timeout(callImage(p,massJ,ratio,"2K",extra),180000,"Hết thời gian chờ máy chủ AI tạo ảnh (180 giây)")};
 const check=demo?async()=>{await zz(250);return PiVerify.mock(B,PiMassing.render(B,camKey).marks,camKey,a)}:async(sys,text,imgs)=>{const r=await timeout(callTextM(sys,text+"\nReply with the JSON object only.",await Promise.all(imgs.map(i=>toJpg(i,1280)))),90000,"Hết thời gian chờ AI chấm ảnh");return parseJ(r)};
 const charge=()=>{if(demo)return;try{spend(unit(),{tool,tab:tool=="agent"?"Pi Agent":"Render theo NV",q:"2K",cnt:1,unit:unit(),m:typeof LAST_IMG_M!="undefined"?LAST_IMG_M:""})}catch(_){}};
 const r=await run(B,camKey,{gen,check,charge,onStep,max});r.demo=demo;r.cost=r.ok&&!demo?unit():0;return r}
function fatalVi(msg){msg=String(msg||"");if(/429|limit:? ?0|quota|billing|hạn mức/i.test(msg))return "Key API chưa được phép tạo ảnh (hạn mức = 0 hoặc chưa bật thanh toán). Gemini: vào Google AI Studio → Billing bật thanh toán cho project của key. OpenAI: cần key sk-… của tổ chức đã Verify. Không trừ xu.";
 if(/401|api key|invalid/i.test(msg))return "Key API không hợp lệ hoặc đã bị thu hồi. Vào ⚙ dán lại key mới. Không trừ xu.";
 if(/verify|verified|organization/i.test(msg))return "Tài khoản OpenAI chưa xác minh tổ chức (Verify Organization) nên chưa dùng được model ảnh. Không trừ xu.";
 if(/503|overload|high demand|quá tải|hết thời gian|timeout/i.test(msg))return "Máy chủ AI đang quá tải, thử lại sau ít phút. Không trừ xu.";
 if(/tự kiểm/.test(msg))return msg+" Không trừ xu.";return "Không tạo được ảnh: "+msg.slice(0,160)+". Không trừ xu."}
return {run,appRun,runFree,fatalVi,isDemo,unit,toJpg,timeout};
})();
