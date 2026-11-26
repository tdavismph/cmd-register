/* ---------- Neighbor Groups and Care Group areas ----------
   A Neighbor Group (NG) is the set of neighbouring households that one Leader Neighbor visits.
   A Care Group area is the set of Neighbor Groups served by one Leader Neighbor Trainer.
   The Administrator has the app propose the Neighbor Groups from the census locations (balanced by adults aged 35 or older,
   or by households), fixes them, groups them into Care Group areas, fixes those, and then records each group's Leader Neighbor.
   A fixed step can be changed only after the Administrator enters the sign-in PIN again; each change is logged.
   Outlines are kept in the plan, in units of 0.00001 degree from PLAN.o, so that a tablet holding only its own households can still draw them. */
const NGCOL=[["#0072B2","Blue"],["#D55E00","Red-orange"],["#009E73","Green"],["#CC79A7","Pink"],["#E69F00","Orange"],["#56B4E9","Sky blue"],["#7B3FA0","Purple"],["#222222","Black"]];
const NGNEAR=60;   // a new house this close (about metres) to a group's outline is taken to belong to it
const PLAN={};
function planReset(){for(const k in PLAN)delete PLAN[k];Object.assign(PLAN,{v:0,st:"none",cst:"none",by:"adults",n:0,o:null,g:[],a:{},mv:{},fx:{},log:[],asg:null,local:false});}
planReset();
const planBody=()=>({v:PLAN.v,st:PLAN.st,cst:PLAN.cst,by:PLAN.by,n:PLAN.n,o:PLAN.o,g:PLAN.g,a:PLAN.a,mv:PLAN.mv,fx:PLAN.fx,log:PLAN.log.slice(-30)});
function planApply(b){planReset();if(!b||!b.g)return;Object.assign(PLAN,{v:b.v||0,st:b.st||"none",cst:b.cst||"none",by:b.by||"adults",n:b.n||0,o:b.o||null,g:b.g||[],a:b.a||{},mv:b.mv||{},fx:b.fx||{},log:b.log||[]});}
const ngIx=id=>PLAN.g.find(g=>g.id===id);
const ngOn=()=>PLAN.st==="fixed";
const n35=h=>(IX.hhP[h.id]||[]).filter(p=>alive(p)&&p.age>=35).length;
const exDemo=h=>!live()&&(IX.w[h.ln]||{}).role==="enum";   // the example's few demonstration census households lie apart from the project area and stay out of the groups
const ngHhs=()=>S.hh.filter(h=>h.cen&&h.cen.st==="done"&&h.cen.gps&&!(h.pend&&(h.pend.st==="no"||h.pend.adm||h.pend.to))&&!exDemo(h));
const ngOfH=h=>PLAN.asg?PLAN.asg[h.id]:h.ng;
function ngMem(){const m=new Map(PLAN.g.map(g=>[g.id,{hs:[],a:0}]));for(const h of S.hh){const e=m.get(ngOfH(h));if(e&&!(h.pend&&h.pend.st==="no")){e.hs.push(h);e.a+=n35(h);}}return m;}
const ngAdj=g=>[...new Set(g.nb.flat().filter(i=>i>=0))].map(i=>PLAN.g[i]).filter(Boolean);
const ngColOf=g=>g.ca&&PLAN.a[g.ca]?NGCOL[PLAN.a[g.ca].col%NGCOL.length][0]:null;
const ngLog=t=>{PLAN.log.push({t:Date.now(),by:me()?me().name:"",what:t});};
const sexW=s=>s==="F"?"woman":s==="M"?"man":"";

/* --- geometry --- */
/* Delaunay triangulation (Bowyer-Watson, points taken from left to right). Returns triangles as [a,b,c,centre x,centre y]. */
function delaunay(P){const n=P.length;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
  const d=Math.max(x1-x0,y1-y0,1)*20,mx=(x0+x1)/2,my=(y0+y1)/2,Q=P.concat([[mx-d,my-d],[mx+d,my-d],[mx,my+d]]);
  const circ=(a,b,c)=>{const ax=Q[a][0],ay=Q[a][1],bx=Q[b][0]-ax,by=Q[b][1]-ay,cx=Q[c][0]-ax,cy=Q[c][1]-ay,D=2*(bx*cy-by*cx)||1e-9,ux=(cy*(bx*bx+by*by)-by*(cx*cx+cy*cy))/D,uy=(bx*(cx*cx+cy*cy)-cx*(bx*bx+by*by))/D;return [a,b,c,ux+ax,uy+ay,ux*ux+uy*uy];};
  let T=[circ(n,n+1,n+2)];const done=[],order=[...Array(n).keys()].sort((a,b)=>Q[a][0]-Q[b][0]||Q[a][1]-Q[b][1]);
  for(const i of order){const px=Q[i][0],py=Q[i][1],E=new Map(),keep=[];
    for(const t of T){const dx=px-t[3],dy=py-t[4];
      if(dx>0&&dx*dx>t[5]){done.push(t);continue;}
      if(dx*dx+dy*dy<t[5]){for(let e=0;e<3;e++){const a=t[e],b=t[(e+1)%3],k=a<b?a*65536+b:b*65536+a;E.set(k,E.has(k)?null:[a,b]);}}else keep.push(t);}
    for(const e of E.values())if(e)keep.push(circ(e[0],e[1],i));T=keep;}
  return done.concat(T).filter(t=>t[0]<n&&t[1]<n&&t[2]<n);}
/* one unit for each spot on the ground: households recorded at the same spot (one compound, one building) stay together */
function ngUnits(hs){const kx=Math.cos(PLAN.o[0]*Math.PI/180),U=new Map();
  for(const h of hs){const g=h.cen.gps,k=g.lat.toFixed(5)+","+g.lon.toFixed(5);let u=U.get(k);if(!u){u={x:(g.lon-PLAN.o[1])*1e5*kx,y:(g.lat-PLAN.o[0])*1e5,hs:[],a:0,w:0};U.set(k,u);}u.hs.push(h);u.a+=n35(h);}
  return [...U.values()];}
/* divide the units into k groups of neighbours with about equal weight, by cutting across the long direction again and again */
function ngSplit(us,k,R,jit,out){if(k<=1||us.length<=1){out.push(us);for(let i=1;i<k;i++)out.push([]);return;}
  let W=0,mx=0,my=0;for(const u of us){W+=u.w;mx+=u.w*u.x;my+=u.w*u.y;}mx/=W;my/=W;let sxx=0,syy=0,sxy=0;for(const u of us){const dx=u.x-mx,dy=u.y-my;sxx+=u.w*dx*dx;syy+=u.w*dy*dy;sxy+=u.w*dx*dy;}
  const ang=.5*Math.atan2(2*sxy,sxx-syy)+(jit?(R()-.5)*jit:0),ca=Math.cos(ang),sa=Math.sin(ang);
  us=us.slice().sort((a,b)=>(a.x*ca+a.y*sa)-(b.x*ca+b.y*sa)||a.x-b.x||a.y-b.y);
  const k1=Math.floor(k/2),target=W*k1/k;let acc=0,i=0;for(;i<us.length;i++){if(acc+us[i].w/2>=target)break;acc+=us[i].w;}
  i=clamp(i,Math.min(k1,us.length-1),Math.max(1,us.length-(k-k1)));
  ngSplit(us.slice(0,i),k1,R,jit,out);ngSplit(us.slice(i),k-k1,R,jit,out);}
/* outlines: each house's cell is the ground nearer to it than to any other house; a group's outline is the edge of its houses' cells.
   A band of extra points round the houses keeps the outer cells from running off into empty ground. */
