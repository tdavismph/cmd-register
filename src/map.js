/* ---------- census map ----------
   Background: building outlines and roads from OpenStreetMap (© OpenStreetMap contributors, ODbL), trimmed to a compact form.
   The built-in background is Nima and Mamobi, Accra (map/default.js). The administrator can replace it (see "map area" below);
   a replacement is kept in Supabase and on each tablet. Household squares are drawn from each household's own location (h.cen.gps),
   so changing the background never moves or changes them.
   Trimmed map: {f:1, bbox:[south,west,north,east], b:[building,...], r:[[roadType,name,line],...], nb, nr, meta}
   A building or line is a flat list of whole numbers: x,y of the first point (1 unit = 0.00001 degree, about 1 m, from the south-west corner), then the steps to each next point. */
const RTYPES=["trunk","primary","secondary","tertiary","unclassified","residential","living_street","service","pedestrian","footway","path","steps","track"];
const MAPMAX=25;          // largest map area, km2
const MAPOSM="© OpenStreetMap contributors";
const bboxKm2=b=>Math.abs((b[2]-b[0])*111.32*(b[3]-b[1])*111.32*Math.cos((b[0]+b[2])/2*Math.PI/180));
/* Trim raw OpenStreetMap data (an Overpass reply, or a GeoJSON file from overpass-turbo) to the compact form. */
function mapTrim(raw,bbox){const B=[],R=[];
  const add=(tags,pts)=>{if(!tags||!pts||pts.length<2)return;if(tags.building){B.push(pts);return;}
    let t=tags.highway;if(!t)return;t=String(t).replace(/_link$/,"");const i=RTYPES.indexOf(t);if(i<0)return;R.push([i,tags.name||0,pts]);};
  if(raw&&Array.isArray(raw.elements)){for(const e of raw.elements)if(e.type==="way"&&e.geometry)add(e.tags,e.geometry.map(g=>[g.lon,g.lat]));}
  else if(raw&&Array.isArray(raw.features)){for(const f of raw.features){const g=f.geometry,p=f.properties||{};if(!g)continue;
      if(g.type==="Polygon")add(p,g.coordinates[0]);else if(g.type==="MultiPolygon")for(const q of g.coordinates)add(p,q[0]);
      else if(g.type==="LineString")add(p,g.coordinates);else if(g.type==="MultiLineString")for(const q of g.coordinates)add(p,q);}}
  else throw new Error("not_map");
  if(!bbox){// A file has no rectangle of its own. Take it from where the buildings are (or the road points when there are no buildings),
    // leaving out the outermost 0.5% on each side, because long roads and a few stray buildings reach far beyond the area that was asked for.
    const P=B.length?B.map(a=>a[0]):R.flatMap(r=>r[2]);if(!P.length)throw new Error("empty");
    const la=P.map(p=>p[1]).sort((x,y)=>x-y),lo=P.map(p=>p[0]).sort((x,y)=>x-y),q=(a,f)=>a[Math.min(a.length-1,Math.max(0,Math.round(f*(a.length-1))))],m=.0003;
    bbox=[q(la,.005)-m,q(lo,.005)-m,q(la,.995)+m,q(lo,.995)+m];}
  const s0=bbox[0],w0=bbox[1],enc=(pts,ring)=>{const q=[];let lx=null,ly=null;
      for(const p of pts){const x=Math.round((p[0]-w0)*1e5),y=Math.round((p[1]-s0)*1e5);if(x===lx&&y===ly)continue;q.push([x,y]);lx=x;ly=y;}
      if(ring&&q.length>1&&q[0][0]===q[q.length-1][0]&&q[0][1]===q[q.length-1][1])q.pop();
      // drop points that lie on a straight line between their neighbours (within about 1 m)
      const k=[];for(let i=0;i<q.length;i++){const a=k[k.length-1],b=q[i],c=q[i+1]||(ring?q[0]:null);
        if(a&&c&&i<q.length-(ring?0:1)){const dx=c[0]-a[0],dy=c[1]-a[1],L=Math.hypot(dx,dy);if(L>0&&Math.abs((b[0]-a[0])*dy-(b[1]-a[1])*dx)/L<=1)continue;}k.push(b);}
      if(k.length<(ring?3:2))return null;const o=[k[0][0],k[0][1]];for(let i=1;i<k.length;i++)o.push(k[i][0]-k[i-1][0],k[i][1]-k[i-1][1]);return o;};
  const b=B.map(p=>enc(p,true)).filter(Boolean),r=R.map(x=>{const l=enc(x[2],false);return l?[x[0],x[1],l]:null;}).filter(Boolean);
  return{f:1,bbox:bbox.map(x=>+(+x).toFixed(5)),b,r,nb:b.length,nr:r.length};}
if(typeof module!=="undefined")module.exports={mapTrim,bboxKm2,RTYPES};

