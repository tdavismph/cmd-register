/* ---------- census map ----------
   Background: building outlines and roads from OpenStreetMap (© OpenStreetMap contributors, ODbL), trimmed to a compact form.
   The built-in background is Nima and Mamobi, Accra (map/default.js). The administrator can replace it (see "map area" below);
   a replacement is kept in Supabase and on each tablet. Household squares are drawn from each household's own location (h.cen.gps),
   so changing the background never moves or changes them.
   Trimmed map: {f:1, bbox:[south,west,north,east], b:[building,...], r:[[roadType,name,line],...], p:[[landmarkType,name,x,y],...], nb, nr, np, meta}
   Landmarks (from build 0.29) are mosques, churches, schools, clinics and hospitals, banks, markets and public toilets. A map saved before build 0.29 has none.
   A building or line is a flat list of whole numbers: x,y of the first point (1 unit = 0.00001 degree, about 1 m, from the south-west corner), then the steps to each next point. */
const RTYPES=["trunk","primary","secondary","tertiary","unclassified","residential","living_street","service","pedestrian","footway","path","steps","track"];
const PTYPES=["mosque","church","worship","school","health","bank","market","toilets"];
const PLAB=["Mosque","Church","Place of worship","School","Clinic or hospital","Bank","Market","Public toilet"],PMARK=["M","C","W","S","+","B","Mk","T"],PPRI=[1,1,1,2,0,4,3,5];
function poiType(t){if(!t)return -1;const a=t.amenity;
  if(a==="place_of_worship"||t.building==="mosque"||t.building==="church")return t.religion==="muslim"||t.building==="mosque"?0:t.religion==="christian"||t.building==="church"?1:2;
  if(a==="school"||a==="kindergarten"||a==="college"||a==="university")return 3;
  if(a==="clinic"||a==="hospital"||a==="doctors"||t.healthcare==="clinic"||t.healthcare==="hospital"||t.healthcare==="centre")return 4;
  if(a==="bank")return 5;if(a==="marketplace")return 6;if(a==="toilets")return 7;return -1;}
const MAPMAX=25;          // largest map area, km2
const MAPOSM="© OpenStreetMap contributors";
const bboxKm2=b=>Math.abs((b[2]-b[0])*111.32*(b[3]-b[1])*111.32*Math.cos((b[0]+b[2])/2*Math.PI/180));
/* Trim raw OpenStreetMap data (an Overpass reply, or a GeoJSON file from overpass-turbo) to the compact form. */
function mapTrim(raw,bbox){const B=[],R=[],P=[];
  const poi=(tags,lon,lat)=>{const k=poiType(tags);if(k>=0&&isFinite(lon)&&isFinite(lat))P.push([k,tags.name?String(tags.name).slice(0,60):0,lon,lat]);};
  const add=(tags,pts)=>{if(!tags||!pts||pts.length<2)return;
    if(poiType(tags)>=0&&!tags.highway){let sx=0,sy=0;for(const q of pts){sx+=q[0];sy+=q[1];}poi(tags,sx/pts.length,sy/pts.length);}
    if(tags.building){B.push(pts);return;}
    let t=tags.highway;if(!t)return;t=String(t).replace(/_link$/,"");const i=RTYPES.indexOf(t);if(i<0)return;R.push([i,tags.name||0,pts]);};
  if(raw&&Array.isArray(raw.elements)){for(const e of raw.elements){if(e.type==="way"&&e.geometry)add(e.tags,e.geometry.map(g=>[g.lon,g.lat]));else if(e.type==="node"&&e.tags)poi(e.tags,e.lon,e.lat);}}
  else if(raw&&Array.isArray(raw.features)){for(const f of raw.features){const g=f.geometry,p=f.properties||{};if(!g)continue;
      if(g.type==="Polygon")add(p,g.coordinates[0]);else if(g.type==="MultiPolygon")for(const q of g.coordinates)add(p,q[0]);
      else if(g.type==="Point")poi(p,g.coordinates[0],g.coordinates[1]);else if(g.type==="LineString")add(p,g.coordinates);else if(g.type==="MultiLineString")for(const q of g.coordinates)add(p,q);}}
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
  // landmarks inside the area; the same place tagged twice (a point and its building) is kept once
  const p=[];for(const q of P){if(q[3]<bbox[0]||q[3]>bbox[2]||q[2]<bbox[1]||q[2]>bbox[3])continue;const x=Math.round((q[2]-w0)*1e5),y=Math.round((q[3]-s0)*1e5);
    if(p.some(o=>o[0]===q[0]&&o[1]===q[1]&&Math.abs(o[2]-x)<40&&Math.abs(o[3]-y)<40))continue;p.push([q[0],q[1],x,y]);}
  return{f:1,bbox:bbox.map(x=>+(+x).toFixed(5)),b,r,p,nb:b.length,nr:r.length,np:p.length};}