function ngGeom(us,lab,ng){const kx=Math.cos(PLAN.o[0]*Math.PI/180),n=us.length,P=us.map((u,i)=>[u.x+((i*7919)%13-6)*.011,u.y+((i*104729)%11-5)*.013]);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
  const C=90,grid=new Map();P.forEach((p,i)=>{const k=Math.floor(p[0]/C)+","+Math.floor(p[1]/C);(grid.get(k)||grid.set(k,[]).get(k)).push(i);});
  const near=(x,y)=>{let b=1e9;const gx=Math.floor(x/C),gy=Math.floor(y/C);for(let a=gx-1;a<=gx+1;a++)for(let c=gy-1;c<=gy+1;c++){const L=grid.get(a+","+c);if(L)for(const i of L){const d=Math.hypot(P[i][0]-x,P[i][1]-y);if(d<b)b=d;}}return b;};
  let q=0;for(let x=x0-115;x<=x1+115;x+=38)for(let y=y0-115;y<=y1+115;y+=38){q++;const jx=x+(q%7)*.9,jy=y+(q%5)*1.1,d=near(jx,jy);if(d>=42&&d<=88)P.push([jx,jy]);}
  const T=delaunay(P),E=new Map();
  T.forEach((t,ti)=>{for(let e=0;e<3;e++){const a=t[e],b=t[(e+1)%3],k=a<b?a*65536+b:b*65536+a;(E.get(k)||E.set(k,[a<b?a:b,a<b?b:a]).get(k)).push(ti);}});
  const segs=Array.from({length:ng},()=>[]),par=[...Array(n).keys()],find=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
  for(const e of E.values()){if(e.length<4)continue;const gi=e[0]<n?lab[e[0]]:-1,gj=e[1]<n?lab[e[1]]:-1;if(gi===gj){if(gi>=0)par[find(e[0])]=find(e[1]);continue;}
    if(gi>=0)segs[gi].push([e[2],e[3],gj]);if(gj>=0)segs[gj].push([e[2],e[3],gi]);}
  const out=[];
  for(let g=0;g<ng;g++){const at=new Map();segs[g].forEach((s,i)=>{for(const v of [s[0],s[1]])(at.get(v)||at.set(v,[]).get(v)).push(i);});
    const used=new Uint8Array(segs[g].length),rings=[],nbs=[];
    for(let s0=0;s0<segs[g].length;s0++){if(used[s0])continue;const vs=[],nb=[];let s=s0,v=segs[g][s0][0];
      for(let guard=0;guard<5000;guard++){used[s]=1;const sg=segs[g][s],to=sg[0]===v?sg[1]:sg[0];vs.push(v);nb.push(sg[2]);v=to;const nx=(at.get(v)||[]).find(i=>!used[i]);if(nx==null)break;s=nx;}
      if(vs.length<3)continue;
      let area=0;const pt=vs.map(t=>[T[t][3]/kx,T[t][4]]);for(let i=0;i<pt.length;i++){const a=pt[i],b=pt[(i+1)%pt.length];area+=a[0]*b[1]-b[0]*a[1];}
      if(area<0){pt.reverse();nb.reverse();nb.push(nb.shift());}   // anticlockwise, so that the inside is on the left of each edge
      rings.push(pt.flat().map(Math.round));nbs.push(nb);}
    out.push({ring:rings,nb:nbs,pc:0});}
  const roots=new Set();for(let i=0;i<n;i++){const r=find(i);if(!roots.has(r)){roots.add(r);out[lab[i]].pc++;}}   // how many separate pieces each group is in
  return out;}
function ngRebuild(){const hs=ngHhs().filter(h=>ngIx(ngOfH(h)));if(!hs.length)return;
  const us=ngUnits(hs),idx=new Map(PLAN.g.map((g,i)=>[g.id,i])),lab=us.map(u=>idx.get(ngOfH(u.hs[0]))),geo=ngGeom(us,lab,PLAN.g.length),kx=Math.cos(PLAN.o[0]*Math.PI/180);
  const sx=PLAN.g.map(()=>[0,0,0]);us.forEach((u,i)=>{const s=sx[lab[i]];s[0]+=u.x/kx*u.hs.length;s[1]+=u.y*u.hs.length;s[2]+=u.hs.length;});
  PLAN.g.forEach((g,i)=>{g.ring=geo[i].ring;g.nb=geo[i].nb;g.pc=geo[i].pc;g.c=sx[i][2]?[Math.round(sx[i][0]/sx[i][2]),Math.round(sx[i][1]/sx[i][2])]:[0,0];});}
