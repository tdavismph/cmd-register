/* ---------- census map area (administrator) ----------
   The administrator can replace the built-in background (Nima and Mamobi) with another area: drag a rectangle on a map,
   fetch buildings and roads from OpenStreetMap through the Overpass API, check the preview, and use it.
   The trimmed map is stored on the server in pieces (cmd_map_put) and each tablet downloads it once (mapSync). */
const OVERPASS=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter"];
const MAPPIECE=350000;    // characters in one piece sent to the server
const MAPFEW=20;          // fewer buildings than this per km2: warn that coverage may be poor
const MAPPOI='["amenity"~"^(place_of_worship|school|kindergarten|college|university|clinic|hospital|doctors|bank|marketplace|toilets)$"]';   // landmarks, as points or as outlines
const mapQuery=b=>"[out:json][timeout:90];(way[\"building\"]("+b.join(",")+");way[\"highway\"]("+b.join(",")+");node"+MAPPOI+"("+b.join(",")+");way"+MAPPOI+"("+b.join(",")+"););out geom;";
const mapMetaTxt=M=>M&&M.meta?"Chosen by "+esc(M.meta.by||"")+" on "+esc(new Date(M.meta.at).toLocaleString())+" ("+(M.meta.src==="file"?"from an uploaded file":"fetched from OpenStreetMap")+")":"The built-in map of Nima and Mamobi, Accra";
function mapAreaCard(){const M=MAPS.cur;
  return '<div class="card"><h3>Census map area</h3>'+(M?"<p><b>"+(mapIsDefault()?"Built-in map: Nima and Mamobi, Accra":"Map chosen for this project")+"</b></p><p class='small'>"+mapMetaTxt(M)+". About "+bboxKm2(M.bbox).toFixed(1)+" square kilometres, "+M.nb.toLocaleString()+" buildings and "+M.nr.toLocaleString()+" roads and paths, "+M.r.filter(r=>r[1]).length.toLocaleString()+" of them with a name, and "+(M.p||[]).length.toLocaleString()+" landmarks. Corners: "+M.bbox[0].toFixed(4)+", "+M.bbox[1].toFixed(4)+" to "+M.bbox[2].toFixed(4)+", "+M.bbox[3].toFixed(4)+".</p>":"")+
    '<div class="row"><button class="pri" data-act="maparea">Choose a new map area</button><a class="btn" href="docs/map-area-guide.pdf" target="_blank" rel="noopener">Instructions (PDF)</a></div>'+
    '<div class="row"><button data-act="mapfile">Upload a map file (GeoJSON)</button>'+(mapIsDefault()?"":'<button data-act="mapdefault">Restore default map</button>')+'</div><input type="file" id="mapfile" accept=".geojson,.json,application/json,application/geo+json" hidden>'+
    "<p class='small muted'>Only the Administrator can change the map area. The households already recorded, and their squares on the map, do not change. After a change, each tablet downloads the new map once, at its next sync: do that on Wi-Fi.</p></div>";}

/* choosing the rectangle: an online map (OpenStreetMap tiles, drawn with the Leaflet library kept in lib/).
   Leaflet is reached as window.L, because L alone is this app's own live-mode object (live.js). */
let LMAP=null;
function leafletLoad(cb){if(window.L)return cb();const c=document.createElement("link");c.rel="stylesheet";c.href="lib/leaflet.css";document.head.appendChild(c);
  const s=document.createElement("script");s.src="lib/leaflet.js";s.onload=cb;s.onerror=()=>{UI.F.msg=["The map could not be opened. Check the internet connection and try again.","bad"];render();};document.head.appendChild(s);}