if(typeof module!=="undefined")module.exports={mapTrim,bboxKm2,RTYPES,PTYPES};

/* the map now in use */
const MAPS={cur:null,def:null,loading:false,v:"default"};
function mapLoad(cb){if(MAPS.cur)return cb&&cb();if(MAPS.def){MAPS.cur=MAPS.def;return cb&&cb();}
  if(MAPS.loading)return;MAPS.loading=true;const s=document.createElement("script");s.src="map/default.js?v=29";   // the number changes when the built-in map file changes, so that a stored older copy is not used
  s.onload=()=>{MAPS.loading=false;MAPS.def=window.CMD_MAP_DEFAULT;MAPS.cur=MAPS.cur||MAPS.def;cb&&cb();};s.onerror=()=>{MAPS.loading=false;MAPS.err=true;cb&&cb();};document.head.appendChild(s);}
const mapIsDefault=()=>!MAPS.cur||MAPS.cur===MAPS.def||!MAPS.cur.meta;

/* drawing */
const MV={};   // view state per canvas id: {cx,cy,k}
function mapPrep(M){if(M._g)return;const g=new Map(),C=500;M._c=C;M._kx=Math.cos((M.bbox[0]+M.bbox[2])/2*Math.PI/180);
  M.b.forEach((p,i)=>{const k=Math.floor(p[0]/C)+","+Math.floor(p[1]/C);(g.get(k)||g.set(k,[]).get(k)).push(i);});M._g=g;
  M._w=(M.bbox[3]-M.bbox[1])*1e5;M._h=(M.bbox[2]-M.bbox[0])*1e5;
  M._rn=M.r.filter(r=>r[1]).sort((a,b)=>a[0]-b[0]);M._ps=(M.p||[]).slice().sort((a,b)=>PPRI[a[0]]-PPRI[b[0]]);}
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
    for(const i of L){const p=M.b[i];if(small){c.rect(X(p[0])-1,Y(p[1])-1,2,2);continue;}let x=p[0],y=p[1];const sx=X(x),sy=Y(y);c.moveTo(sx,sy);for(let j=2;j<p.length;j+=2){x+=p[j];y+=p[j+1];c.lineTo(X(x),Y(y));}c.lineTo(sx,sy);}}   // back to the first corner; closePath() is very slow on a long path
  c.fill();if(!small)c.stroke();
  // landmarks and street names, when the map is zoomed in enough to read them. A name is left out where it would cover another.
  {const FT="system-ui,sans-serif",boxes=[],free=(x,y,w,h)=>{for(const b of boxes)if(x<b[0]+b[2]&&x+w>b[0]&&y<b[1]+b[3]&&y+h>b[1])return false;boxes.push([x,y,w,h]);return true;};
   c.textBaseline="middle";
   if(k>=.7)for(const q of M._ps){if(q[0]>=5&&k<1.2)continue;const x=X(q[2]),y=Y(q[3]);if(x<-10||x>W+10||y<-10||y>H+10)continue;
     const lab=q[1]||PLAB[q[0]];c.font="600 11px "+FT;const tw=c.measureText(lab).width;if(!free(x-9,y-9,tw+24,18))continue;
     c.beginPath();c.arc(x,y,7.5,0,6.3);c.fillStyle="#fff";c.fill();c.lineWidth=1.4;c.strokeStyle="#4a3f7a";c.stroke();
     c.fillStyle="#3d3266";c.textAlign="center";c.font="700 "+(PMARK[q[0]].length>1?8:10)+"px "+FT;c.fillText(PMARK[q[0]],x,y+.5);
     c.textAlign="left";c.font="600 11px "+FT;c.lineWidth=3;c.strokeStyle="rgba(255,255,255,.9)";c.strokeText(lab,x+11,y);c.fillStyle="#3d3266";c.fillText(lab,x+11,y);}
   if(k>=.45){c.font="11px "+FT;c.textAlign="center";const put={};
     for(const r of M._rn){if(r[0]>3&&k<.9)continue;const p=r[2];if(p[0]<x0-1500||p[0]>x1+1500||p[1]<y0-1500||p[1]>y1+1500)continue;
       const pts=[];let x=p[0],y=p[1];pts.push([X(x),Y(y)]);for(let i=2;i<p.length;i+=2){x+=p[i];y+=p[i+1];pts.push([X(x),Y(y)]);}
       const seg=[];let len=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);len+=d;}
       const nm=r[1],tw=c.measureText(nm).width;if(len<tw+12)continue;
       let t=len/2,i=0;while(i<seg.length-1&&t>seg[i]){t-=seg[i];i++;}
       const a=pts[i],b=pts[i+1],f=seg[i]?t/seg[i]:0,mx=a[0]+(b[0]-a[0])*f,my=a[1]+(b[1]-a[1])*f;if(mx<0||mx>W||my<0||my>H)continue;
       if((put[nm]||[]).some(o=>Math.hypot(o[0]-mx,o[1]-my)<300))continue;
       let ang=Math.atan2(b[1]-a[1],b[0]-a[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
       const hw=Math.abs(Math.cos(ang))*tw/2+7,hh=Math.abs(Math.sin(ang))*tw/2+7;if(!free(mx-hw,my-hh,2*hw,2*hh))continue;(put[nm]=put[nm]||[]).push([mx,my]);
       c.save();c.translate(mx,my);c.rotate(ang);c.lineWidth=3;c.strokeStyle="rgba(255,255,255,.88)";c.strokeText(nm,0,0);c.fillStyle="#5d5341";c.fillText(nm,0,0);c.restore();}}
   c.textAlign="left";c.textBaseline="alphabetic";}
  // Neighbor Groups and Care Group areas
  if(st.ov&&PLAN.o)ngDraw(c,X,Y,k,M,st.ov,W,H);
  // households
  const s=st.small?Math.max(3,Math.min(13,k*5)):Math.max(st.ov?5:9,Math.min(16,k*(st.ov?9:14))),hit=[];   // smaller squares where group outlines are drawn, so that the outlines and colours stay visible
  (items||[]).forEach(it=>{const x=X((it.lon-M.bbox[1])*1e5)+(it.dx||0)*s*.8,y=Y((it.lat-M.bbox[0])*1e5)+(it.dy||0)*s*.8;if(x<-20||x>W+20||y<-20||y>H+20)return;
    c.beginPath();c.rect(x-s/2,y-s/2,s,s);if(it.fill){c.fillStyle=it.fill;c.fill();}else{c.fillStyle="rgba(255,255,255,.75)";c.fill();}
    c.lineWidth=it.id===sel?3.5:1.6;c.strokeStyle=it.id===sel?"#000":"#1d2a27";c.stroke();hit.push([x,y,it.id]);});
  cv._hit=hit;if(st.ov&&PLAN.o)ngDraw(c,X,Y,k,M,st.ov,W,H,true);
  c.font="11px system-ui,sans-serif";const tw=c.measureText(MAPOSM).width;c.fillStyle="rgba(255,255,255,.85)";c.fillRect(W-tw-12,H-20,tw+12,20);c.fillStyle="#333";c.fillText(MAPOSM,W-tw-6,H-6);}
