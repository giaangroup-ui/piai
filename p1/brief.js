/* PiAi P1 – Nhiệm vụ thiết kế (Brief) -> tham số số. Đơn vị mét, x=đông, y=bắc, gốc = góc TN lô đất. */
window.PiBrief=(()=>{
const HOTEL={name:"Khách sạn ven biển",plot:{w:90,d:45},plinth:0.75,
 volumes:[
  {id:"podium",label:"Khối đế",x0:14.8,y0:13.6,x1:74.4,y1:37.5,floors:[6.5,4,4,4,4],color:"#e6dcc6",chamfer:{corner:"SE",dx:7.6,dy:7.9,floorsCut:1}},
  {id:"tower",label:"Tháp",x0:14.8,y0:19.7,x1:64.7,y1:37.5,base:"podium",floors:Array(14).fill(3.3),color:"#fafafa"}],
 site:[{k:"carpark",x0:.5,y0:5,x1:12.9,y1:43},{k:"pond",a:[80.1,18.1],b:[65.8,6.8],w:2.2},{k:"island",x0:13.8,y0:1.5,x1:54.6,y1:8.3},{k:"sidewalk",w:4}],
 streets:[{k:"boulevard",side:"S",w:21},{k:"side",side:"E",w:17}],
 cameras:{corner:{eye:[165,-100,28],target:[48,22,33],fov:52},aerial:{eye:[170,-110,150],target:[45,20,15],fov:50},sea:{eye:[-75,150,40],target:[45,25,33],fov:50},entrance:{eye:[40,-95,1.7],target:[50,25,36],fov:70}},
 style:"contemporary Vietnamese coastal: wave-shaped balconies, bronze louvres, teak, stone podium with Cham lotus bronze screens, rooftop infinity pool on podium, sail-shaped crown"};
const levels=v=>{let z=0,a=[0];for(const h of v.floors)a.push(z+=h);return a};
function resolve(b){b=JSON.parse(JSON.stringify(b));const by={};for(const v of b.volumes){const base=v.base?by[v.base].top:b.plinth;v.lv=levels(v).map(z=>+(z+base).toFixed(2));v.top=v.lv[v.lv.length-1];by[v.id]=v}b.top=Math.max(...b.volumes.map(v=>v.top));return b}
function validate(b){const e=[];for(const v of b.volumes){if(!(v.x1>v.x0&&v.y1>v.y0))e.push(v.label+": footprint sai");if(v.x1>b.plot.w||v.y1>b.plot.d)e.push(v.label+": vượt ranh lô đất");if(!v.floors.length)e.push(v.label+": chưa có tầng")}return e}
function formHTML(b){return `<div class="pbf"><h3>📐 Nhiệm vụ thiết kế</h3><label>Tên<input id="pb_name" value="${b.name}"></label>
<label>Lô đất (m) <input id="pb_pw" type="number" value="${b.plot.w}" style="width:70px">×<input id="pb_pd" type="number" value="${b.plot.d}" style="width:70px"></label>
<label>Nền cao hơn đường (m)<input id="pb_pl" type="number" step=".05" value="${b.plinth}"></label>
${b.volumes.map((v,i)=>`<fieldset><legend>${v.label}</legend>x0<input data-v="${i}" data-k="x0" type="number" value="${v.x0}"> y0<input data-v="${i}" data-k="y0" type="number" value="${v.y0}"> x1<input data-v="${i}" data-k="x1" type="number" value="${v.x1}"> y1<input data-v="${i}" data-k="y1" type="number" value="${v.y1}"><br>Chiều cao các tầng (m, cách nhau dấu phẩy)<input data-v="${i}" data-k="floors" value="${v.floors.join(",")}" style="width:100%"></fieldset>`).join("")}
<label>Phong cách<textarea id="pb_style">${b.style}</textarea></label></div>`}
function readForm(root,b){b=JSON.parse(JSON.stringify(b));const q=s=>root.querySelector(s);b.name=q("#pb_name").value;b.plot.w=+q("#pb_pw").value;b.plot.d=+q("#pb_pd").value;b.plinth=+q("#pb_pl").value;b.style=q("#pb_style").value;
root.querySelectorAll("[data-v]").forEach(el=>{const v=b.volumes[+el.dataset.v],k=el.dataset.k;v[k]=k=="floors"?el.value.split(/[,;\s]+/).filter(Boolean).map(Number):+el.value});return b}
return {HOTEL,resolve,validate,formHTML,readForm,save:b=>localStorage.piai_brief=JSON.stringify(b),load:()=>{try{return JSON.parse(localStorage.piai_brief)}catch(_){return HOTEL}}};
})();
