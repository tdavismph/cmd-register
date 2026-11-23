/* ---------- live mode: sign-in, records kept on the tablet, sync with the server ----------
   The example data never touches the server. In live mode every record is stored on the tablet
   (IndexedDB), so it survives closing the app and works offline, and is sent to the Supabase
   database whenever there is a connection. The server limits each worker to her own records:
   see server/setup.sql. */
// Public values, safe to publish (the same as the key every visitor's browser receives).
const SERVER=window.CMD_SERVER||{url:"https://zxyftmpskbhtjretacig.supabase.co",key:"sb_publishable_aRJWlS41yCDBQLrI_J_HPQ_dqBQZfP5"};
const TYPES=["hh","p","v","ref","ev","gm","q"];
const L={mode:null,auth:null,seq:0,meta:{},dirty:{},last:null,msg:"",syncMsg:"",busy:false,welcome:"start"};
const SNAP=new Map();   // record key -> JSON as last stored, to find records changed on this tablet
const live=()=>L.mode==="live";
const rk=(ty,id)=>ty+"|"+id;
const ERRS={wrong_code_or_pin:"Wrong sign-in name or PIN.",locked:"Too many wrong PINs. Try again in 15 minutes.",already_set_up:"The server already has an administrator. Sign in instead.",
  bad_input:"A name is required. The sign-in name needs 3 or more characters and the PIN 6 or more digits.",code_taken:"That sign-in name is already used.",offline:"No connection. Connect and try again.",
  admin_only:"Only the administrator can do this.",no_such_trainer:"Choose a Trainer.",no_such_promoter:"Choose a Promoter.",not_signed_in:"Your session has ended. Sign in again.",
  no_server:"This copy of the app is not connected to a server yet.",server_404:"The server is not set up yet. Run server/setup.sql in Supabase first."};
const errText=c=>ERRS[c]||("The server did not respond as expected ("+c+").");

