/* PiAi P1 – Dựng khối trên canvas (port của render_v4.py, mở rộng cho nhà phố / biệt thự / mặt cắt).
   Mỗi tầng một vạch để đếm được tầng. Camera "auto" tự căn khung theo công trình. */
window.PiMassing=(()=>{
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)};
const SH=[.8,1,.7,.6];const shade=(c,k)=>"#"+[1,3,5].map(i=>Math.min(255,parseInt(c.substr(i,2),16)*k|0).toString(16).padStart(2,"0")).join("");
const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
/* ---- khách sạn (giữ nguyên hình học đã hiệu chỉnh) ---- */
function sceneTower(B){const P=[];const flat=(q,z,c)=>P.push({p:q.map(([x,y])=>[x,y,z]),c,g:1});
 const prism=(q,lv,c)=>{q.forEach((a,i)=>{const b=q[(i+1)%q.length];P.push({p:[[...a,lv[0]],[...b,lv[0]],[...b,lv.at(-1)],[...a,lv.at(-1)]],c:shade(c,SH[i%4]),o:1,lv})});P.push({p:q.map(a=>[...a,lv.at(-1)]),c,o:1})};
 const W=B.plot.w,D=B.plot.d;flat([[-40,-40],[W+40,-40],[W+40,D+40],[-40,D+40]],-.05,"#6b6b6b");
 for(const s of B.streets){if(s.side=="S")flat([[-40,-1],[W+40,-1],[W+40,-1-s.w],[-40,-1-s.w]],-.03,"#4a4a4a");if(s.side=="E")flat([[W+1,-40],[W+1+s.w,-40],[W+1+s.w,D+40],[W+1,D+40]],-.03,"#4a4a4a")}
 flat([[0,0],[W,0],[W,D],[0,D]],0,"#d8d0bd");
 const pod=B.volumes[0];for(const s of B.site||[]){if(s.k=="carpark")flat(rect(s.x0,s.y0,s.x1,s.y1),.01,"#3c4a5a");
  if(s.k=="island")flat(rect(s.x0,s.y0,s.x1,s.y1),.02,"#4f8f3a");
  if(s.k=="pond"){const d=nrm([...sub(s.b,s.a),0]),n=[-d[1]*s.w/2,d[0]*s.w/2];flat([[s.a[0]+n[0],s.a[1]+n[1]],[s.b[0]+n[0],s.b[1]+n[1]],[s.b[0]-n[0],s.b[1]-n[1]],[s.a[0]-n[0],s.a[1]-n[1]]],.03,"#29b6e6")}
  if(s.k=="sidewalk")flat(rect(pod.x0-s.w,pod.y0-s.w,pod.x1+s.w,pod.y1+s.w),.04,"#a89f94")}
 prism(rect(pod.x0-1.2,pod.y0-1.2,pod.x1+1.2,pod.y1+1.2),[0,B.plinth],"#8c8378");
 for(const v of B.volumes){const q=rect(v.x0,v.y0,v.x1,v.y1);
  if(v.chamfer&&v.chamfer.corner=="SE"){const k=v.chamfer.floorsCut;prism([[v.x0,v.y0],[v.x1-v.chamfer.dx,v.y0],[v.x1,v.y0+v.chamfer.dy],[v.x1,v.y1],[v.x0,v.y1]],v.lv.slice(0,k+1),v.color);prism(q,v.lv.slice(k),v.color)}else prism(q,v.lv,v.color)}
 return P}