/* the map now in use */
const MAPS={cur:null,def:null,loading:false,v:"default"};
function mapLoad(cb){if(MAPS.cur)return cb&&cb();if(MAPS.def){MAPS.cur=MAPS.def;return cb&&cb();}
  if(MAPS.loading)return;MAPS.loading=true;const s=document.createElement("script");s.src="map/default.js";
  s.onload=()=>{MAPS.loading=false;MAPS.def=window.CMD_MAP_DEFAULT;MAPS.cur=MAPS.cur||MAPS.def;cb&&cb();};s.onerror=()=>{MAPS.loading=false;MAPS.err=true;cb&&cb();};document.head.appendChild(s);}
const mapIsDefault=()=>!MAPS.cur||MAPS.cur===MAPS.def||!MAPS.cur.meta;

/* drawing */
const MV={};   // view state per canvas id: {cx,cy,k}
function mapPrep(M){if(M._g)return;const g=new Map(),C=500;M._c=C;M._kx=Math.cos((M.bbox[0]+M.bbox[2])/2*Math.PI/180);
  M.b.forEach((p,i)=>{const k=Math.floor(p[0]/C)+","+Math.floor(p[1]/C);(g.get(k)||g.set(k,[]).get(k)).push(i);});M._g=g;
  M._w=(M.bbox[3]-M.bbox[1])*1e5;M._h=(M.bbox[2]-M.bbox[0])*1e5;}
const RSTY=[[7,"#f3c98b"],[6,"#f6d9a3"],[5,"#f9e7b8"],[4,"#ffffff"],[3,"#ffffff"],[3,"#ffffff"],[3,"#ffffff"],[2,"#ffffff"],[2,"#ece7dc"],[1,"#c9b8a0"],[1,"#c9b8a0"],[1,"#c9b8a0"],[1,"#d8cdb8"]];
function mapDraw(cv,M,items,sel){mapPrep(M);const st=MV[cv.id],dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle="#f4f1ea";c.fillRect(0,0,W,H);
  const kx=M._kx,k=st.k,X=x=>(x*kx-st.cx)*k+W/2,Y=y=>H/2-(y-st.cy)*k,x0=(st.cx-W/2/k)/kx,x1=(st.cx+W/2/k)/kx,y0=st.cy-H/2/k,y1=st.cy+H/2/k;
  // the map area
  c.strokeStyle="#b9b2a3";c.setLineDash([6,5]);c.lineWidth=1;c.strokeRect(X(0),Y(M._h),M._w*kx*k,M._h*k);c.setLineDash([]);
  // roads: casing first, then fill, widest last
  const line=p=>{let x=p[0],y=p[1];c.moveTo(X(x),Y(y));for(let i=2;i<p.length;i+=2){x+=p[i];y+=p[i+1];c.lineTo(X(x),Y(y));}};
  c.lineCap="round";c.lineJoin="round";
  for(const pass of [0,1])for(let t=RTYPES.length-1;t>=0;t--){const w=Math.max(1,RSTY[t][0]*Math.min(2.2,Math.max(.35,k*2.2)));if(pass===0&&w<2)continue;
    c.beginPath();for(const r of M.r)if(r[0]===t){const p=r[2];if(p[0]<x0-600||p[0]>x1+600||p[1]<y0-600||p[1]>y1+600){let x=p[0],y=p[1],inn=false;for(let i=2;i<p.length&&!inn;i+=2){x+=p[i];y+=p[i+1];inn=x>=x0&&x<=x1&&y>=y0&&y<=y1;}if(!inn)continue;}line(p);}
    c.strokeStyle=pass?RSTY[t][1]:"#cfc6b4";c.lineWidth=pass?w:w+1.6;c.stroke();}
  // buildings
  const C=M._c;c.fillStyle="#ddd6c8";c.strokeStyle="#b3aa98";c.lineWidth=.7;const small=k<.22;c.beginPath();
  for(let gx=Math.floor(x0/C)-1;gx<=Math.floor(x1/C)+1;gx++)for(let gy=Math.floor(y0/C)-1;gy<=Math.floor(y1/C)+1;gy++){const L=M._g.get(gx+","+gy);if(!L)continue;
    for(const i of L){const p=M.b[i];if(small){c.rect(X(p[0])-1,Y(p[1])-1,2,2);continue;}let x=p[0],y=p[1];c.moveTo(X(x),Y(y));for(let j=2;j<p.length;j+=2){x+=p[j];y+=p[j+1];c.lineTo(X(x),Y(y));}c.closePath();}}
  c.fill();if(!small)c.stroke();
  // households
  const s=Math.max(9,Math.min(16,k*14)),hit=[];
  (items||[]).forEach(it=>{const x=X((it.lon-M.bbox[1])*1e5)+(it.dx||0)*s*.8,y=Y((it.lat-M.bbox[0])*1e5)+(it.dy||0)*s*.8;if(x<-20||x>W+20||y<-20||y>H+20)return;
    c.beginPath();c.rect(x-s/2,y-s/2,s,s);if(it.fill){c.fillStyle=it.fill;c.fill();}else{c.fillStyle="rgba(255,255,255,.75)";c.fill();}
    c.lineWidth=it.id===sel?3.5:1.6;c.strokeStyle=it.id===sel?"#000":"#1d2a27";c.stroke();hit.push([x,y,it.id]);});
  cv._hit=hit;
  c.font="11px system-ui,sans-serif";const tw=c.measureText(MAPOSM).width;c.fillStyle="rgba(255,255,255,.85)";c.fillRect(W-tw-12,H-20,tw+12,20);c.fillStyle="#333";c.fillText(MAPOSM,W-tw-6,H-6);}
