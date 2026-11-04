/* PiAi P1 – Tự kiểm tra ảnh render (METHOD.md §4). Vision model trả JSON; so mốc hình học bằng code. */
window.PiVerify=(()=>{
const SYS="You are a strict architectural QA inspector. Compare IMAGE 1 (render) against IMAGE 2 (massing reference). Count carefully twice. Reply JSON only.";
function ask(B){const v=PiBrief.resolve(B).volumes;return `Return JSON {${v.map(x=>`"floors_${x.id}":int`).join(",")},"buildings":int,"bbox":{${v.map(x=>`"${x.id}":{"l":0-1,"r":0-1,"t":0-1,"b":0-1}`).join(",")}},"horizon":0-1,"camera_same":bool,"site":{"carpark":bool,"pond":bool,"islands":bool,"streets_corner":bool},"extra_structures":bool,"text_or_outlines":bool,"style_ok":bool,"notes":string}. bbox/horizon are fractions of image width/height for each volume in IMAGE 1.`}
function score(B,J,marks,tol=.03){B=PiBrief.resolve(B);const R=[];const add=(k,ok,msg,fix)=>R.push({k,ok:!!ok,msg,fix});
 for(const v of B.volumes){const f=J["floors_"+v.id];add("floors_"+v.id,f==v.floors.length,`${v.label}: ${f??"?"}/${v.floors.length} tầng`,`${v.id} must show exactly ${v.floors.length} floors`)}
 add("one",J.buildings==1&&!J.extra_structures,`Số công trình: ${J.buildings??"?"}${J.extra_structures?" + công trình thừa":""}`,"exactly one building, remove extra structures");
 let dmax=0;for(const v of B.volumes){const a=marks.vol[v.id],b=(J.bbox||{})[v.id];if(!b){dmax=1;continue}for(const k of["l","r","t","b"])dmax=Math.max(dmax,Math.abs(a[k]-b[k]))}
 add("geom",dmax<=tol*2,`Lệch khối so với dựng khối: ${(dmax*100).toFixed(1)}%`,"match massing silhouette and proportions exactly");
 const dh=Math.abs((J.horizon??-1)-marks.horizon);add("cam",J.camera_same&&dh<=tol,`Camera/đường chân trời lệch ${(dh*100).toFixed(1)}%`,"keep identical camera and horizon");
 const s=J.site||{};add("site",s.carpark&&s.pond&&s.islands&&s.streets_corner,"Khu đất: "+[["carpark","bãi xe"],["pond","hồ nước"],["islands","đảo cây"],["streets_corner","ngã đường"]].map(([k,l])=>(s[k]?"✓ ":"✗ ")+l).join(" · "),"keep car park, pond, islands, street corner in place");
 add("clean",!J.text_or_outlines,"Không còn viền/chữ của ảnh khối","remove outlines and text");
 add("style",J.style_ok,"Phong cách đúng mô tả","apply style materials");
 return {pass:R.every(r=>r.ok),rows:R,notes:J.notes||""}}
function card(sc,attempt){return `<div class="pscore" style="border:1px solid var(--b);border-radius:12px;padding:10px;margin:8px 0"><b>${sc.pass?"✅ ĐẠT":"❌ LOẠI"} – lần ${attempt}</b>${sc.rows.map(r=>`<div>${r.ok?"✓":"✗"} ${r.msg}</div>`).join("")}${sc.notes?`<small style="opacity:.7">${String(sc.notes).replace(/</g,"&lt;")}</small>`:""}</div>`}
return {SYS,ask,score,card};
})();