/* ---- nhà phố / biệt thự: ngoại thất ---- */
function sceneHouse(B,cam){const P=[];const flat=(q,z,c,o)=>{P.push({p:q.map(([x,y])=>[x,y,z]),c,g:o?0:1,o});return P.length-1};
 const prism=(q,lv,c,opt={})=>{const idx=[];q.forEach((a,i)=>{const b=q[(i+1)%q.length];P.push({p:[[...a,lv[0]],[...b,lv[0]],[...b,lv.at(-1)],[...a,lv.at(-1)]],c:shade(c,SH[i%4]),o:1,lw:opt.lw,lv:opt.nolines?null:lv});idx.push(P.length-1)});P.push({p:q.map(a=>[...a,lv.at(-1)]),c,o:1,lw:opt.lw});idx.push(P.length-1);return idx};
 const on=(i,k=1)=>{for(let j=P.length-k;j<P.length;j++)P[j].on=i};
 const sec=!!cam.section,h=B.volumes[0],sw=(B.site.find(s=>s.k=="sidewalk")||{w:3}).w,st=B.streets[0].w,W=Math.max(B.plot.w,h.x1)+30,X0=Math.min(0,h.x0)-30,D=B.plot.d;
 const xc=sec?(B.core?(B.core.x0+B.core.x1)/2:(h.x0+h.x1)/2):null;
 flat(rect(X0,-sw-st-sw-30,W,D+30),-.06,"#8f9a86");
 flat(rect(X0,-sw-st-sw,W,-sw-st),-.04,"#b9b1a6");flat(rect(X0,-sw-st,W,-sw),-.04,"#4b4f53");flat(rect(X0,-sw,W,0),-.03,"#b9b1a6");
 for(let x=X0+2;x<W;x+=7)flat(rect(x,-sw-st/2-.08,x+3,-sw-st/2+.08),-.02,"#f2f2f2");
 flat(rect(0,0,B.plot.w,D),0,B.type=="villa"?"#9cbf7f":"#cfc6b4");
 if(B.type=="villa"){flat(rect(h.x0+.5,0,h.x0+3.5,h.y0),.01,"#b8b0a0")}
 for(const n of B.neighbors||[]){if(sec)continue;prism(rect(n.x0,n.y0,n.x1,n.y1),[0,n.h],"#b4b4b4",{nolines:1,lw:1.5})}
 const R=B.volumes.find(v=>v.id=="roof"),top=h.top,F={};
 if(!sec){
  prism(rect(h.x0-(B.type=="villa"?1:0),h.y0-(B.type=="villa"?1.2:.5),h.x1+(B.type=="villa"?1:0),h.y0+(B.type=="villa"?h.y1-h.y0+1:0)),[0,B.plinth],"#8c8378",{nolines:1});
  const I=prism(rect(h.x0,h.y0,h.x1,h.y1),h.lv,h.color);F.front=I[0];F.top=I[4];
  if(R){const J=prism(rect(R.x0,R.y0,R.x1,R.y1),R.lv,R.color);F.rfront=J[0]}
  if(B.roof&&B.roof.type=="gable"){const rz=top+Math.min(3.2,(h.y1-h.y0)*.22),ym=(h.y0+h.y1)/2,o=.6;const a=[h.x0-o,h.y0-o,top],b=[h.x1+o,h.y0-o,top],c=[h.x1+o,ym,rz],d=[h.x0-o,ym,rz],e=[h.x1+o,h.y1+o,top],f=[h.x0-o,h.y1+o,top];
   P.push({p:[f,e,c,d],c:"#8a4b35",o:1},{p:[a,b,c,d],c:"#a65a3f",o:1},{p:[b,e,c],c:"#d9cfbe",o:1},{p:[a,f,d],c:"#d9cfbe",o:1})}
  else if(B.roof&&B.roof.terrace){const pz=top+1.1,Q=rect(h.x0,h.y0,h.x1,h.y1);if(!R||R.y0>h.y0+.3){P.push({p:[[h.x0,h.y0,top],[h.x1,h.y0,top],[h.x1,h.y0,pz],[h.x0,h.y0,pz]],c:"#e6decf",o:1,lw:2})}}
  if(B.core){const c=B.core;flat(rect(c.x0,c.y0,c.x1,c.y1),top+.03,"#8fc3dc",1);on(F.top);
   if(c.tree){const cx=(c.x0+c.x1)/2,cy=(c.y0+c.y1)/2,r=Math.min(c.x1-c.x0,c.y1-c.y0)*.62;const oct=[...Array(8)].map((_,i)=>[cx+r*Math.cos(i*Math.PI/4+Math.PI/8),cy+r*Math.sin(i*Math.PI/4+Math.PI/8)]);const n0=P.length;prism(oct,[top+.05,top+2.4],"#3f8f3a",{nolines:1,lw:1.5});for(let j=n0;j<P.length;j++)P[j].on=F.top}}
  if(B.roof&&B.roof.pergola&&R){const y0=R.y1+.4,y1=B.core?B.core.y0-.2:h.y1-.6;if(y1-y0>1.2){for(let x=h.x0+.4;x<h.x1-.2;x+=.9){P.push({p:[[x,y0,top+2.5],[x+.12,y0,top+2.5],[x+.12,y1,top+2.5],[x,y1,top+2.5]],c:"#8b5a2b",o:1,lw:1,on:F.top})}}}
  /* mặt tiền: mã màu vật liệu (cùng mã trong prompt) */
  const fr=F.front,w=h.x1-h.x0,y=h.y0-.03,fq=(a,b,z0,z1,c)=>P.push({p:[[h.x0+a*w,y,z0],[h.x0+b*w,y,z0],[h.x0+b*w,y,z1],[h.x0+a*w,y,z1]],c,o:1,lw:2,on:fr});
  const fac=B.facade||{},lv=h.lv;
  for(let i=0;i<h.floors.length;i++){const z0=lv[i],z1=lv[i+1],hh=z1-z0;
   if(i==0){if(B.type=="townhouse"){if(B.garage)fq(.08,.6,z0,z0+Math.min(2.7,hh-.35),"#2b2b2b");fq(.68,.88,z0,z0+Math.min(2.4,hh-.4),"#5a3a1e")}else{fq(.1,.45,z0+.2,z1-.5,"#9fb4c2");if(B.garage)fq(.55,.9,z0,z0+2.6,"#2b2b2b")}continue}
   if(B.mezz&&i==B.mezz.i){fq(.08,.92,z0+.25,z1-.35,"#9fb4c2");continue}
   if(fac.breeze){fq(.05,.47,z0+.2,z1-.2,"#c0602a");fac.louvre?fq(.53,.95,z0+.2,z1-.2,"#93663a"):fq(.53,.95,z0+.2,z1-.2,"#9fb4c2")}
   else if(fac.louvre){fq(.06,.4,z0+.2,z1-.25,"#9fb4c2");fq(.46,.94,z0+.2,z1-.2,"#93663a")}else fq(.1,.9,z0+.3,z1-.4,"#9fb4c2");
   if(fac.planter){const a=h.x0+(fac.breeze?.53:.46)*w,b=h.x0+.97*w,d=.7,zt=z0+.55;P.push({p:[[a,h.y0-d,zt],[b,h.y0-d,zt],[b,h.y0,zt],[a,h.y0,zt]],c:"#55a83f",o:1,lw:2,on:fr},{p:[[a,h.y0-d,z0+.05],[b,h.y0-d,z0+.05],[b,h.y0-d,zt],[a,h.y0-d,zt]],c:"#3f8f30",o:1,lw:2,on:fr})}}
  if(R&&R.y0<=h.y0+2&&(fac.louvre||B.roof.shrine)){const yy=R.y0-.03;P.push({p:[[h.x0+.15*w,yy,R.lv[0]+.3],[h.x0+.85*w,yy,R.lv[0]+.3],[h.x0+.85*w,yy,R.top-.35],[h.x0+.15*w,yy,R.top-.35]],c:"#93663a",o:1,lw:2,on:F.rfront})}
 }else{/* mặt cắt phối cảnh: cắt dọc tại x = tâm lõi, nhìn từ phía cắt */
  const X1=h.x1,cut="#3a3a3a",wall="#efe7d8";const slab=(y0,y1,z,xa=xc)=>{if(y1-y0<.05)return;const q=rect(xa,y0,X1,y1);q.forEach((a,i)=>{const b=q[(i+1)%4];P.push({p:[[...a,z-.25],[...b,z-.25],[...b,z],[...a,z]],c:i==3?cut:"#8d8d8d",o:1,lw:1.5})});P.push({p:q.map(a=>[...a,z]),c:"#cfcac0",o:1,lw:1})};
  /* tường sau mã màu không gian: kem = phòng từng tầng, xanh nhạt = lõi thông tầng, hồng = không gian thông 2 tầng sau lửng */
  {const c=B.core,Xw=X1-.01,q=(ya,yb,za,zb,col)=>{if(yb-ya>.05)P.push({p:[[Xw,ya,za],[Xw,yb,za],[Xw,yb,zb],[Xw,ya,zb]],c:col,o:1,lw:1})};const mz=B.mezz,yM=mz?h.y0+mz.d:null;
   for(let i=0;i<h.floors.length;i++){const z0=h.lv[i],z1=h.lv[i+1],cr=i%2?"#eadfca":"#f6efe2";
    if(mz&&i==mz.i-1){/* tầng dưới lửng: phía trước thường, phía sau thông 2 tầng */q(h.y0,yM,z0,z1,cr);if(c){q(c.y0,c.y1,z0,h.lv[i+2],"#d4ecc8");q(c.y1,h.y1,z0,h.lv[i+2],"#f3c3c3");q(yM,c.y0,z0,h.lv[i+2],"#f3c3c3")}else q(yM,h.y1,z0,h.lv[i+2],"#f3c3c3");continue}
    if(mz&&i==mz.i){q(h.y0,yM,z0,z1,cr);continue}
    if(c){q(h.y0,c.y0,z0,z1,cr);q(c.y0,c.y1,z0,z1,"#d4ecc8");q(c.y1,h.y1,z0,z1,cr)}else q(h.y0,h.y1,z0,z1,cr)}}
  const c=B.core;for(let i=0;i<h.lv.length;i++){const z=h.lv[i],a=h.y0,b=(B.mezz&&i==B.mezz.i)?h.y0+B.mezz.d:h.y1;
   if(c&&i>0){slab(a,Math.min(b,c.y0),z);slab(Math.max(a,c.y1),b,z);if(c.x1<X1&&b>c.y0)slab(Math.max(a,c.y0),Math.min(b,c.y1),z,c.x1)}else slab(a,b,z)}
  if(c)P.push({p:[[xc,c.y0,top+.15],[c.x1,c.y0,top+.15],[c.x1,c.y1,top+.15],[xc,c.y1,top+.15]],c:"#8fc3dc",o:1,lw:2});
    for(const y of[h.y0,h.y1]){const q=rect(xc,y-(y==h.y0?0:.2),X1,y+(y==h.y0?.2:0));q.forEach((a,i)=>{const b=q[(i+1)%4];P.push({p:[[...a,B.plinth],[...b,B.plinth],[...b,top],[...a,top]],c:i==3?cut:"#d8cfbf",o:1,lw:1.5})})}
  if(R){const q=rect(xc,R.y0,X1,R.y1);slab(R.y0,R.y1,R.top);for(const y of[R.y0,R.y1])P.push({p:[[xc,y,R.lv[0]],[X1,y,R.lv[0]],[X1,y,R.top],[xc,y,R.top]],c:"#d8cfbf",o:1,lw:2});P.push({p:[[X1-.02,R.y0,R.lv[0]],[X1-.02,R.y1,R.lv[0]],[X1-.02,R.y1,R.top],[X1-.02,R.y0,R.top]],c:"#f3ecdf",o:1,lw:1})}
  if(c&&c.tree){const cx=xc+.01,cy=(c.y0+c.y1)/2,r=Math.min(c.x1-c.x0,c.y1-c.y0)*.62;P.push({p:[[cx,cy-.25,B.plinth],[cx,cy+.25,B.plinth],[cx,cy+.25,top-4.5],[cx,cy-.25,top-4.5]],c:"#6b4423",o:1,lw:2});
   const zc0=Math.max(B.plinth+3,top-6.5),zc1=top+2,hr=(c.y1-c.y0)*.42;P.push({p:[[cx,cy-hr*.8,zc0+.8],[cx,cy-hr,(zc0+zc1)/2],[cx,cy-hr*.75,zc1-.5],[cx,cy,zc1],[cx,cy+hr*.75,zc1-.5],[cx,cy+hr,(zc0+zc1)/2],[cx,cy+hr*.8,zc0+.8],[cx,cy,zc0]],c:"#3f8f3a",o:1,lw:2})}
 }
 return P}