function inRing(r,x,y){let c=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const xi=r[i],yi=r[i+1],xj=r[j],yj=r[j+1];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
function ngAt(x,y,near){for(const g of PLAN.g){let c=false;for(const r of g.ring||[])if(inRing(r,x,y))c=!c;if(c)return g;}
  if(!near)return null;let best=null,bd=near;for(const g of PLAN.g)for(const r of g.ring||[])for(let i=0;i<r.length;i+=2){const d=Math.hypot(r[i]-x,r[i+1]-y);if(d<bd){bd=d;best=g;}}return best;}
const ngAtLL=(lat,lon)=>PLAN.o&&ngOn()?ngAt((lon-PLAN.o[1])*1e5,(lat-PLAN.o[0])*1e5,NGNEAR):null;

/* --- step 1: Neighbor Groups --- */
function ngSet1(k,by,seed){const hs=ngHhs();if(!hs.length)return "No household has a census location yet.";
  let la=1e9,lo=1e9;for(const h of hs){la=Math.min(la,h.cen.gps.lat);lo=Math.min(lo,h.cen.gps.lon);}
  PLAN.oPrev=PLAN.o;PLAN.o=[+(la-.003).toFixed(5),+(lo-.003).toFixed(5)];PLAN.by=by;
  const us=ngUnits(hs);k=clamp(k,1,us.length);PLAN.n=k;for(const u of us)u.w=by==="hh"?u.hs.length:u.a+.05*u.hs.length;
  const parts=[];ngSplit(us,k,seed?rng(seed):null,seed?1.2:0,parts);
  // a new group that holds most of an old group's households keeps that group's number, Leader Neighbor and Care Group area
  // (first, the group in which its Leader Neighbor lives); groups left over are paired with the nearest old group, so that no Leader Neighbor is left without a group
  const old=PLAN.g,pairs=[],kx=Math.cos(PLAN.o[0]*Math.PI/180),home={};for(const g of old){const p=g.pid&&IX.p[g.pid];if(p)home[p.hh]=g.id;}
  const cen=parts.map(p=>{let x=0,y=0,n=0;for(const u of p){x+=u.x/kx*u.hs.length;y+=u.y*u.hs.length;n+=u.hs.length;}return n?[x/n,y/n]:[0,0];});
  parts.forEach((p,i)=>{const c={};for(const u of p)for(const h of u.hs){if(h.ng)c[h.ng]=(c[h.ng]||0)+1;if(home[h.id])c[home[h.id]]=(c[home[h.id]]||0)+1000;}for(const id in c)pairs.push([c[id],i,id]);});
  pairs.sort((a,b)=>b[0]-a[0]);const got={},taken={};for(const [,i,id] of pairs){if(got[i]||taken[id]||!old.some(g=>g.id===id))continue;got[i]=id;taken[id]=1;}
  const o0=old.length&&old[0].c&&PLAN.oPrev?[(PLAN.oPrev[1]-PLAN.o[1])*1e5,(PLAN.oPrev[0]-PLAN.o[0])*1e5]:[0,0];
  for(let i=0;i<parts.length;i++){if(got[i])continue;let best=null,bd=1e12;for(const g of old){if(taken[g.id]||!g.c)continue;const d=Math.hypot(g.c[0]+o0[0]-cen[i][0],g.c[1]+o0[1]-cen[i][1]);if(d<bd){bd=d;best=g;}}if(best){got[i]=best.id;taken[best.id]=1;}}
  const nos=new Set(old.filter(g=>taken[g.id]).map(g=>g.no));let nx=1,ser=old.reduce((m,g)=>Math.max(m,+g.id.slice(1)||0),0);
  PLAN.g=parts.map((p,i)=>{const o=got[i]&&old.find(g=>g.id===got[i]);if(o)return Object.assign({},o,{ring:[],nb:[]});while(nos.has(nx))nx++;nos.add(nx);return {id:"n"+(++ser),no:nx,ring:[],nb:[],c:[0,0],ln:null,pid:null,name:"",sex:"",ca:null};});
  PLAN.asg={};parts.forEach((p,i)=>{for(const u of p)for(const h of u.hs)PLAN.asg[h.id]=PLAN.g[i].id;});
  PLAN.g.sort((a,b)=>a.no-b.no);PLAN.st="draft";PLAN.local=true;ngRebuild();return "";}
function ngSet(k,by,seed){let best=null,bs=1e9;const g0=PLAN.g,o0=PLAN.o;
  for(let t=0;t<10;t++){PLAN.g=g0;PLAN.o=o0;const sd=seed+t*(seed?104729:7919),err=ngSet1(k,by,sd);if(err){PLAN.g=g0;PLAN.o=o0;return err;}
    const sc=PLAN.g.reduce((x,g)=>x+(g.pc||1)-1,0);if(sc<bs){bs=sc;best=sd;}if(!sc)return "";}
  PLAN.g=g0;PLAN.o=o0;return ngSet1(k,by,best);}
/* which households would change Leader Neighbor if the proposal were fixed now */
function ngEffect(){const mv=[];for(const h of S.hh){const g=ngIx(ngOfH(h));if(!g||!g.ln||h.ln===g.ln)continue;mv.push([h,h.ln,g.ln]);}return mv;}
const lnMoves=mv=>mv.filter(m=>(IX.w[m[1]]||{}).role==="ln");
function effectTxt(all){const mv=lnMoves(all),fresh=all.length-mv.length,add=fresh?" "+fresh+" household"+(fresh===1?"":"s")+" not yet with a Leader Neighbor will join the Leader Neighbor of "+(fresh===1?"its":"their")+" group.":"";
  if(!mv.length)return "No household changes Leader Neighbor."+add;const c={};for(const m of mv){const k=m[1]+"|"+m[2];c[k]=(c[k]||0)+1;}
  const rows=Object.entries(c).sort((a,b)=>b[1]-a[1]),nm=id=>esc((IX.w[id]||{}).name||"?");
  return "<b>"+mv.length+" household"+(mv.length===1?"":"s")+" will move to a different Leader Neighbor</b>, with "+(mv.length===1?"its":"their")+" visit history and open referrals: "+rows.slice(0,8).map(([k,n])=>n+" from "+nm(k.split("|")[0])+" to "+nm(k.split("|")[1])).join("; ")+(rows.length>8?"; and "+(rows.length-8)+" more such moves":"")+"."+add;}
function ngMoveHh(h,lnId){if(h.ln===lnId)return;h.ln=lnId;PLAN.mv[h.id]=lnId;}
function ngFix(){const mv=ngEffect();for(const h of S.hh){const id=PLAN.asg[h.id];if(id&&h.ng!==id)h.ng=id;}for(const m of mv)ngMoveHh(m[0],m[2]);
  reown(mv.map(m=>m[0].id));PLAN.asg=null;PLAN.st="fixed";PLAN.fx.ng={t:Date.now(),by:me().name};
  if(PLAN.g.some(g=>!g.ca)&&PLAN.cst==="fixed")PLAN.cst="draft";
  ngLog("Fixed "+PLAN.g.length+" Neighbor Groups"+(lnMoves(mv).length?"; "+lnMoves(mv).length+" household"+(lnMoves(mv).length===1?"":"s")+" moved to a different Leader Neighbor":""));index();planSave();}

/* --- step 2: Care Group areas --- */
const ngLnts=()=>S.w.filter(w=>w.role==="lnt"&&w.active!==false).sort((a,b)=>(a.cg||0)-(b.cg||0));
function ngSuggest(){const T=ngLnts();if(!T.length)return;const us=PLAN.g.map(g=>({x:g.c[0],y:g.c[1],w:1,g}));let parts=null,bs=1e9;
  for(let t=0;t<40&&bs;t++){const ps=[];ngSplit(us,T.length,t?rng(t*7919):null,t?1.4:0,ps);let sc=0;
    for(const p of ps){if(p.length<2)continue;const ids=new Set(p.map(u=>u.g.id)),seen=new Set([p[0].g.id]),q=[p[0].g];while(q.length){for(const o of ngAdj(q.pop()))if(ids.has(o.id)&&!seen.has(o.id)){seen.add(o.id);q.push(o);}}sc+=p.length-seen.size;}
    if(sc<bs){bs=sc;parts=ps;}}
  // an area goes to the Trainer who already has most of its Leader Neighbors
  const pairs=[];parts.forEach((p,i)=>{const c={};for(const u of p){const t=u.g.ca||(IX.w[u.g.ln]||{}).lnt;if(t)c[t]=(c[t]||0)+1;}for(const t in c)pairs.push([c[t],i,t]);});
  pairs.sort((a,b)=>b[0]-a[0]);const got={},taken={};for(const [,i,t] of pairs){if(got[i]!=null||taken[t]||!T.some(w=>w.id===t))continue;got[i]=t;taken[t]=1;}
  const free=T.filter(w=>!taken[w.id]);parts.forEach((p,i)=>{if(got[i]==null)got[i]=free.shift().id;for(const u of p)u.g.ca=got[i];});
  const usedCol=new Set();for(const w of T){let a=PLAN.a[w.id];if(!a||usedCol.has(a.col)){let c=0;while(usedCol.has(c)&&c<NGCOL.length-1)c++;a=PLAN.a[w.id]={col:c};}usedCol.add(a.col);}
  PLAN.local=true;}
function ngJoined(lnt){const gs=PLAN.g.filter(g=>g.ca===lnt);if(gs.length<2)return true;const seen=new Set([gs[0].id]),q=[gs[0]];while(q.length){for(const o of ngAdj(q.pop()))if(o.ca===lnt&&!seen.has(o.id)){seen.add(o.id);q.push(o);}}return seen.size===gs.length;}
const ngEffectCa=()=>PLAN.g.filter(g=>g.ln&&IX.w[g.ln]&&g.ca&&IX.w[g.ln].lnt!==g.ca);
async function ngFixCa(){const ch=ngEffectCa();
  for(const g of ch){const w=IX.w[g.ln],t=IX.w[g.ca];
    if(live()){const r=await rpc("cmd_save_worker",{p_token:L.auth.token,p_worker:{id:w.id,lnt:t.id},p_pin:""});if(!r||!r.ok)throw {code:(r&&r.error)||"server"};}
    w.lnt=t.id;w.cg=t.cg;}
  PLAN.cst="fixed";PLAN.fx.ca={t:Date.now(),by:me().name};ngLog("Fixed the Care Group boundaries"+(ch.length?"; "+ch.length+" Leader Neighbor"+(ch.length===1?"":"s")+" moved to a different Care Group":""));index();if(live())await refreshWorkers();await planSave();}

/* --- step 3: Leader Neighbors --- */
const ngCands=(g,mem)=>(mem.get(g.id)||{hs:[]}).hs.flatMap(h=>(IX.hhP[h.id]||[]).filter(p=>alive(p)&&p.age>=35)).sort((a,b)=>a.name<b.name?-1:1);
function ngFlags(g){const f=[];if(!g.ln){f.push(["Not yet chosen","warn"]);return f;}
  const p=IX.p[g.pid];if(p&&IX.hh[p.hh]&&IX.hh[p.hh].ng!==g.id)f.push(["Now lives outside this group","warn"]);
  if(g.sex==="M"&&!ngAdj(g).some(o=>o.ln&&o.sex==="F"))f.push(["No woman Leader Neighbor in a neighbouring group","bad"]);return f;}
async function ngSetLn(g,pid,code,pin){const p=IX.p[pid],t=IX.w[g.ca];if(!p||!t)return "Choose a person.";let w=IX.w[g.ln];
  if(live()){if(g.pid===pid)return "";const r=await rpc("cmd_save_worker",{p_token:L.auth.token,p_worker:{role:"ln",name:p.name,code,lnt:t.id},p_pin:pin});
    if(!r||!r.ok)return errText((r&&r.error)||"server");await refreshWorkers();w=IX.w[r.worker.id]||r.worker;}
  else if(w){w.name=p.name;w.lnt=t.id;w.cg=t.cg;}
  else{w={id:"l"+(S.w.filter(x=>x.role==="ln").reduce((m,x)=>Math.max(m,+x.id.slice(1)||0),0)+1),role:"ln",name:p.name,lnt:t.id,cg:t.cg,q:.8};S.w.push(w);}
  const was=g.name;g.ln=w.id;g.pid=pid;g.name=p.name;g.sex=p.sex;index();
  const moved=[];for(const h of S.hh)if(h.ng===g.id&&h.ln!==w.id&&!(h.pend&&h.pend.st==="no")){ngMoveHh(h,w.id);moved.push(h.id);}
  reown(moved);index();ngLog("Neighbor Group "+g.no+": Leader Neighbor "+p.name+(was&&was!==p.name?" (in place of "+was+")":""));if(!live()&&typeof roleSel==="function")roleSel();await planSave();return "";}

/* --- keeping the plan: on the server in live mode, and on this tablet --- */
async function planSave(){PLAN.v=Date.now();PLAN.local=false;if(typeof live!=="function"||!live())return;IDB.set("plan",planBody());
  try{const r=await rpc("cmd_plan_set",{p_token:L.auth.token,p_body:planBody(),p_note:(PLAN.log[PLAN.log.length-1]||{}).what||""});if(!r||!r.ok)UI.note=["The groups are saved on this tablet but did not reach the server ("+((r&&r.error)||"no answer")+").","bad"];}
  catch(e){UI.note=[e.code==="offline"?"The groups are saved on this tablet. They will not reach the other tablets until you press Send again with a connection.":"The server could not store the groups. Has update-0.31.sql been run in Supabase?","bad"];PLAN.unsent=true;}
  syncSoon();}
async function planSync(){if(!live()||!L.auth||!L.auth.token||PLAN.local||PLAN.st==="draft"||PLAN.cst==="draft"&&me().role==="admin")return;let info;
  try{info=await rpc("cmd_plan_info",{p_token:L.auth.token});}catch(e){return;}
  if(!info||!info.v||+info.v===PLAN.v)return;
  try{const b=await rpc("cmd_plan_get",{p_token:L.auth.token});if(b&&b.g){planApply(b);IDB.set("plan",planBody());planTidy();}}catch(e){}}
/* a Leader Neighbor's tablet lets go of households that the Administrator has moved to someone else */
function planTidy(){const w=me();if(!w||w.role!=="ln")return;const gone=new Set(S.hh.filter(h=>h.ln===w.id&&PLAN.mv[h.id]&&PLAN.mv[h.id]!==w.id&&!L.dirty[rk("hh",h.id)]).map(h=>h.id));if(!gone.size)return;
  const ps=new Set(S.p.filter(p=>gone.has(p.hh)).map(p=>p.id)),drop=(ty,f)=>{for(let i=S[ty].length-1;i>=0;i--)if(f(S[ty][i])&&!L.dirty[rk(ty,S[ty][i].id)]){SNAP.delete(rk(ty,S[ty][i].id));delete L.meta[rk(ty,S[ty][i].id)];S[ty].splice(i,1);}};
  drop("hh",h=>gone.has(h.id));drop("p",p=>gone.has(p.hh));for(const ty of ["v","ref","ev","hv"])drop(ty,r=>ps.has(r.p)||gone.has(r.hh));index();store();}
/* after a household changes Leader Neighbor, its people, visits and referrals are sent again so that the server files them under the new one */
function reown(hids){if(typeof live!=="function"||!live()||!hids.length)return;const H=new Set(hids),now=Date.now();
  for(const ty of ["hh","p","v","ref","ev","hv"])for(const r of S[ty]){const hid=ty==="hh"?r.id:ty==="p"?r.hh:((IX.p[r.p]||{}).hh||r.hh);if(H.has(hid)){const k=rk(ty,r.id);L.dirty[k]=1;L.meta[k]=now;}}}

/* --- drawing on a map --- */
const hexA=(h,a)=>"rgba("+parseInt(h.slice(1,3),16)+","+parseInt(h.slice(3,5),16)+","+parseInt(h.slice(5,7),16)+","+a+")";
function ngOverlay(){const w=me();if(!w||!PLAN.o||!PLAN.g.length)return null;const r=w.role;
  if(mapFull(r))return ngOn()?{g:PLAN.g}:null;if(!ngOn())return null;
  if(r==="lnt"){const g=PLAN.g.filter(x=>x.ca===w.id&&(UI.area==="all"||x.ln===UI.area));return g.length?{g,own:UI.area!=="all"}:null;}
  if(r==="ln"){const g=PLAN.g.filter(x=>x.ln===w.id);return g.length?{g,own:true}:null;}return null;}
function ngDraw(c,X,Y,k,M,ov,W,H,labels){const ox=(PLAN.o[1]-M.bbox[1])*1e5,oy=(PLAN.o[0]-M.bbox[0])*1e5,FT="system-ui,sans-serif";
  const path=g=>{c.beginPath();for(const r of g.ring){for(let i=0;i<r.length;i+=2){const x=X(r[i]+ox),y=Y(r[i+1]+oy);i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}};
  const text=(t,x,y,font,col)=>{c.font=font;c.textAlign="center";c.textBaseline="middle";c.lineWidth=4;c.lineJoin="round";c.strokeStyle="rgba(255,255,255,.92)";c.strokeText(t,x,y);c.fillStyle=col;c.fillText(t,x,y);c.textAlign="left";c.textBaseline="alphabetic";};
  if(labels){if(k>=.5||ov.own||!PLAN.g.some(g=>g.ca))for(const g of ov.g){const x=X(g.c[0]+ox),y=Y(g.c[1]+oy);if(x<-40||x>W+40||y<-20||y>H+20)continue;
      text((k>=2.2?"Neighbor Group ":k>=.3?"NG ":"")+g.no,x,y-(k>=1.3&&g.name?8:0),"700 "+(k>=.3?12:10)+"px "+FT,"#1b1b1b");if(k>=1.3&&g.name)text(g.name,x,y+7,"600 11px "+FT,"#333");}
    else if(k>=.1){const A={};for(const g of ov.g){if(!g.ca)continue;const a=A[g.ca]=A[g.ca]||[0,0,0];a[0]+=g.c[0];a[1]+=g.c[1];a[2]++;}
      for(const id in A){const a=A[id],t=IX.w[id];text("Care Group "+((t&&t.cg)||""),X(a[0]/a[2]+ox),Y(a[1]/a[2]+oy),"800 15px "+FT,NGCOL[PLAN.a[id].col%NGCOL.length][0]);}}
    return;}
  for(const g of ov.g){const col=ngColOf(g),sel=ov.sel&&ov.sel.has(g.id);path(g);
    c.fillStyle=sel?"rgba(20,20,20,.34)":col?hexA(col,ov.own?.07:.13):"hsla("+(g.no*67%360)+",65%,50%,.16)";c.fill("evenodd");}
  if(k>=.16){c.lineWidth=1;c.strokeStyle="rgba(30,30,30,.6)";c.setLineDash([5,3]);for(const g of ov.g){path(g);c.stroke();}c.setLineDash([]);}
  // the edge of each Care Group area, drawn just inside the area in its own colour
  c.lineCap="round";for(const g of ov.g){const col=ngColOf(g);if(!col&&!ov.own)continue;c.strokeStyle=col||"#333";c.lineWidth=k<.3?2.5:3.5;c.beginPath();
    g.ring.forEach((r,ri)=>{const nb=g.nb[ri],n=r.length/2;for(let i=0;i<n;i++){const o=nb[i]>=0?PLAN.g[nb[i]]:null;if(!ov.own&&o&&o.ca===g.ca)continue;
      const j=(i+1)%n,x1=r[2*i],y1=r[2*i+1],x2=r[2*j],y2=r[2*j+1],dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy)||1,nx=-dy/d*2,ny=dx/d*2;
      c.moveTo(X(x1+ox)+nx,Y(y1+oy)-ny);c.lineTo(X(x2+ox)+nx,Y(y2+oy)-ny);}});c.stroke();}}
function ngLegend(){if(!ngOn()||!mapFull(me().role))return"";const T=ngLnts().filter(t=>PLAN.a[t.id]&&PLAN.g.some(g=>g.ca===t.id));if(!T.length)return '<p class="small muted">The dashed outlines are the Neighbor Groups.</p>';
  return '<div class="row">'+T.map(t=>'<span class="lg"><i style="background:'+NGCOL[PLAN.a[t.id].col%NGCOL.length][0]+'"></i>Care Group '+t.cg+": "+esc(t.name)+"</span>").join("")+'</div><p class="small muted">Each coloured boundary is one Care Group area, served by one Trainer. The dashed outlines inside it are its Neighbor Groups; zoom in for their numbers.</p>';}

/* --- the Administrator's page --- */
function ngStatTxt(mem){const a=PLAN.g.map(g=>mem.get(g.id).a),h=PLAN.g.map(g=>mem.get(g.id).hs.length);if(!a.length)return"";
  return "<p>"+PLAN.g.length+" Neighbor Groups. Adults aged 35 or older in a group: "+Math.min(...a)+" to "+Math.max(...a)+" (mean "+mean(a).toFixed(1)+"). Households in a group: "+Math.min(...h)+" to "+Math.max(...h)+" (mean "+mean(h).toFixed(1)+").</p>";}
function vNG(){const U=UI.ng=UI.ng||{sel:new Set(),col:0},adm=me().role==="admin";let o="<h1>Neighbor Groups and Care Group areas</h1><p class='muted'>A Neighbor Group is the set of neighbouring households that one Leader Neighbor visits. A Care Group area is the set of Neighbor Groups served by one Leader Neighbor Trainer.</p>";
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+UI.note[0]+"</div>";UI.note=null;}
  if(!MAPS.cur){if(MAPS.err)return o+'<div class="note bad">The map could not be loaded. Connect to the internet once and open this page again.</div>';mapLoad(()=>{if(UI.tab==="ngs"&&!UI.mode)render();});return o+'<div class="note">Loading the map…</div>';}
  const hs=ngHhs(),noLoc=S.hh.filter(h=>h.cen&&h.cen.st==="done"&&!h.cen.gps).length,mem=ngMem(),lnN=S.w.filter(w=>w.role==="ln"&&w.active!==false).length,T=ngLnts();
  const when=f=>f?" on "+fmtD(iso(new Date(f.t)))+" by "+esc(f.by):"";
  const unlock=what=>U.unlock===what?'<div class="q"><label class="t" for="ng_pw">'+(live()?"Enter your sign-in PIN to make changes":"Enter the password to make changes (in example mode, type: example)")+'</label><div class="row"><input id="ng_pw" type="password" autocomplete="off" style="width:200px"><button class="pri" data-act="ngunlock" data-v="'+what+'">Unlock</button><button data-act="ngcancelpw">Cancel</button></div>'+(U.msg?'<p class="small" style="color:var(--bad,#b3261e)">'+esc(U.msg)+"</p>":"")+"</div>":'<div class="row"><button data-act="ngaskpw" data-v="'+what+'">'+(what==="ng"?"Change the Neighbor Groups":"Change the Care Group boundaries")+"</button></div>";
  o+=mapBox("ngmap","58vh")+ngLegend()+'<div id="nginfo">'+ngInfo(U,mem)+"</div>";
  // 1
  o+='<div class="card"><h3>1. Neighbor Groups '+chip(PLAN.st==="fixed"?["Fixed","good"]:PLAN.st==="draft"?["Proposed, not yet fixed","warn"]:["Not yet set",""])+"</h3>";
  if(PLAN.st==="fixed")o+=ngStatTxt(mem)+"<p class='small muted'>Fixed"+when(PLAN.fx.ng)+". They stay as they are until the Administrator changes them.</p>"+(adm?unlock("ng"):"");
  else if(!adm)o+="<p class='muted'>The Administrator has not fixed the Neighbor Groups yet.</p>";
  else{o+="<p class='small'>"+hs.length+" households have a census location."+(noLoc?" "+noLoc+" were recorded without one and are placed by hand after the groups are fixed.":"")+" The app puts neighbouring households together so that each group has about the same number of adults aged 35 or older.</p>"+
      '<div class="row"><label>Number of Neighbor Groups <input id="ng_n" type="number" min="1" max="400" inputmode="numeric" style="width:90px" value="'+(PLAN.n||lnN||Math.max(1,Math.round(hs.length/26)))+'"></label><label>Balance by <select id="ng_by"><option value="adults"'+(PLAN.by!=="hh"?" selected":"")+'>adults aged 35 or older</option><option value="hh"'+(PLAN.by==="hh"?" selected":"")+'>households</option></select></label><button class="'+(PLAN.st==="none"?"pri":"")+'" data-act="ngset">'+(PLAN.st==="none"?"Set Neighbor Groups":"Set Neighbor Groups again (reshuffle)")+"</button></div>";
    if(PLAN.st==="draft")o+=ngStatTxt(mem)+(PLAN.g.some(g=>g.pc>1)?"<div class='note warn'>"+PLAN.g.filter(g=>g.pc>1).map(g=>"Neighbor Group "+g.no+" is in "+g.pc+" separate pieces.").join(" ")+" Zoom in, touch the stray households and move them to the group around them, or press the button again for another proposal.</div>":"")+"<p class='small'>Each press gives a different proposal. To move one household to the group next door, touch its square on the map.</p><div class='note'>"+effectTxt(ngEffect())+"</div>"+
      '<div class="row"><button class="pri" data-act="ngfix">Fix Neighbor Groups</button>'+(U.snap?'<button data-act="ngrevert">Cancel the changes</button>':"")+"</div><p class='small muted'>A proposal stays on this tablet. The other tablets see the groups only after they are fixed.</p>";}
  o+="</div>";
  // 2
  o+='<div class="card"><h3>2. Care Group areas '+chip(PLAN.cst==="fixed"?["Fixed","good"]:PLAN.g.some(g=>g.ca)?["Proposed, not yet fixed","warn"]:["Not yet set",""])+"</h3>";
  const areaTbl=()=>tbl(["Colour","Care Group","Trainer","#Neighbor Groups","#Adults 35 or older","#Households","Joined up"],T.map(t=>{const gs=PLAN.g.filter(g=>g.ca===t.id),a=PLAN.a[t.id];return "<tr><td>"+(a&&gs.length?'<span class="lg"><i style="background:'+NGCOL[a.col%NGCOL.length][0]+'"></i>'+NGCOL[a.col%NGCOL.length][1]+"</span>":"")+"</td><td>"+t.cg+"</td><td>"+esc(t.name)+"</td><td class='n'>"+gs.length+"</td><td class='n'>"+gs.reduce((s,g)=>s+mem.get(g.id).a,0)+"</td><td class='n'>"+gs.reduce((s,g)=>s+mem.get(g.id).hs.length,0)+"</td><td>"+(gs.length?ngJoined(t.id)?"Yes":'<span class="chip warn">No: in separate pieces</span>':"")+"</td></tr>";}));
  if(PLAN.st!=="fixed")o+="<p class='muted'>Fix the Neighbor Groups first.</p>";
  else if(!T.length)o+="<p class='muted'>Add the Leader Neighbor Trainers on the Workers page first. Each Trainer serves one Care Group area.</p>";
  else if(PLAN.cst==="fixed")o+=areaTbl()+"<p class='small muted'>Fixed"+when(PLAN.fx.ca)+".</p>"+(adm?unlock("ca"):"");
  else if(!adm)o+=areaTbl();
  else{const n=PLAN.g.length,k=T.length,base=Math.floor(n/k),rem=n%k,un=PLAN.g.filter(g=>!g.ca).length,sel=PLAN.g.filter(g=>U.sel.has(g.id)),ch=ngEffectCa();
    o+="<p class='small'>With "+n+" Neighbor Groups and "+k+" Trainer"+(k===1?"":"s")+", "+(rem?rem+" area"+(rem===1?" has ":"s have ")+(base+1)+" groups and "+(k-rem)+(k-rem===1?" has ":" have ")+base:"each area has "+base+" groups")+".</p>"+
      '<div class="row"><button class="'+(un===n?"pri":"")+'" data-act="ngsuggest">Suggest areas</button></div><p class="small">Or build an area by hand: touch Neighbor Groups on the map to select them, choose the Trainer and a boundary colour, and press Assign LNT.</p>'+
      "<p><b>Selected:</b> "+(sel.length?sel.length+" (Neighbor Group "+sel.map(g=>g.no).join(", ")+")":"none")+"</p>"+
      '<div class="row"><label>Trainer <select id="ng_lnt">'+T.map(t=>'<option value="'+t.id+'"'+(U.lnt===t.id?" selected":"")+">Care Group "+t.cg+" · "+esc(t.name)+" ("+PLAN.g.filter(g=>g.ca===t.id).length+" groups now)</option>").join("")+"</select></label></div>"+
      '<div class="row" role="group" aria-label="Boundary colour">'+NGCOL.map((c,i)=>'<button class="sw'+(U.col===i?" on":"")+'" data-act="ngcol" data-v="'+i+'" style="--c:'+c[0]+'" aria-label="'+c[1]+'" title="'+c[1]+'"></button>').join("")+'</div><div class="row"><button class="'+(sel.length?"pri":"")+'" data-act="ngassign"'+(sel.length?"":" disabled")+'>Assign LNT</button><button data-act="ngclear"'+(sel.length?"":" disabled")+">Clear the selection</button></div>"+areaTbl()+
      (un?"<p class='small'>"+un+" Neighbor Group"+(un===1?" is":"s are")+" not yet in an area.</p>":"")+
      (ch.length?"<div class='note'><b>"+ch.length+" Leader Neighbor"+(ch.length===1?"":"s")+" will move to a different Care Group</b>, with "+(ch.length===1?"her or his":"their")+" households: "+ch.slice(0,8).map(g=>esc(g.name)+" (Neighbor Group "+g.no+") from Care Group "+IX.w[g.ln].cg+" to "+IX.w[g.ca].cg).join("; ")+(ch.length>8?"; and "+(ch.length-8)+" more":"")+".</div>":"<div class='note'>No Leader Neighbor changes Care Group.</div>")+
      '<div class="row"><button class="pri" data-act="ngfixca"'+(un?" disabled":"")+">Fix Care Group Boundaries</button>"+(U.snap?'<button data-act="ngrevert">Cancel the changes</button>':"")+"</div>";}
  o+="</div>";
  // 3
  o+='<div class="card"><h3>3. Leader Neighbors</h3>';
  if(PLAN.st!=="fixed"||PLAN.cst!=="fixed")o+="<p class='muted'>Fix the Care Group boundaries first.</p>";
  else{const f=PLAN.g.filter(g=>g.ln&&g.sex==="F").length,m=PLAN.g.filter(g=>g.ln&&g.sex==="M").length,none=PLAN.g.filter(g=>!g.ln).length;
    o+="<p>The members of each Neighbor Group choose their Leader Neighbor from the adults aged 35 or older who live in the group. The person chosen does not need to have high blood pressure or diabetes. Record the choice here.</p>"+
      "<div class='note warn'><b>Waist measurement.</b> A woman's waist should be measured by a woman. When a Neighbor Group chooses a man, check that a neighbouring group has a woman Leader Neighbor who can measure waists for him. If the Leader Neighbors in an area are all men, this cannot be done. Encourage a balance of women and men.</div>"+
      "<p><b>"+f+" women and "+m+" men chosen"+(none?"; "+none+" group"+(none===1?"":"s")+" still to choose":"")+".</b></p>"+
      tbl(["Neighbor Group","Care Group","#Households","#Adults 35 or older","Leader Neighbor","",""],PLAN.g.map(g=>{const e=mem.get(g.id),t=IX.w[g.ca]||{};return "<tr"+(U.open===g.id?' style="background:#eef4fa"':"")+"><td>"+g.no+"</td><td>"+(t.cg||"")+"</td><td class='n'>"+e.hs.length+"</td><td class='n'>"+e.a+"</td><td>"+(g.ln?esc(g.name)+" <span class='muted small'>("+sexW(g.sex)+")</span>":"")+"</td><td>"+ngFlags(g).map(chip).join(" ")+"</td><td>"+(adm?'<button data-act="ngopen" data-id="'+g.id+'">'+(g.ln?"Change":"Choose")+"</button>":"")+"</td></tr>";}));}
  o+="</div>";
  // households waiting
  const wait=S.hh.filter(h=>(h.pend&&h.pend.adm&&h.pend.st!=="no")||(ngOn()&&h.cen&&h.cen.st==="done"&&!h.ng&&!h.pend&&!exDemo(h)));
  if(adm&&ngOn()&&wait.length){const opts=PLAN.g.filter(g=>g.ln).map(g=>'<option value="'+g.id+'">Neighbor Group '+g.no+" · "+esc(g.name)+"</option>").join("");
    o+='<div class="card"><h3>Households waiting to be placed in a Neighbor Group ('+wait.length+")</h3><p class='small muted'>These were recorded without a usable location, or at a spot outside every group, or for a group in another Trainer's area.</p>"+
      wait.slice(0,40).map(h=>{const near=h.pend&&h.pend.ng?ngIx(h.pend.ng):h.cen&&h.cen.gps?ngAtLL(h.cen.gps.lat,h.cen.gps.lon):null;return '<div class="row" style="border-top:1px solid var(--line);padding-top:8px"><span class="grow"><b>'+esc(h.head)+"</b> <span class='muted small'>"+esc(h.no)+(h.cen&&h.cen.lm?" · "+esc(h.cen.lm):"")+(h.cen&&!h.cen.gps?" · no location":"")+"</span></span><select id='ngw_"+h.id+"'>"+(opts||"<option value=''>Choose the Leader Neighbors first</option>").replace('value="'+(near?near.id:"-")+'"','value="'+(near?near.id:"-")+'" selected')+'</select><button data-act="ngplace" data-id="'+h.id+'">Place</button></div>';}).join("")+"</div>";}
  if(PLAN.log.length)o+='<div class="card"><h3>Changes made</h3>'+PLAN.log.slice(-8).reverse().map(l=>"<p class='small'>"+fmtD(iso(new Date(l.t)))+", "+esc(l.by)+": "+esc(l.what)+".</p>").join("")+"</div>";
  const items=S.hh.filter(h=>h.cen&&h.cen.st==="done"&&h.cen.gps&&!(h.pend&&h.pend.st==="no")).map(h=>({id:h.id,lat:h.cen.gps.lat,lon:h.cen.gps.lon,fill:h.id===U.hh?"#111":"#fff"}));
  const grouped=items.filter(i=>ngIx(ngOfH(IX.hh[i.id])));
  setTimeout(()=>{mapMount("ngmap",MAPS.cur,items,ngPick,false,grouped.length?grouped:null);const st=MV.ngmap;if(st){st.ov=PLAN.g.length&&PLAN.o?{g:PLAN.g,sel:U.sel}:null;st.small=true;const cv=document.getElementById("ngmap");if(cv)mapDraw(cv,MAPS.cur,items,st.sel);}},0);
  return o;}