function vMapSel(){const F=UI.F;let o='<button class="link" data-act="mapcancel">‹ Cancel</button><h1>Choose a new map area</h1>';
  if(F.step==="pick"){const a=F.box?bboxKm2(F.box):0,big=a>MAPMAX;
    o+='<div class="card"><p>1. Move and zoom the map until the whole project area is on the screen.<br>2. Tap <b>Draw the rectangle</b>, then drag from one corner of the project area to the opposite corner.<br>3. Tap <b>Fetch the map</b>.</p><div id="lmap" class="lmap"></div><p class="small muted">Map data '+MAPOSM+'. This step needs an internet connection.</p>'+
      '<div class="row"><button data-act="mapdraw" class="'+(F.draw?"pri":"")+'">'+(F.draw?"Now drag on the map…":"Draw the rectangle")+'</button><button data-act="mapscreen">Use the area now on the screen</button></div>'+
      '<div id="mapsize">'+mapSizeHtml(F)+"</div>"+(F.msg?'<div class="note '+F.msg[1]+'">'+esc(F.msg[0])+"</div>":"")+
      '<div class="row"><button class="pri tap" data-act="mapfetch"'+(F.box&&!big&&!F.busy?"":" disabled")+">"+(F.busy?"Fetching the map… this can take a minute":"Fetch the map")+"</button></div></div>";
    setTimeout(mapSelMount,0);}
  else if(F.step==="preview"){const M=F.M,a=bboxKm2(M.bbox),few=M.nb<MAPFEW*a||M.nb<50;
    o+='<div class="card"><h3>Preview</h3><div class="grid"><div class="card"><h3>Buildings found</h3><div class="big">'+M.nb.toLocaleString()+'</div></div><div class="card"><h3>Roads and paths found</h3><div class="big">'+M.nr.toLocaleString()+'</div><p class="small muted">'+M.r.filter(r=>r[1]).length.toLocaleString()+' with a name</p></div><div class="card"><h3>Landmarks found</h3><div class="big">'+(M.p||[]).length.toLocaleString()+'</div><p class="small muted">mosques, churches, schools, clinics, banks, markets, public toilets</p></div><div class="card"><h3>Area</h3><div class="big">'+a.toFixed(1)+' km²</div></div><div class="card"><h3>Size for each tablet</h3><div class="big">'+(JSON.stringify(mapBare(M)).length/1048576).toFixed(1)+" MB</div></div></div>"+
      (few?'<div class="note warn"><b>Very few buildings were found.</b> OpenStreetMap may not have this area mapped well. Household squares will still appear in the right places, but with little background behind them. You can use this map, choose a different rectangle, or cancel.</div>':"")+
      (!M.nr?'<div class="note warn">No roads were found in this area.</div>':"")+mapBox("pmap","50vh")+
      (F.msg?'<div class="note '+F.msg[1]+'">'+esc(F.msg[0])+"</div>":"")+
      '<div class="row"><button class="pri tap" data-act="mapuse"'+(F.busy?" disabled":"")+">"+(F.busy?"Saving the map…":"Use this map")+'</button></div><div class="row"><button data-act="mapcancel">Cancel</button></div></div>';
    setTimeout(()=>mapMount("pmap",M,mapItems(),null,true),0);}
  return o;}
const mapSizeHtml=F=>{if(!F.box)return '<p class="small muted">No rectangle yet.</p>';const a=bboxKm2(F.box);
  return a>MAPMAX?'<div class="note bad"><b>This rectangle is too large: about '+a.toFixed(1)+" square kilometres.</b> The largest area that the map service and the tablets can handle is about "+MAPMAX+" square kilometres. Draw a smaller rectangle around the project area only.</div>":'<p><span class="chip good">Rectangle: about '+a.toFixed(1)+" square kilometres</span></p>";};
const mapBare=M=>({f:1,bbox:M.bbox,b:M.b,r:M.r,p:M.p||[],nb:M.nb,nr:M.nr,np:(M.p||[]).length,meta:M.meta,name:M.name});
function mapSelMount(){const el=document.getElementById("lmap"),F=UI.F;if(!el||!F||F.step!=="pick")return;
  leafletLoad(()=>{if(!document.getElementById("lmap")||el._done)return;el._done=true;const b=(MAPS.cur||{}).bbox||[5.57,-0.215,5.605,-0.18];
    const m=LMAP=window.L.map(el,{zoomSnap:.5});window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:MAPOSM}).addTo(m);
    if(F.view)m.setView(F.view[0],F.view[1]);else m.fitBounds([[b[0],b[1]],[b[2],b[3]]]);
    const show=()=>{if(F.rect){m.removeLayer(F.rect);F.rect=null;}if(F.box)F.rect=window.L.rectangle([[F.box[0],F.box[1]],[F.box[2],F.box[3]]],{color:"#b3261e",weight:3,fillOpacity:.08}).addTo(m);const s=document.getElementById("mapsize");if(s)s.innerHTML=mapSizeHtml(F);
      const fb=document.querySelector('button[data-act="mapfetch"]');if(fb)fb.disabled=!(F.box&&bboxKm2(F.box)<=MAPMAX&&!F.busy);};
    F.rect=null;show();m.on("moveend",()=>{F.view=[m.getCenter(),m.getZoom()];});
    let a=null;const ll=e=>m.containerPointToLatLng(window.L.point(e.clientX-el.getBoundingClientRect().left,e.clientY-el.getBoundingClientRect().top));
    const setBox=(p,q)=>{F.box=[Math.min(p.lat,q.lat),Math.min(p.lng,q.lng),Math.max(p.lat,q.lat),Math.max(p.lng,q.lng)].map(x=>+x.toFixed(5));};
    el.addEventListener("pointerdown",e=>{if(!F.draw)return;e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);a=ll(e);},true);
    el.addEventListener("pointermove",e=>{if(!F.draw||!a)return;e.preventDefault();e.stopPropagation();setBox(a,ll(e));show();},true);
    el.addEventListener("pointerup",e=>{if(!F.draw||!a)return;e.stopPropagation();const q=ll(e);if(Math.abs(q.lat-a.lat)>1e-5&&Math.abs(q.lng-a.lng)>1e-5)setBox(a,q);a=null;F.draw=false;F.msg=null;m.dragging.enable();UI.keep=true;render();},true);
    if(F.draw)m.dragging.disable();});}