function scene(B,cam){return B.type&&B.type!=="tower"?sceneHouse(B,cam||{}):sceneTower(B)}
function basis(e,t){const f=nrm(sub(t,e)),r=nrm(crs(f,[0,0,1])),u=crs(r,f);return{f,r,u}}
function keyPts(B,cam){const P=[];for(const v of B.volumes){const xs=cam.section&&v.id!=="x"?[(B.core?(B.core.x0+B.core.x1)/2:(v.x0+v.x1)/2),v.x1]:[v.x0,v.x1];for(const X of xs)for(const Y of[v.y0,v.y1])for(const Z of[0,v.top])P.push([X,Y,Z])}
 if(B.core&&B.core.tree)P.push([(B.core.x0+B.core.x1)/2,(B.core.y0+B.core.y1)/2,B.top+2.4]);if(B.roof&&B.roof.type=="gable"){const h=B.volumes[0];P.push([h.x0,(h.y0+h.y1)/2,h.top+3.2])}return P}
function frame(B,cam,Wd,Ht){const pts=keyPts(B,cam),e=cam.eye;let c=pts.reduce((s,p)=>add(s,p),[0,0,0]).map(v=>v/pts.length);let t=c,fov=50;
 for(let it=0;it<4;it++){const{f,r,u}=basis(e,t);let ax=[],ay=[];for(const p of pts){const v=sub(p,e),z=dot(v,f);ax.push(dot(v,r)/z);ay.push(dot(v,u)/z)}
  const mx=(Math.max(...ax)+Math.min(...ax))/2,my=(Math.max(...ay)+Math.min(...ay))/2,dist=Math.hypot(...sub(t,e));t=add(add(t,mul(r,mx*dist)),mul(u,my*dist));
  const hx=(Math.max(...ax)-Math.min(...ax))/2,hy=(Math.max(...ay)-Math.min(...ay))/2;const tn=Math.max(hx,hy*Wd/Ht)*(cam.margin||1.18);fov=2*Math.atan(tn)*180/Math.PI}
 return{eye:e,target:t,fov:Math.min(88,Math.max(20,fov))}}
