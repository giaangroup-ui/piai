/* PiAi P1 – Prompt khoá hình khối, sinh từ Brief (thứ tự: GEOMETRY LOCK -> SITE LOCK -> STYLE -> VIEW -> cleanup). */
window.PiPrompt=(()=>{
function build(B,camKey,emph=[]){B=PiBrief.resolve(B);const v=B.volumes,n=v.reduce((s,x)=>s+x.floors.length,0);
 const L=["Convert the attached 3D massing model image into a photorealistic architectural photograph. The massing image is the ABSOLUTE geometry reference: keep the exact camera position, lens, horizon, framing, silhouette and every floor line. Do not add, remove or reshape any volume.","","GEOMETRY LOCK:",
 `- ONE building only, ${v.map(x=>x.label=="Tháp"?"TOWER":"PODIUM").join(" + ")} = ${n} storeys total, top at about ${B.top.toFixed(1)} m.`];
 for(const x of v){const w=(x.x1-x.x0).toFixed(1),d=(x.y1-x.y0).toFixed(1);L.push(`- ${x.id.toUpperCase()}: exactly ${x.floors.length} floors = ${x.floors.length} horizontal bands (count them in the massing), footprint ${w} m x ${d} m, floor heights ${x.floors.join("/")} m, roof at ${x.top.toFixed(1)} m. Straight sharp 90-degree corners.`);
  if(x.chamfer)L.push(`- Only the lowest ${x.chamfer.floorsCut} floor(s) of the ${x.id} are cut diagonally at the ${x.chamfer.corner} corner (${x.chamfer.dx} x ${x.chamfer.dy} m) as a covered drive-through; everything above is a complete solid corner. No columns in the passage.`)}
 L.push(`- Stone plinth ${B.plinth} m above street (${Math.round(B.plinth/.15)} steps) all around; stone-paved sidewalk.`,"","SITE LOCK (colour codes in the massing): dark blue-grey = car park with white bays; green = landscaped islands; cyan diagonal strip = reflecting pond; light beige = paved drive/plaza; dark grey = streets meeting at the corner. Keep each element exactly where it is.","",
 "STYLE (surface materials only, never change geometry): "+B.style+".","",`VIEW/LIGHT: same camera as the massing (${camKey}), golden-hour sunlight, realistic people and cars at true scale.`,"",
 "REMOVE all massing artifacts: no black outlines, no flat colour fills, no text, no labels. Exactly one building; no extra towers, pools or structures.");
 if(emph.length)L.push("","CRITICAL FIXES FROM PREVIOUS ATTEMPT (must satisfy): "+emph.join("; ")+".");
 return L.join("\n")}
return {build};
})();