/* the card under the map: a household to move (while the groups are a proposal), or a Neighbor Group and its Leader Neighbor */
function ngInfo(U,mem){const adm=me().role==="admin";
  if(U.hh&&PLAN.st==="draft"&&adm){const h=IX.hh[U.hh],g=ngIx(ngOfH(h));if(!h||!g)return"";const near=ngAdj(g),adj=near.concat(PLAN.g.filter(x=>x!==g&&!near.includes(x)));   // the neighbouring groups first
    return '<div class="card"><h2>'+esc(h.head)+' <span class="muted small">'+esc(h.no)+"</span></h2><p>Now in Neighbor Group "+g.no+". "+n35(h)+" adult"+(n35(h)===1?"":"s")+" aged 35 or older.</p>"+(adj.length?'<div class="row"><label>Move to <select id="ng_to">'+adj.map(a=>'<option value="'+a.id+'">Neighbor Group '+a.no+" ("+mem.get(a.id).a+" adults 35 or older)</option>").join("")+'</select></label><button data-act="ngmove">Move</button></div>':"")+"</div>";}
  const g=U.open&&ngIx(U.open);if(!g)return"";const e=mem.get(g.id),t=IX.w[g.ca],both=PLAN.st==="fixed"&&PLAN.cst==="fixed";
  let o='<div class="card"><h2>Neighbor Group '+g.no+"</h2><p>"+e.hs.length+" households, "+e.a+" adults aged 35 or older."+(t?" Care Group "+t.cg+", Trainer "+esc(t.name)+".":"")+(g.ln?" Leader Neighbor: <b>"+esc(g.name)+"</b> ("+sexW(g.sex)+").":"")+"</p>"+ngFlags(g).map(chip).join(" ");
  if(adm&&both){const cs=ngCands(g,mem);
    o+='<div class="q"><label class="t" for="ng_ln">'+(g.ln?"Record a different Leader Neighbor":"Leader Neighbor chosen by the group")+'</label><select id="ng_ln" style="width:100%"><option value="">Choose from the '+cs.length+" adults aged 35 or older in this group</option>"+cs.map(p=>'<option value="'+p.id+'"'+(p.id===g.pid?" selected":"")+">"+esc(p.name)+", "+sexW(p.sex)+", "+p.age+"</option>").join("")+"</select></div>"+
      (live()?'<div class="row"><input id="ng_code" placeholder="Sign-in name" autocapitalize="none" style="width:170px"><input id="ng_pin" placeholder="PIN (6+ digits)" inputmode="numeric" style="width:150px"></div><p class="small muted">The sign-in name and PIN are what this Leader Neighbor types on the tablet.'+(g.ln?" Recording a different person makes a new sign-in; remove the earlier one on the Workers page.":"")+"</p>":"")+
      (U.msg?'<div class="note bad">'+esc(U.msg)+"</div>":"")+'<div class="row"><button class="pri" data-act="ngsaveln" data-id="'+g.id+'">Save the Leader Neighbor</button><button data-act="ngclose">Close</button></div>';}
  return o+"</div>";}