function mapFit(id,M,items,W,H){mapPrep(M);let x0=0,x1=M._w,y0=0,y1=M._h;
  const P=(items||[]).map(it=>[(it.lon-M.bbox[1])*1e5,(it.lat-M.bbox[0])*1e5]);
  if(P.length){x0=Math.min(...P.map(p=>p[0]))-120;x1=Math.max(...P.map(p=>p[0]))+120;y0=Math.min(...P.map(p=>p[1]))-120;y1=Math.max(...P.map(p=>p[1]))+120;}
  MV[id]={cx:(x0+x1)/2*M._kx,cy:(y0+y1)/2,k:Math.min(W/((x1-x0)*M._kx||1),H/((y1-y0)||1))*.94};}
/* attach a map to a canvas already in the page */
function mapMount(id,M,items,onPick,fitAll,fitTo){const cv=document.getElementById(id);if(!cv||!M)return;
  if(!MV[id]||MV[id].m!==M){mapFit(id,M,fitAll?null:fitTo||items,cv.clientWidth,cv.clientHeight);MV[id].m=M;}
  const st=MV[id],draw=()=>{if(!cv._raf)cv._raf=requestAnimationFrame(()=>{cv._raf=0;mapDraw(cv,M,items,st.sel);});};draw();
  const pts=new Map();let moved=0,pd=0;
  const zoom=(f,px,py)=>{const W=cv.clientWidth,H=cv.clientHeight,k2=Math.max(.02,Math.min(12,st.k*f));const wx=st.cx+(px-W/2)/st.k,wy=st.cy-(py-H/2)/st.k;st.cx=wx-(px-W/2)/k2;st.cy=wy+(py-H/2)/k2;st.k=k2;draw();};
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.offsetX,e.offsetY]);moved=0;if(pts.size===2){const a=[...pts.values()];pd=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);}};
  cv.onpointermove=e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.offsetX-p[0],dy=e.offsetY-p[1];pts.set(e.pointerId,[e.offsetX,e.offsetY]);
    if(pts.size===1){st.cx-=dx/st.k;st.cy+=dy/st.k;moved+=Math.abs(dx)+Math.abs(dy);draw();}
    else if(pts.size===2){const a=[...pts.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pd>0)zoom(d/pd,(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2);pd=d;moved=99;}};
  cv.onpointerup=cv.onpointercancel=e=>{pts.delete(e.pointerId);if(moved<6&&onPick){let best=null,bd=22;for(const h of cv._hit||[]){const d=Math.hypot(h[0]-e.offsetX,h[1]-e.offsetY);if(d<bd){bd=d;best=h[2];}}st.sel=best;draw();onPick(best,[(st.cx+(e.offsetX-cv.clientWidth/2)/st.k)/M._kx,st.cy-(e.offsetY-cv.clientHeight/2)/st.k]);}};
  cv.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.25:.8,e.offsetX,e.offsetY);};
  cv._zoom=f=>zoom(f,cv.clientWidth/2,cv.clientHeight/2);cv._fit=all=>{mapFit(id,M,all?null:fitTo||items,cv.clientWidth,cv.clientHeight);const n=MV[id];st.cx=n.cx;st.cy=n.cy;st.k=n.k;MV[id]=st;draw();};}
