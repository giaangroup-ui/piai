/* PiAi P1 – Tự kiểm tra ảnh render (METHOD.md §4). Vision model trả JSON; so mốc hình học bằng code. */
window.PiVerify=(()=>{
const SYS="You are a strict architectural QA inspector. Compare IMAGE 1 (render) against IMAGE 2 (massing reference). Count carefully twice. Reply JSON only.";
function ask(B){const v=PiBrief.resolve(B).volumes;return `Return JSON {${v.map(x=>`"floors_${x.id}":int,"floors_${x.id}_recount":int`).join(",")},"tower_wide_slab":bool,"ground_corner_chamfer_passage":bool,"columns_under_corner_or_canopy":bool,"identical_to_massing":bool,"buildings":int,"bbox":{${v.map(x=>`"${x.id}":{"l":0-1,"r":0-1,"t":0-1,"b":0-1}`).join(",")}},"horizon":0-1,"camera_same":bool,"site":{"carpark":bool,"pond":bool,"islands":bool,"streets_corner":bool},"extra_structures":bool,"text_or_outlines":bool,"style_ok":bool,"notes":string}. Count floor bands of each volume two independent times (floors_X and floors_X_recount). tower_wide_slab = the tower reads as a long wide slab (long side much longer than its height per 3 floors), not a slim point tower. bbox/horizon are fractions of image width/height for each volume in IMAGE 1.`}
function score(B,J,marks,tol=.03){B=PiBrief.resolve(B);const R=[];const add=(k,ok,msg,fix)=>R.push({k,ok:!!ok,msg,fix});
 for(const v of B.volumes){const f=J["floors_"+v.id],f2=J["floors_"+v.id+"_recount"]??f;add("floors_"+v.id,f==v.floors.length&&f2==f,`${v.label}: ${f??"?"}${f2!=f?"/"+f2:""} trên ${v.floors.length} tầng`,`${v.id} must show exactly ${v.floors.length} floors`)}
 const tw=marks.vol.tower,bt=(J.bbox||{}).tower;if(tw){const ar=(tw.r-tw.l)/(tw.b-tw.t),ar2=bt?(bt.r-bt.l)/Math.max(.01,bt.b-bt.t):0;add("slab",J.tower_wide_slab!==false&&Math.abs(ar2/ar-1)<=.25,`Tháp dạng khối dài (tỷ lệ rộng/cao ${ar2.toFixed(2)} so với ${ar.toFixed(2)})`,"tower is a long wide slab exactly as in the massing, not slim")}
 if(B.volumes.some(v=>v.chamfer)){add("chamfer",J.ground_corner_chamfer_passage,"Tầng 1 vát góc thành lối xe xuyên góc","ground floor corner cut diagonally as drive-through, floors above complete");add("cols",!J.columns_under_corner_or_canopy,"Không có cột dưới góc/mái đón","no columns under the corner or canopy, cantilevered")}
 add("echo",!(J.identical_to_massing&&J.text_or_outlines),"Ảnh đã được render (không trả lại ảnh khối)","must be a photorealistic render, not the massing");
 add("one",J.buildings==1&&!J.extra_structures,`Số công trình: ${J.buildings??"?"}${J.extra_structures?" + công trình thừa":""}`,"exactly one building, remove extra structures");
 let dmax=0;for(const v of B.volumes){const a=marks.vol[v.id],b=(J.bbox||{})[v.id];if(!b){dmax=1;continue}for(const k of["l","r","t","b"])dmax=Math.max(dmax,Math.abs(a[k]-b[k]))}
 add("geom",dmax<=tol*2.5,`Lệch khối so với dựng khối: ${(dmax*100).toFixed(1)}%`,"match massing silhouette and proportions exactly");
 const dh=Math.abs((J.horizon??-1)-marks.horizon);add("cam",J.camera_same&&dh<=tol*1.3,`Camera/đường chân trời lệch ${(dh*100).toFixed(1)}%`,"keep identical camera and horizon");
 const s=J.site||{};add("site",s.carpark&&s.pond&&s.islands&&s.streets_corner,"Khu đất: "+[["carpark","bãi xe"],["pond","hồ nước"],["islands","đảo cây"],["streets_corner","ngã đường"]].map(([k,l])=>(s[k]?"✓ ":"✗ ")+l).join(" · "),"keep car park, pond, islands, street corner in place");
 add("clean",!J.text_or_outlines,"Không còn viền/chữ của ảnh khối","remove outlines and text");
 add("style",J.style_ok,"Phong cách đúng mô tả","apply style materials");
 return {pass:R.every(r=>r.ok),rows:R,notes:J.notes||""}}
function card(sc,attempt){return `<div class="pscore" style="border:1px solid var(--b);border-radius:12px;padding:10px;margin:8px 0"><b>${sc.pass?"✅ ĐẠT":"❌ LOẠI"} – lần ${attempt}</b>${sc.rows.map(r=>`<div>${r.ok?"✓":"✗"} ${r.msg}</div>`).join("")}${sc.notes?`<small style="opacity:.7">${String(sc.notes).replace(/</g,"&lt;")}</small>`:""}</div>`}
return {SYS,ask,score,card};
})();