function ngPick(hid,pt){const U=UI.ng,M=MAPS.cur;if(!U||!M)return;U.msg="";
  const g=pt&&PLAN.o?ngAt(pt[0]-(PLAN.o[1]-M.bbox[1])*1e5,pt[1]-(PLAN.o[0]-M.bbox[0])*1e5):null,adm=me().role==="admin";
  if(PLAN.st==="draft"&&adm){U.hh=hid||null;U.open=null;}
  else if(PLAN.st==="fixed"&&PLAN.cst!=="fixed"&&adm&&g){U.sel.has(g.id)?U.sel.delete(g.id):U.sel.add(g.id);const t=g.ca&&U.sel.size===1&&U.sel.has(g.id)?g.ca:null;if(t){U.lnt=t;U.col=PLAN.a[t]?PLAN.a[t].col:U.col;}}
  else U.open=g?g.id:null;
  if(MV.ngmap)MV.ngmap.sel=null;UI.keep=true;render();}

/* --- adding a household after the census (Leader Neighbor or Trainer) --- */
function ahTarget(A){const w=me(),g=A.gps?ngAtLL(A.gps.lat,A.gps.lon):null;
  if(!ngOn()||!PLAN.g.some(x=>x.ln))return {k:"free"};
  if(!A.gps)return {k:"noloc"};
  if(!g)return {k:"out"};
  if(!g.ln)return {k:"nolead",g};
  if(w.role==="ln")return g.ln===w.id?{k:"mine",g}:{k:"other",g};
  return g.ca===w.id?{k:"mine",g}:{k:"otherarea",g};}
