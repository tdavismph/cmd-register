/* ---------- pictures for the counselling pages (simple drawings; to be replaced by tested illustrations) ---------- */
const ICON={
 pill:'<rect x="22" y="48" width="76" height="30" rx="15"/><line x1="60" y1="48" x2="60" y2="78"/><circle cx="92" cy="28" r="12"/><line x1="84" y1="20" x2="100" y2="36"/>',
 heart:'<path d="M60 96C30 74 16 58 16 42a20 20 0 0 1 44-8a20 20 0 0 1 44 8c0 16-14 32-44 54z"/><polyline points="30 52 46 52 54 38 64 66 72 52 90 52"/>',
 clinic:'<rect x="22" y="38" width="76" height="60"/><polyline points="14 42 60 14 106 42"/><line x1="60" y1="52" x2="60" y2="80"/><line x1="46" y1="66" x2="74" y2="66"/>',
 card:'<rect x="14" y="30" width="92" height="60" rx="8"/><line x1="26" y1="48" x2="70" y2="48"/><line x1="26" y1="62" x2="92" y2="62"/><line x1="26" y1="76" x2="58" y2="76"/>',
 leaf:'<path d="M24 96C24 50 50 22 98 22C98 68 72 96 24 96z"/><line x1="24" y1="96" x2="78" y2="42"/>',
 calendar:'<rect x="18" y="26" width="84" height="74" rx="8"/><line x1="18" y1="46" x2="102" y2="46"/><line x1="40" y1="16" x2="40" y2="34"/><line x1="80" y1="16" x2="80" y2="34"/><polyline points="44 72 56 84 78 60"/>',
 cuff:'<rect x="16" y="34" width="50" height="52" rx="10"/><path d="M66 60h18a14 14 0 0 1 14 14v8"/><circle cx="98" cy="92" r="10"/><line x1="28" y1="50" x2="54" y2="50"/><line x1="28" y1="62" x2="54" y2="62"/>',
 drop:'<path d="M60 14C40 44 28 60 28 76a32 32 0 0 0 64 0C92 60 80 44 60 14z"/>',
 foot:'<path d="M44 20c16 0 22 16 20 40c-2 20 6 26 6 38c0 10-8 14-18 14s-18-6-18-18c0-14 6-22 4-40c-2-20-4-34 6-34z"/><circle cx="76" cy="26" r="5"/><circle cx="86" cy="36" r="4"/><circle cx="92" cy="48" r="4"/>',
 salt:'<path d="M40 44h40l8 56H32z"/><path d="M44 44a16 16 0 0 1 32 0"/><circle cx="54" cy="32" r="1.5"/><circle cx="60" cy="28" r="1.5"/><circle cx="66" cy="32" r="1.5"/>',
 bottle:'<path d="M50 14h20v16c10 6 14 14 14 26v44a6 6 0 0 1-6 6H42a6 6 0 0 1-6-6V56c0-12 4-20 14-26z"/><line x1="36" y1="64" x2="84" y2="64"/>',
 plate:'<circle cx="60" cy="60" r="44"/><circle cx="60" cy="60" r="30"/><line x1="60" y1="30" x2="60" y2="90"/><line x1="60" y1="60" x2="90" y2="60"/>',
 scale:'<rect x="18" y="26" width="84" height="72" rx="12"/><path d="M38 52a22 22 0 0 1 44 0z"/><line x1="60" y1="52" x2="70" y2="38"/>',
 walk:'<circle cx="64" cy="20" r="9"/><path d="M62 32l-8 28l14 16l4 28"/><path d="M54 60l-14 40"/><path d="M60 38l-18 12l-4 16"/><path d="M62 40l16 14l12 2"/>',
 nosmoke:'<circle cx="60" cy="60" r="44"/><line x1="29" y1="29" x2="91" y2="91"/><rect x="32" y="54" width="48" height="12"/><line x1="86" y1="54" x2="86" y2="66"/>',
 moon:'<path d="M84 76A40 40 0 1 1 48 20a32 32 0 0 0 36 56z"/><path d="M82 22l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/>',
 phone:'<rect x="36" y="12" width="48" height="96" rx="10"/><line x1="52" y1="94" x2="68" y2="94"/><text x="60" y="62" text-anchor="middle" font-size="22" font-weight="800" stroke="none" fill="currentColor">112</text>',
 hands:'<circle cx="34" cy="34" r="14"/><circle cx="86" cy="34" r="14"/><circle cx="34" cy="86" r="14"/><circle cx="86" cy="86" r="14"/><text x="34" y="41" text-anchor="middle" font-size="18" font-weight="800" stroke="none" fill="currentColor">1</text><text x="86" y="41" text-anchor="middle" font-size="18" font-weight="800" stroke="none" fill="currentColor">2</text><text x="34" y="93" text-anchor="middle" font-size="18" font-weight="800" stroke="none" fill="currentColor">3</text><text x="86" y="93" text-anchor="middle" font-size="18" font-weight="800" stroke="none" fill="currentColor">4</text>',
 family:'<circle cx="34" cy="34" r="12"/><path d="M14 96c0-24 8-38 20-38s20 14 20 38"/><circle cx="84" cy="30" r="12"/><path d="M64 96c0-26 8-42 20-42s20 16 20 42"/><circle cx="60" cy="62" r="8"/><path d="M48 100c0-14 4-24 12-24s12 10 12 24"/>'};
const ic=k=>'<svg viewBox="0 0 120 120" width="96" height="96" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[k]||"")+"</svg>";

/* ---------- screen state ---------- */
const UI={who:"adm",tab:null,hh:null,pid:null,F:null,mode:null,area:"all",q:"",all:false,note:null};
const me=()=>IX.w[UI.who];
const TABS={ln:[["today","Today"],["hhs","Households"],["group","Group lesson"],["reports","My results"],["pages","Counselling pages"],["account","Account"]],
  lnt:[["coach","My Care Group"],["refs","Referrals"],["hhs","Households"],["reports","Results"],["pages","Counselling pages"],["account","Account"]],
  prom:[["screen","Screening day"],["recheck","BP re-checks"],["cmap","Census map"],["refs","Referrals"],["coach","Quality"],["reports","Reports"],["compare","Care Groups compared"],["pages","Counselling pages"],["account","Account"]],
  clinic:[["refs","Referrals"],["patients","Patients"],["reports","Reports"],["pages","Counselling pages"],["account","Account"]],
  admin:[["reports","Reports"],["compare","Care Groups compared"],["refs","Referrals"],["cprog","Census"],["cmap","Census map"],["workers","Workers"],["settings","Settings"],["pages","Counselling pages"]],
  enum:[["census","Census"],["callbacks","Call-backs"],["cmap","Map"],["chelp","How to"],["account","Account"]]};
const ROLE={admin:"Administrator",clinic:"Clinic",prom:"Promoter (CHO)",lnt:"Leader Neighbor Trainer",ln:"Leader Neighbor",enum:"Enumerator"};
const lnsOf=w=>w.role==="ln"||w.role==="enum"?[w.id]:w.role==="lnt"?S.w.filter(x=>x.lnt===w.id).map(x=>x.id):w.role==="prom"&&live()?S.w.filter(x=>x.role==="ln"&&(IX.w[x.lnt]||{}).prom===w.id).map(x=>x.id):S.w.filter(x=>x.role==="ln").map(x=>x.id); // live: a Promoter sees only her Trainers' Care Groups, as on the server
function scope(){const w=me();let ids=lnsOf(w);if(UI.area!=="all"){if(UI.area.startsWith("cg"))ids=ids.filter(i=>IX.w[i].cg===+UI.area.slice(2));else if(ids.includes(UI.area))ids=[UI.area];}return new Set(ids);}
const canVisit=()=>["ln","lnt"].includes(me().role);