const mapBox=(id,h)=>'<div class="mapwrap"><canvas id="'+id+'" class="mapcv" style="height:'+(h||"62vh")+'"></canvas><div class="mapbtn"><button data-act="mapz" data-id="'+id+'" data-v="in" aria-label="Zoom in">+</button><button data-act="mapz" data-id="'+id+'" data-v="out" aria-label="Zoom out">−</button><button data-act="mapz" data-id="'+id+'" data-v="fit">Households</button><button data-act="mapz" data-id="'+id+'" data-v="all">Whole area</button></div></div><p class="small muted">Map data '+MAPOSM+". Drag to move the map. Pinch, or use + and −, to zoom. Street names and landmarks appear as you zoom in"+(MAPS.cur&&(MAPS.cur.p||[]).length?": M mosque, C church, S school, + clinic or hospital, B bank, Mk market, T public toilet.":".")+"</p>";

/* household squares */
const MCOL={none:"#2e9a5b",htn:"#2a6fdb",dm:"#d8402f",both:"#8a41c9",vac:"#9aa3a0",mon:"#e39b2d"};
const mapFull=r=>r==="admin"||r==="prom"||r==="clinic";   // these roles see the colours for hypertension and diabetes
const mapField=r=>r==="ln"||r==="lnt";   // Leader Neighbors and Trainers: their own households, coloured by visit schedule, never by condition
const mapsUrl=g=>"https://www.google.com/maps/search/?api=1&query="+g.lat+","+g.lon;
function mapItems(){const r=me().role,ids=scope(),full=mapFull(r),out=[],seen={};
  for(const h of S.hh){const g=h.cen&&h.cen.gps;if(!g||(h.pend&&(h.pend.st==="no"||(mapField(r)&&(h.pend.adm||h.pend.to)))))continue;const own=(IX.w[h.ln]||{}).role;
    if(!(r==="admin"||r==="clinic"||(r==="prom"&&(own==="enum"||ids.has(h.ln)))||(r==="enum"&&h.ln===UI.who)||(mapField(r)&&ids.has(h.ln))))continue;
    const ps=(IX.hhP[h.id]||[]).filter(alive),H=ps.some(p=>p.htn.dx),D=ps.some(p=>p.dm.dx),st=h.cen.st;
    let cls=st==="vac"?"vac":st!=="done"?"open":mapField(r)?(hhMonthly(h)?"mon":"none"):!full?"none":H&&D?"both":H?"htn":D?"dm":"none";
    const key=g.lat.toFixed(5)+","+g.lon.toFixed(5),n=seen[key]=(seen[key]||0)+1,a=n>1?(n-2)*2.4:0;   // houses at the same spot are fanned out a little
    out.push({id:h.id,lat:g.lat,lon:g.lon,fill:cls==="open"?null:MCOL[cls],cls,dx:n>1?Math.cos(a)*(1+Math.floor((n-2)/6)):0,dy:n>1?Math.sin(a)*(1+Math.floor((n-2)/6)):0});}
  return out;}