function vAddHh(){const w=me(),A=UI.AH=UI.AH||{head:"",sex:"F",age:"",nhis:"",lm:"",ln:"",gps:null,gpsMsg:""},lns=w.role==="ln"?[w]:S.w.filter(x=>x.role==="ln"&&x.lnt===w.id&&x.active!==false);
  if(!lns.length)return '<button class="link" data-act="back">‹ Back</button><div class="card"><p>This Care Group has no Leader Neighbors yet. The Administrator records them on the Neighbor Groups page.</p></div>';
  const t=ahTarget(A),lead=g=>"Neighbor Group "+g.no+(g.ln?" (Leader Neighbor: "+esc(g.name)+")":"");
  let where="";
  if(t.k==="mine")where='<div class="note good">This spot is in '+lead(t.g)+"."+(w.role==="ln"?" The household joins your group once your Trainer confirms it.":"")+"</div>";
  else if(t.k==="other")where='<div class="note warn">This spot is in '+lead(t.g)+", not in your group. Save it anyway: it is sent to your Trainer, who "+(t.g.ca===w.lnt?"passes it to that Leader Neighbor":"sends it to the Administrator, because that group is in another Trainer's area")+".</div>";
  else if(t.k==="otherarea")where='<div class="note warn">This spot is in '+lead(t.g)+", in another Trainer's Care Group area. Save it anyway: it is sent to the Administrator to place.</div>";
  else if(t.k==="nolead")where='<div class="note warn">This spot is in Neighbor Group '+t.g.no+", which has no Leader Neighbor yet. Save it anyway: it is sent to the Administrator to place.</div>";
  else if(t.k==="out")where='<div class="note warn">This spot is outside every Neighbor Group. Check the location. If it is right, save it: it is sent to the Administrator to place.</div>';
  const pickLn=t.k==="free"||(t.k==="noloc"&&w.role==="lnt");
  let o='<button class="link" data-act="back">‹ Back</button><h1>Add a household</h1><div class="card"><div class="q"><label class="t" for="ah_head">Head of household: name</label><input id="ah_head" data-ah="head" value="'+esc(A.head)+'" style="width:100%"></div>'+
    '<div class="row"><div class="q grow"><label class="t" for="ah_sex">Sex</label><select id="ah_sex" data-ah="sex"><option value="F"'+(A.sex==="F"?" selected":"")+'>Woman</option><option value="M"'+(A.sex==="M"?" selected":"")+'>Man</option></select></div><div class="q grow"><label class="t" for="ah_age">Age in years</label><input id="ah_age" data-ah="age" type="number" min="18" max="110" inputmode="numeric" value="'+esc(A.age)+'"></div></div><p class="small muted">The head of household is added as the first adult. Add the other adults on the next screen.</p>'+
    '<div class="q"><label class="t" for="ah_nhis">National Health Insurance (NHIS) active?</label><select id="ah_nhis" data-ah="nhis"><option value="">Not known</option><option value="y"'+(A.nhis==="y"?" selected":"")+'>Yes</option><option value="n"'+(A.nhis==="n"?" selected":"")+">No</option></select></div></div>";
  o+='<div class="card"><h3>Where the house is</h3><p class="small">Stand at the door and record the location. The app then finds the Neighbor Group that the house belongs to.</p>'+gpsHtml(A).replace('data-act="czgps"','data-act="ahgps"')+
    (A.gps&&A.gps.map?'<p><span class="chip info">Location set by touching the map</span></p>':"");
  if(MAPS.cur){o+='<p class="small">If the tablet cannot find the location, touch the map at the house instead.</p>'+mapBox("ahmap","300px");
    const its=S.hh.filter(h=>scope().has(h.ln)&&h.cen&&h.cen.gps).map(h=>({id:h.id,lat:h.cen.gps.lat,lon:h.cen.gps.lon,fill:"#fff"}));if(A.gps)its.push({id:"new",lat:A.gps.lat,lon:A.gps.lon,fill:"#111"});
    setTimeout(()=>{mapMount("ahmap",MAPS.cur,its,(id,pt)=>{if(!pt)return;const M=MAPS.cur;A.gps={lat:+(M.bbox[0]+pt[1]/1e5).toFixed(6),lon:+(M.bbox[1]+pt[0]/1e5).toFixed(6),acc:10,t:Date.now(),map:true};A.gpsMsg="";UI.keep=true;render();});if(MV.ahmap)MV.ahmap.ov=ngOverlay();},0);}
  else if(!MAPS.err){mapLoad(()=>{if(UI.mode==="addhh")render();});}
  o+=where+'<div class="q"><label class="t" for="ah_lm">How to find the house (a landmark, the colour of the gate, whose compound)</label><input id="ah_lm" data-ah="lm" value="'+esc(A.lm)+'" style="width:100%"></div>'+
    (pickLn&&(lns.length>1||w.role!=="ln")?'<div class="q"><label class="t" for="ah_ln">Leader Neighbor</label><select id="ah_ln" data-ah="ln">'+lns.map(l=>'<option value="'+l.id+'"'+(A.ln===l.id?" selected":"")+">"+esc(l.name)+"</option>").join("")+"</select></div>":"")+
    (t.k==="noloc"&&w.role==="ln"?'<p class="small muted">Without a location the household is sent to your Trainer to confirm.</p>':"")+
    (A.msg?'<div class="note bad">'+esc(A.msg)+"</div>":"")+'<div class="row"><button class="pri" data-act="savehh">Save and add the adults</button></div></div>';
  return o;}