/* storage on the tablet */
const IDB={db:null,
  open(){return new Promise(res=>{try{const r=indexedDB.open("cmd-register",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>{IDB.db=r.result;res(true);};r.onerror=()=>res(false);}catch(e){res(false);}});},
  get(k){return new Promise(res=>{try{const r=IDB.db.transaction("kv").objectStore("kv").get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>res(null);}catch(e){res(null);}});},
  set(k,v){try{IDB.db.transaction("kv","readwrite").objectStore("kv").put(v,k);}catch(e){}}};
const cfgPart=()=>({start:CFG.start,cut:CFG.adrs.cut,model:CFG.model});
function applyCfg(c){if(!c)return;if(c.start)setStart(c.start);if(c.cut>0)CFG.adrs.cut=c.cut;if(c.model)Object.assign(CFG.model,c.model);}
function store(){if(!live()||!IDB.db)return;const recs={};for(const ty of TYPES)recs[ty]=S[ty];
  IDB.set("state",{mode:L.mode,auth:L.auth,seq:L.seq,meta:L.meta,dirty:L.dirty,last:L.last,cfg:cfgPart(),w:S.w,recs});}
function wipeRecords(){for(const ty of TYPES)S[ty].length=0;S.w.length=0;SNAP.clear();L.meta={};L.dirty={};L.seq=0;L.last=null;}

/* which worker owns a record: the household's Leader Neighbor; for a QIVC, the worker observed */
function ownerOf(ty,r){if(ty==="hh")return r.ln;if(ty==="gm")return r.ln;if(ty==="q")return r.wid;
  const pid=r.p||(ty==="p"?r.id:null),p=ty==="p"?r:IX.p[pid],h=IX.hh[(p&&p.hh)||r.hh];return h?h.ln:null;}

/* find records changed on this tablet since they were last stored */
function scan(){const now=Date.now();
  for(const ty of TYPES)for(const r of S[ty]){const k=rk(ty,r.id),j=JSON.stringify(r);if(SNAP.get(k)!==j){SNAP.set(k,j);L.meta[k]=now;L.dirty[k]=1;}}}
let afterT=null,lastCfg="";
function afterAction(){if(!live())return;clearTimeout(afterT);afterT=setTimeout(()=>{scan();store();
  const c=JSON.stringify(cfgPart());if(me()&&me().role==="admin"&&c!==lastCfg){lastCfg=c;rpc("cmd_settings_set",{p_token:L.auth.token,p_body:cfgPart()}).catch(()=>{});}
  syncSoon();},400);}
["click","change"].forEach(t=>document.addEventListener(t,()=>afterAction()));

/* server calls */
async function rpc(fn,args){if(!SERVER.url)throw {code:"no_server"};let r;
  try{r=await fetch(SERVER.url+"/rest/v1/rpc/"+fn,{method:"POST",headers:{"Content-Type":"application/json",apikey:SERVER.key,Authorization:"Bearer "+SERVER.key},body:JSON.stringify(args||{})});}catch(e){throw {code:"offline"};}
  const j=await r.json().catch(()=>null);
  if(!r.ok){const m=(j&&(j.message||j.error))||"";throw {code:/not_signed_in/.test(m)?"not_signed_in":"server_"+r.status,message:m};}
  return j;}

/* sync: send what changed here, then fetch what changed elsewhere */
let syncT=null;
function syncSoon(){clearTimeout(syncT);syncT=setTimeout(sync,1500);}
function mergePerson(a,b,bNewer){const o=Object.assign({},bNewer?b:a);
  for(const k of ["bp","glu","hab"]){const seen=new Set(),all=[];for(const e of (a[k]||[]).concat(b[k]||[])){const j=JSON.stringify(e);if(!seen.has(j)){seen.add(j);all.push(e);}}
    if(a[k]||b[k])o[k]=all.sort((x,y)=>(x.d<y.d?-1:x.d>y.d?1:0));}
  return o;}
/* a referral edited on two devices keeps every follow-up entry, the facility visit and the closure */
function mergeRef(a,b,bNewer){const o=Object.assign({},bNewer?b:a),seen=new Set(),all=[];for(const e of (a.fu||[]).concat(b.fu||[])){const j=JSON.stringify(e);if(!seen.has(j)){seen.add(j);all.push(e);}}
  if(all.length)o.fu=all.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:(x.t||0)-(y.t||0));const s=[a.seen,b.seen].filter(Boolean).sort()[0];if(s)o.seen=s;if(a.closed||b.closed)o.closed=a.closed||b.closed;return o;}
function applyPulled(recs){let n=0;
  for(const x of recs){const ty=x.ty,b=x.body;if(!TYPES.includes(ty)||!b||!b.id)continue;const k=rk(ty,b.id),arr=S[ty],i=arr.findIndex(r=>r.id===b.id);
    if(i>=0&&L.dirty[k]){if(ty==="p"){arr[i]=mergePerson(arr[i],b,(x.u||0)>(L.meta[k]||0));SNAP.set(k,"");}else if(ty==="ref"){arr[i]=mergeRef(arr[i],b,(x.u||0)>(L.meta[k]||0));SNAP.set(k,"");}continue;}   // local changes not yet sent win; a person record keeps both sets of readings
    if(i>=0)arr[i]=b;else arr.push(b);SNAP.set(k,JSON.stringify(b));L.meta[k]=x.u||0;n++;}
  return n;}