function mapFit(id,M,items,W,H){mapPrep(M);let x0=0,x1=M._w,y0=0,y1=M._h;
  const P=(items||[]).map(it=>[(it.lon-M.bbox[1])*1e5,(it.lat-M.bbox[0])*1e5]);
  if(P.length){x0=Math.min(...P.map(p=>p[0]))-120;x1=Math.max(...P.map(p=>p[0]))+120;y0=Math.min(...P.map(p=>p[1]))-120;y1=Math.max(...P.map(p=>p[1]))+120;}
  MV[id]={cx:(x0+x1)/2*M._kx,cy:(y0+y1)/2,k:Math.min(W/((x1-x0)*M._kx||1),H/((y1-y0)||1))*.94};}
/* attach a map to a canvas already in the page */
function mapMount(id,M,items,onPick,fitAll){const cv=document.getElementById(id);if(!cv||!M)return;
  if(!MV[id]||MV[id].m!==M){mapFit(id,M,fitAll?null:items,cv.clientWidth,cv.clientHeight);MV[id].m=M;}
  const st=MV[id],draw=()=>{if(!cv._raf)cv._raf=requestAnimationFrame(()=>{cv._raf=0;mapDraw(cv,M,items,st.sel);});};draw();
  const pts=new Map();let moved=0,pd=0;
  const zoom=(f,px,py)=>{const W=cv.clientWidth,H=cv.clientHeight,k2=Math.max(.02,Math.min(12,st.k*f));const wx=st.cx+(px-W/2)/st.k,wy=st.cy-(py-H/2)/st.k;st.cx=wx-(px-W/2)/k2;st.cy=wy+(py-H/2)/k2;st.k=k2;draw();};
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.offsetX,e.offsetY]);moved=0;if(pts.size===2){const a=[...pts.values()];pd=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);}};
  cv.onpointermove=e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.offsetX-p[0],dy=e.offsetY-p[1];pts.set(e.pointerId,[e.offsetX,e.offsetY]);
    if(pts.size===1){st.cx-=dx/st.k;st.cy+=dy/st.k;moved+=Math.abs(dx)+Math.abs(dy);draw();}
    else if(pts.size===2){const a=[...pts.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pd>0)zoom(d/pd,(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2);pd=d;moved=99;}};
  cv.onpointerup=cv.onpointercancel=e=>{pts.delete(e.pointerId);if(moved<6&&onPick){let best=null,bd=22;for(const h of cv._hit||[]){const d=Math.hypot(h[0]-e.offsetX,h[1]-e.offsetY);if(d<bd){bd=d;best=h[2];}}st.sel=best;draw();onPick(best);}};
  cv.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.25:.8,e.offsetX,e.offsetY);};
  cv._zoom=f=>zoom(f,cv.clientWidth/2,cv.clientHeight/2);cv._fit=all=>{mapFit(id,M,all?null:items,cv.clientWidth,cv.clientHeight);const n=MV[id];st.cx=n.cx;st.cy=n.cy;st.k=n.k;MV[id]=st;draw();};}
const mapBox=(id,h)=>'<div class="mapwrap"><canvas id="'+id+'" class="mapcv" style="height:'+(h||"62vh")+'"></canvas><div class="mapbtn"><button data-act="mapz" data-id="'+id+'" data-v="in" aria-label="Zoom in">+</button><button data-act="mapz" data-id="'+id+'" data-v="out" aria-label="Zoom out">−</button><button data-act="mapz" data-id="'+id+'" data-v="fit">Households</button><button data-act="mapz" data-id="'+id+'" data-v="all">Whole area</button></div></div><p class="small muted">Map data '+MAPOSM+". Drag to move the map. Pinch, or use + and −, to zoom.</p>";