function mapLegend(full){const sq=(c,t)=>'<span class="lg"><i style="background:'+(c||"transparent")+'"></i>'+t+"</span>";
  if(mapField(me().role))return '<div class="row">'+sq(MCOL.mon,"Monthly group lesson and home visit")+sq(MCOL.none,"Screening visit about three times a year")+"</div>";
  return '<div class="row">'+(full?sq(MCOL.none,"Censused, no patient")+sq(MCOL.htn,"Hypertension")+sq(MCOL.dm,"Diabetes")+sq(MCOL.both,"Both"):sq(MCOL.none,"Completed"))+sq(MCOL.vac,"Vacant, or not a home")+sq(null,"Visited, not completed (call back, or refused)")+"</div>";}
function vCMap(){const r=me().role,full=mapFull(r),field=mapField(r);let o="<h1>"+(field?"Household map":"Census map")+"</h1>";
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  if(!MAPS.cur){if(MAPS.err)return o+'<div class="note bad">The map could not be loaded. Connect to the internet once and open this page again.</div>'+(r==="admin"?mapAreaCard():"");
    mapLoad(()=>{if(UI.tab==="cmap"&&!UI.mode)render();});return o+'<div class="note">Loading the map…</div>';}
  const items=mapItems(),noLoc=S.hh.filter(h=>h.cen&&!h.cen.gps&&(r!=="enum"||h.ln===UI.who)).length,M=MAPS.cur;
  const outside=items.filter(i=>i.lat<M.bbox[0]||i.lat>M.bbox[2]||i.lon<M.bbox[1]||i.lon>M.bbox[3]).length;
  if(field){const mine=S.hh.filter(h=>scope().has(h.ln)).length;
    o+=areaSel()+"<p class='muted'>"+items.length+" of "+mine+" household"+(mine===1?"":"s")+" "+(items.length===1?"has":"have")+" a location from the census. Tap a square to see whose house it is and how to find it.</p>";}
  else o+="<p class='muted'>"+items.length+" household"+(items.length===1?"":"s")+" with a location."+(noLoc?" "+noLoc+" recorded without a location, so not on the map.":"")+(outside?" "+outside+" lie outside the map area and are drawn on a blank background.":"")+(full?" The colours for hypertension and diabetes are shown only to the Administrator, the Promoters and the clinic staff.":"")+"</p>";
  o+=mapBox("cmap")+mapLegend(full)+ngLegend()+(field&&ngOverlay()?'<p class="small muted">The outline shows '+(r==="ln"?"your Neighbor Group":UI.area==="all"?"the Neighbor Groups in your Care Group area":"this Leader Neighbor's Neighbor Group")+".</p>":"")+'<div id="mapinfo"></div>';
  if(r==="admin")o+=mapAreaCard();
  const key=UI.who+"|"+UI.area,foc=UI.mapFocus;UI.mapFocus=null;if(MV.cmap&&MV.cmap.key!==key)delete MV.cmap;
  setTimeout(()=>{mapMount("cmap",M,items,mapPick);const st=MV.cmap;if(!st)return;st.key=key;st.ov=ngOverlay();
    const it=foc&&items.find(i=>i.id===foc);if(it){mapPrep(M);st.cx=(it.lon-M.bbox[1])*1e5*M._kx;st.cy=(it.lat-M.bbox[0])*1e5;st.k=Math.max(st.k,2.2);st.sel=foc;const cv=document.getElementById("cmap");mapDraw(cv,M,items,foc);mapPick(foc);}},0);return o;}