async function sync(){if(!live()||L.busy||!L.auth||!L.auth.token)return;if(!navigator.onLine){L.syncMsg="Offline. "+Object.keys(L.dirty).length+" changes waiting.";return hdr();}
  L.busy=true;L.syncMsg="Syncing…";hdr();
  try{scan();
    const keys=Object.keys(L.dirty);
    for(let i=0;i<keys.length;i+=200){const batch=keys.slice(i,i+200).map(k=>{const [ty,id]=k.split("|"),r=S[ty].find(x=>x.id===id);return r?{ty,id,ln:ownerOf(ty,r),u:L.meta[k]||Date.now(),body:r}:null;}).filter(Boolean);
      if(batch.length)await rpc("cmd_push",{p_token:L.auth.token,p_records:batch});
      for(const k of keys.slice(i,i+200))delete L.dirty[k];}
    await refreshWorkers();
    const cfg=await rpc("cmd_settings_get",{p_token:L.auth.token});applyCfg(cfg);lastCfg=JSON.stringify(cfgPart());
    let got=0,guard=0;
    while(guard++<200){const r=await rpc("cmd_pull",{p_token:L.auth.token,p_since:L.seq});got+=applyPulled(r.records||[]);L.seq=r.seq||L.seq;if(!r.count||r.count<1000)break;}
    index();scan();L.dirty={...L.dirty};L.last=Date.now();
    L.syncMsg="Synced "+new Date(L.last).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})+(Object.keys(L.dirty).length?" · "+Object.keys(L.dirty).length+" changes waiting":"");store();
    if(got&&!UI.F&&!UI.G)render();
  }catch(e){L.syncMsg=e.code==="offline"?"Offline. "+Object.keys(L.dirty).length+" changes waiting.":errText(e.code);if(e.code==="not_signed_in"){L.auth.token=null;store();render();}}
  finally{L.busy=false;hdr();}}
addEventListener("online",()=>sync());
setInterval(()=>{if(live()&&document.visibilityState==="visible")sync();},5*60*1000);

/* sign-in, first-time setup, sign-out */
async function signIn(fn,args){L.msg="";try{const res=await rpc(fn,args);if(!res||!res.ok){L.msg=errText(res&&res.error||"server");return render();}
    const same=L.auth&&L.auth.worker&&L.auth.worker.id===res.worker.id;if(!same)wipeRecords();   // a different worker never sees the previous worker's records
    if(!same)setStart(TODAY);L.mode="live";LIVE=true;L.auth={token:res.token,worker:res.worker};UI.who=res.worker.id;if(!S.w.some(w=>w.id===res.worker.id))S.w.push(res.worker);index();
    UI.tab=null;UI.mode=null;store();render();await sync();render();}
  catch(e){L.msg=errText(e.code);render();}}
async function signOut(){if(Object.keys(L.dirty).length&&!confirm("Some changes have not reached the server yet. Sign out anyway? They stay on this tablet only if the same worker signs in again."))return;
  try{if(L.auth&&L.auth.token)await rpc("cmd_logout",{p_token:L.auth.token});}catch(e){}
  L.auth=Object.assign({},L.auth,{token:null});store();render();}

/* screens */
const fld=(id,label,type,extra)=>'<div class="q"><label class="t" for="'+id+'">'+esc(label)+'</label><input id="'+id+'" type="'+(type||"text")+'" '+(extra||"")+' style="width:100%"></div>';
function vWelcome(){const w=L.welcome,m=L.msg?'<div class="note bad">'+esc(L.msg)+"</div>":"";
  $("#nav").innerHTML="";$("#role").hidden=true;$("#who").textContent=SERVER.url?"":"Example mode only";
  if(w==="login")return '<div class="card"><h1>Sign in</h1>'+m+fld("li_code","Sign-in name","text",'autocapitalize="none" autocomplete="username"')+fld("li_pin","PIN","password",'inputmode="numeric" autocomplete="current-password"')+'<div class="row"><button class="pri" data-act="login">Sign in</button><button data-act="welcome" data-w="start">Back</button></div></div>';
  if(w==="setup")return '<div class="card"><h1>First-time setup (administrator only)</h1><p class="muted">This creates the administrator account. It works once, on a server with no administrator yet.</p>'+m+fld("su_name","Name")+fld("su_code","Sign-in name","text",'autocapitalize="none" autocomplete="off"')+fld("su_pin","PIN (6 or more digits)","password",'inputmode="numeric"')+fld("su_pin2","PIN again","password",'inputmode="numeric"')+'<div class="row"><button class="pri" data-act="setup">Create the administrator</button><button data-act="welcome" data-w="start">Back</button></div></div>';
  return '<div class="card"><h1>CBIO Cardiometabolic Disease Register</h1><p>A home visit register with counselling pages for hypertension and diabetes, for the Ghana CBIO+ demonstration.</p>'+m+
    '<div class="row"><button class="pri tap" data-act="example">Try it with example data</button>'+(SERVER.url?'<button class="tap" data-act="welcome" data-w="login">Sign in</button>':"")+"</div>"+
    '<p class="small muted">Example data is fictitious and stays on this device. '+(SERVER.url?"Signing in uses the project database; records are kept on the tablet and sent to the server when there is a connection.":"This copy is not yet connected to a server.")+"</p>"+
    (SERVER.url?'<p class="small"><button class="link" data-act="welcome" data-w="setup">First-time setup (administrator only)</button></p>':"")+"</div>";}