async function mapFetch(){const F=UI.F;if(!F.box||bboxKm2(F.box)>MAPMAX||F.busy)return;F.busy=true;F.msg=null;UI.keep=true;render();let raw=null,err="";
  for(const url of OVERPASS){try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),120000);const r=await fetch(url,{method:"POST",body:"data="+encodeURIComponent(mapQuery(F.box)),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ctl.signal});clearTimeout(t);
      if(!r.ok){err="busy";continue;}const j=await r.json();if(j&&Array.isArray(j.elements)){raw=j;break;}err="busy";}catch(e){err=navigator.onLine===false?"offline":"busy";}}
  if(!UI.F||UI.F!==F)return;F.busy=false;
  if(!raw){F.msg=[err==="offline"?"There is no internet connection. Connect and try again.":"The OpenStreetMap service did not answer. It is often busy. Wait a few minutes and tap Fetch the map again. If it still fails, use Upload a map file (GeoJSON): the Instructions (PDF) explain how.","bad"];UI.keep=true;return render();}
  mapPreview(raw,F.box,"overpass");}
function mapPreview(raw,box,src){const F=UI.F;let M;try{M=mapTrim(raw,box);}catch(e){F.msg=[e.message==="empty"?"The file holds no buildings or roads.":"This is not a map file the app can read. Use a GeoJSON file exported from overpass-turbo.eu, as the Instructions (PDF) explain.","bad"];F.step=F.step||"pick";UI.keep=true;return render();}
  const a=bboxKm2(M.bbox);if(a>MAPMAX){F.msg=["This map covers about "+a.toFixed(1)+" square kilometres. The largest area that the tablets can handle is about "+MAPMAX+". Make a file for a smaller rectangle.","bad"];F.step="pick";UI.keep=true;return render();}
  if(!M.nb&&!M.nr){F.msg=["No buildings or roads were found in this area. Check that the rectangle is over the project area.","bad"];F.step="pick";UI.keep=true;return render();}
  M.meta={by:me().name,byId:UI.who,at:new Date().toISOString(),src,km2:+a.toFixed(2)};M.name="Project map";F.M=M;F.step="preview";F.msg=null;LMAP=null;render();}
async function mapUse(){const F=UI.F,M=F.M;if(me().role!=="admin"||F.busy)return;const v="m"+Date.now();M.v=v;
  if(live()){F.busy=true;UI.keep=true;render();try{const txt=JSON.stringify(mapBare(M)),n=Math.ceil(txt.length/MAPPIECE);
      for(let i=0;i<n;i++){const r=await rpc("cmd_map_put",{p_token:L.auth.token,p_v:v,p_part:i,p_total:n,p_body:txt.slice(i*MAPPIECE,(i+1)*MAPPIECE),p_meta:Object.assign({nb:M.nb,nr:M.nr,bbox:M.bbox},M.meta)});if(!r||!r.ok)throw {code:(r&&r.error)||"server"};}}
    catch(e){F.busy=false;F.msg=[e.code==="offline"?"No connection. The map was not saved. Connect and tap Use this map again.":e.code==="server_404"?"The server is not ready for maps yet. Run server/update-0.27.sql in Supabase, then tap Use this map again.":"The map could not be saved on the server ("+(e.code||"error")+"). Try again.","bad"];UI.keep=true;return render();}}
  MAPS.cur=M;MAPS.v=v;IDB.set("map",mapBare(Object.assign({},M,{v})));delete MV.cmap;UI.F=null;UI.mode=null;UI.tab="cmap";UI.note=["The new map is in use."+(live()?" Each tablet will download it at its next sync. Ask the workers to sync on Wi-Fi.":" In example mode it is kept on this device only."),""];render();}
