// Cache theo phiên bản: sw.js?v=<commit>. Không bao giờ chạm vào API/bên thứ ba.
const V=new URL(self.location).searchParams.get("v")||"dev",C="piai-"+V,SHELL=["./","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./p1/brief.js","./p1/massing.js","./p1/prompt.js","./p1/verify.js","./p1/pipeline.js","./p1/ui.js","./p1/agent.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(SHELL.map(u=>fetch(u,{cache:"reload"}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==location.origin)return;
 const fresh=r.mode==="navigate"||/\/$|\.html$|\.js$|\.json$|\.webmanifest$/.test(u.pathname);
 if(fresh){e.respondWith(fetch(r,{cache:"no-store"}).then(res=>{if(res.ok&&!u.pathname.endsWith("version.json")){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})
  .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("./"))));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})))});
