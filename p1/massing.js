/* PiAi P1 – Dựng khối trên canvas (port của render_v4.py). Mỗi tầng một vạch để đếm được tầng. */
window.PiMassing=(()=>{
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)};
const SH=[.8,1,.7,.6];const shade=(c,k)=>"#"+[1,3,5].map(i=>Math.min(255,parseInt(c.substr(i,2),16)*k|0).toString(16).padStart(2,"0")).join("");
function scene(B){const P=[];const flat=(q,z,c)=>P.push({p:q.map(([x,y])=>[x,y,z]),c,g:1});
 const prism=(q,lv,c)=>{q.forEach((a,i)=>{const b=q[(i+1)%q.length];P.push({p:[[...a,lv[0]],[...b,lv[0]],[...b,lv.at(-1)],[...a,lv.at(-1)]],c:shade(c,SH[i%4]),o:1,lv})});P.push({p:q.map(a=>[...a,lv.at(-1)]),c,o:1})};
 const W=B.plot.w,D=B.plot.d;flat([[-40,-40],[W+40,-40],[W+40,D+40],[-40,D+40]],-.05,"#6b6b6b");
 for(const s of B.streets){if(s.side=="S")flat([[-40,-1],[W+40,-1],[W+40,-1-s.w],[-40,-1-s.w]],-.03,"#4a4a4a");if(s.side=="E")flat([[W+1,-40],[W+1+s.w,-40],[W+1+s.w,D+40],[W+1,D+40]],-.03,"#4a4a4a")}
 flat([[0,0],[W,0],[W,D],[0,D]],0,"#d8d0bd");
 const pod=B.volumes[0];for(const s of B.site){if(s.k=="carpark")flat([[s.x0,s.y0],[s.x1,s.y0],[s.x1,s.y1],[s.x0,s.y1]],.01,"#3c4a5a");
  if(s.k=="island")flat([[s.x0,s.y0],[s.x1,s.y0],[s.x1,s.y1],[s.x0,s.y1]],.02,"#4f8f3a");
  if(s.k=="pond"){const d=nrm([...sub(s.b,s.a),0]),n=[-d[1]*s.w/2,d[0]*s.w/2];flat([[s.a[0]+n[0],s.a[1]+n[1]],[s.b[0]+n[0],s.b[1]+n[1]],[s.b[0]-n[0],s.b[1]-n[1]],[s.a[0]-n[0],s.a[1]-n[1]]],.03,"#29b6e6")}
  if(s.k=="sidewalk")flat([[pod.x0-s.w,pod.y0-s.w],[pod.x1+s.w,pod.y0-s.w],[pod.x1+s.w,pod.y1+s.w],[pod.x0-s.w,pod.y1+s.w]],.04,"#a89f94")}
 prism([[pod.x0-1.2,pod.y0-1.2],[pod.x1+1.2,pod.y0-1.2],[pod.x1+1.2,pod.y1+1.2],[pod.x0-1.2,pod.y1+1.2]],[0,B.plinth],"#8c8378");
 for(const v of B.volumes){const q=[[v.x0,v.y0],[v.x1,v.y0],[v.x1,v.y1],[v.x0,v.y1]];
  if(v.chamfer&&v.chamfer.corner=="SE"){const k=v.chamfer.floorsCut;prism([[v.x0,v.y0],[v.x1-v.chamfer.dx,v.y0],[v.x1,v.y0+v.chamfer.dy],[v.x1,v.y1],[v.x0,v.y1]],v.lv.slice(0,k+1),v.color);prism(q,v.lv.slice(k),v.color)}else prism(q,v.lv,v.color)}
 return P}
function render(B,cam,Wd=1536,Ht=1024){B=PiBrief.resolve(B);const c=document.createElement("canvas");c.width=Wd;c.height=Ht;const x=c.getContext("2d");
 const e=cam.eye,f=nrm(sub(cam.target,e)),r=nrm(crs(f,[0,0,1])),u=crs(r,f),fl=(Wd/2)/Math.tan(cam.fov*Math.PI/360);
 const pr=p=>{const v=sub(p,e),z=dot(v,f);return [Wd/2+fl*dot(v,r)/z,Ht/2-fl*dot(v,u)/z,z]};
 x.fillStyle="#bcd9ee";x.fillRect(0,0,Wd,Ht);let hz=pr([e[0]+f[0]*1e4,e[1]+f[1]*1e4,e[2]])[1];hz=Math.min(Math.max(hz,0),Ht);x.fillStyle="#9fb39a";x.fillRect(0,hz,Wd,Ht-hz);
 const it=scene(B).map((g,i)=>{const pp=g.p.map(pr);if(Math.min(...pp.map(p=>p[2]))<=.5)return null;const m=g.p[0].map((_,k)=>g.p.reduce((s,p)=>s+p[k],0)/g.p.length);return {...g,pp,dep:g.g?1e6-i:Math.hypot(...sub(m,e))}}).filter(Boolean).sort((a,b)=>b.dep-a.dep);
 for(const g of it){x.beginPath();g.pp.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle=g.c;x.fill();if(g.o){x.strokeStyle="#000";x.lineWidth=3;x.stroke()}
  if(g.lv&&g.lv.length>2){const[a,b]=g.p;x.lineWidth=2;for(const z of g.lv.slice(1,-1)){const p1=pr([a[0],a[1],z]),p2=pr([b[0],b[1],z]);x.beginPath();x.moveTo(p1[0],p1[1]);x.lineTo(p2[0],p2[1]);x.stroke()}}}
 /* mốc hình học để so ảnh render: bbox của từng khối trên ảnh */
 const marks={horizon:hz/Ht,vol:{}};for(const v of B.volumes){const pts=[];for(const X of[v.x0,v.x1])for(const Y of[v.y0,v.y1])for(const Z of[v.lv[0],v.top]){const p=pr([X,Y,Z]);pts.push(p)}marks.vol[v.id]={l:Math.min(...pts.map(p=>p[0]))/Wd,r:Math.max(...pts.map(p=>p[0]))/Wd,t:Math.min(...pts.map(p=>p[1]))/Ht,b:Math.max(...pts.map(p=>p[1]))/Ht}}
 return {url:c.toDataURL("image/png"),marks,brief:B}}
return {render,scene};
})();
