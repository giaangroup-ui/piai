/* PiAi P1 – Brief -> dựng khối -> prompt khoá -> render -> tự kiểm -> chạy lại (tối đa N). Chỉ trừ xu cho ảnh ĐẠT. */
window.PiPipeline=(()=>{
async function run(B,camKey,{gen,check,charge,onStep=()=>{},max=3}={}){
 const m=PiMassing.render(B,B.cameras[camKey]);onStep({type:"massing",url:m.url});let emph=[],log=[];
 for(let a=1;a<=max;a++){const prompt=PiPrompt.build(B,camKey,emph);onStep({type:"prompt",a,prompt});
  const img=await gen(prompt,m.url);if(!img){log.push({a,err:"no image"});continue}
  const J=await check(PiVerify.SYS,PiVerify.ask(B),[img,m.url]);const sc=PiVerify.score(B,J,m.marks);log.push({a,sc});onStep({type:"check",a,img,sc,html:PiVerify.card(sc,a)});
  if(sc.pass){charge&&charge(a);return {ok:true,img,sc,massing:m.url,log}}
  emph=sc.rows.filter(r=>!r.ok).map(r=>r.fix)}
 return {ok:false,massing:m.url,log}}  /* ảnh loại không bao giờ được trả ra làm kết quả, không trừ xu */
return {run};
})();