function saveHh(){const A=UI.AH,w=me(),head=(A.head||"").trim(),age=+A.age;A.msg=!head?"Enter the name of the head of household.":!(age>=18&&age<=110)?"Enter the age of the head of household (18 or older).":"";if(A.msg){UI.keep=true;return render();}
  const t=ahTarget(A),lns=w.role==="ln"?[w]:S.w.filter(x=>x.role==="ln"&&x.lnt===w.id&&x.active!==false);let ln=w.id,ng=null,pend=null;const by={by:w.id,d:TODAY};
  if(t.k==="free"||t.k==="noloc"){ln=w.role==="ln"?w.id:(A.ln||lns[0].id);const g=PLAN.g.find(x=>x.ln===ln);ng=ngOn()&&g?g.id:null;if(w.role==="ln"&&ngOn())pend=by;}
  else if(t.k==="mine"){ln=t.g.ln;ng=t.g.id;if(w.role==="ln")pend=by;}
  else if(t.k==="other")pend=Object.assign(by,{ng:t.g.id,to:t.g.ln});
  else pend=Object.assign(by,{adm:true,ng:t.g?t.g.id:null});
  const own=IX.w[ln]||w,h={id:uid("h"),ln,no:"CG"+(own.cg||"")+"-"+Math.random().toString(36).slice(2,6).toUpperCase(),head,nhis:A.nhis==="y",topics:[],reg:TODAY};
  if(ng)h.ng=ng;if(pend)h.pend=pend;if(A.gps||A.lm)h.cen={st:"done",d:TODAY,by:w.id,gps:A.gps?{lat:A.gps.lat,lon:A.gps.lon,acc:A.gps.acc,t:A.gps.t}:null,lm:A.lm.trim(),add:true,tries:1};
  S.hh.push(h);S.p.push({id:uid("p"),hh:h.id,name:head,sex:A.sex,age,bp:[],glu:[],htn:{},dm:{},meds:[]});index();UI.AH=null;
  UI.note=[pend&&pend.adm?"Saved. This household has been sent to the Administrator to place in a Neighbor Group.":pend&&pend.to?"Saved. This household has been sent to your Trainer, to pass on to "+((IX.w[pend.to]||{}).name||"the Leader Neighbor of that group")+".":pend?"Saved. Your Trainer will confirm this household.":"Saved."];
  if(scope().has(h.ln)&&!(pend&&(pend.adm||pend.to))){UI.hh=h.id;UI.mode="hh";}else{UI.mode=null;}render();}
/* what a household that is still waiting shows */
function hhPend(h){const p=h.pend;if(!p||p.st==="no")return"";const g=p.ng&&ngIx(p.ng);
  return '<div class="note warn">'+(p.adm?"New household, waiting for the Administrator to place it in a Neighbor Group.":p.to?"New household, waiting for the Trainer to pass it to "+(g?"Neighbor Group "+g.no+" ("+esc(g.name)+")":"another Leader Neighbor")+".":"New household, waiting for the Trainer to confirm it.")+"</div>";}
/* the Trainer's list of new households to confirm */
function pendCard(){const w=me();if(w.role!=="lnt")return"";const ids=new Set(lnsOf(w)),hs=S.hh.filter(h=>h.pend&&!h.pend.adm&&h.pend.st!=="no"&&ids.has(h.ln));if(!hs.length)return"";
  return '<div class="card"><h3>New households to confirm ('+hs.length+")</h3><p class='small muted'>A Leader Neighbor added these. Check that each is a real household in the place shown, then confirm it.</p>"+hs.map(h=>{const p=h.pend,g=p.ng&&ngIx(p.ng),mine=g&&g.ca===w.id;
    return '<div style="border-top:1px solid var(--line);padding:8px 0"><p><b>'+esc(h.head)+"</b> <span class='muted small'>"+esc(h.no)+"</span><br><span class='small'>Added by "+esc((IX.w[p.by]||{}).name||"")+" on "+fmtD(p.d)+"."+(h.cen&&h.cen.lm?" "+esc(h.cen.lm)+".":"")+(h.cen&&h.cen.gps?"":" No location recorded.")+(p.to?" The location is in Neighbor Group "+(g?g.no+" ("+esc(g.name)+")":"")+(mine?"":", in another Trainer's area")+".":"")+'</span></p><div class="row">'+
      (p.to?'<button class="pri" data-act="pendok" data-id="'+h.id+'">'+(mine?"Confirm and pass to "+esc(g.name):"Confirm and send to the Administrator")+'</button><button data-act="pendkeep" data-id="'+h.id+'">Keep with '+esc((IX.w[h.ln]||{}).name||"")+"</button>":'<button class="pri" data-act="pendok" data-id="'+h.id+'">Confirm</button>')+
      '<button data-hh="'+h.id+'">Open</button><button data-act="pendno" data-id="'+h.id+'">Not a household here</button></div></div>';}).join("")+"</div>";}