function hdr(){if(!live()||!me())return;const w=me();$("#who").textContent=ROLE[w.role]+(w.role==="admin"?"":": "+w.name)+" · "+(L.syncMsg||"not yet synced");}
function liveCard(){const n=Object.keys(L.dirty).length;
  return "<div class='card'><h3>Data and sign-in</h3><p class='small'>Signed in as "+esc(me().name)+" ("+esc(ROLE[me().role])+"). Records are kept on this tablet and sent to the server when there is a connection."+(L.last?" Last sync: "+new Date(L.last).toLocaleString()+".":"")+" "+n+" change"+(n===1?"":"s")+" waiting to be sent.</p>"+
    (L.syncMsg?"<p class='small muted'>"+esc(L.syncMsg)+"</p>":"")+"<div class='row'><button data-act="+'"syncnow"'+">Sync now</button><button data-act="+'"signout"'+">Sign out</button></div></div>";}
function vAccount(){return "<h1>Account</h1>"+liveCard();}

/* programme start date (administrator) */
function startCard(){return "<div class='card'><h3>Programme calendar</h3><div class='row'><label>Home visits started on <input type='date' data-cfgstart='1' value='"+esc(CFG.start)+"'"+(me().role==="admin"?"":" disabled")+"></label></div><p class='small muted'>The month of the programme (1 to 12) and the group lesson for each month are counted from this date. The census is taken to have been about 10 weeks earlier.</p></div>";}

/* workers (administrator, live mode) */
function vWorkersLive(){const g=r=>S.w.filter(w=>w.role===r&&w.active!==false),sel=(id,arr,lab)=>'<select id="'+id+'">'+arr.map(w=>'<option value="'+w.id+'">'+esc(lab(w))+"</option>").join("")+"</select>";
  const row=w=>"<tr><td>"+esc(ROLE[w.role])+"</td><td>"+esc(w.name)+"</td><td>"+esc(w.code||"")+"</td><td>"+(w.role==="lnt"?"Care Group "+w.cg+(w.prom&&IX.w[w.prom]?" · Promoter "+esc(IX.w[w.prom].name):""):w.role==="ln"?"Care Group "+w.cg+(w.lnt&&IX.w[w.lnt]?" · Trainer "+esc(IX.w[w.lnt].name):""):"")+"</td></tr>";
  const add=(title,role,extra)=>"<div class='card'><h3>"+title+"</h3><div class='row'><input id='nw_"+role+"_name' placeholder='Name' class='grow'><input id='nw_"+role+"_code' placeholder='Sign-in name' autocapitalize='none' style='width:150px'><input id='nw_"+role+"_pin' placeholder='PIN (6+ digits)' inputmode='numeric' style='width:140px'>"+(extra||"")+"<button data-act='addworker' data-role='"+role+"'>Add</button></div></div>";
  let o="<h1>Workers</h1>"+(L.msg?'<div class="note">'+esc(L.msg)+"</div>":"");L.msg="";
  o+="<div class='card'>"+tbl(["Role","Name","Sign-in name","Covers"],["admin","prom","clinic","lnt","ln"].flatMap(r=>g(r).map(row)))+"</div>";
  o+=add("Add a Promoter (CHO)","prom")+add("Add a clinic user","clinic");
  o+=g("prom").length?add("Add a Leader Neighbor Trainer (starts a new Care Group)","lnt",sel("nw_lnt_sup",g("prom"),w=>"Promoter: "+w.name)):"<div class='card'><p class='muted'>Add a Promoter first. Each Trainer belongs to a Promoter.</p></div>";
  o+=g("lnt").length?add("Add a Leader Neighbor","ln",sel("nw_ln_sup",g("lnt"),w=>"Care Group "+w.cg+" · "+w.name)):"<div class='card'><p class='muted'>Add a Trainer first. Each Leader Neighbor belongs to a Trainer's Care Group.</p></div>";
  const all=S.w.filter(w=>w.role!=="admin"&&w.active!==false);
  if(all.length)o+="<div class='card'><h3>Give a worker a new PIN, or remove a worker</h3><div class='row'>"+sel("pw_who",all,w=>ROLE[w.role]+" · "+w.name)+"<input id='pw_pin' placeholder='New PIN (6+ digits)' inputmode='numeric' style='width:170px'><button data-act='setpin'>Set PIN</button><button data-act='deactivate'>Remove</button></div><p class='small muted'>A removed worker can no longer sign in. Her households and records stay; give them to another Leader Neighbor before removing her.</p></div>";
  return o;}