/* household squares */
const MCOL={none:"#2e9a5b",htn:"#2a6fdb",dm:"#d8402f",both:"#8a41c9",vac:"#9aa3a0"};
function mapItems(){const r=me().role,ids=scope(),full=r==="admin"||r==="prom",out=[],seen={};
  for(const h of S.hh){const g=h.cen&&h.cen.gps;if(!g)continue;const own=(IX.w[h.ln]||{}).role;
    if(!(r==="admin"||(r==="prom"&&(own==="enum"||ids.has(h.ln)))||(r==="enum"&&h.ln===UI.who)))continue;
    const ps=(IX.hhP[h.id]||[]).filter(alive),H=ps.some(p=>p.htn.dx),D=ps.some(p=>p.dm.dx),st=h.cen.st;
    let cls=st==="vac"?"vac":st!=="done"?"open":!full?"none":H&&D?"both":H?"htn":D?"dm":"none";
    const key=g.lat.toFixed(5)+","+g.lon.toFixed(5),n=seen[key]=(seen[key]||0)+1,a=n>1?(n-2)*2.4:0;   // houses at the same spot are fanned out a little
    out.push({id:h.id,lat:g.lat,lon:g.lon,fill:cls==="open"?null:MCOL[cls],cls,dx:n>1?Math.cos(a)*(1+Math.floor((n-2)/6)):0,dy:n>1?Math.sin(a)*(1+Math.floor((n-2)/6)):0});}
  return out;}
function mapLegend(full){const sq=(c,t)=>'<span class="lg"><i style="background:'+(c||"transparent")+'"></i>'+t+"</span>";
  return '<div class="row">'+(full?sq(MCOL.none,"Censused, no patient")+sq(MCOL.htn,"Hypertension")+sq(MCOL.dm,"Diabetes")+sq(MCOL.both,"Both"):sq(MCOL.none,"Completed"))+sq(MCOL.vac,"Vacant, or not a home")+sq(null,"Visited, not completed (call back, or refused)")+"</div>";}
function vCMap(){const r=me().role,full=r==="admin"||r==="prom";let o="<h1>Census map</h1>";
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  if(!MAPS.cur){if(MAPS.err)return o+'<div class="note bad">The map could not be loaded. Connect to the internet once and open this page again.</div>'+(r==="admin"?mapAreaCard():"");
    mapLoad(()=>{if(UI.tab==="cmap"&&!UI.mode)render();});return o+'<div class="note">Loading the map…</div>';}
  const items=mapItems(),noLoc=S.hh.filter(h=>h.cen&&!h.cen.gps&&(r!=="enum"||h.ln===UI.who)).length,M=MAPS.cur;
  const outside=items.filter(i=>i.lat<M.bbox[0]||i.lat>M.bbox[2]||i.lon<M.bbox[1]||i.lon>M.bbox[3]).length;
  o+="<p class='muted'>"+items.length+" household"+(items.length===1?"":"s")+" with a location."+(noLoc?" "+noLoc+" recorded without a location, so not on the map.":"")+(outside?" "+outside+" lie outside the map area and are drawn on a blank background.":"")+(full?" The colours for hypertension and diabetes are shown only to the Administrator and the Promoters.":"")+"</p>";
  o+=mapBox("cmap")+mapLegend(full)+'<div id="mapinfo"></div>';
  if(r==="admin")o+=mapAreaCard();
  setTimeout(()=>mapMount("cmap",M,items,mapPick),0);return o;}
function mapPick(id){const el=$("#mapinfo");if(!el)return;if(!id){el.innerHTML="";return;}const h=IX.hh[id],ps=IX.hhP[id]||[],full=["admin","prom"].includes(me().role);
  el.innerHTML='<div class="card"><h2>'+esc(h.head)+' <span class="muted small">'+esc(h.no)+"</span></h2><div class='row'>"+chip(CST[h.cen.st])+(h.cen.st==="cb"&&h.cen.why?chip([CZCB[h.cen.why],"warn"]):"")+chip(["Location accurate to about "+Math.round(h.cen.gps.acc)+" m",h.cen.gps.acc<=CZ.good?"good":h.cen.gps.acc<=CZ.poor?"warn":"bad"])+"</div><p class='small'>"+(h.cen.lm?esc(h.cen.lm)+". ":"")+fmtD(h.cen.d)+", "+esc((IX.w[h.cen.by]||{}).name||"")+"."+(h.cen.st==="done"?" "+ps.length+" adult"+(ps.length===1?"":"s")+" listed.":"")+"</p>"+
    (full&&h.cen.st==="done"?"<p class='small'>"+ps.filter(alive).map(p=>pLink(p)+" ("+p.age+")").join(", ")+"</p>":"")+"</div>";}
if(typeof document!=="undefined")document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.dataset.act!=="mapz")return;const cv=document.getElementById(b.dataset.id);if(!cv||!cv._zoom)return;const v=b.dataset.v;if(v==="in")cv._zoom(1.5);else if(v==="out")cv._zoom(1/1.5);else cv._fit(v==="all");});