if(typeof document!=="undefined"){
document.addEventListener("input",e=>{const el=e.target;if(el.dataset&&el.dataset.ah&&UI.AH)UI.AH[el.dataset.ah]=el.value;});
document.addEventListener("change",e=>{const el=e.target;if(el.dataset&&el.dataset.ah&&UI.AH)UI.AH[el.dataset.ah]=el.value;if(el.id==="ng_lnt"&&UI.ng){UI.ng.lnt=el.value;if(PLAN.a[el.value]){UI.ng.col=PLAN.a[el.value].col;UI.keep=true;render();}}});
document.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset,A=d.act,U=UI.ng,v=id=>(document.getElementById(id)||{}).value||"",again=()=>{UI.keep=true;render();};
  if(A==="ahgps")return czLocate(UI.AH);
  if(A==="pendok"||A==="pendkeep"||A==="pendno"){const h=IX.hh[d.id],p=h&&h.pend;if(!p)return;const w=me();
    if(A==="pendno"){if(!confirm("Remove "+h.head+"? Use this only when there is no such household here."))return;for(const q of IX.hhP[h.id]||[])q.out=TODAY;h.pend=Object.assign({},p,{st:"no",ok:w.id});}
    else if(A==="pendok"&&p.to){const g=ngIx(p.ng);if(g&&g.ca===w.id&&g.ln){h.ln=g.ln;h.ng=g.id;delete h.pend;h.conf={by:w.id,d:TODAY};reown([h.id]);}else h.pend=Object.assign({},p,{adm:true,to:null,ok:w.id});}
    else{const g=PLAN.g.find(x=>x.ln===h.ln);if(g&&ngOn())h.ng=g.id;delete h.pend;h.conf={by:w.id,d:TODAY};}
    index();return again();}
  if(!A||A.slice(0,2)!=="ng"||!U)return;U.msg="";
  if(A==="ngset"){const n=+v("ng_n");if(!(n>=1))return;const err=ngSet(Math.round(n),v("ng_by")==="hh"?"hh":"adults",PLAN.st==="none"&&!U.tries?0:1000+(U.tries=(U.tries||0)+1)*7919+Date.now()%100000);U.tries=U.tries||1;U.hh=null;if(err)UI.note=[err,"bad"];return again();}
  if(A==="ngmove"){const h=IX.hh[U.hh],to=v("ng_to");if(h&&to){PLAN.asg[h.id]=to;ngRebuild();}return again();}
  if(A==="ngfix"){ngFix();U.snap=null;U.hh=null;UI.note=UI.note||["The Neighbor Groups are fixed.","good"];return again();}
  if(A==="ngsuggest"){ngSuggest();U.sel.clear();return again();}
  if(A==="ngcol"){U.col=+d.v;return again();}
  if(A==="ngclear"){U.sel.clear();return again();}
  if(A==="ngassign"){const t=v("ng_lnt");if(!t||!U.sel.size)return;for(const g of PLAN.g)if(U.sel.has(g.id))g.ca=t;PLAN.a[t]={col:U.col};PLAN.local=true;U.sel.clear();U.lnt=t;
    const free=NGCOL.findIndex((c,i)=>!Object.keys(PLAN.a).some(k=>PLAN.a[k].col===i&&PLAN.g.some(g=>g.ca===k)));if(free>=0)U.col=free;return again();}
  if(A==="ngfixca"){try{await ngFixCa();U.snap=null;U.sel.clear();UI.note=UI.note||["The Care Group boundaries are fixed.","good"];}catch(err){UI.note=["The change could not be saved: "+errText(err.code||"server"),"bad"];}return again();}
  if(A==="ngaskpw"){U.unlock=d.v;return again();}
  if(A==="ngcancelpw"){U.unlock=null;return again();}
  if(A==="ngunlock"){const pw=v("ng_pw");
    if(live()){try{const r=await rpc("cmd_login",{p_code:me().code||"",p_pin:pw});if(!r||!r.ok){U.msg=r&&r.error==="locked"?"Too many wrong PINs. Try again in 15 minutes.":"That is not your PIN.";return again();}rpc("cmd_logout",{p_token:r.token}).catch(()=>{});}catch(err){U.msg="The PIN is checked on the server, so this needs a connection.";return again();}}
    else if(pw!=="example"){U.msg="In example mode the password is the word: example";return again();}
    U.snap=JSON.stringify(planBody());U.unlock=null;
    if(d.v==="ng"){PLAN.asg={};for(const h of S.hh)if(h.ng)PLAN.asg[h.id]=h.ng;PLAN.st="draft";PLAN.n=PLAN.g.length;ngLog("Unlocked the Neighbor Groups to change them");}
    else{PLAN.cst="draft";ngLog("Unlocked the Care Group boundaries to change them");}
    PLAN.local=true;return again();}
  if(A==="ngrevert"){if(U.snap){const lg=PLAN.log;planApply(JSON.parse(U.snap));PLAN.log=lg;ngLog("Cancelled the changes");U.snap=null;U.sel.clear();U.hh=null;}return again();}
  if(A==="ngopen"){U.open=d.id;UI.keep=false;render();const el=document.getElementById("nginfo");if(el)el.scrollIntoView({block:"center"});return;}
  if(A==="ngclose"){U.open=null;return again();}
  if(A==="ngsaveln"){const g=ngIx(d.id),pid=v("ng_ln");if(!pid){U.msg="Choose a person.";return again();}if(live()&&(v("ng_code").trim().length<3||v("ng_pin").length<6)&&g.pid!==pid){U.msg="Enter a sign-in name (3 or more letters) and a PIN (6 or more digits).";return again();}
    try{U.msg=await ngSetLn(g,pid,v("ng_code").trim(),v("ng_pin"));}catch(err){U.msg=errText(err.code||"server");}if(!U.msg)UI.note=["Saved: "+g.name+" is the Leader Neighbor of Neighbor Group "+g.no+".","good"];return again();}
  if(A==="ngplace"){const h=IX.hh[d.id],g=ngIx(v("ngw_"+d.id));if(!h||!g||!g.ln)return;h.ng=g.id;ngMoveHh(h,g.ln);delete h.pend;h.conf={by:me().id,d:TODAY};reown([h.id]);index();ngLog("Placed household "+h.no+" in Neighbor Group "+g.no);await planSave();return again();}
});}

/* --- the example: the groups, areas and Leader Neighbors as they would stand after the census --- */
function exPlan(){planReset();const Q=rng(20261126),hs=ngHhs();let la=1e9,lo=1e9;for(const h of hs){la=Math.min(la,h.cen.gps.lat);lo=Math.min(lo,h.cen.gps.lon);}
  PLAN.o=[+(la-.003).toFixed(5),+(lo-.003).toFixed(5)];
  const LN=S.w.filter(w=>w.role==="ln");PLAN.g=LN.map((w,i)=>({id:"n"+(i+1),no:i+1,ring:[],nb:[],c:[0,0],ln:w.id,pid:null,name:"",sex:"",ca:w.lnt}));PLAN.n=LN.length;
  const by=Object.fromEntries(PLAN.g.map(g=>[g.ln,g.id]));for(const h of S.hh)if(by[h.ln])h.ng=by[h.ln];
  for(const t of S.w.filter(w=>w.role==="lnt"))PLAN.a[t.id]={col:(t.cg-1)%NGCOL.length};
  ngRebuild();const mem=ngMem();
  for(const g of PLAN.g){const cs=ngCands(g,mem),want=Q()<.72?"F":"M",pool=cs.filter(p=>p.sex===want&&p.age<70&&!p.death),p=(pool.length?pool:cs)[Math.floor(Q()*(pool.length?pool:cs).length)];if(!p)continue;
    g.pid=p.id;g.name=p.name;g.sex=p.sex;IX.w[g.ln].name=p.name;}
  const t0=Date.UTC(+CFG.census.slice(0,4),+CFG.census.slice(5,7)-1,+CFG.census.slice(8,10))+50*864e5;
  PLAN.by="hh";PLAN.st=PLAN.cst="fixed";PLAN.fx={ng:{t:t0,by:"Administrator"},ca:{t:t0+864e5,by:"Administrator"}};
  PLAN.log=[{t:t0,by:"Administrator",what:"Fixed "+PLAN.g.length+" Neighbor Groups"},{t:t0+864e5,by:"Administrator",what:"Fixed the Care Group boundaries"}];PLAN.v=1;}