async function refreshWorkers(){const ws=await rpc("cmd_workers_list",{p_token:L.auth.token});if(Array.isArray(ws)){S.w.length=0;S.w.push(...ws);index();store();}}
async function saveWorker(body,pin){try{const r=await rpc("cmd_save_worker",{p_token:L.auth.token,p_worker:body,p_pin:pin||""});L.msg=r&&r.ok?"Saved: "+r.worker.name+(r.worker.code?" (sign-in name "+r.worker.code+")":""):errText(r&&r.error||"server");await refreshWorkers();}
  catch(e){L.msg=errText(e.code);}render();}

/* add a household (Leader Neighbor or Trainer) */
function vAddHh(){const w=me(),lns=w.role==="ln"?[w]:S.w.filter(x=>x.role==="ln"&&x.lnt===w.id&&x.active!==false);
  if(!lns.length)return '<button class="link" data-act="back">‹ Back</button><div class="card"><p>This Care Group has no Leader Neighbors yet. The administrator adds them on the Workers page.</p></div>';
  return '<button class="link" data-act="back">‹ Back</button><h1>Add a household</h1><div class="card">'+fld("nh_head","Head of household: name")+
    '<div class="row"><div class="q grow"><label class="t" for="nh_sex">Sex</label><select id="nh_sex"><option value="F">Woman</option><option value="M">Man</option></select></div><div class="q grow"><label class="t" for="nh_age">Age in years</label><input id="nh_age" type="number" min="18" max="110" inputmode="numeric"></div></div><p class="small muted">The head of household is added as the first adult. Add the other adults on the next screen.</p>'+
    (lns.length>1||w.role!=="ln"?'<div class="q"><label class="t" for="nh_ln">Leader Neighbor</label><select id="nh_ln">'+lns.map(l=>'<option value="'+l.id+'">'+esc(l.name)+"</option>").join("")+"</select></div>":"")+
    '<div class="q"><label class="t" for="nh_nhis">National Health Insurance (NHIS) active?</label><select id="nh_nhis"><option value="">Not known</option><option value="y">Yes</option><option value="n">No</option></select></div>'+
    (L.msg?'<div class="note bad">'+esc(L.msg)+"</div>":"")+'<div class="row"><button class="pri" data-act="savehh">Save and add the adults</button></div></div>';}