function render(B,camIn,Wd,Ht){B=PiBrief.resolve(B);let cam=typeof camIn=="string"?PiBrief.cams(B)[camIn]:camIn;cam=cam||Object.values(PiBrief.cams(B))[0];
 Wd=Wd||cam.W||1536;Ht=Ht||cam.H||1024;if(cam.auto){cam={...cam,...frame(B,cam,Wd,Ht)}}
 const c=document.createElement("canvas");c.width=Wd;c.height=Ht;const x=c.getContext("2d");
 const e=cam.eye,{f,r,u}=basis(e,cam.target),fl=(Wd/2)/Math.tan(cam.fov*Math.PI/360);
 const pr=p=>{const v=sub(p,e),z=dot(v,f);return [Wd/2+fl*dot(v,r)/z,Ht/2-fl*dot(v,u)/z,z]};
 x.fillStyle="#bcd9ee";x.fillRect(0,0,Wd,Ht);let hz=pr([e[0]+f[0]*1e4,e[1]+f[1]*1e4,e[2]])[1];const hzRaw=hz;hz=Math.min(Math.max(hz,0),Ht);x.fillStyle="#9fb39a";x.fillRect(0,hz,Wd,Ht-hz);
 const S=scene(B,cam);const it=S.map((g,i)=>{const pp=g.p.map(pr);if(Math.min(...pp.map(p=>p[2]))<=.3)return null;const m=g.p[0].map((_,k)=>g.p.reduce((s,p)=>s+p[k],0)/g.p.length);return {...g,i,pp,dep:g.g?1e6-i:Math.hypot(...sub(m,e))}});
 for(const g of it)if(g&&g.on!=null&&it[g.on]){g.dep=Math.min(g.dep,it[g.on].dep-1e-4*(1+g.i-g.on))}
 const L=it.filter(Boolean).sort((a,b)=>b.dep-a.dep);
 for(const g of L){x.beginPath();g.pp.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle=g.c;x.fill();if(g.o){x.strokeStyle="#000";x.lineWidth=g.lw||3;x.stroke()}
  if(g.lv&&g.lv.length>2){const[a,b]=g.p;x.lineWidth=2;for(const z of g.lv.slice(1,-1)){const p1=pr([a[0],a[1],z]),p2=pr([b[0],b[1],z]);x.beginPath();x.moveTo(p1[0],p1[1]);x.lineTo(p2[0],p2[1]);x.stroke()}}}
 /* mốc hình học để so ảnh render: bbox của từng khối trên ảnh */
 const marks={horizon:hzRaw/Ht,vol:{},W:Wd,H:Ht};for(const v of B.volumes){const pts=[];const xs=cam.section?[(B.core?(B.core.x0+B.core.x1)/2:(v.x0+v.x1)/2),v.x1]:[v.x0,v.x1];for(const X of xs)for(const Y of[v.y0,v.y1])for(const Z of[v.lv[0],v.top]){pts.push(pr([X,Y,Z]))}marks.vol[v.id]={l:Math.min(...pts.map(p=>p[0]))/Wd,r:Math.max(...pts.map(p=>p[0]))/Wd,t:Math.min(...pts.map(p=>p[1]))/Ht,b:Math.max(...pts.map(p=>p[1]))/Ht}}
 return {url:c.toDataURL("image/png"),marks,brief:B,cam}}
return {render,scene,frame};
})();