/* ---------- small builders ---------- */
const chip=(a)=>a?'<span class="chip '+a[1]+'">'+esc(a[0])+"</span>":"";
const bpTxt=r=>r?r.s+"/"+r.di:"";
const seg=(f,opts,val)=>'<div class="seg">'+opts.map(o=>'<button data-f="'+f+'" data-v="'+esc(o[0])+'" class="'+(String(val)===String(o[0])?"on":"")+'">'+esc(o[1])+"</button>").join("")+"</div>";
const YN=[["y","Yes"],["n","No"]];
const multi=(f,opts,arr,neutral,none)=>'<div class="seg multi'+(neutral?" neutral":"")+'">'+opts.map(o=>'<button data-m="'+f+'" data-v="'+esc(o)+'" class="'+(arr.includes(o)?"on":"")+'">'+esc(o)+"</button>").join("")+(none?'<button data-m="'+f+'" data-v="__none" class="none '+(arr.includes("__none")?"on":"")+'">'+esc(none)+"</button>":"")+"</div>";
const q=(label,inner,miss,hint)=>'<div class="q'+(miss?" miss":"")+'"><label class="t">'+esc(label)+"</label>"+(hint?'<p class="small muted">'+esc(hint)+"</p>":"")+inner+"</div>";
const num=(f,val,ph,w)=>'<input type="number" inputmode="decimal" data-n="'+f+'" value="'+esc(val??"")+'" placeholder="'+esc(ph||"")+'" style="width:'+(w||110)+'px">';
const bar=(label,n,d,target,sub)=>{const p=pct(n,d);return "<tr><td>"+esc(label)+(sub?'<div class="small muted">'+esc(sub)+"</div>":"")+'</td><td class="n">'+n+'</td><td class="n">'+d+'</td><td class="n"><b>'+(p==null?"":p+"%")+'</b></td><td><div class="meter"><i style="width:'+(p||0)+'%"></i>'+(target?'<b style="left:'+target+'%"></b>':"")+"</div></td><td class=\"n\">"+(target?"≥ "+target+"%":"")+"</td></tr>";};
const barHead='<tr><th>Indicator</th><th class="n">Number</th><th class="n">Out of</th><th class="n">%</th><th></th><th class="n">Target</th></tr>';
const tbl=(head,rows)=>'<div class="tblwrap"><table><tr>'+head.map(h=>"<th"+(h[0]==="#"?' class="n"':"")+">"+esc(h.replace(/^#/,""))+"</th>").join("")+"</tr>"+rows.join("")+"</table></div>";
const pLink=p=>'<button class="link" data-pid="'+p.id+'">'+esc(p.name)+"</button>";

/* ---------- due list for a Leader Neighbor ---------- */
function tasks(lnId){const out=[];
  for(const h of IX.lnH[lnId]||[]){const ps=(IX.hhP[h.id]||[]).filter(alive);if(!ps.length)continue;
    // due when the referral is urgent or more than 14 days old, and no follow-up has been recorded recently (3 days if urgent, 14 if routine)
    const refs=ps.flatMap(openRef),urgent=refs.filter(r=>{const f=lastFu(r);return(r.urg<3||diff(TODAY,r.d)>14)&&!(f&&diff(TODAY,f.d)<(r.urg<3?3:14));});
    if(urgent.length)out.push({p:1,h,fu:urgent[0].p,t:"Follow up a referral",why:urgent.map(r=>{const f=lastFu(r);return IX.p[r.p].name+": "+rz(r.code)+", referred "+fmtD(r.d)+(f?". Last follow-up "+fmtD(f.d)+": "+FUST[f.st].toLowerCase():". No follow-up recorded yet");}).join("; ")});
    const monthly=hhMonthly(h);
    if(monthly&&(!h.last||mIdx(h.last)!==CUR)){const why=[];let pr=2,first=0;
      for(const p of ps){const l=lastBP(p),lv=S.v.filter(v=>v.p===p.id).pop();
        const st=[p.htn,p.dm].filter(c=>c.rx&&c.rxStart&&!c.rxPre&&diff(TODAY,c.rxStart)<=60&&!(lv&&lv.d>=c.rxStart)).map(c=>c.rxStart).sort()[0];
        if(st){why.push(p.name+": first visit since treatment started on "+fmtD(st));pr=1;first=1;}
        else if((p.htn.dx&&!p.htn.rx)||(p.dm.dx&&!p.dm.rx)){why.push(p.name+": diagnosed, not on treatment");pr=1;}
        else if(inCare(p)&&lv&&lv.med==="n"){why.push(p.name+" said at the last visit that the medicine was not taken every day");pr=1;}
        else if(raisedOnce(p)){why.push(p.name+": re-check a raised reading");pr=1;}
        else if(l&&(l.s>=160||l.di>=100)){why.push(p.name+": last reading "+bpTxt(l));pr=1;}
        else if(onTB(p)){why.push(p.name+": on TB treatment, monthly visit");}
        else if(artLn(p)&&me().role!=="admin"){why.push(p.name+": medicine support, monthly visit");}
        else if(isSurv(p)){const sv=S.v.filter(v=>v.p===p.id&&v.sv).length;why.push(p.name+": "+survTxt(p).toLowerCase()+(sv?", monthly visit":", first visit since this was recorded"));if(!sv)pr=1;}
        else if(isPatient(p))why.push(p.name+": monthly visit");}
      out.push({p:pr,h,first,t:"Monthly home visit",why:why.join("; ")||"Household with a person at risk"});}
    else if(!monthly&&(!h.last||diff(TODAY,h.last)>=CFG.recheck))out.push({p:3,h,t:"Screening visit",why:(h.last?"Last visit "+fmtD(h.last):"Not yet visited")+". Check every adult aged 35 or older."});}
  return out.sort((a,b)=>a.p-b.p||(b.first||0)-(a.first||0)||(a.h.last<b.h.last?-1:1));}
const half=()=>diff(TODAY,mStart(CUR))<15?"first half of the month: group lesson":"second half of the month: home visits";

/* ---------- views ---------- */
function vToday(){const w=me(),ts=tasks(w.id),gm=S.gm.find(g=>g.ln===w.id&&g.m===CUR),L=LESSONS[CUR];
  let h="<h1>Today</h1><p class='muted'>Month "+(CUR+1)+" of 12, "+half()+".</p>";
  h+='<div class="card task '+(gm?"p3":"p2")+'"><h3>Group lesson '+(CUR+1)+"</h3><h2>"+esc(L[0])+"</h2>"+(gm?'<p><span class="chip good">Held on '+fmtD(gm.d)+"</span> "+gm.att+" of "+gm.cohort+" attended.</p>":'<p>Not yet recorded this month.</p><div class="row"><button class="pri" data-tab="group">Record the group meeting</button></div>')+"</div>";
  const n1=ts.filter(t=>t.p===1).length,n2=ts.filter(t=>t.p===2).length,n3=ts.filter(t=>t.p===3).length;
  h+='<div class="grid"><div class="card"><h3>Priority</h3><div class="big">'+n1+'</div></div><div class="card"><h3>Monthly visits left</h3><div class="big">'+n2+'</div></div><div class="card"><h3>Screening visits due</h3><div class="big">'+n3+"</div></div></div>";
  const show=UI.all?ts:ts.slice(0,12);
  h+=show.map(t=>'<div class="card task p'+t.p+'"><div class="row"><div class="grow"><h3>'+esc(t.t)+"</h3><h2>"+esc(t.h.head)+' <span class="muted small">'+esc(t.h.no)+"</span></h2><p class='small'>"+esc(t.why)+'</p></div><div style="display:flex;flex-direction:column;gap:6px">'+(t.fu?'<button class="pri" style="white-space:nowrap" data-act="fu" data-id="'+t.fu+'">Record follow-up</button>':"")+'<button class="'+(t.fu?"":"pri")+'" data-hh="'+t.h.id+'">Open</button></div></div></div>').join("");
  if(ts.length>12&&!UI.all)h+='<button data-act="all">Show all '+ts.length+"</button>";
  if(!ts.length)h+='<div class="note">Nothing is due today.</div>';return h;}

function vHhs(){const ids=scope(),ql=UI.q.toLowerCase();let hs=S.hh.filter(h=>ids.has(h.ln));
  if(ql)hs=hs.filter(h=>(h.head+" "+h.no+" "+(IX.hhP[h.id]||[]).map(p=>p.name).join(" ")).toLowerCase().includes(ql));
  let h='<div class="row"><h1 class="grow">Households</h1>'+(canVisit()?'<button class="pri" data-act="addhh">Add a household</button>':"")+"</div>"+areaSel()+'<input id="q" placeholder="Search by name or house number" value="'+esc(UI.q)+'">';
  const rows=hs.slice(0,UI.all?999:40).map(x=>{const ps=(IX.hhP[x.id]||[]).filter(alive),m=hhMonthly(x);
    return '<tr><td><button class="link" data-hh="'+x.id+'">'+esc(x.head)+'</button><div class="small muted">'+esc(x.no)+"</div></td><td>"+chip(m?["Monthly","info"]:["Screening","good"])+"</td><td>"+ps.filter(isPatient).length+" / "+ps.length+"</td><td>"+fmtD(x.last)+"</td></tr>";});
  h+='<div class="card">'+tbl(["Household","Visits","Patients / adults","Last visit"],rows)+(hs.length>40&&!UI.all?'<button data-act="all">Show all '+hs.length+"</button>":"")+"</div>";return h;}

function vHh(){const h=IX.hh[UI.hh],ps=IX.hhP[h.id]||[],ln=IX.w[h.ln];
  let o='<button class="link" data-act="back">‹ Back</button><h1>'+esc(h.head)+' <span class="muted small">'+esc(h.no)+"</span></h1>";
  o+="<p class='muted'>Leader Neighbor: "+esc(ln.name)+". "+(hhMonthly(h)?"Monthly group lesson and home visit.":"Screening visit about three times a year.")+(h.last?" Last visit "+fmtD(h.last)+".":" Not yet visited.")+" NHIS "+(h.nhis?"active":"not active or not known")+".</p>";
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  for(const p of ps){const l=lastBP(p),refs=openRef(p);
    o+='<div class="card"><div class="row"><div class="grow"><h2>'+esc(p.name)+'</h2><p class="small muted">'+(p.sex==="F"?"Woman":"Man")+", "+p.age+" years"+(p.preg?", pregnant":"")+"</p></div>"+
      (alive(p)&&canVisit()?'<button class="pri" data-act="visit" data-id="'+p.id+'">Start visit</button>':"")+'<button data-pid="'+p.id+'">Health record</button></div>'+
      (p.death?'<p><span class="chip bad">Died '+fmtD(p.death.d)+"</span></p>":p.out?'<p><span class="chip">Moved away</span></p>':'<div class="row">'+chip(htnLabel(p))+chip(dmLabel(p))+(isSurv(p)?chip([survTxt(p),"warn"]):"")+modChips(p,true)+(refs.length?chip(["Referral open since "+fmtD(refs[0].d)+(lastFu(refs[0])?": "+FUST[lastFu(refs[0]).st].toLowerCase():""),"warn"]):"")+(atRisk(p)&&!raisedOnce(p)&&!screenPos(p)?chip(["Raised diabetes risk (score "+riskScore(p).toFixed(1)+")","warn"]):"")+"</div>"+(l?"<p class='small'>Last reading "+bpTxt(l)+" on "+fmtD(l.d)+"</p>":"")+(refs.length&&canFu()?'<div class="row"><button data-act="fu" data-id="'+p.id+'">Referral follow-up</button></div>':""))+"</div>";}
  if(canVisit())o+='<div class="card"><h3>Add an adult to this household</h3><div class="row"><input id="a_name" placeholder="Name" class="grow"><select id="a_sex"><option value="F">Woman</option><option value="M">Man</option></select><input id="a_age" type="number" placeholder="Age" style="width:90px"><button data-act="addp">Add</button></div></div>';
  return o;}

function vPerson(){const p=IX.p[UI.pid],h=IX.hh[p.hh],r=me().role,vs=S.v.filter(v=>v.p===p.id).reverse(),refs=S.ref.filter(x=>x.p===p.id&&rOn(x)).reverse();
  let o='<button class="link" data-act="back">‹ Back</button><h1>'+esc(p.name)+"</h1><p class='muted'>"+(p.sex==="F"?"Woman":"Man")+", "+p.age+" years. Household "+esc(h.no)+" ("+esc(h.head)+"). "+ownTxt(h)+".</p>";
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  o+='<div class="row">'+(p.death?chip(["Died "+fmtD(p.death.d)+": "+p.death.cause,"bad"]):chip(htnLabel(p))+chip(dmLabel(p))+(isSurv(p)?chip([survTxt(p),"warn"]):"")+modChips(p,false))+"</div>";
  if(alive(p)){o+='<div class="row">'+(canVisit()?'<button class="pri" data-act="visit" data-id="'+p.id+'">Start visit</button>':"")+(r==="prom"?'<button class="pri" data-act="pbp" data-id="'+p.id+'">Check blood pressure</button>':"")+(r==="clinic"?'<button class="pri" data-act="clinic" data-id="'+p.id+'">Clinic entry</button>':"")+'<button data-act="event" data-id="'+p.id+'">Record an event, a death or a move</button></div>';
    if(r==="prom")o+='<div class="card"><h3>Fingerstick blood sugar</h3><div class="row">'+num("fs_"+p.id,"","mmol/L")+'<label class="row"><input type="checkbox" id="ff_'+p.id+'" style="min-height:0"> Fasting</label><label class="row"><input type="checkbox" id="fx_'+p.id+'" style="min-height:0"> Danger sign</label><button data-act="finger" data-id="'+p.id+'">Save</button></div><p class="small muted">Danger signs: vomiting, belly pain, drowsy or confused, or deep fast breathing. '+gluRule()+'</p>'+"</div>";}
  o+=modPerson(p);
  if(p.meds.length||p.review)o+='<div class="card"><h3>Treatment (entered by the clinic)</h3>'+(p.meds.length?"<p>"+p.meds.map(esc).join("; ")+"</p>":"")+(p.review?"<p>Next review: "+fmtD(p.review)+(p.review<TODAY?' <span class="chip warn">date has passed</span>':"")+"</p>":"")+"</div>";
  o+='<div class="card"><h3>Blood pressure</h3>'+(p.bp.length?spark(p)+tbl(["Date","Reading","By"],p.bp.slice().reverse().slice(0,8).map(x=>"<tr><td>"+fmtD(x.d)+"</td><td>"+(elev(x)?"<b>"+bpTxt(x)+"</b>":bpTxt(x))+"</td><td>"+esc(SRC[x.src]||"")+"</td></tr>")):"<p class='muted'>No reading yet.</p>")+"</div>";
  if(p.glu.length)o+='<div class="card"><h3>Blood sugar</h3>'+tbl(["Date","Test","Result","By"],p.glu.slice().reverse().map(g=>"<tr><td>"+fmtD(g.d)+"</td><td>"+(g.t==="a1c"?"HbA1c (clinic)":g.t==="fast"?"Fasting venous (clinic)":"Fingerstick"+(g.fast?", fasting":""))+"</td><td>"+(gluPos(g)?"<b>":"")+g.v+(g.t==="a1c"?"%":" mmol/L")+(gluPos(g)?"</b>":"")+"</td><td>"+(g.by==="cl"?"Clinic":"Promoter")+"</td></tr>"))+"</div>";
  if(refs.length)o+='<div class="card"><h3>Referrals</h3>'+tbl(["Date","Reason","Outcome","Follow-up entries"],refs.map(x=>"<tr><td>"+fmtD(x.d)+"</td><td>"+esc(rz(x.code))+"</td><td>"+refOutcome(x)+"</td><td style='min-width:200px'>"+((x.fu||[]).map(fuLine).join("")||'<span class="small muted">None</span>')+"</td></tr>"))+(alive(p)&&canFu()&&refs.some(refOpen)?'<div class="row"><button data-act="fu" data-id="'+p.id+'">Referral follow-up</button></div>':"")+"</div>";
  if(vs.length)o+='<div class="card"><h3>Visits</h3>'+tbl(["Date","Reading","Medicine every day","Page shown","Commitment"],vs.slice(0,8).map(v=>"<tr><td>"+fmtD(v.d)+"</td><td>"+(v.s?v.s+"/"+v.di:"")+"</td><td>"+(v.med==="y"?"Yes":v.med==="n"?"No: "+esc(whyList(v).map(k=>WHY[k][0]).join("; "))+(v.missed&&v.missed.length?'<div class="small muted">Missed: '+esc(v.missed.join("; "))+"</div>":""):"")+"</td><td>"+v.pages.filter(pgShow).map(k=>esc(PAGES[k][1])).join("; ")+"</td><td>"+esc(commitShow(v.commit))+"</td></tr>"))+"</div>";
  const evs=S.ev.filter(e=>e.p===p.id);if(evs.length)o+='<div class="card"><h3>Events</h3>'+evs.map(e=>"<p>"+fmtD(e.d)+": "+esc(e.type)+"</p>").join("")+"</div>";
  return o;}
const ownTxt=h=>{const w=IX.w[h.ln]||{};return(w.role==="enum"?"Census, not yet in a Care Group: ":"Leader Neighbor: ")+esc(w.name||"");};
const SRC={census:"Census",visit:"Leader Neighbor",clinic:"Clinic",prom:"Promoter"};
function spark(p){const a=p.bp.slice(-10);if(a.length<2)return"";const W=300,H=70,x=i=>10+i*(W-20)/(a.length-1),y=v=>H-6-(clamp(v,90,200)-90)*(H-12)/110;
  return '<svg viewBox="0 0 '+W+" "+H+'" style="width:100%;max-width:420px;height:70px" role="img" aria-label="Upper reading over time"><line x1="0" x2="'+W+'" y1="'+y(140)+'" y2="'+y(140)+'" stroke="var(--line)" stroke-dasharray="4 4"/><text x="'+(W-2)+'" y="'+(y(140)-3)+'" text-anchor="end" font-size="10" fill="var(--muted)">140</text><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="'+a.map((r,i)=>x(i)+","+y(r.s)).join(" ")+'"/>'+a.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(r.s)+'" r="3" fill="'+(elev(r)?"var(--bad)":"var(--good)")+'"/>').join("")+"</svg>";}

/* ---------- the home visit: checks and counselling in one flow ---------- */
function startVisit(pid,kind){const p=IX.p[pid],lv=S.v.filter(v=>v.p===pid).pop();
  UI.F={pid,kind,warn:[],askPreg:p.sex==="F"&&p.age<50,preg:null,dxH:p.htn.dx?"y":null,dxD:p.dm.dx?"y":null,r:[["",""],["",""],["",""]],nobp:false,med:null,why:[],medHome:null,review:null,nhis:null,kept:null,low:null,feet:null,
    hxS:null,hxM:null,hxEdit:false,missed:[],tbs:[],tbc:null,hq:null,hoff:null,salt:null,drinks:null,act:"",tob:null,fam:null,prev:null,waist:"",wt:"",commit:[],who:"",fst:null,fwhy:[],fact:null,fnote:"",ffac:"",will:null,last:lv&&commitShow(lv.commit),tried:false,nV:S.v.filter(v=>v.p===pid&&v.kind!=="census").length};UI.mode="visit";}
const whyKeys=F=>Object.keys(WHY).filter(k=>F.why.includes(WHY[k][0]));
/* Stroke and heart attack history in the visit. A question is asked when it has no answer on record, or when the Leader Neighbor taps Change. */
const hxAsk=(F,p,k)=>F.kind!=="prom"&&(F.hxEdit||!p.cvd||p.cvd[k]==null);
const hxVal=(F,p,k)=>hxAsk(F,p,k)?F[k==="st"?"hxS":"hxM"]==="y":!!(p.cvd&&p.cvd[k]);
const hxMiss=(F,p)=>(hxAsk(F,p,"st")&&!F.hxS)||(hxAsk(F,p,"mi")&&!F.hxM);
/* The survivor page is due at the first visit made while the person is flagged, and then at every third such visit. A visit where it was pushed out by other pages does not count as shown. */
function planDue(p){const fv=S.v.filter(v=>v.p===p.id&&v.sv);let last=-1;fv.forEach((v,i)=>{if(v.pages.includes("e_plan_s"))last=i;});return last<0||fv.length-1-last>=2;}
const whyList=v=>v.why?[].concat(v.why):[];
function avgBP(F){const v=F.r.map(x=>[+x[0],+x[1]]),ok=i=>v[i][0]>=60&&v[i][0]<=300&&v[i][1]>=30&&v[i][1]<=200;
  if(!ok(0)||!ok(1))return{need3:false};const far=Math.abs(v[0][0]-v[1][0])>10||Math.abs(v[0][1]-v[1][1])>10;
  if(!far)return{s:Math.round((v[0][0]+v[1][0])/2),di:Math.round((v[0][1]+v[1][1])/2),need3:false};
  if(!ok(2))return{need3:true};return{s:Math.round((v[1][0]+v[2][0])/2),di:Math.round((v[1][1]+v[2][1])/2),need3:true};}
function visitState(){const F=UI.F,p=IX.p[F.pid],a=F.nobp?{}:avgBP(F),warn=F.warn.filter(x=>x!=="__none"),dxH=F.dxH==="y",dx=dxH||F.dxD==="y",surv=F.kind!=="prom"&&(hxVal(F,p,"st")||hxVal(F,p,"mi")),care=dx||surv||(F.kind!=="prom"&&modCare(p));
  const dec0=(a.s!=null||warn.length||(dxH&&F.med==="n"))?decide({id:p.id,htn:{dx:dxH},bp:p.bp,glu:p.glu},a.s??null,a.di??null,warn,F.preg==="y",dxH&&F.med==="n"):null;
  // a person who declined a referral in the last CFG.declineWait days is referred again only if now willing
  const dec=dec0&&dec0.code==="declined"&&F.will==="y"?{urg:3,code:dec0.was,refer:1,t:"The person is now willing to go. Refer to the facility."}:dec0;
  if(dec&&dec.code==="ok"&&surv&&!dxH)dec.t=dec.t.replace("Check again in about four months.","Check again at next month's visit.");
  const find=[],askWill=!!(dec0&&dec0.code==="declined"),orf=F.kind==="prom"?[]:openRef(p).filter(r=>r.d<TODAY);
  if(F.kind!=="prom"){modFind(F,p,find,"pre");
    if(orf.length&&fuNeedsWhy(F))for(const k of fuKeys(F))if(FUPAGE[k]&&!find.includes(FUPAGE[k]))find.push(FUPAGE[k]);
    if(care&&F.med==="n")for(const k of whyKeys(F))if(!find.includes(WHY[k][1]))find.push(WHY[k][1]);
    modFind(F,p,find,"post");
    if(surv&&planDue(p))find.push("e_plan_s");   // after the referral and medicine pages; with three of those it waits for the next visit
    if(F.review==="missed")find.push("c_review");
    if(dec&&dec.code==="recheck")find.push("r_raised");
    if(F.low==="y")find.push("d_low");
    if(F.dxD==="y"&&F.nV%3===0)find.push("d_feet");
    if(p.age>=35&&F.dxD!=="y"&&!p.glu.length)find.push("d_test");
    if(dx&&F.nV%3===1&&!find.length)find.push("c_between");}
  const h=IX.hh[p.hh],monthly=care||hhMonthly(h);
  const pages=(F.kind==="prom"?[]:find.length?find.slice(0,3):[monthly?LESSONS[CUR][3]:(PREV_TOPICS.find(t=>!h.topics.includes(t))||PREV_TOPICS[CUR%5])]).map(k=>k==="e_plan"&&surv?"e_plan_s":k);
  return{p,a,warn,dx,dxH,surv,care,dec,pages,monthly,askWill,orf};}
function pageHtml(k){const P=PAGES[k];return '<div class="card" style="border-width:2px"><img class="pgpic" src="img/'+(PIMG[k]||k)+'.jpg" alt="" loading="lazy" onerror="this.style.display=\'none\'"><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div class="grow"><h3>Counselling page</h3>'+(isModPage(k)?'<p><span class="chip warn">'+MODDRAFT+"</span></p>":"")+'<h2>'+esc(P[1])+'</h2><p style="margin-top:6px"><b>Ask:</b> '+esc(P[2])+'</p></div></div><ul style="margin:0;padding-left:20px;font-size:18px;line-height:1.5">'+P[3].map(m=>"<li>"+esc(m)+"</li>").join("")+"</ul></div>";}
const PGROUPS=[["Medicine",["m_routine","m_forget","m_well","m_side","m_out","m_herbs","m_other"]],["Readings and clinic visits",["n_bp","n_card","r_raised","c_between","c_review"]],["Diabetes",["d_signs","d_test","d_feet","d_low"]],["Food and drink",["k_salt","k_drinks","k_plate"]],["Activity and habits",["w_weight","a_move","t_tobacco","s_stress"]],["Family and emergencies",["f_helpers","f_family","e_plan","e_plan_s"]]];
const PORDER=PGROUPS.flatMap(g=>g[1]);
const commitList=k=>'<div class="card"><h3>Small actions to choose from</h3><ul style="margin:0;padding-left:20px;font-size:17px;line-height:1.5">'+PAGES[k][4].map(c=>"<li>"+esc(c)+"</li>").join("")+"</ul></div>";
function vPages(){const PORDER=porder();if(UI.pg&&!PORDER.includes(UI.pg))UI.pg=null;if(UI.pg){const i=PORDER.indexOf(UI.pg);
    return '<button class="link" data-pg="">‹ All pages</button>'+pageHtml(UI.pg)+commitList(UI.pg)+'<div class="row">'+(i>0?'<button data-pg="'+PORDER[i-1]+'">‹ Previous</button>':"")+(i<PORDER.length-1?'<button class="pri" data-pg="'+PORDER[i+1]+'">Next ›</button>':"")+"</div>";}
  let o="<h1>Counselling pages</h1><p class='muted'>All "+PORDER.length+" pages used in the home visit (the household emergency plan has a second version for stroke and heart attack survivors), for counselling a group at the health facility, at church or elsewhere. Tap a page to show it on its own. Draft text and draft pictures.</p>"+'<div class="row"><button data-act="all">'+(UI.all?"Showing every page in full":"Show every page in full")+"</button></div>";
  for(const [g,ks] of pgroups()){o+='<h2 class="rep">'+esc(g)+"</h2>";
    o+=UI.all?ks.map(k=>pageHtml(k)+commitList(k)).join(""):'<div class="card">'+ks.map(k=>'<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div class="grow"><button class="link" data-pg="'+k+'"><b>'+esc(PAGES[k][1])+'</b></button><p class="small muted">'+esc(PAGES[k][2])+"</p>"+(isModPage(k)?'<p><span class="chip warn">'+MODDRAFT+"</span></p>":"")+"</div></div>").join("")+"</div>";}
  return o;}
function dynHtml(st){const F=UI.F;let b="";
  if(st.a.s!=null)b+='<div class="big">'+st.a.s+"/"+st.a.di+' <span class="small muted" style="font-size:14px">average</span></div>';
  if(st.dec)b+='<div class="note '+(st.dec.urg===1?"bad":st.dec.urg?"warn":st.dec.code==="recheck"||st.dec.code==="recent"?"warn":"")+'">'+(st.dec.urg===1?"<b>Emergency.</b> ":"")+esc(st.dec.t.replace(/^Emergency\. /,""))+"</div>";
  if(st.askWill)b+=q("Is the person willing to go to the facility now?",seg("will",YN,F.will),F.tried&&!F.will);
  return b;}
function commitHtml(st){const F=UI.F,opts=[...new Set(st.pages.flatMap(k=>PAGES[k][4]))];return multi("commit",opts,F.commit,true);}
function vVisit(){const F=UI.F,st=visitState(),p=st.p,prom=F.kind==="prom",miss=k=>F.tried&&k;
  let o='<button class="link" data-act="cancel">‹ Cancel</button><h1>'+(prom?"Blood pressure check: ":"Home visit: ")+esc(p.name)+"</h1><p class='muted'>"+(p.sex==="F"?"Woman":"Man")+", "+p.age+" years. "+(prom?"":"Ask who may stay in the room before you speak about readings or medicines.")+"</p>";
  o+='<div class="card"><h3>Step 1. Greet and ask</h3>'+q("Does the person have any of these today?",multi("warn",WARN,F.warn,false,"None of these"),miss(!F.warn.length))+(F.askPreg?q("Is she pregnant?",seg("preg",YN,F.preg),miss(!F.preg),p.preg?"Recorded as pregnant at an earlier visit.":""):"")+(prom?"":modStep1(F,p,miss))+"</div>";
  o+='<div class="card"><h3>Step 2. Diagnosis and blood pressure</h3>'+q("Has a health worker ever told you that you have high blood pressure?",p.htn.dx?'<p><span class="chip info">Yes, on record</span></p>':seg("dxH",YN,F.dxH),miss(!F.dxH))+
     q("Has a health worker ever told you that you have diabetes, or sugar disease?",p.dm.dx?'<p><span class="chip info">Yes, on record</span></p>':seg("dxD",YN,F.dxD),miss(!F.dxD))+
     (prom?"":[["st","hxS","Has a health worker ever told you that you had a stroke?"],["mi","hxM","Has a health worker ever told you that you had a heart attack?"]].map(([k,f,t])=>hxAsk(F,p,k)?q(t,seg(f,YN,F[f]),miss(!F[f])):q(t,'<p><span class="chip '+(p.cvd[k]?"warn":"")+'">'+(p.cvd[k]?"Yes":"No")+", on record</span></p>")).join("")+
       (!F.hxEdit&&p.cvd&&(p.cvd.st!=null||p.cvd.mi!=null)?'<div class="row"><button data-act="hxedit">Change the stroke and heart attack answers</button><span class="small muted">For when the person mentions a past stroke or heart attack, or an answer on record is wrong.</span></div>':""))+
     '<div class="q'+(miss(!F.nobp&&st.a.s==null)?" miss":"")+'"><label class="t">Blood pressure</label><p class="small muted">Seated, back supported, feet flat, arm at heart level, five minutes of rest. Two readings, one to two minutes apart.</p>'+
     (F.nobp?"":[0,1,2].map(i=>'<div class="row" id="r'+i+'"'+(i===2&&!st.a.need3?" hidden":"")+'><span style="width:110px">'+(i===2?"Third reading":"Reading "+(i+1))+"</span>"+num("r."+i+".0",F.r[i][0],"upper",90)+"<span>/</span>"+num("r."+i+".1",F.r[i][1],"lower",90)+(i===2?'<span class="small muted">The first two differ by more than 10.</span>':"")+"</div>").join(""))+
     '<label class="row"><input type="checkbox" data-c="nobp"'+(F.nobp?" checked":"")+' style="min-height:0"> No reading today (no machine, or the person declined)</label><div id="dyn">'+dynHtml(st)+"</div></div></div>";
  if(!prom){
    if(st.orf.length)o+='<div class="card"><h3>Referral follow-up</h3>'+st.orf.map(refHead).join("")+fuFields(F,F.tried)+"</div>";
    if(st.care){const rev=p.review&&p.review<TODAY;
      o+='<div class="card"><h3>Step 3. Medicine and the last commitment</h3>'+(st.surv?'<div class="note warn"><b>Stroke or heart attack survivor.</b> Ask about every medicine the facility has given. Do not advise the person to start aspirin or any other medicine: that is the clinician\'s decision.</div>':"")+(allMeds(p).length?'<div class="note"><b>Medicines on the clinic\'s record:</b><ul style="margin:4px 0 0;padding-left:20px">'+allMeds(p).map(m=>"<li>"+esc(m)+"</li>").join("")+"</ul>"+(p.review?"Next review: "+fmtD(p.review)+".":"")+"</div>":'<div class="note warn">No medicine is on the clinic\'s record for this person.</div>')+q("Are you taking your medicine every day?",seg("med",YN,F.med),miss(!F.med),allMeds(p).length>1?"Ask about each medicine listed above.":"")+
        (F.med==="n"&&allMeds(p).length?q("Which ones are being missed?",multi("missed",allMeds(p),F.missed,true,"Not sure which"),miss(!F.missed.length),"Tap every one that applies."):"")+
        (F.med==="n"?q("What are the reasons? Tap every one that applies.",multi("why",Object.values(WHY).map(v=>v[0]),F.why,true),miss(!F.why.length)):"")+
        q("Is the "+(st.dxH&&F.dxD==="y"?"blood pressure and diabetes ":st.dxH?"blood pressure ":F.dxD==="y"?"diabetes ":"")+"medicine from the health facility in the house today?",seg("medHome",YN,F.medHome),false,"Ask to see it.")+q("Is the NHIS card active?",seg("nhis",[["y","Yes"],["n","No"],["u","Not sure"]],F.nhis))+modStep3(F,p,miss)+
        (rev?q("The review date ("+fmtD(p.review)+") has passed. Did you go?",seg("review",[["kept","Yes"],["missed","No"]],F.review)):"")+
        (F.dxD==="y"?q("Since my last visit, have you been shaky, sweaty or confused before a meal?",seg("low",YN,F.low))+(F.nV%3===0?q("Feet: any sore, blister or dark spot?",seg("feet",[["ok","None seen"],["sore","Yes"]],F.feet),0,"Look at both feet together, with a family member."):""):"")+
        (F.last?q("Last time you chose: \""+F.last+"\". Did you manage?",seg("kept",[["y","Yes"],["p","Partly"],["n","No"]],F.kept)):"")+"</div>";}
    const hab=p.age>=35&&(F.nV%3===0||!p.hab),risk=p.age>=35&&!st.dx&&!p.riskD;
    if(hab||risk)o+='<div class="card"><h3>Habits and risk</h3>'+
      (hab?q("Was salt added at the table yesterday?",seg("salt",YN,F.salt))+q("Sweet drinks yesterday (minerals, malt, sweetened juice)",seg("drinks",[["0","None"],["1","One"],["2","Two or more"]],F.drinks))+q("Days in the last 7 with 30 minutes of brisk walking or other activity",num("act",F.act,"0 to 7",90))+q("Do you smoke or use tobacco?",seg("tob",YN,F.tob)):"")+
      (risk?q("Does a parent, brother or sister have diabetes?",seg("fam",YN,F.fam))+q("Has a health worker ever said that your sugar was high?",seg("prev",YN,F.prev)):"")+
      (imp()?q("Waist (inches) and weight (pounds), measured in private",'<div class="row">'+num("waistIn",F.waistIn,"waist in")+num("wtLb",F.wtLb,"weight lb")+"</div>",0,"Leave empty if not measured today."):q("Waist (cm) and weight (kg), measured in private",'<div class="row">'+num("waist",F.waist,"waist cm")+num("wt",F.wt,"weight kg")+"</div>",0,"Leave empty if not measured today."))+"</div>";
    o+=modPrivate(F,p,miss);
    o+='<div class="card"><h3>Step 4. Ask, listen and share the messages that fit</h3><p class="small muted">'+(st.monthly?"A page opened by today's findings comes first. With no finding, the page follows up this month's group lesson: "+esc(LESSONS[CUR][0])+".":"Screening visit: one prevention topic this household has not yet heard.")+'</p></div><div id="pages">'+st.pages.map(pageHtml).join("")+"</div>";
    o+='<div class="card"><h3>Step 5. Agree on one or two small actions</h3><p class="small muted">Ask what would make the action hard, and help to solve it.</p><div id="commit">'+commitHtml(st)+'</div><input data-t="who" value="'+esc(F.who)+'" placeholder="A family member who also commits, and to what (optional)"></div>';}
  o+='<div class="card"><h3>'+(prom?"Record":"Step 6. Record, refer and plan")+"</h3>"+(F.tried?'<div class="note bad">Please complete the items marked with *.</div>':"")+'<div class="row"><button class="pri tap" data-act="save">Save the visit</button></div></div>';
  return o;}
function saveVisit(){const F=UI.F,st=visitState(),p=st.p,h=IX.hh[p.hh],prom=F.kind==="prom";
  if(!F.warn.length||!F.dxH||!F.dxD||(F.askPreg&&!F.preg)||(!F.nobp&&st.a.s==null)||(!prom&&hxMiss(F,p))||(!prom&&st.care&&(!F.med||(F.med==="n"&&(!F.why.length||(allMeds(p).length&&!F.missed.length)))))||(!prom&&modMiss(F,p))||(st.orf.length&&!fuOk(F))||(st.askWill&&!F.will)){F.tried=true;return render();}
  if(F.dxH==="y"&&!p.htn.dx)p.htn={dx:true,src:"self",dxDate:TODAY};if(F.dxD==="y"&&!p.dm.dx)p.dm={dx:true,src:"self",dxDate:TODAY};
  if(F.askPreg)p.preg=F.preg==="y";
  if(!prom&&(hxAsk(F,p,"st")||hxAsk(F,p,"mi"))){const was=isSurv(p),c={st:hxVal(F,p,"st"),mi:hxVal(F,p,"mi")};c.d=(c.st||c.mi)?(was&&p.cvd.d)||TODAY:null;c.by=UI.who;p.cvd=c;}
  // decide before today's reading is stored, so "raised on a second day" counts earlier days only
  const dec=st.dec;const v={id:uid("v"),d:TODAY,hh:h.id,p:p.id,by:UI.who,kind:prom?"prom":st.monthly?"home":"screen",warn:st.warn,pages:st.pages,med:st.care?F.med:null,why:st.care&&F.med==="n"?whyKeys(F):null,medHome:F.medHome==="y",nhis:F.nhis==="y",kept:F.kept==="y",commit:commitKeep(F.commit.join("; ")),who:F.who,act:dec&&dec.code};
  if(st.care&&F.med==="n"&&allMeds(p).length)v.missed=F.missed.includes("__none")?["Not sure which"]:F.missed.slice();if(st.surv)v.sv=1;
  if(st.orf.length){v.fu=F.fst;addFu(st.orf,F);}if(st.askWill)v.will=F.will;const held=!!declinedRecently(p)&&F.will!=="y";
  if(st.a.s!=null){p.bp.push({d:TODAY,s:st.a.s,di:st.a.di,by:UI.who,src:prom?"prom":"visit"});v.s=st.a.s;v.di=st.a.di;}
  if(!prom){if(F.med==="y"){if(p.htn.dx&&!p.htn.rx){p.htn.rx=true;p.htn.rxStart=p.htn.rxStart||TODAY;}}
    if(F.nhis==="y")h.nhis=true;else if(F.nhis==="n")h.nhis=false;
    if(F.salt||F.drinks||F.act!==""||F.tob){(p.hab=p.hab||[]).push({d:TODAY,salt:F.salt==="y",drinks:+F.drinks||0,act:clamp(+F.act||0,0,7),tob:F.tob==="y"});p.inactive=(+F.act||0)<3;}
    if(F.fam){p.fam=F.fam==="y";p.riskD=TODAY;}if(F.prev)p.prevSugar=F.prev==="y";if(imp()){if(+F.waistIn)p.waist=inCm(+F.waistIn);if(+F.wtLb)p.wt=lbKg(+F.wtLb);}else{if(+F.waist)p.waist=+F.waist;if(+F.wt)p.wt=+F.wt;}
    h.last=TODAY;if(!st.monthly&&!h.topics.includes(st.pages[0]))h.topics.push(st.pages[0]);}
  S.v.push(v);let note=[p.name+": visit saved."+(dec?" "+dec.t:""),dec&&dec.urg===1?"bad":dec&&dec.refer?"warn":""];
  // A routine referral is not added while another referral is open. An emergency or prompt referral is always added,
  // whatever happened to an earlier one (unless one at least as urgent was already made today).
  const mk=(code,urg)=>{if(openRef(p).some(r=>urg>=3||(r.urg<=urg&&r.d===TODAY)))return;S.ref.push({id:uid("r"),p:p.id,d:TODAY,by:UI.who,code,urg});};
  if(dec&&dec.refer){mk(dec.code,dec.urg);note[0]+=" A referral is on the clinic's list.";}
  else if(!prom&&F.dxD==="y"&&F.med==="n"&&!seenRecently(p)&&!held){mk("relink",3);note=[p.name+": visit saved. Refer back to the facility: diabetes medicine is not being taken.","warn"];}
  if(F.feet==="sore"){mk("feet",2);note=[note[0]+" Foot sore: to be seen by a health worker today.","warn"];}
  if(F.med==="n"&&whyKeys(F).includes("side")&&!(dec&&dec.refer)&&!seenRecently(p)&&!held)mk("side",3);
  // A stroke or heart attack survivor who is not taking the medicine every day, or who has no medicine on the clinic's record and has not been seen at the facility since being flagged:
  // a routine referral for the clinician to review the medicines. The same limits apply as for other routine referrals.
  if(!prom&&st.surv&&!(dec&&dec.refer)&&!seenRecently(p)&&!held){const since=p.cvd.d||TODAY,seenSince=S.ref.some(r=>r.p===p.id&&r.seen&&r.seen>=since)||p.bp.some(r=>r.src==="clinic"&&r.d>=since)||p.glu.some(g=>g.by==="cl"&&g.d>=since);
    if((F.med==="n"||(!p.meds.length&&!seenSince))&&!openRef(p).length){mk("survmed",3);note=[note[0]+" Referred to the facility for a review of medicines after a stroke or heart attack. The health worker decides which medicines are needed.","warn"];}}
  if(!prom)note[0]+=modSave(F,p,v);
  UI.F=null;UI.mode=prom?"person":"hh";UI.hh=h.id;UI.note=note;render();}

/* ---------- clinic entry ---------- */
function vClinic(){const F=UI.F,p=IX.p[F.pid],refs=openRef(p);
  let o='<button class="link" data-act="cancel">‹ Cancel</button><h1>Clinic entry: '+esc(p.name)+"</h1><p class='muted'>"+(p.sex==="F"?"Woman":"Man")+", "+p.age+" years."+(refs.length?" Referred on "+fmtD(refs[0].d)+": "+esc(rz(refs[0].code))+".":"")+"</p>";
  o+='<div class="card"><h3>Blood pressure at the clinic</h3><div class="row">'+num("cs",F.cs,"upper",90)+"<span>/</span>"+num("cd",F.cd,"lower",90)+"</div>"+q("Hypertension",seg("htn",[["yes","Confirmed"],["no","Not hypertension"],["same","No change"]],F.htn))+"</div>";
  o+='<div class="card"><h3>Laboratory test for diabetes</h3>'+q("Test done",seg("lab",[["none","None today"],["fast","Fasting venous glucose"],["a1c","HbA1c"]],F.lab))+(F.lab!=="none"?q("Result ("+(F.lab==="a1c"?"%":"mmol/L")+")",num("labv",F.labv,F.lab==="a1c"?"%":"mmol/L"),0,"For reference: HbA1c of 6.5% or more, or fasting glucose of 7.0 mmol/L or more, meets the WHO definition of diabetes. The clinician decides."):"")+q("Diabetes",seg("dm",[["yes","Confirmed"],["no","Not diabetes"],["same","No change"]],F.dm))+"</div>";
  o+=modClinic(F,p);
  o+='<div class="card"><h3>Medicines prescribed</h3>'+multi("meds",MEDS,F.meds,true)+q("Next review date",'<input type="date" data-t="review" value="'+esc(F.review)+'">')+'<textarea data-t="note" placeholder="Note for the Promoter and the Leader Neighbor (optional)">'+esc(F.note)+'</textarea></div><div class="card"><button class="pri tap" data-act="saveclinic">Save</button></div>';return o;}
function saveClinic(){const F=UI.F,p=IX.p[F.pid];
  if(+F.cs&&+F.cd)p.bp.push({d:TODAY,s:+F.cs,di:+F.cd,by:"cl",src:"clinic"});
  if(F.lab!=="none"&&+F.labv)p.glu.push({d:TODAY,t:F.lab,v:+F.labv,by:"cl"});
  const bpMed=F.meds.some(m=>MEDS.indexOf(m)<4),dmMed=F.meds.some(m=>[4,5,6].includes(MEDS.indexOf(m)));
  if(F.htn==="yes"){if(!p.htn.dx||p.htn.src==="self"&&!p.htn.base)p.htn={...p.htn,dx:true,src:"clinic",dxDate:p.htn.dxDate||TODAY};}else if(F.htn==="no"&&!p.htn.dx)p.htn.ruledOut=TODAY;
  if(F.dm==="yes"){if(!p.dm.dx)p.dm={dx:true,src:"clinic",dxDate:TODAY};}else if(F.dm==="no"&&!p.dm.dx)p.dm.ruledOut=TODAY;
  if(p.htn.dx&&bpMed){p.htn.rx=true;p.htn.rxStart=p.htn.rxStart||TODAY;}if(p.dm.dx&&dmMed){p.dm.rx=true;p.dm.rxStart=p.dm.rxStart||TODAY;}
  if(F.meds.length)p.meds=F.meds.slice();if(F.review)p.review=F.review;if(F.note)p.cnote=F.note;
  modSaveClinic(F,p);
  for(const r of openRef(p))r.seen=TODAY;UI.F=null;UI.mode="person";UI.note=[p.name+": clinic entry saved. Open referrals are marked as seen.",""];render();}

/* ---------- events, deaths, moves ---------- */
function vEvent(){const F=UI.F,p=IX.p[F.pid];
  return '<button class="link" data-act="cancel">‹ Cancel</button><h1>Record for '+esc(p.name)+'</h1><div class="card">'+q("What happened?",seg("type",EVENTS.concat(["Death","Moved away"]).map(x=>[x,x]),F.type))+q("Date",'<input type="date" data-t="d" value="'+esc(F.d)+'" max="'+TODAY+'">')+(F.type==="Death"?q("Cause, as the family or the facility reports it",seg("cause",CAUSES.map(x=>[x,x]),F.cause)):"")+'<button class="pri" data-act="saveevent">Save</button></div>';}
function saveEvent(){const F=UI.F,p=IX.p[F.pid];if(!F.type)return;
  if(F.type==="Death")p.death={d:F.d,cause:F.cause||"Not known"};else if(F.type==="Moved away")p.out=F.d;else{S.ev.push({id:uid("e"),p:p.id,d:F.d,type:F.type});
    if(F.type===EVENTS[0]||F.type===EVENTS[1]){const k=F.type===EVENTS[0]?"st":"mi";p.cvd=Object.assign({},p.cvd,{[k]:true,d:(isSurv(p)&&p.cvd.d)||TODAY});}}
  UI.F=null;UI.mode="person";UI.note=["Recorded.",""];render();}

/* ---------- group lesson ---------- */
function vGroup(){const w=me(),L=LESSONS[CUR],gm=S.gm.find(g=>g.ln===w.id&&g.m===CUR),hs=(IX.lnH[w.id]||[]).filter(hhMonthly);
  const cohort=hs.flatMap(h=>IX.hhP[h.id].filter(p=>alive(p)&&(inCare(p)||atRisk(p))));UI.G=UI.G||{att:[]};
  let o="<h1>Group lesson "+(CUR+1)+": "+esc(L[0])+"</h1><p class='muted'>Taught in the first half of the month to your cohort of patients and adults at risk, each with one household member.</p>";
  o+='<div class="card"><h3>What people will do</h3><p>'+esc(L[1])+"</p><h3>Activity</h3><p>"+esc(L[2])+'</p><p class="small muted">The full lesson, with its story and pictures, opens in the separate Care Group flipchart.</p></div>';
  if(gm)o+='<div class="note">Held on '+fmtD(gm.d)+". "+gm.att+" of "+gm.cohort+" attended.</div>";
  else o+='<div class="card"><h3>Who attended? ('+cohort.length+' in your cohort)</h3>'+multi("gatt",cohort.map(p=>p.name),UI.G.att,true)+'<button class="pri" data-act="savegroup">Save the meeting ('+UI.G.att.length+" present)</button></div>";
  o+='<div class="card"><h3>The year</h3>'+tbl(["#Month","Lesson","Held","#Attended"],LESSONS.map((x,i)=>{const g=S.gm.find(g=>g.ln===w.id&&g.m===i);return "<tr><td class='n'>"+(i+1)+"</td><td>"+esc(x[0])+"</td><td>"+(g?fmtD(g.d):i<CUR?'<span class="chip warn">not held</span>':"")+"</td><td class='n'>"+(g?g.att+" of "+g.cohort:"")+"</td></tr>";}))+"</div>";return o;}

/* ---------- supervision: Trainers and Promoters ---------- */

/* ---------- lists for Promoters and the clinic ---------- */
function areaSel(){const w=me();if(w.role==="ln")return"";const ids=lnsOf(w);let o='<div class="row"><label>Area <select id="area"><option value="all">All</option>';
  if(w.role!=="lnt")for(const c of [...new Set(S.w.filter(x=>x.role==="lnt"&&(w.role!=="prom"||x.prom===w.id)).map(x=>x.cg))].sort((a,b)=>a-b))o+='<option value="cg'+c+'"'+(UI.area==="cg"+c?" selected":"")+">Care Group "+c+"</option>";
  else for(const i of ids)o+='<option value="'+i+'"'+(UI.area===i?" selected":"")+">"+esc(IX.w[i].name)+"</option>";return o+"</select></label></div>";}
const inScope=()=>{const ids=scope();return S.p.filter(p=>ids.has(IX.hh[p.hh].ln)&&alive(p));};
function vScreen(){const ps=inScope().filter(p=>p.age>=35&&!p.dm.dx&&!fingers(p).length);
  let o="<h1>Screening day</h1>"+areaSel()+"<p class='muted'>Adults aged 35 or older with no fingerstick result: "+ps.length+". Enter the result in mmol/L. A random result of "+CFG.glu.rand+" or more, or a fasting result of "+CFG.glu.fast.toFixed(1)+" or more, sends the person to the clinic for a laboratory test.</p>"+'<div class="note warn"><b>Before each test, ask about danger signs: vomiting, belly pain, drowsy or confused, or deep fast breathing.</b> '+gluRule()+"</div>";
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  o+='<div class="card">'+tbl(["Person","Leader Neighbor","Result (mmol/L)","Fasting","Danger sign",""],ps.slice(0,UI.all?999:25).map(p=>"<tr><td>"+pLink(p)+'<div class="small muted">'+p.age+" years</div></td><td>"+esc(IX.w[IX.hh[p.hh].ln].name)+"</td><td>"+num("fs_"+p.id,"","mmol/L",100)+'</td><td><input type="checkbox" id="ff_'+p.id+'" style="min-height:0"></td><td><input type="checkbox" id="fx_'+p.id+'" style="min-height:0"></td><td><button data-act="finger" data-id="'+p.id+'">Save</button></td></tr>'))+(ps.length>25&&!UI.all?'<button data-act="all">Show all '+ps.length+"</button>":"")+"</div>";return o;}
/* Fingerstick rules. Low: ADA levels 1 and 2 (below 3.9 and below 3.0 mmol/L). High with danger signs: 2024 ADA/EASD consensus on hyperglycaemic crises.
   Very high: WHO HEARTS-D (2020) urgent-referral level. All drafts for clinical review. */
const gluRule=()=>"Same-day referral: "+CFG.glu.emerg+" or more; "+CFG.glu.sick+" or more with a danger sign; below "+CFG.glu.vlow.toFixed(1)+"; or below "+CFG.glu.low+" with a danger sign. Below "+CFG.glu.low+": give sugar at once.";
const SUGAR="Give quick sugar now: 3 teaspoons of sugar stirred into a glass of water, or half a glass of a sweet soft drink or juice. Do this only if the person is awake and can swallow. Check again after 15 minutes and repeat up to 3 times. Then give a snack or a meal.";
function saveFinger(id){const p=IX.p[id],v=+($('[data-n="fs_'+id+'"]')||{}).value,fast=($("#ff_"+id)||{}).checked,sick=!!($("#fx_"+id)||{}).checked;if(!(v>=1&&v<=40))return;
  const g={d:TODAY,t:"finger",fast:!!fast,v,by:UI.who};if(sick)g.sick=true;p.glu.push(g);let n=[p.name+": "+v+" mmol/L saved. In the normal range for a screening test.",""];
  // an emergency or prompt referral is always added, unless one at least as urgent was already made today
  const ref=(code,urg)=>{if(!openRef(p).some(r=>r.d===TODAY&&r.urg<=urg))S.ref.push({id:uid("r"),p:p.id,d:TODAY,by:UI.who,code,urg});};
  const E="EMERGENCY: send the person to the facility today, with someone to go with them. If the person cannot be woken, cannot swallow or has a fit, call an ambulance.";
  if(v<CFG.glu.low){const vlo=v<CFG.glu.vlow;
    if(vlo||sick){ref(vlo?"gluvlo":"glulo",1);n=[p.name+": "+v+" mmol/L is "+(vlo?"very ":"")+"low"+(sick?", with a danger sign":"")+". "+SUGAR+" "+E,"bad"];}
    else{ref("glulo",2);n=[p.name+": "+v+" mmol/L is low. "+SUGAR+" If it is still below "+CFG.glu.low+" after the third try, or the person becomes drowsy or confused, send the person to the facility now. Referred to the clinic within days to review the medicine.","bad"];}}
  else if(v>=CFG.glu.emerg||(sick&&v>=CFG.glu.sick)){ref(v>=CFG.glu.emerg?"gluhi":"gluill",1);
    n=[p.name+": "+v+" mmol/L is "+(v>=CFG.glu.emerg?"very high":"high, with a danger sign")+". "+E+" Do not wait for a second test.","bad"];}
  else if(gluPos(g)&&!p.dm.dx){if(!openRef(p).length)S.ref.push({id:uid("r"),p:p.id,d:TODAY,by:UI.who,code:"glu",urg:3});n=[p.name+": "+v+" mmol/L is raised. Referred to the clinic for a laboratory test. One result is not a diagnosis.","warn"];}
  n[2]=p.id;UI.note=n;render();}
function vRecheck(){const cz=S.p.filter(p=>alive(p)&&(IX.w[IX.hh[p.hh].ln]||{}).role==="enum"),ps=inScope().concat(cz).filter(p=>raisedOnce(p)&&!openRef(p).length).sort((a,b)=>lastBP(b).s-lastBP(a).s);
  let o="<h1>Blood pressure re-checks</h1>"+areaSel()+"<p class='muted'>People never diagnosed whose last reading was raised and who have no open referral: "+ps.length+". A second raised reading on another day leads to referral."+(cz.length?" People with a raised reading at the census are included ("+ps.filter(p=>cz.includes(p)).length+"): check them in the weeks after the census, before the Leader Neighbors start their visits.":"")+"</p>";
  o+='<div class="card">'+tbl(["Person","Leader Neighbor or census pair","Last reading","Raised on",""],ps.slice(0,UI.all?999:30).map(p=>{const l=lastBP(p);return "<tr><td>"+pLink(p)+'<div class="small muted">'+p.age+" years"+(IX.hh[p.hh].cen?". "+esc(IX.hh[p.hh].no)+(IX.hh[p.hh].cen.lm?", "+esc(IX.hh[p.hh].cen.lm):"")+(IX.hh[p.hh].cen.ph?", phone "+esc(IX.hh[p.hh].cen.ph):""):"")+"</div></td><td>"+esc(IX.w[IX.hh[p.hh].ln].name)+"</td><td><b>"+bpTxt(l)+"</b> "+fmtD(l.d)+"</td><td>"+elevDays(p)+' day(s)</td><td><button data-act="pbp" data-id="'+p.id+'">Check</button></td></tr>';}))+(ps.length>30&&!UI.all?'<button data-act="all">Show all '+ps.length+"</button>":"")+"</div>";return o;}
/* ---------- referral follow-up ---------- */
const canFu=()=>["ln","lnt","prom"].includes(me().role),canClose=()=>["lnt","prom"].includes(me().role);
const fuNeedsWhy=F=>F.fst==="not"||F.fst==="wont";
const fuKeys=F=>Object.keys(FUWHY).filter(k=>F.fwhy.includes(FUWHY[k]));
const fuOk=F=>!!F.fst&&(!fuNeedsWhy(F)||F.fwhy.length>0)&&(F.fst!=="not"||!!F.fact);
const wName=id=>IX.w[id]?IX.w[id].name:id==="pr"?"Promoter":id==="cl"?"Clinic":"";
const facNames=()=>[...new Set(S.ref.flatMap(r=>(r.fu||[]).map(f=>f.fac).concat(r.closed?[r.closed.fac]:[])).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const facInput=(key,val)=>'<div class="q"><label class="t">Name of the other facility</label><input data-t="'+key+'" list="faclist" value="'+esc(val||"")+'" placeholder="Choose from the list, or type a new name" autocomplete="off" style="width:100%"><datalist id="faclist">'+facNames().map(n=>'<option value="'+esc(n)+'">').join("")+"</datalist></div>";
const fuTxt=f=>FUST[f.st]+(f.fac?" ("+f.fac+")":"")+(f.why&&f.why.length?". Reasons: "+f.why.map(k=>FUWHY[k]).join("; "):"")+(f.act||f.note?". Action: "+[f.act?FUACT[f.act]:"",f.note].filter(Boolean).join(": "):"");
const fuLine=f=>'<div class="small">'+fmtD(f.d)+(wName(f.by)?" ("+esc(wName(f.by))+")":"")+": "+esc(fuTxt(f))+".</div>";
const refOutcome=r=>r.seen?'<span class="chip good">Seen at the facility '+fmtD(r.seen)+"</span>":r.closed?'<span class="chip '+(r.closed.how==="declined"?"bad":"info")+'">'+CLOSED[r.closed.how]+(r.closed.how==="elsewhere"?" (self-reported)":"")+" "+fmtD(r.closed.d)+"</span>"+(r.closed.fac?'<div class="small">'+esc(r.closed.fac)+"</div>":"")+(r.closed.note?'<div class="small muted">'+esc(r.closed.note)+"</div>":""):'<span class="chip warn">Open</span>';
const refHead=r=>'<p class="small"><b>'+esc(rz(r.code))+"</b>, referred "+fmtD(r.d)+(wName(r.by)?" by "+esc(wName(r.by)):"")+", "+diff(TODAY,r.d)+" days ago.</p>"+((r.fu||[]).map(fuLine).join("")||'<p class="small muted">No follow-up recorded yet.</p>');
function fuFields(F,tried){return q("Has the person been to the facility since the referral?",seg("fst",Object.entries(FUST),F.fst),tried&&!F.fst)+(F.fst==="other"?facInput("ffac",F.ffac):"")+
  (fuNeedsWhy(F)?q("Reasons for not going. Tap every one that applies.",multi("fwhy",Object.values(FUWHY),F.fwhy,true),tried&&!F.fwhy.length,"Ask, and listen without scolding."):"")+
  (F.fst?q("Action agreed"+(F.fst==="not"?"":" (if any)"),seg("fact",Object.entries(FUACT),F.fact),tried&&F.fst==="not"&&!F.fact)+'<input data-t="fnote" value="'+esc(F.fnote)+'" placeholder="Short note: who will do what, and when (optional)" style="width:100%">':"");}
function addFu(refs,F){const e={d:TODAY,t:Date.now(),by:UI.who,st:F.fst,why:fuNeedsWhy(F)?fuKeys(F):[],act:F.fact||null,note:(F.fnote||"").trim()};if(F.fst==="other"&&(F.ffac||"").trim())e.fac=F.ffac.trim();for(const r of refs)r.fu=(r.fu||[]).concat([e]);return e;}
function fuBack(){const f=UI.fuFrom||[];UI.fuFrom=null;if(f[1])UI.tab=f[1];return f[0]==="hh"||f[0]==="person"?f[0]:null;}
function vFu(){const F=UI.F,p=IX.p[F.pid],h=IX.hh[p.hh],refs=openRef(p);
  let o='<button class="link" data-act="cancel">‹ Cancel</button><h1>Referral follow-up: '+esc(p.name)+"</h1><p class='muted'>"+(p.sex==="F"?"Woman":"Man")+", "+p.age+" years. Household "+esc(h.no)+" ("+esc(h.head)+"). Leader Neighbor: "+esc(IX.w[h.ln].name)+". Last reading "+bpTxt(lastBP(p))+".</p>";
  if(!refs.length)return o+'<div class="note">This person has no open referral.</div>';
  o+='<div class="card"><h3>Open referral'+(refs.length>1?"s":"")+"</h3>"+refs.map(refHead).join("<hr>")+"</div>";
  o+='<div class="card"><h3>New follow-up entry</h3>'+fuFields(F,F.tried)+(F.tried&&!fuOk(F)?'<div class="note bad">Please complete the items marked with *.</div>':"")+'<div class="row"><button class="pri tap" data-act="savefu">Save the follow-up</button></div></div>';
  if(canClose())o+='<div class="card"><h3>Close the referral</h3><p class="small muted">Only a Trainer or a Promoter closes a referral. A clinic entry still closes it as seen at the facility. <b>Declined:</b> the person has decided not to go; a raised reading then creates no new routine referral for '+CFG.declineWait+' days unless the person says he or she is now willing. <b>Seen elsewhere:</b> the person reports care at another facility (self-reported). A warning sign or an emergency reading always creates a new referral.</p>'+
    q("Close as",seg("close",Object.entries(CLOSED),F.close),F.ctried&&!F.close)+(F.close==="elsewhere"?facInput("cfac",F.cfac):"")+'<input data-t="cnote" value="'+esc(F.cnote)+'" placeholder="Note (optional)" style="width:100%"><div class="row"><button data-act="closefu">Close the referral</button></div></div>';
  return o;}
function saveFu(){const F=UI.F,p=IX.p[F.pid];if(!canFu()||!fuOk(F)){F.tried=true;return render();}
  const e=addFu(openRef(p),F);UI.note=[p.name+": follow-up saved. "+FUST[e.st]+".",""];UI.F=null;UI.mode=fuBack();render();}
function closeFu(){const F=UI.F,p=IX.p[F.pid];if(!canClose())return;if(!F.close){F.ctried=true;return render();}
  for(const r of openRef(p)){r.closed={d:TODAY,by:UI.who,how:F.close,note:(F.cnote||"").trim()};if(F.close==="elsewhere"&&(F.cfac||"").trim())r.closed.fac=F.cfac.trim();}
  UI.note=[p.name+": referral closed as "+CLOSED[F.close].toLowerCase()+".",""];UI.F=null;UI.mode=fuBack();render();}
function vRefs(){const ids=scope(),wide=["admin","clinic"].includes(me().role),mine=r=>rOn(r)&&IX.p[r.p]&&(ids.has(IX.hh[IX.p[r.p].hh].ln)||(wide&&(IX.w[IX.hh[IX.p[r.p].hh].ln]||{}).role==="enum"))&&alive(IX.p[r.p]),rs=S.ref.filter(r=>refOpen(r)&&mine(r)).sort((a,b)=>a.urg-b.urg||(a.d<b.d?-1:1)),cl=me().role==="clinic",fu=canFu();
  const none=rs.filter(r=>!lastFu(r)).length,done=S.ref.filter(r=>r.closed&&!r.seen&&mine(r)&&diff(TODAY,r.closed.d)<=60).sort((a,b)=>a.closed.d<b.closed.d?1:-1);
  let o="<h1>Open referrals</h1>"+areaSel();
  if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  o+="<p class='muted'>"+rs.length+" referrals not yet recorded as seen at the facility and not closed. "+none+" of them have no follow-up entry yet.</p>";
  // one card per referral, so that the latest follow-up is readable on a phone as well as on a tablet
  o+=rs.slice(0,UI.all?999:40).map(r=>{const p=IX.p[r.p],dd=diff(TODAY,r.d),f=lastFu(r);
    return '<div class="card"><div class="row" style="align-items:flex-start"><div class="grow"><h2 style="margin:0">'+pLink(p)+"</h2><p class='small muted' style='margin:2px 0 6px'>"+p.age+" years, last reading "+bpTxt(lastBP(p))+". "+ownTxt(IX.hh[p.hh])+".</p>"+
      '<div class="row">'+chip([rz(r.code),r.urg===1?"bad":r.urg===2?"warn":"info"])+'<span class="small">Referred '+fmtD(r.d)+", "+(dd>14?"<b>"+dd+" days</b>":dd+" day"+(dd===1?"":"s"))+" ago</span></div></div>"+
      (cl?'<button data-act="clinic" data-id="'+p.id+'">Clinic entry</button>':fu?'<button class="pri" style="white-space:nowrap" data-act="fu" data-id="'+p.id+'">Follow up</button>':"")+"</div>"+
      '<div style="margin-top:8px">'+(f?chip([FUST[f.st],f.st==="wont"?"bad":f.st==="not"?"warn":"info"])+' <span class="small muted">'+fmtD(f.d)+(wName(f.by)?", "+esc(wName(f.by)):"")+((r.fu||[]).length>1?", entry "+r.fu.length+" of "+r.fu.length:"")+"</span>"+(f.fac?'<div class="small"><b>Facility:</b> '+esc(f.fac)+"</div>":"")+(f.why&&f.why.length?'<div class="small"><b>Reasons:</b> '+esc(f.why.map(k=>FUWHY[k]).join("; "))+"</div>":"")+(f.act||f.note?'<div class="small"><b>Action:</b> '+esc([f.act?FUACT[f.act]:"",f.note].filter(Boolean).join(": "))+"</div>":""):'<span class="chip">No follow-up yet</span>')+"</div></div>";}).join("")+(rs.length>40&&!UI.all?'<button data-act="all">Show all '+rs.length+"</button>":"");
  if(done.length)o+='<h2 class="rep">Closed in the last 60 days without a facility visit</h2><div class="card">'+tbl(["Person","Reason","Referred","Closed as","Closed","By"],done.slice(0,40).map(r=>{const p=IX.p[r.p];return "<tr><td>"+pLink(p)+"</td><td>"+esc(rz(r.code))+"</td><td>"+fmtD(r.d)+"</td><td>"+chip([CLOSED[r.closed.how]+(r.closed.how==="elsewhere"?" (self-reported)":""),r.closed.how==="declined"?"bad":"info"])+(r.closed.fac?'<div class="small">'+esc(r.closed.fac)+"</div>":"")+(r.closed.note?'<div class="small muted">'+esc(r.closed.note)+"</div>":"")+"</td><td>"+fmtD(r.closed.d)+"</td><td>"+esc(wName(r.closed.by))+"</td></tr>";}))+"</div>";
  return o;}
function vPatients(){const ql=UI.q.toLowerCase();let ps=S.p.filter(p=>alive(p)&&inCare(p));if(ql)ps=S.p.filter(p=>alive(p)&&p.name.toLowerCase().includes(ql));
  ps.sort((a,b)=>(a.review||"9")<(b.review||"9")?-1:1);
  let o='<h1>Patients</h1><input id="q" placeholder="Search any adult by name" value="'+esc(UI.q)+'"><p class="muted">'+ps.length+(ql?" found.":" people on the register with hypertension or diabetes, or a past stroke or heart attack. Earliest review dates first.")+"</p>";
  o+='<div class="card">'+tbl(["Person","Condition","Last reading","Next review",""],ps.slice(0,UI.all?999:40).map(p=>"<tr><td>"+pLink(p)+'<div class="small muted">'+p.age+" years</div></td><td>"+chip(htnLabel(p))+" "+(p.dm.dx?chip(dmLabel(p)):"")+(isSurv(p)?" "+chip([survTxt(p),"warn"]):"")+"</td><td>"+bpTxt(lastBP(p))+"</td><td>"+(p.review?fmtD(p.review)+(p.review<TODAY?' <span class="chip warn">passed</span>':""):"")+'</td><td><button data-act="clinic" data-id="'+p.id+'">Clinic entry</button></td></tr>'))+(ps.length>40&&!UI.all?'<button data-act="all">Show all '+ps.length+"</button>":"")+"</div>";return o;}

/* ---------- reports ---------- */
function calc(ids){const P=S.p.filter(p=>ids.has(IX.hh[p.hh].ln)),A=P.filter(p=>alive(p)&&p.age>=35),o={A:A.length,adults:P.filter(alive).length,hh:S.hh.filter(h=>ids.has(h.ln)).length};
  const lastMed=p=>{const v=S.v.filter(v=>v.p===p.id&&v.med).pop();return v&&v.med;};
  o.screened=A.filter(p=>p.bp.length).length;o.twice=A.filter(p=>new Set(p.bp.map(r=>r.d)).size>=2).length;
  const hyp=A.filter(p=>p.htn.dx||elevDays(p)>=2);o.hyp=hyp.length;o.pend=A.filter(p=>raisedOnce(p)&&elevDays(p)<2).length;
  o.aware=hyp.filter(p=>p.htn.dx).length;const found=hyp.filter(p=>!p.htn.base);o.found=found.length;o.linked=found.filter(p=>p.htn.rx).length;
  const rx=hyp.filter(p=>p.htn.rx);o.rx=rx.length;const asked=rx.filter(p=>lastMed(p));o.asked=asked.length;o.adh=asked.filter(p=>lastMed(p)==="y").length;
  const cd=rx.filter(p=>diff(TODAY,p.htn.rxStart)>=90&&lastBP(p));o.cd=cd.length;o.ctrl=cd.filter(p=>!elev(lastBP(p))).length;
  o.tested=A.filter(p=>p.glu.length||p.dm.dx).length;const dm=A.filter(p=>p.dm.dx);o.pos=A.filter(screenPos).length;o.dm=dm.length;const dfound=dm.filter(p=>!p.dm.base);o.dfound=dfound.length+o.pos;o.dlinked=dfound.filter(p=>p.dm.rx).length;
  o.drx=dm.filter(p=>p.dm.rx).length;const gd=dm.filter(p=>p.dm.rx&&labs(p).some(g=>diff(g.d,p.dm.rxStart)>=90));o.gd=gd.length;o.goal=gd.filter(p=>{const g=labs(p).pop();return g.t==="a1c"?g.v<CFG.glu.a1cGoal:g.v<CFG.glu.fastGoal;}).length;
  const two=rx.filter(p=>p.bp.length>=2&&diff(lastBP(p).d,p.bp[0].d)>=60);o.two=two.length;o.s0=mean(two.map(p=>p.bp[0].s));o.s1=mean(two.map(p=>lastBP(p).s));
  const drop=Math.max(0,(o.s0||0)-(o.s1||0)),py=two.reduce((a,p)=>a+Math.max(0,diff(TODAY,p.htn.rxStart>CFG.census?p.htn.rxStart:CFG.census))/365,0),M=CFG.model,av=(rate,rr)=>py*rate/100*(1-Math.pow(rr,drop/10));
  o.drop=drop;o.py=py;o.cvd=[av(M.cvdRate,M.rrCvdHi),av(M.cvdRate,M.rrCvd),av(M.cvdRate,M.rrCvdLo)];o.dth=[av(M.deathRate,M.rrDeathHi),av(M.deathRate,M.rrDeath),av(M.deathRate,M.rrDeathLo)];
  const since=addD(TODAY,-90),pid=new Set(P.map(p=>p.id)),V=S.v.filter(v=>pid.has(v.p));o.why={};for(const v of V)if(v.d>=since&&v.med==="n")for(const k of whyList(v))o.why[k]=(o.why[k]||0)+1;
  const pv=V.filter(v=>v.d>=since&&v.med);o.medHome=[pv.filter(v=>v.medHome).length,pv.length];o.nhis=[S.hh.filter(h=>ids.has(h.ln)&&hhMonthly(h)&&h.nhis).length,S.hh.filter(h=>ids.has(h.ln)&&hhMonthly(h)).length];
  o.revPassed=P.filter(p=>alive(p)&&p.review&&p.review<TODAY).length;
  const sv=P.filter(p=>alive(p)&&isSurv(p)),svA=sv.filter(p=>lastMed(p));o.surv=sv.length;o.survSt=sv.filter(p=>p.cvd.st).length;o.survMi=sv.filter(p=>p.cvd.mi).length;o.survNoDx=sv.filter(p=>!isPatient(p)).length;
  o.survRx=sv.filter(p=>p.meds.some(m=>SURVMED.includes(m))).length;o.survAsked=svA.length;o.survAdh=svA.filter(p=>lastMed(p)==="y").length;
  const R=S.ref.filter(r=>pid.has(r.p)&&rOn(r));o.ref=[1,2,3].map(u=>{const a=R.filter(r=>r.urg===u),lim=u===1?1:u===2?7:14;return{n:a.length,seen:a.filter(r=>r.seen).length,fast:a.filter(r=>r.seen&&diff(r.seen,r.d)<=lim).length,els:a.filter(r=>!r.seen&&r.closed&&r.closed.how==="elsewhere").length,decl:a.filter(r=>!r.seen&&r.closed&&r.closed.how==="declined").length,open:a.filter(refOpen).length,lim};});
  // reasons for not going: each referral counted once per reason, over all its follow-up entries
  o.fuWhy={};o.fuN=0;o.refOpenFu=[R.filter(r=>refOpen(r)&&(r.fu||[]).length).length,R.filter(refOpen).length];
  for(const r of R){const ks=new Set((r.fu||[]).flatMap(f=>f.why||[]));if(ks.size)o.fuN++;for(const k of ks)o.fuWhy[k]=(o.fuWhy[k]||0)+1;}
  const hb=A.filter(p=>p.hab&&p.hab.length>=2);o.hb=hb.length;const f=(k,t)=>[pct(hb.filter(p=>t(p.hab[0][k])).length,hb.length),pct(hb.filter(p=>t(p.hab[p.hab.length-1][k])).length,hb.length)];
  o.hab={salt:f("salt",x=>!x),drinks:f("drinks",x=>x<=1),act:f("act",x=>x>=5),tob:f("tob",x=>!x)};
  o.waist=[A.filter(p=>p.waist&&p.waist>=CFG.waist[p.sex]).length,A.filter(p=>p.waist).length];
  o.deaths=P.filter(p=>p.death&&p.age>=35);o.deathsDx=o.deaths.filter(p=>isPatient(p)).length;o.ev=S.ev.filter(e=>pid.has(e.p));
  o.visits=V.filter(v=>v.kind!=="prom").length;o.gm=S.gm.filter(g=>ids.has(g.ln));return o;}
function vReports(){const ids=scope(),c=calc(ids),T=CFG.targets,r1=x=>x==null?"":x.toFixed(1);
  let o="<h1>"+(me().role==="ln"?"My results":"Reports")+"</h1>"+areaSel()+"<p class='muted'>Month "+(CUR+1)+" of 12. "+c.hh+" households, "+c.adults+" adults on the register, "+c.A+" aged 35 or older."+(live()?"":" Example data.")+"</p>";
  o+='<div class="grid"><div class="card"><h3>Adults 35+ screened for BP</h3><div class="big">'+(pct(c.screened,c.A)??0)+'%</div></div><div class="card"><h3>On BP treatment and controlled</h3><div class="big">'+(pct(c.ctrl,c.cd)??0)+'%</div><p class="small muted">'+c.ctrl+" of "+c.cd+'</p></div><div class="card"><h3>Fall in average upper reading</h3><div class="big">'+r1(c.drop)+'</div><p class="small muted">mmHg, '+c.two+' people on treatment with readings two months apart</p></div><div class="card"><h3>Open referrals</h3><div class="big">'+c.ref.reduce((a,x)=>a+x.open,0)+"</div></div></div>";
  o+='<h2 class="rep">1. Hypertension: from screening to control</h2><div class="card"><div class="tblwrap"><table>'+barHead+bar("Adults aged 35 or older screened for blood pressure",c.screened,c.A,T.screened)+bar("Screened on two or more days",c.twice,c.A,0)+bar("People with hypertension who know their status",c.aware,c.hyp,T.aware,"Diagnosed, out of those diagnosed or raised on two days")+bar("Found by the project and now on treatment",c.linked,c.found,T.linked,"Not diagnosed at the census")+bar("On treatment and taking the medicine every day",c.adh,c.asked,T.adherent,"Answer at the last home visit")+bar("On treatment three months or more with BP below 140/90",c.ctrl,c.cd,T.controlled,"Latest reading")+"</table></div><p class='small muted'>"+c.hyp+" adults have hypertension by the register's definition. "+c.pend+" more had one raised reading and wait for a re-check. The black mark on each bar is the project's target.</p></div>";
  o+='<h2 class="rep">2. Diabetes: from testing to control</h2><div class="card"><div class="tblwrap"><table>'+barHead+bar("Adults aged 35 or older tested for blood sugar",c.tested,c.A,T.tested,"Fingerstick by a Promoter, or already diagnosed")+bar("Found by the project and now on treatment",c.dlinked,c.dfound,T.dmLinked,"Screen raised or newly confirmed, out of those not diagnosed at the census")+bar("On treatment with the latest laboratory result at target",c.goal,c.gd,0,"HbA1c below "+CFG.glu.a1cGoal+"% or fasting glucose below "+CFG.glu.fastGoal.toFixed(1)+" mmol/L, tested three months or more after starting")+"</table></div><p class='small muted'>"+c.dm+" adults have diagnosed diabetes; "+c.drx+" are on treatment. "+c.pos+" have a raised screening result and wait for the laboratory test. Few people on treatment have had a follow-up laboratory test, so the last row rests on small numbers.</p></div>";
  o+='<h2 class="rep">3. Blood pressure change and modelled events averted</h2><div class="card">'+tbl(["Measure","#Value"],["<tr><td>People on treatment with readings at least two months apart</td><td class='n'>"+c.two+"</td></tr>","<tr><td>Average upper reading, first reading on the register</td><td class='n'>"+r1(c.s0)+"</td></tr>","<tr><td>Average upper reading, latest</td><td class='n'>"+r1(c.s1)+"</td></tr>","<tr><td>Fall (mmHg)</td><td class='n'><b>"+r1(c.drop)+"</b></td></tr>","<tr><td>Modelled major cardiovascular events averted so far (stroke, heart attack, heart failure)</td><td class='n'><b>"+r1(c.cvd[1])+"</b> ("+r1(c.cvd[0])+" to "+r1(c.cvd[2])+")</td></tr>","<tr><td>Modelled deaths averted so far</td><td class='n'><b>"+r1(c.dth[1])+"</b> ("+r1(c.dth[0])+" to "+r1(c.dth[2])+")</td></tr>"])+"<p class='small muted'>The last two rows are modelled, not measured. They apply the trial result that each 10 mmHg fall in the upper reading lowers major cardiovascular events by 20% and deaths by 13% (Ettehad and others, Lancet 2016) to "+r1(c.py)+" person-years on treatment. The yearly rates without the fall ("+CFG.model.cvdRate+"% for events, "+CFG.model.deathRate+"% for deaths) are planning assumptions set in Settings. The fall also includes the tendency of a first high reading to be lower when repeated, so a comparison area is needed to attribute it to the project.</p></div>";
  const wy=Object.entries(c.why).sort((a,b)=>b[1]-a[1]),wn=wy.reduce((a,x)=>a+x[1],0);
  o+='<h2 class="rep">4. Staying on treatment</h2><div class="card"><h3>Reasons for not taking the medicine every day, last 90 days</h3>'+tbl(["Reason (a person may give more than one)","#Times given","#%"],wy.map(([k,n])=>"<tr><td>"+esc(WHY[k][0])+"</td><td class='n'>"+n+"</td><td class='n'>"+pct(n,wn)+"%</td></tr>"))+'<div class="tblwrap"><table>'+barHead+bar("Blood pressure or diabetes medicine in the house at the visit",c.medHome[0],c.medHome[1],0,"Home visits to patients, last 90 days")+bar("Households on monthly visits with an active NHIS card",c.nhis[0],c.nhis[1],0)+"</table></div><p class='small'>"+c.revPassed+" people have a clinic review date that has passed.</p></div>";
  o+='<div class="card"><h3>Stroke and heart attack survivors</h3><div class="tblwrap"><table>'+barHead+bar("Survivors identified",c.surv,c.adults,0,"Out of all adults on the register. Stroke "+c.survSt+", heart attack "+c.survMi+"; "+c.survNoDx+" have neither hypertension nor diabetes")+bar("Survivors with a statin or aspirin recorded as prescribed",c.survRx,c.surv,0,"From the clinic\'s medicine record")+bar("Survivors taking all their medicines every day",c.survAdh,c.survAsked,0,"Answer at the last home visit, among those asked")+"</table></div><p class='small muted'>A survivor is a person who answered yes to either history question in a visit, or who has a stroke or heart attack recorded as an event. The history is self-reported. Whether a survivor should take a statin or aspirin is for the clinician to decide.</p></div>";
  {const tot=c.ref.reduce((t,x)=>({n:t.n+x.n,seen:t.seen+x.seen,fast:t.fast+x.fast,els:t.els+x.els,decl:t.decl+x.decl,open:t.open+x.open}),{n:0,seen:0,fast:0,els:0,decl:0,open:0}),pc=(a,n)=>a+(n?' <span class="small muted">('+pct(a,n)+"%)</span>":"");
   const rrow=(l,x,lim)=>"<tr><td>"+l+"</td><td class='n'>"+x.n+"</td><td class='n'>"+pc(x.seen,x.n)+"</td><td class='n'>"+x.fast+(lim?' <span class="small muted">within '+lim+" day"+(lim>1?"s":"")+"</span>":"")+"</td><td class='n'>"+pc(x.els,x.n)+"</td><td class='n'>"+pc(x.decl,x.n)+"</td><td class='n'>"+pc(x.open,x.n)+"</td></tr>";
   o+='<h2 class="rep">5. Referrals</h2><div class="card">'+tbl(["Urgency","#Referred","#Seen at the Salvation Army facility","#Seen in time","#Seen elsewhere (self-reported)","#Declined","#Still open"],c.ref.map((x,i)=>rrow(["Emergency (same day)","Prompt (within days)","Routine"][i],x,x.lim)).concat([rrow("<b>All referrals</b>",tot,0)]))+
     '<p class="small muted">Seen at the Salvation Army facility is recorded by the clinic. Seen elsewhere and Declined are recorded by a Trainer or a Promoter when closing a referral, from what the person reports. Open referrals with at least one follow-up entry: '+c.refOpenFu[0]+" of "+c.refOpenFu[1]+".</p></div>";
   const fk=Object.keys(FUWHY).filter(k=>c.fuWhy[k]).sort((a,b)=>c.fuWhy[b]-c.fuWhy[a]);
   o+='<div class="card"><h3>Reasons given for not going to the facility</h3>'+(fk.length?tbl(["Reason","#Referrals","#% of referrals with a reason recorded"],fk.map(k=>"<tr><td>"+esc(FUWHY[k])+"</td><td class='n'>"+c.fuWhy[k]+"</td><td class='n'>"+pct(c.fuWhy[k],c.fuN)+"%</td></tr>"))+'<p class="small muted">From the follow-up entries on '+c.fuN+" referrals. A referral is counted once for each reason, and one referral may have several reasons.</p>":"<p class='muted'>No reason has been recorded yet.</p>")+"</div>";}
  const H=c.hab,hr=(l,a,t)=>"<tr><td>"+l+"</td><td class='n'>"+(a[0]??"")+"%</td><td class='n'><b>"+(a[1]??"")+"%</b></td><td class='n'>"+(t?"≥ "+t+"%":"")+"</td></tr>";
  o+='<h2 class="rep">6. Habits and risk</h2><div class="card">'+tbl(["Adults 35+ asked at two or more visits ("+c.hb+")","#First answer","#Latest answer","#Target"],[hr("No salt added at the table yesterday",H.salt),hr("At most one sweet drink yesterday",H.drinks),hr("Active for 30 minutes on five or more days of the last seven",H.act,T.active),hr("Does not use tobacco",H.tob)])+"<p class='small'>Raised waist measurement: "+c.waist[0]+" of "+c.waist[1]+" adults measured ("+pct(c.waist[0],c.waist[1])+"%).</p><p class='small muted'>These are answers given to the Leader Neighbor, who also does the counselling, so they may overstate change. The baseline and endline surveys are the measure of behaviour.</p></div>";
  const dc={};for(const p of c.deaths)dc[p.death.cause]=(dc[p.death.cause]||0)+1;const et={};for(const e of c.ev)et[e.type]=(et[e.type]||0)+1;
  o+='<h2 class="rep">7. Events and deaths</h2><div class="card">'+tbl(["Event since the start of home visits","#Number"],EVENTS.map(t=>"<tr><td>"+t+"</td><td class='n'>"+(et[t]||0)+"</td></tr>"))+tbl(["Deaths among adults 35+ since the census, by reported cause","#Number"],Object.entries(dc).sort((a,b)=>b[1]-a[1]).map(([k,n])=>"<tr><td>"+esc(k)+"</td><td class='n'>"+n+"</td></tr>").concat(["<tr><td><b>All deaths</b> ("+c.deathsDx+" in people diagnosed with hypertension or diabetes)</td><td class='n'><b>"+c.deaths.length+"</b></td></tr>"]))+"<p class='small muted'>At this population size the number of deaths is too small to show an effect of the project. Deaths are recorded to close each person's record and to prepare for a larger programme.</p></div>";
  if(me().role!=="ln"){const rows=[...ids].map(i=>lnRow(IX.w[i]));const tot=(k)=>rows.reduce((a,r)=>a+r[k],0);
    o+='<h2 class="rep">8. Work done</h2><div class="card"><div class="tblwrap"><table>'+barHead+bar("Monthly home visits done this month",tot("done"),tot("mo"),0,"Households with a patient or a person at risk")+bar("Screening households visited in the last four months",tot("up"),tot("sc"),0)+bar("Group lessons held this month",rows.filter(r=>r.gmNow).length,rows.length,0)+bar("Attendance at group lessons, all months",c.gm.reduce((a,g)=>a+g.att,0),c.gm.reduce((a,g)=>a+g.cohort,0),0)+"</table></div><p class='small'>"+c.visits+" home visit records in all.</p></div>"+qReport(ids);}
  else{const mine=["home","group"].map(k=>qLast(me().id,k)).filter(Boolean);o+='<h2 class="rep">My QIVC scores</h2>'+(mine.length?mine.map(x=>qDetail(x,"ln")).join(""):'<div class="card"><p class="muted">Your Trainer has not yet observed a home visit or a group lesson.</p></div>');}
  o+=modReports(ids);
  return o;}
/* ---------- Care Groups compared ---------- */
function vCompare(){const T=CFG.targets,cgs=S.w.filter(w=>w.role==="lnt").sort((a,b)=>a.cg-b.cg),all=new Set(S.w.filter(w=>w.role==="ln").map(w=>w.id));
  const data=cgs.map(t=>{const ids=new Set(lnsOf(t)),c=calc(ids),rows=[...ids].map(i=>lnRow(IX.w[i])),R=c.ref.reduce((a,x)=>[a[0]+x.seen,a[1]+x.n],[0,0]),qh=[...ids].map(i=>qLast(i,"home")).filter(Boolean),qg=[...ids].map(i=>qLast(i,"group")).filter(Boolean);
    return{t,c,done:[rows.reduce((a,r)=>a+r.done,0),rows.reduce((a,r)=>a+r.mo,0)],att:[c.gm.reduce((a,g)=>a+g.att,0),c.gm.reduce((a,g)=>a+g.cohort,0)],R,qh:qh.length?[Math.round(mean(qh.map(q=>q.score))),100]:[0,0],qg:qg.length?[Math.round(mean(qg.map(q=>q.score))),100]:[0,0]};});
  const A=calc(all),IND=[["Adults aged 35 or older screened for blood pressure",x=>[x.c.screened,x.c.A],T.screened,[A.screened,A.A]],
    ["People with hypertension who know their status",x=>[x.c.aware,x.c.hyp],T.aware,[A.aware,A.hyp]],
    ["Found by the project and now on treatment",x=>[x.c.linked,x.c.found],T.linked,[A.linked,A.found]],
    ["On treatment and taking the medicine every day",x=>[x.c.adh,x.c.asked],T.adherent,[A.adh,A.asked]],
    ["On treatment three months or more with BP below 140/90",x=>[x.c.ctrl,x.c.cd],T.controlled,[A.ctrl,A.cd]],
    ["Adults aged 35 or older tested for blood sugar",x=>[x.c.tested,x.c.A],T.tested,[A.tested,A.A]],
    ["Referrals seen at the facility",x=>x.R,0,null],
    ["Monthly home visits done this month",x=>x.done,0,null],
    ["Attendance at group lessons, all months",x=>x.att,0,null],
    ["QIVC of Leader Neighbors' home visits, mean latest score",x=>x.qh,70,null,1],
    ["QIVC of Leader Neighbors' group lessons, mean latest score",x=>x.qg,70,null,1]];
  let o="<h1>Care Groups compared</h1><p class='muted'>Month "+(CUR+1)+" of 12. One bar for each Care Group. The black mark is the target. A bar is red when the Care Group is below the target, or, where there is no target, when it is the lowest. Example data.</p>";
  for(const [label,f,target,tot,isScore] of IND){const v=data.map(x=>{const[n,d]=f(x);return{x,n,d,p:pct(n,d)};}),lo=Math.min(...v.filter(z=>z.p!=null).map(z=>z.p)),sum=tot||[v.reduce((a,z)=>a+z.n,0),v.reduce((a,z)=>a+z.d,0)];
    o+='<div class="card"><div class="row"><h2 class="grow">'+esc(label)+"</h2>"+(target?'<span class="chip">Target '+target+"%</span>":"")+(isScore?"":'<span class="chip info">All: '+pct(sum[0],sum[1])+"%</span>")+'</div><div class="tblwrap"><table>'+v.map(z=>{const bad=z.p!=null&&(target?z.p<target:z.p===lo);
      return "<tr><td>Care Group "+z.x.t.cg+'<div class="small muted">'+esc(z.x.t.name)+'</div></td><td style="width:55%"><div class="meter" style="height:16px"><i style="width:'+(z.p||0)+"%;background:var(--"+(bad?"bad":"accent")+')"></i>'+(target?'<b style="left:'+target+'%"></b>':"")+"</div></td><td class='n'><b>"+(z.p==null?"–":z.p+"%")+"</b></td><td class='n small muted'>"+(isScore?"":z.n+" of "+z.d)+"</td></tr>";}).join("")+"</table></div></div>";}
  return o;}
function vWorkers(){if(live())return vWorkersLive();const g=r=>S.w.filter(w=>w.role===r);
  return "<h1>Workers</h1><div class='card'>"+tbl(["Role","Name","Covers"],[...g("prom").map(w=>"<tr><td>Promoter (CHO)</td><td>"+esc(w.name)+"</td><td>"+g("lnt").filter(t=>t.prom===w.id).length+" Trainers</td></tr>"),...g("clinic").map(w=>"<tr><td>Clinic</td><td>"+esc(w.name)+"</td><td>All referrals</td></tr>"),...g("enum").map(w=>"<tr><td>Enumerator</td><td>"+esc(w.name)+"</td><td>Census: "+czHh(w.id).length+" households recorded</td></tr>"),...g("lnt").map(w=>"<tr><td>Leader Neighbor Trainer</td><td>"+esc(w.name)+"</td><td>Care Group "+w.cg+": "+lnsOf(w).length+" Leader Neighbors</td></tr>"),...g("ln").map(w=>"<tr><td>Leader Neighbor</td><td>"+esc(w.name)+"</td><td>Care Group "+w.cg+": "+(IX.lnH[w.id]||[]).length+" households, "+(IX.lnH[w.id]||[]).filter(hhMonthly).length+" on monthly visits</td></tr>")])+"</div>";}
function vSettings(){const M=CFG.model,row=(l,v)=>"<tr><td>"+l+"</td><td class='n'>"+v+"</td></tr>";
  return "<h1>Settings</h1>"+modSettings()+unitSettings()+"<div class='card'><h3>Rules built into the visit (demonstration narrative, section 4.4)</h3>"+tbl(["Rule","#Value"],[row("Raised blood pressure","140/90 or more"),row("Refer promptly, with no warning sign","180/110 or more"),row("Pregnant: refer now","140/90 or more, one reading"),row("Pregnant: emergency","160/110 or more"),row("Never diagnosed: refer","raised on two days"),row("Already diagnosed: refer back","raised once, or off the medicine"),row("Any warning sign","emergency, same day"),row("Stroke or heart attack survivor","monthly visits; medicine question at every visit; emergency plan page at the first visit and every third visit after"),row("Survivor not taking the medicine every day, or with no medicine on the clinic's record","routine referral for a review of medicines"),row("Fingerstick blood sugar: emergency, same day",CFG.glu.emerg+" or more; "+CFG.glu.sick+" or more with a danger sign; below "+CFG.glu.vlow.toFixed(1)+"; below "+CFG.glu.low+" with a danger sign (mmol/L)"),row("Fingerstick blood sugar: low, give sugar and refer within days","below "+CFG.glu.low+" mmol/L"),row("No new routine referral after a facility visit","for "+CFG.noRefer+" days"),row("No new routine referral after a referral is closed as declined, unless the person is now willing","for "+CFG.declineWait+" days"),row("Re-check after a normal reading, and screening visits","every "+CFG.recheck+" days"),row("Fingerstick sugar raised (random / fasting)",CFG.glu.rand+" / "+CFG.glu.fast.toFixed(1)+" mmol/L"),row("African Diabetes Risk Score that counts as raised","above "+CFG.adrs.cut),row("Raised waist (men / women)",CFG.waist.M+" / "+CFG.waist.F+" cm")])+"<p class='small muted'>The blood pressure rules follow the narrative, which cites the WHO HEARTS and PEN protocols and the Ghana Standard Treatment Guidelines. The sugar values are the WHO diagnostic values. The risk score and waist values are drafts. The "+CFG.noRefer+"-day limit on routine referrals is a project decision (20 November 2026); emergencies, readings of 180/110 or more, pregnancy, foot sores and raised sugar screens are always referred. All need review by clinical staff in Ghana before field use.</p></div>"+
  "<div class='card'><h3>Assumptions for the modelled events averted</h3><div class='row'><label>Major cardiovascular events per 100 people with hypertension per year "+num("m.cvdRate",M.cvdRate,"",90)+"</label></div><div class='row'><label>Deaths per 100 people with hypertension per year "+num("m.deathRate",M.deathRate,"",90)+"</label></div><p class='small muted'>These are planning figures, not Ghanaian data. Replace them when a local source is agreed.</p></div>"+
  "<div class='card'><h3>Diabetes-risk flag</h3><div class='row'><label>African Diabetes Risk Score counted as raised when above "+num("a.cut",CFG.adrs.cut,"",90)+"</label></div><p class='small muted'>The score uses age, waist and hypertension (Mayige 2014; derived in Tanzania, Senegal and Guinea). An adult aged 35 or older with a raised score moves to monthly visits. The published cut-off for South Africa is 1.46. The project uses 3.5, so that each Leader Neighbor's monthly cohort stays near 12 people; neither value has been checked in Ghana. A higher cut-off flags fewer people. Every adult aged 35 or older has the fingerstick test whatever the score.</p></div>"+
  (live()?startCard()+liveCard():"<div class='card'><h3>Data</h3><p class='small muted'>Build 0.27, example mode. All people and results are fictitious. Records entered here stay on this device until the page is closed, and nothing is sent to a server.</p></div>");}

/* ---------- frame ---------- */
function render(){const w=me(),y=window.scrollY;const tabs=TABS[w.role].filter(t=>t[0]!=="account"||live());if(!tabs.some(t=>t[0]===UI.tab))UI.tab=tabs[0][0];
  $("#who").textContent=ROLE[w.role]+(w.role==="admin"?"":": "+w.name)+(live()?"":" · example data");
  document.body.classList.toggle("census",w.role==="enum");
  $("#nav").innerHTML=UI.mode==="cz"?"":tabs.map(t=>'<button class="tab'+(t[0]===UI.tab&&!UI.mode?" on":"")+'" data-tab="'+t[0]+'">'+t[1]+"</button>").join("");
  const V={today:vToday,hhs:vHhs,group:vGroup,reports:vReports,coach:vCoach,refs:vRefs,screen:vScreen,recheck:vRecheck,patients:vPatients,workers:vWorkers,settings:vSettings,pages:vPages,compare:vCompare,account:vAccount,census:vCensus,callbacks:vCallbacks,chelp:vCHelp,cprog:vCProg,cmap:vCMap};
  const M={hh:vHh,person:vPerson,visit:vVisit,clinic:vClinic,event:vEvent,qivc:vQivc,addhh:vAddHh,fu:vFu,cz:vCz,hv:vHv,mapsel:vMapSel};
  $("#app").innerHTML=(UI.mode?M[UI.mode]:V[UI.tab])();if(UI.keep){window.scrollTo(0,y);UI.keep=false;}else window.scrollTo(0,0);}
function roleSel(){const g=(r,l)=>'<optgroup label="'+l+'">'+S.w.filter(w=>w.role===r).map(w=>'<option value="'+w.id+'">'+esc(r==="admin"?"Administrator":r==="clinic"?"Clinic":w.name+(w.cg?" (Care Group "+w.cg+")":""))+"</option>").join("")+"</optgroup>";
  $("#role").innerHTML=g("admin","Administrator")+g("prom","Promoters (CHO)")+g("clinic","Clinic")+g("lnt","Leader Neighbor Trainers")+g("ln","Leader Neighbors")+g("enum","Enumerators (census)");$("#role").value=UI.who;}
function setPath(o,path,v){const k=path.split(".");for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=v;}
document.addEventListener("click",e=>{const el=e.target.closest("button,[data-pid]");if(!el)return;const d=el.dataset;
  if(d.qa){UI.F.a[d.qa]=UI.F.a[d.qa]===+d.v?null:+d.v;if(UI.F.a[d.qa]==null)delete UI.F.a[d.qa];UI.keep=true;return render();}
  if(d.f==="kind"&&UI.mode==="qivc"){if(UI.F.kind!==d.v){UI.F.kind=d.v;UI.F.a={};UI.F.r={};}UI.keep=true;return render();}
  if(d.f){UI.F[d.f]=UI.F[d.f]===d.v?null:d.v;UI.keep=true;return render();}
  if(d.m){const arr=d.m==="gatt"?UI.G.att:UI.F[d.m];if(d.v==="__none"){arr.length=0;arr.push("__none");}else{const i=arr.indexOf(d.v),n=arr.indexOf("__none");if(n>=0)arr.splice(n,1);const j=arr.indexOf(d.v);if(j>=0)arr.splice(j,1);else arr.push(d.v);}UI.keep=true;return render();}
  if(d.tab){UI.tab=d.tab;UI.mode=null;UI.F=null;UI.all=false;UI.q="";UI.pg=null;return render();}
  if(d.pg!==undefined){UI.pg=d.pg||null;return render();}
  if(d.hh){UI.back=UI.mode?null:UI.tab;UI.hh=d.hh;UI.mode="hh";return render();}
  if(d.pid){UI.pid=d.pid;UI.from=UI.mode;UI.mode="person";return render();}
  const A=d.act;if(!A)return;
  if(A==="all"){UI.all=UI.tab==="pages"&&!UI.mode?!UI.all:true;UI.keep=true;return render();}
  if(A==="back"){if(UI.mode==="person"&&UI.from==="hh"){UI.mode="hh";UI.from=null;}else UI.mode=null;return render();}
  if(A==="cancel"){const k=UI.F&&UI.F.kind;UI.mode=UI.mode==="fu"?fuBack():UI.mode==="qivc"?null:UI.mode==="visit"&&k!=="prom"?"hh":"person";UI.F=null;return render();}
  if(A==="visit"){UI.pid=d.id;UI.hh=IX.p[d.id].hh;startVisit(d.id,"home");return render();}
  if(A==="pbp"){UI.pid=d.id;startVisit(d.id,"prom");return render();}
  if(A==="hxedit"){UI.F.hxEdit=true;UI.F.hxS=null;UI.F.hxM=null;UI.keep=true;return render();}
  if(A==="save")return saveVisit();
  if(A==="fu"){UI.fuFrom=[UI.mode,UI.tab];UI.pid=d.id;UI.F={pid:d.id,fst:null,fwhy:[],fact:null,fnote:"",ffac:"",close:null,cnote:"",cfac:(openRef(IX.p[d.id]).flatMap(r=>r.fu||[]).filter(f=>f.fac).pop()||{}).fac||"",tried:false,ctried:false};UI.mode="fu";return render();}
  if(A==="savefu")return saveFu();
  if(A==="closefu")return closeFu();
  if(A==="clinic"){const p=IX.p[d.id];UI.pid=d.id;UI.F={pid:d.id,cs:"",cd:"",htn:"same",lab:"none",labv:"",dm:"same",meds:p.meds.slice(),review:"",note:""};UI.mode="clinic";return render();}
  if(A==="saveclinic")return saveClinic();
  if(A==="event"){UI.F={pid:d.id,type:null,d:TODAY,cause:null};UI.mode="event";return render();}
  if(A==="saveevent")return saveEvent();
  if(A==="finger")return saveFinger(d.id);
  if(A==="qivc"){const w=IX.w[d.id];UI.F={wid:d.id,kind:d.kind||qKinds(w)[0],a:{},r:{},note:"",tried:false};UI.mode="qivc";return render();}
  if(A==="saveqivc"){const F=UI.F,its=qItems(F.kind);if(its.some(i=>F.a[i[0]]==null)){F.tried=true;return render();}const sc=qScore(F.a);
    S.q.push({id:uid("q"),wid:F.wid,kind:F.kind,by:UI.who,d:TODAY,a:F.a,r:F.r,score:sc.score,note:F.note});UI.note=[QIV[F.kind].name+" checklist saved for "+IX.w[F.wid].name+": "+sc.score+"%."];UI.F=null;UI.mode=null;UI.tab="coach";return render();}
  if(A==="savegroup"){const w=me(),hs=(IX.lnH[w.id]||[]).filter(hhMonthly),n=hs.flatMap(h=>IX.hhP[h.id].filter(p=>alive(p)&&(inCare(p)||atRisk(p)))).length;S.gm.push({id:uid("g"),ln:w.id,m:CUR,d:TODAY,lesson:CUR,att:UI.G.att.length,cohort:n,who:UI.G.att.slice()});UI.G=null;return render();}
  if(A==="addp"){const name=$("#a_name").value.trim(),age=+$("#a_age").value;if(!name||!(age>=18&&age<=110))return;const p={id:uid("p"),hh:UI.hh,name,sex:$("#a_sex").value,age,bp:[],glu:[],htn:{},dm:{},meds:[]};S.p.push(p);index();UI.keep=true;return render();}});
document.addEventListener("input",e=>{const el=e.target,d=el.dataset;
  if(d.n&&UI.F&&UI.mode==="visit"){setPath(UI.F,d.n,el.value);const st=visitState();$("#dyn").innerHTML=dynHtml(st);const r3=$("#r2");if(r3)r3.hidden=!st.a.need3;const pg=$("#pages");if(pg){const now=st.pages.join();if(pg.dataset.k!==now){pg.dataset.k=now;pg.innerHTML=st.pages.map(pageHtml).join("");$("#commit").innerHTML=commitHtml(st);}}return;}
  if(d.n&&d.n.startsWith("m.")){CFG.model[d.n.slice(2)]=+el.value||0;return;}
  if(d.n==="a.cut"){if(+el.value>0)CFG.adrs.cut=+el.value;return;}
  if(d.n&&UI.F){UI.F[d.n]=el.value;return;}
  if(d.t&&UI.F){UI.F[d.t]=el.value;return;}
  if(d.c&&UI.F){UI.F[d.c]=el.checked;UI.keep=true;return render();}
  if(el.id==="q"){UI.q=el.value;UI.keep=true;render();const n=$("#q");n.focus();n.setSelectionRange(n.value.length,n.value.length);}});
document.addEventListener("change",e=>{const el=e.target;
  if(el.dataset.qr&&UI.F){UI.F.r[el.dataset.qr]=+el.value||null;return;}
  if(el.id==="role"){UI.who=el.value;UI.tab=null;UI.mode=null;UI.F=null;UI.G=null;UI.area="all";UI.all=false;UI.q="";render();}
  if(el.id==="area"){UI.area=el.value;UI.all=false;UI.keep=true;render();}});
try{if("serviceWorker" in navigator&&location.hostname.endsWith("github.io"))navigator.serviceWorker.register("sw.js").catch(()=>{});}catch(e){}