function saveHh(){const head=$("#nh_head").value.trim();const hsex=$("#nh_sex").value,hage=+$("#nh_age").value,bad=!head?"Enter the name of the head of household.":!(hage>=18&&hage<=110)?"Enter the age of the head of household (18 or older).":"";
  if(bad){const keep={nh_head:head,nh_sex:hsex,nh_age:$("#nh_age").value,nh_nhis:$("#nh_nhis").value,nh_ln:($("#nh_ln")||{}).value};L.msg=bad;render();for(const k in keep){const e=$("#"+k);if(e&&keep[k]!=null)e.value=keep[k];}return;}L.msg="";
  const lnId=($("#nh_ln")||{}).value||me().id,ln=IX.w[lnId],h={id:uid("h"),ln:lnId,no:"CG"+(ln.cg||"")+"-"+Math.random().toString(36).slice(2,6).toUpperCase(),head,nhis:$("#nh_nhis").value==="y",topics:[],reg:TODAY};
  S.hh.push(h);S.p.push({id:uid("p"),hh:h.id,name:head,sex:hsex,age:hage,bp:[],glu:[],htn:{},dm:{},meds:[]});index();UI.hh=h.id;UI.mode="hh";render();}

/* actions */
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset,A=d.act;
  if(A==="welcome"){L.welcome=d.w;L.msg="";return render();}
  if(A==="example"){L.mode="example";LIVE=false;for(const ty of TYPES)S[ty].length=0;S.w.length=0;SEQ=0;build();index();roleSel();$("#role").hidden=false;UI.tab=null;UI.mode=null;return render();}
  if(A==="login")return signIn("cmd_login",{p_code:$("#li_code").value,p_pin:$("#li_pin").value});
  if(A==="setup"){if($("#su_pin").value!==$("#su_pin2").value){L.msg="The two PINs are not the same.";return render();}return signIn("cmd_bootstrap",{p_name:$("#su_name").value,p_code:$("#su_code").value,p_pin:$("#su_pin").value});}
  if(A==="syncnow")return sync().then(render);
  if(A==="signout")return signOut();
  if(A==="addhh"){L.msg="";UI.back=UI.tab;UI.mode="addhh";return render();}
  if(A==="savehh")return saveHh();
  if(A==="addworker"){const r=d.role,v=k=>($("#nw_"+r+"_"+k)||{}).value||"";const body={role:r,name:v("name").trim(),code:v("code").trim()};if(r==="lnt")body.prom=v("sup");if(r==="ln")body.lnt=v("sup");return saveWorker(body,v("pin"));}
  if(A==="setpin")return saveWorker({id:$("#pw_who").value},$("#pw_pin").value);
  if(A==="deactivate"){const w=IX.w[$("#pw_who").value];if(w&&confirm("Remove "+w.name+"? She will no longer be able to sign in."))return saveWorker({id:w.id,active:false},"");}});
document.addEventListener("change",e=>{const el=e.target;if(el.dataset.cfgstart&&el.value&&me().role==="admin"){setStart(el.value);render();}});

/* start-up: a signed-in worker goes straight to her work; otherwise the welcome screen */
async function boot(){await IDB.open();const st=IDB.db?await IDB.get("state"):null;
  if(st&&st.mode==="live"&&st.auth){L.mode="live";LIVE=true;L.auth=st.auth;L.seq=st.seq||0;L.meta=st.meta||{};L.dirty=st.dirty||{};L.last=st.last||null;applyCfg(st.cfg);
    S.w.push(...(st.w||[]));for(const ty of TYPES)S[ty].push(...((st.recs||{})[ty]||[]));index();for(const ty of TYPES)for(const r of S[ty])SNAP.set(rk(ty,r.id),JSON.stringify(r));
    lastCfg=JSON.stringify(cfgPart());if(L.auth.worker)UI.who=L.auth.worker.id;}
  render();if(live()&&L.auth.token)sync();}

/* The welcome screen comes first; the app's own screens need a worker (example or signed in). */
const renderApp=render;
render=function(){if(!L.mode||(live()&&!(L.auth&&L.auth.token))){if(live())L.welcome="login";$("#app").innerHTML=vWelcome();return;}
  $("#role").hidden=live();renderApp();if(live())hdr();};

boot();