async function mapDefault(){if(me().role!=="admin"||!confirm("Go back to the built-in map of Nima and Mamobi? The households already recorded do not change."))return;
  if(live()){try{const r=await rpc("cmd_map_reset",{p_token:L.auth.token});if(!r||!r.ok)throw {code:"server"};}catch(e){UI.note=["The default map could not be restored on the server. Check the connection and try again.","bad"];return render();}}
  MAPS.v="default";IDB.set("map",null);MAPS.cur=null;delete MV.cmap;mapLoad(()=>{MAPS.cur=MAPS.def;UI.note=["The built-in map is in use again.",""];render();});}
/* each tablet: fetch the project's map when the server has a different one from the copy kept here */
async function mapSync(){if(!live()||!L.auth||!L.auth.token)return;let info;try{info=await rpc("cmd_map_info",{p_token:L.auth.token});}catch(e){return;}
  if(!info||!info.v||info.v===MAPS.v)return;
  if(info.v==="default"){MAPS.v="default";IDB.set("map",null);if(MAPS.cur&&MAPS.cur!==MAPS.def){MAPS.cur=MAPS.def||null;delete MV.cmap;}return;}
  try{let txt="";for(let i=0;i<info.parts;i++){const p=await rpc("cmd_map_get",{p_token:L.auth.token,p_v:info.v,p_part:i});if(typeof p!=="string")return;txt+=p;}
    const M=JSON.parse(txt);M.v=info.v;MAPS.cur=M;MAPS.v=info.v;IDB.set("map",mapBare(M));delete MV.cmap;if(UI.tab==="cmap"&&!UI.mode&&!UI.F)render();}catch(e){}}
async function mapBoot(){try{const M=IDB.db?await IDB.get("map"):null;if(M&&M.b){MAPS.cur=M;MAPS.v=M.v||"local";}}catch(e){}}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const A=b.dataset.act;if(!A||!A.startsWith("map")||A==="mapz")return;if(me().role!=="admin")return;const F=UI.F;
  if(A==="maparea"){UI.F={step:"pick",box:null,draw:false,msg:null,busy:false};UI.mode="mapsel";return render();}
  if(A==="mapcancel"){LMAP=null;UI.F=null;UI.mode=null;return render();}
  if(A==="mapdraw"&&F){F.draw=!F.draw;if(LMAP){if(F.draw)LMAP.dragging.disable();else LMAP.dragging.enable();}b.className=F.draw?"pri":"";b.textContent=F.draw?"Now drag on the map…":"Draw the rectangle";return;}
  if(A==="mapscreen"&&F&&LMAP){const q=LMAP.getBounds().pad(-.06);F.box=[q.getSouth(),q.getWest(),q.getNorth(),q.getEast()].map(x=>+x.toFixed(5));F.msg=null;UI.keep=true;return render();}
  if(A==="mapfetch")return mapFetch();
  if(A==="mapuse")return mapUse();
  if(A==="mapdefault")return mapDefault();
  if(A==="mapfile"){const i=$("#mapfile");if(i){i.value="";i.click();}return;}});
document.addEventListener("change",e=>{const el=e.target;if(el.id!=="mapfile"||!el.files||!el.files[0]||me().role!=="admin")return;const f=el.files[0];
  if(f.size>80*1048576){UI.note=["This file is too large ("+Math.round(f.size/1048576)+" MB). Make a file for a smaller area.","bad"];return render();}
  const rd=new FileReader();rd.onload=()=>{let raw;UI.F={step:"pick",box:null,draw:false,msg:null,busy:false,file:true};UI.mode="mapsel";try{raw=JSON.parse(rd.result);}catch(x){UI.F.msg=["This file could not be read. It must be a GeoJSON file, as exported from overpass-turbo.eu.","bad"];return render();}mapPreview(raw,null,"file");};
  rd.onerror=()=>{UI.note=["The file could not be read.","bad"];render();};rd.readAsText(f);});