/* household page: where the house is, from the census */
function hhWhere(h){const c=h.cen,g=c&&c.gps;if(!c)return"";
  if(!g)return '<div class="card"><h3>Where this house is</h3><p class="small">'+(c.lm?esc(c.lm)+". ":"")+"No location was recorded for this house at the census.</p></div>";
  let o='<div class="card"><h3>Where this house is</h3><p>'+(c.lm?esc(c.lm)+".":"No description was written at the census.")+"</p>";
  if(MAPS.cur){const key=h.id;if(MV.hhmap&&MV.hhmap.key!==key)delete MV.hhmap;o+=mapBox("hhmap","240px");
    setTimeout(()=>{mapMount("hhmap",MAPS.cur,[{id:h.id,lat:g.lat,lon:g.lon,fill:"#111"}],null);if(MV.hhmap){MV.hhmap.key=key;MV.hhmap.ov=ngOverlay();}},0);}
  else if(MAPS.err)o+='<p class="small muted">The map could not be loaded. Connect to the internet once and open this page again.</p>';
  else{mapLoad(()=>{if(UI.mode==="hh"&&UI.hh===h.id)render();});o+='<p class="small muted">Loading the map…</p>';}
  o+='<div class="row">'+(TABS[me().role].some(t=>t[0]==="cmap")?'<button data-act="showmap" data-id="'+h.id+'">Show among the other households</button>':"")+'<a class="btnlink" href="'+mapsUrl(g)+'" target="_blank" rel="noopener">Open in a maps app</a></div>'+
    "<p class='small muted'>Latitude "+g.lat+", longitude "+g.lon+", recorded at the census"+(c.d?" on "+fmtD(c.d):"")+" and accurate to about "+Math.round(g.acc)+" m. The maps app needs an internet connection.</p></div>";
  return o;}
function mapPick(id){const el=$("#mapinfo");if(!el)return;if(!id){el.innerHTML="";return;}const h=IX.hh[id],ps=IX.hhP[id]||[],full=mapFull(me().role);
  if(mapField(me().role)){const g=h.cen.gps,ln=IX.w[h.ln]||{};
    el.innerHTML='<div class="card"><h2>'+esc(h.head)+' <span class="muted small">'+esc(h.no)+"</span></h2><div class='row'>"+chip(hhMonthly(h)?["Monthly","info"]:["Screening","good"])+chip(["Location accurate to about "+Math.round(g.acc)+" m",g.acc<=CZ.good?"good":g.acc<=CZ.poor?"warn":"bad"])+"</div><p>"+(h.cen.lm?esc(h.cen.lm)+".":"No description was written at the census.")+"</p><p class='small muted'>"+(me().role==="lnt"?"Leader Neighbor: "+esc(ln.name||"")+". ":"")+(h.last?"Last visit "+fmtD(h.last)+".":"Not yet visited.")+'</p><div class="row"><button class="pri" data-hh="'+h.id+'">Open the household</button><a class="btnlink" href="'+mapsUrl(g)+'" target="_blank" rel="noopener">Open in a maps app</a></div></div>';return;}
  el.innerHTML='<div class="card"><h2>'+esc(h.head)+' <span class="muted small">'+esc(h.no)+"</span></h2><div class='row'>"+chip(CST[h.cen.st])+(h.cen.st==="cb"&&h.cen.why?chip([CZCB[h.cen.why],"warn"]):"")+chip(["Location accurate to about "+Math.round(h.cen.gps.acc)+" m",h.cen.gps.acc<=CZ.good?"good":h.cen.gps.acc<=CZ.poor?"warn":"bad"])+"</div><p class='small'>"+(h.cen.lm?esc(h.cen.lm)+". ":"")+fmtD(h.cen.d)+", "+esc((IX.w[h.cen.by]||{}).name||"")+"."+(h.cen.st==="done"?" "+ps.length+" adult"+(ps.length===1?"":"s")+" listed.":"")+"</p>"+
    (full&&h.cen.st==="done"?"<p class='small'>"+ps.filter(alive).map(p=>pLink(p)+" ("+p.age+")").join(", ")+"</p>":"")+"</div>";}
if(typeof document!=="undefined")document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.dataset.act!=="mapz")return;const cv=document.getElementById(b.dataset.id);if(!cv||!cv._zoom)return;const v=b.dataset.v;if(v==="in")cv._zoom(1.5);else if(v==="out")cv._zoom(1/1.5);else cv._fit(v==="all");});
