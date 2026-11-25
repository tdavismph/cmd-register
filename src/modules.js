/* ---------- optional modules: TB and HIV case-finding and treatment support ----------
   Both are OFF unless the administrator switches them on in Settings (CFG.mods, synced with the other settings).
   With a module off, nothing of it is shown and nothing is asked; records already collected are kept and come back when it is switched on.
   TB facts are kept on the person record (p.tb). The yearly HIV test question is kept on the person record (p.hq) and holds no result.
   That a person is on ART is kept in a separate record (S.hv, one per person), which the server sends to a Leader Neighbor
   only when the person has agreed that this Leader Neighbor may know (lnOk). No HIV test result is stored anywhere. */
CFG.mods={tb:false,hiv:false};
const modOn=k=>!!(CFG.mods&&CFG.mods[k]);
const MODDRAFT="Draft for review, not yet pre-tested or clinically reviewed";
Object.assign(PAGES,{
 tb_what:["drop","TB: what it is, and why to get tested","How long have you had this cough, fever, night sweating or loss of weight?",["TB is a disease caused by a germ. It spreads through the air when a person with TB in the lungs coughs.","The signs are a cough that does not go away, fever, sweating at night and losing weight.","TB can be cured. The test and the medicine are given at the health facility.","The sooner you are tested, the sooner you are well, and the safer your family is.","I will write a referral so that the facility expects you."],["Go for the TB test this week","Cover my mouth and nose when I cough"]],
 tb_daily:["pill","TB medicine: every day until the end","How are you getting on with the TB medicine?",["TB medicine is taken every day for the full course, usually six months.","You will feel better after a few weeks, but the germ is still in the body. Stopping early lets it come back, and it is then harder to cure.","If the medicine makes you feel unwell, do not stop. Tell the health worker the same day.","Keep every clinic visit, and collect the next supply before this one finishes."],["Take my TB medicine at the same time every day","A family member is with me when I take it","Go to every clinic visit until the health worker says the treatment is complete"]],
 tb_house:["family","TB: protecting the household","Who lives and sleeps in this house with you?",["Cover your mouth and nose with a cloth or your elbow when you cough or sneeze.","Keep windows and doors open so that air moves through the house.","Everyone who lives in the house should be checked for TB at the facility, above all children under 5.","Taking the medicine every day is what protects the family most."],["Take everyone in the house for a TB check","Keep the windows open during the day"]],
 hiv_know:["card","Why to know your HIV status","What have you heard about the HIV test?",["Many people with HIV feel well for years. Only a test can tell.","The test is quick and private. The result is given to you alone.","With treatment, a person with HIV can live a long and healthy life.","A person on treatment whose virus is fully controlled does not pass HIV to a sexual partner.","I will not ask for your result, now or later. I can write a referral if you would like a test."],["Go for an HIV test this month","Go for the test together with my partner"]],
 hiv_art:["pill","Taking ART every day","How are you getting on with your medicine?",["The medicine keeps the virus low, so that the body stays strong.","Take it every day at the same time, also when you feel well.","Do not stop the medicine and do not share it. If it makes you feel unwell, tell the health worker.","Keep every clinic visit, and collect the next supply before this one finishes.","What you tell me stays private."],["Take my medicine at the same time every day","Collect my next supply before this one finishes"]]});
const MODPAGES={tb:["tb_what","tb_daily","tb_house"],hiv:["hiv_know","hiv_art"]};
const isModPage=k=>MODPAGES.tb.includes(k)||MODPAGES.hiv.includes(k);
const pgroups=()=>PGROUPS.concat(modOn("tb")?[["TB module ("+MODDRAFT.toLowerCase()+")",MODPAGES.tb]]:[],modOn("hiv")?[["HIV module ("+MODDRAFT.toLowerCase()+")",MODPAGES.hiv]]:[]);
const porder=()=>pgroups().flatMap(g=>g[1]);
Object.assign(REASON,{tb:"TB test",hivtest:"HIV test"});
/* referrals of a module that is switched off are hidden, not deleted */
const rOn=r=>(r.code!=="tb"||modOn("tb"))&&(r.code!=="hivtest"||modOn("hiv"));
/* reason shown on screen: a neutral label for the HIV test wherever a family member could read it */
const rz=c=>c==="hivtest"&&!["clinic","prom","lnt"].includes(me().role)?"Test at the facility":REASON[c];

/* TB */
const TBSYM=["Cough","Fever","Night sweats","Weight loss without trying"];
const TBOUT={completed:"Treatment completed",cured:"Cured",stopped:"Stopped",died:"Died",moved:"Moved"};
const TBASK=90;   // days before the symptom questions are asked again
const onTB=p=>modOn("tb")&&!!(p.tb&&p.tb.rx&&p.tb.rx.start&&!p.tb.rx.out);
const tbRef=p=>S.ref.some(r=>r.p===p.id&&r.code==="tb"&&refOpen(r));
const tbAsk=p=>modOn("tb")&&p.age>=15&&!onTB(p)&&!tbRef(p)&&!(p.tb&&p.tb.asked&&diff(TODAY,p.tb.asked)<TBASK);
/* HIV */
const HVROLES=["clinic","prom","lnt"];
const hvRec=p=>modOn("hiv")?(IX.hv||{})[p.id]||null:null;
const hvSee=p=>{const r=hvRec(p),ro=me().role;return !!(r&&r.art&&(HVROLES.includes(ro)||(ro==="ln"&&r.lnOk)));};
const artLn=p=>{const r=hvRec(p);return !!(r&&r.art&&r.lnOk);};   // the same answer for every user, so that the visit schedule does not differ between tablets
const hivAsk=p=>modOn("hiv")&&p.age>=18&&["ln","lnt"].includes(me().role)&&!hvSee(p)&&!(p.hq&&diff(TODAY,p.hq.d)<365);
const HQ=[["y","Yes"],["n","No, more than 12 months ago"],["never","Never tested"],["ns","Prefers not to say"],["skip","Not asked today: we were not alone"]];
const hqOffer=F=>F.hq==="n"||F.hq==="never";
const modMeds=p=>(onTB(p)?["TB medicine"]:[]).concat(hvSee(p)?["Clinic medicine (private)"]:[]);
const allMeds=p=>p.meds.concat(modMeds(p));
const modCare=p=>onTB(p)||hvSee(p);
/* What may be shown in a visit history: HIV pages and commitments never (a family member may read the screen); TB ones only while the module is on. */
const pgShow=k=>!MODPAGES.hiv.includes(k)&&(!MODPAGES.tb.includes(k)||modOn("tb"));
const modCommits=ks=>new Set(ks.flatMap(k=>PAGES[k][4]));
const commitKeep=c=>(c||"").split("; ").filter(x=>x&&!modCommits(MODPAGES.hiv).has(x)).join("; ");
const commitShow=c=>(c||"").split("; ").filter(x=>x&&!modCommits(MODPAGES.hiv).has(x)&&(modOn("tb")||!modCommits(MODPAGES.tb).has(x))).join("; ");

/* the home visit */
function modFind(F,p,find,when){
  if(when==="pre"){if(tbAsk(p)&&F.tbs.some(x=>x!=="__none"))find.push("tb_what");return;}
  if(onTB(p)){if(F.tbc&&F.tbc!=="all")find.push("tb_house");if(F.med==="n"||F.nV%3===0)find.push("tb_daily");}
  if(hivAsk(p)&&hqOffer(F))find.push("hiv_know");
  if(hvSee(p)&&(F.med==="n"||F.nV%3===0))find.push("hiv_art");}
const modStep1=(F,p,miss)=>tbAsk(p)?q("TB check. Do you have any of these?",multi("tbs",TBSYM,F.tbs,false,"None of these"),miss(!F.tbs.length),"Ask about each one in turn."):"";
const modStep3=(F,p,miss)=>onTB(p)?q("Have the other people who live in this house been checked for TB at the facility?",seg("tbc",[["all","Yes, all of them"],["some","Some of them"],["none","None of them"]],F.tbc),miss(!F.tbc),"Ask above all about children under 5."):"";
const modPrivate=(F,p,miss)=>hivAsk(p)?'<div class="card"><h3>A private question</h3>'+todo("Ask this only when nobody else can hear. If you cannot be alone with the person today, tap the last choice and ask at the next visit. Never ask for a test result, and never write one down.")+
  q("Have you had an HIV test in the last 12 months?",seg("hq",HQ,F.hq),miss(!F.hq))+(hqOffer(F)?q("Would you like a referral for a test?",seg("hoff",YN,F.hoff),miss(!F.hoff),"Show the page below first. The choice is the person's own."):"")+"</div>":"";
const modMiss=(F,p)=>(tbAsk(p)&&!F.tbs.length)||(onTB(p)&&!F.tbc)||(hivAsk(p)&&(!F.hq||(hqOffer(F)&&!F.hoff)));
function modSave(F,p,v){let t="";
  if(tbAsk(p)){const sym=F.tbs.filter(x=>x!=="__none");p.tb=Object.assign({},p.tb,{asked:TODAY,sym});v.tbs=sym;
    if(sym.length){p.tb.posD=TODAY;S.ref.push({id:uid("r"),p:p.id,d:TODAY,by:UI.who,code:"tb",urg:2});t+=" TB symptoms: referred for a TB test, to be seen within days.";}}
  if(onTB(p)&&F.tbc){p.tb=Object.assign({},p.tb,{contacts:{d:TODAY,ans:F.tbc}});v.tbc=F.tbc;}
  if(hivAsk(p)&&F.hq&&F.hq!=="skip"){p.hq={d:TODAY,ans:F.hq};if(hqOffer(F)){p.hq.off=F.hoff;
      if(F.hoff==="y"&&!S.ref.some(r=>r.p===p.id&&r.code==="hivtest"&&refOpen(r))){S.ref.push({id:uid("r"),p:p.id,d:TODAY,by:UI.who,code:"hivtest",urg:3});t+=" A referral for a test is recorded.";}}}
  return t;}

/* person record */
function modChips(p,house){return(onTB(p)?chip(["On TB treatment","info"]):"")+(!house&&hvSee(p)?chip(["Medicine support (confidential)","info"]):"");}
function modPerson(p){let o="";const r=me().role;
  if(modOn("tb")&&p.tb){const t=p.tb,L=[];
    if(t.asked)L.push("Symptom questions asked on "+fmtD(t.asked)+": "+(t.sym&&t.sym.length?esc(t.sym.join(", ")):"none of the four"));
    if(t.test)L.push("Test recorded by the clinic on "+fmtD(t.test.d)+": <b>"+(t.test.res==="pos"?"TB found":"no TB found")+"</b>");
    if(t.rx&&t.rx.start)L.push("Treatment started on "+fmtD(t.rx.start)+(t.rx.out?". Outcome on "+fmtD(t.rx.out.d)+": <b>"+TBOUT[t.rx.out.how]+"</b>":""));
    if(t.contacts)L.push("People in the house checked for TB (asked "+fmtD(t.contacts.d)+"): "+({all:"all",some:"some",none:"none"})[t.contacts.ans]);
    if(L.length)o+='<div class="card"><h3>TB</h3>'+L.map(x=>"<p class='small'>"+x+"</p>").join("")+"</div>";}
  if(modOn("hiv")&&alive(p)&&(HVROLES.includes(r)||r==="ln")){const h=hvRec(p);
    if(hvSee(p))o+='<div class="card"><h3>Medicine support (confidential)</h3><p class="small">This person takes ART and has asked for the programme\'s support. Recorded on '+fmtD(h.d)+" by "+esc(wName(h.by))+" ("+(h.src==="clinic"?"enrolled by the clinic, with consent":"told by the person")+"). The Leader Neighbor "+(h.lnOk?"may know":"<b>may not know</b>")+'.</p><p class="small muted">Do not speak of this where others can hear. On the Due list and the household screen it appears only as "medicine support".</p>'+(r!=="ln"?'<div class="row"><button data-act="hvnew" data-id="'+p.id+'">Change</button></div>':"")+"</div>";
    else o+='<div class="row"><button data-act="hvnew" data-id="'+p.id+'">Private medicine support</button><span class="small muted">Only when the person has told you about a medicine and asks for support with it.</span></div>';}
  return o;}
function vHv(){const F=UI.F,p=IX.p[F.pid],r=me().role,miss=k=>F.tried&&k;
  return '<button class="link" data-act="cancel">‹ Cancel</button><h1>Private medicine support: '+esc(p.name)+'</h1><div class="card">'+todo("Use this only when the person has chosen to tell "+(r==="clinic"?"the clinic":"you")+" that they take ART (antiretroviral therapy, the medicine for HIV) and wants help to take it every day. Never ask anyone whether they have HIV. Fill this in where nobody else can see the screen.")+
    q("What should be recorded?",seg("art",[["y","The person takes ART and wants support"],["n","Stop the support and remove the record from the visit list"]],F.art),miss(!F.art))+
    (F.art==="y"?q("Does the person agree that this is recorded in the programme's register?",seg("cons",[["y","Yes, the person agrees"]],F.cons),miss(!F.cons),"Without this agreement, record nothing.")+
      (r==="ln"?'<p class="small muted">By telling you, the person has agreed that you, the Leader Neighbor, know. The Trainer, the Promoter and the clinic can also see it. Nobody else can.</p>':q("Does the person agree that the Leader Neighbor may know?",seg("lnOk",YN,F.lnOk),miss(!F.lnOk),"If No, the Leader Neighbor's tablet shows nothing, and the Trainer gives the support.")):"")+
    (F.tried?'<div class="note bad">Please complete the items marked with *.</div>':"")+'<div class="row"><button class="pri" data-act="savehv">Save</button></div></div>';}
function saveHv(){const F=UI.F,p=IX.p[F.pid],r=me().role;if(!F.art||(F.art==="y"&&(!F.cons||(r!=="ln"&&!F.lnOk)))){F.tried=true;return render();}
  const id="hv_"+p.id,old=S.hv.find(x=>x.id===id),rec=F.art==="y"?{id,p:p.id,art:true,src:r==="clinic"?"clinic":"self",d:TODAY,by:UI.who,lnOk:r==="ln"?true:F.lnOk==="y",consent:{d:TODAY,by:UI.who}}:{id,p:p.id,art:false,lnOk:false,d:TODAY,by:UI.who,stopped:TODAY};
  if(old)S.hv[S.hv.indexOf(old)]=rec;else S.hv.push(rec);index();UI.F=null;UI.mode="person";UI.note=["Saved.",""];render();}

/* clinic entry */
function modClinic(F,p){if(!modOn("tb"))return"";const t=p.tb||{},pos=F.tbt==="pos"||(t.test&&t.test.res==="pos");
  return '<div class="card"><h3>TB</h3>'+(t.asked&&t.sym&&t.sym.length?'<p class="small">Symptoms reported at the home visit on '+fmtD(t.asked)+": "+esc(t.sym.join(", "))+".</p>":"")+(t.test?'<p class="small">Earlier test, '+fmtD(t.test.d)+": "+(t.test.res==="pos"?"TB found":"no TB found")+".</p>":"")+
    q("TB test result today",seg("tbt",[["pos","TB found"],["neg","No TB found"]],F.tbt),0,"Leave empty if no result today.")+
    (pos&&!(t.rx&&t.rx.start)?q("Date TB treatment started",'<input type="date" data-t="tbst" value="'+esc(F.tbst||"")+'" max="'+TODAY+'">'):"")+
    (t.rx&&t.rx.start&&!t.rx.out?"<p class='small'>On TB treatment since "+fmtD(t.rx.start)+".</p>"+q("Treatment outcome",seg("tbo",Object.entries(TBOUT),F.tbo),0,"Leave empty while the person is still on treatment. Record a death also with Record an event, a death or a move."):"")+
    (t.rx&&t.rx.out?"<p class='small'>Outcome on "+fmtD(t.rx.out.d)+": "+TBOUT[t.rx.out.how]+".</p>":"")+"</div>";}
function modSaveClinic(F,p){if(!modOn("tb"))return;const t=Object.assign({},p.tb);
  if(F.tbt)t.test={d:TODAY,res:F.tbt};if(F.tbst)t.rx={start:F.tbst};if(F.tbo&&t.rx&&t.rx.start)t.rx=Object.assign({},t.rx,{out:{d:TODAY,how:F.tbo}});
  if(F.tbt||F.tbst||F.tbo)p.tb=t;}

/* reports */
function modReports(ids){let o="";const P=S.p.filter(p=>ids.has(IX.hh[p.hh].ln)),A=P.filter(alive),pid=new Set(P.map(p=>p.id)),lastMed=p=>{const v=S.v.filter(v=>v.p===p.id&&(v.med||v.mm)).pop();return v&&(v.med||v.mm);},row=(l,n)=>"<tr><td>"+l+"</td><td class='n'>"+n+"</td></tr>";
  if(modOn("tb")){const asked=P.filter(p=>p.tb&&p.tb.asked),pos=P.filter(p=>p.tb&&p.tb.posD),rp=new Set(S.ref.filter(r=>r.code==="tb"&&pid.has(r.p)).map(r=>r.p)),tested=P.filter(p=>p.tb&&p.tb.test),dx=tested.filter(p=>p.tb.test.res==="pos"),rx=P.filter(p=>p.tb&&p.tb.rx&&p.tb.rx.start),cur=rx.filter(p=>!p.tb.rx.out&&alive(p)),am=cur.filter(lastMed);
    o+='<h2 class="rep">TB module: from symptoms to treatment outcome</h2><div class="card"><div class="tblwrap"><table>'+barHead+bar("Adults asked the four TB symptom questions",asked.length,A.length,0,"Asked at a home visit, at least once")+bar("With one or more symptoms",pos.length,asked.length,0)+bar("Referred for a TB test",rp.size,pos.length,0)+bar("Tested",tested.filter(p=>rp.has(p.id)).length,rp.size,0,"Result recorded by the clinic, among those referred")+bar("Diagnosed with TB",dx.length,tested.length,0,"Among everyone with a result recorded")+bar("Started on treatment",rx.filter(p=>dx.includes(p)).length,dx.length,0)+bar("On treatment and taking the medicine every day",am.filter(p=>lastMed(p)==="y").length,am.length,0,"Answer at the last home visit, among those asked")+"</table></div>"+
      tbl(["Treatment status","#People"],[row("On treatment now",cur.length)].concat(Object.keys(TBOUT).map(k=>row(TBOUT[k],rx.filter(p=>p.tb.rx.out&&p.tb.rx.out.how===k).length))))+'<p class="small muted">'+MODDRAFT+". Symptoms are as reported to the Leader Neighbor; test results, treatment dates and outcomes are entered by the clinic.</p></div>";}
  // HIV: counts only, and only for the whole programme
  if(modOn("hiv")&&["admin","clinic"].includes(me().role)&&UI.area==="all"){const asked=A.filter(p=>p.hq),off=asked.filter(p=>p.hq.ans==="n"||p.hq.ans==="never"),R=S.ref.filter(r=>r.code==="hivtest"&&pid.has(r.p)),went=new Set(R.filter(r=>r.seen||(r.fu||[]).some(f=>f.st==="went"||f.st==="other")).map(r=>r.p)),art=S.hv.filter(h=>h.art&&!h.hidden&&IX.p[h.p]&&alive(IX.p[h.p])).map(h=>IX.p[h.p]),am=art.filter(lastMed);
    o+='<h2 class="rep">HIV module: counts for the whole programme</h2><div class="card">'+tbl(["Measure","#Number"],[row("Adults asked whether they had an HIV test in the last 12 months",asked.length),row("Not tested in the last 12 months, and offered a referral for a test",off.length),row("Accepted the referral",new Set(R.map(r=>r.p)).size),row("Went for a test (recorded by the clinic, or reported at follow-up)",went.size),row("People on ART who asked for support",art.length),row("Of them, asked about the medicine at a home visit",am.length),row("Of those asked, taking the medicine every day",am.filter(p=>lastMed(p)==="y").length)])+
      '<p class="small muted">'+MODDRAFT+". Counts only. No test result is recorded in this register. This section is shown to the Administrator and the clinic for the whole programme, never for one Care Group or one Leader Neighbor.</p></div>";}
  return o;}

/* settings */
function unitSettings(){return "<div class='card'><h3>Units for height, waist and weight</h3><div class='seg'><button data-act='units' data-v='metric' class='"+(imp()?"":"on")+"'>Centimetres and kilograms</button><button data-act='units' data-v='us' class='"+(imp()?"on":"")+"'>Feet, inches and pounds</button></div><p class='small muted'>This changes only how workers type measurements, on every tablet after its next sync. Records are always kept in centimetres and kilograms, so the choice can be changed at any time. Blood sugar stays in mmol/L.</p></div>";}
function modSettings(){const sw=(k,name,what)=>'<div class="q"><label class="t">'+name+'</label><p class="small muted">'+what+'</p><div class="seg"><button data-act="mod" data-k="'+k+'" data-v="on" class="'+(modOn(k)?"on":"")+'">On</button><button data-act="mod" data-k="'+k+'" data-v="off" class="'+(modOn(k)?"":"on")+'">Off</button></div></div>';
  return "<div class='card'><h3>Optional modules</h3>"+sw("tb","TB module","Symptom questions at home visits, a TB test referral, treatment support, three counselling pages and a report section.")+sw("hiv","HIV module","A yearly question about HIV testing with a referral on request, confidential support for people on ART who ask for it, two counselling pages and programme-level counts. No test result is ever recorded.")+
    "<p class='small muted'>Both are off unless switched on here. Every tablet follows this choice after its next sync. Switching a module off hides its screens and keeps its records; switching it on again brings them back. The text of both modules is a draft: "+MODDRAFT.toLowerCase()+".</p></div>";}

/* QIVC: extra home-visit steps, only while the module is on */
const QMOD={tb:[["tb1","TB and HIV modules","If the tablet asked the TB symptom questions: did she ask about each of the four before tapping any, or None of these?"],["tb2","TB and HIV modules","For a person on TB treatment: did she ask about the medicine and about the people in the house being checked, without scolding?"]],
  hiv:[["hv1","TB and HIV modules","If the tablet asked the HIV test question: did she ask it where nobody else could hear, without asking for or guessing a result?"],["hv2","TB and HIV modules","If the person had not tested in the last 12 months: did she show the page and offer the referral, without pressure?"]]};
const qItems=kind=>kind==="home"?QIV.home.items.concat(modOn("tb")?QMOD.tb:[],modOn("hiv")?QMOD.hiv:[]):QIV[kind].items;

/* example data for both modules. It is always built, and shown only while the module is on. No random numbers are drawn. */
function modSeed(){const num=p=>+String(p.id).replace(/\D/g,"")||0,last={};for(const v of S.v)if(v.kind!=="prom")last[v.p]=v;
  for(const p of S.p){if(!alive(p)||!/^p\d+$/.test(p.id))continue;const n=num(p),v=last[p.id],h=IX.hh[p.hh];if(!v||!h||h.cen)continue;
    if(diff(TODAY,v.d)<=TBASK&&n%5){p.tb={asked:v.d,sym:[]};
      if(n%83===7){p.tb.sym=n%2?["Cough","Night sweats"]:["Cough","Weight loss without trying"];p.tb.posD=v.d;const r={id:"rtb"+n,p:p.id,d:v.d,by:h.ln,code:"tb",urg:2};S.ref.push(r);
        if(n%3){const sd=addD(v.d,3+n%5);if(sd<=TODAY){r.seen=sd;p.tb.test={d:sd,res:n%4===1||n%4===2?"pos":"neg"};if(p.tb.test.res==="pos"){p.tb.rx={start:sd};if(!v.med)v.mm=n%3===1?"y":"n";}}}}}
    if(n%3){const a=n%10;p.hq={d:v.d,ans:a<4?"y":a<7?"n":a<9?"never":"ns"};
      if(a>=4&&a<9){p.hq.off=n%4<2?"y":"n";if(p.hq.off==="y"){const r={id:"rhv"+n,p:p.id,d:v.d,by:h.ln,code:"hivtest",urg:3};if(n%8<3&&addD(v.d,9)<=TODAY)r.seen=addD(v.d,9);S.ref.push(r);}}}
    if(n%157===11){S.hv.push({id:"hv_"+p.id,p:p.id,art:true,src:n%2?"self":"clinic",d:addD(v.d,-30),by:n%2?h.ln:"cl",lnOk:n%3!==0,consent:{d:addD(v.d,-30),by:n%2?h.ln:"cl"}});if(!v.med)v.mm=n%4?"y":"n";}}
  // Akosua Asante's area: one person on TB treatment, one finished, and two people on ART (one whom she may know about, one whom she may not)
  const a=(IX.lnH.l20||[]).flatMap(h=>IX.hhP[h.id]||[]).filter(p=>alive(p)&&/^p\d+$/.test(p.id)&&!p.cvd&&!(p.tb&&p.tb.rx)),s40=addD(TODAY,-40);
  if(a[2]){a[2].tb={asked:addD(s40,-6),sym:["Cough","Fever"],posD:addD(s40,-6),test:{d:s40,res:"pos"},rx:{start:s40}};S.ref.push({id:"rtbA",p:a[2].id,d:addD(s40,-6),by:"l20",code:"tb",urg:2,seen:s40});}
  if(a[5]){const s=addD(TODAY,-215);a[5].tb={asked:addD(s,-5),sym:["Cough"],posD:addD(s,-5),test:{d:s,res:"pos"},rx:{start:s,out:{d:addD(TODAY,-30),how:"completed"}}};S.ref.push({id:"rtbB",p:a[5].id,d:addD(s,-5),by:"l20",code:"tb",urg:2,seen:s});}
  if(a[14]){a[14].tb={asked:addD(TODAY,-9),sym:["Cough","Weight loss without trying"],posD:addD(TODAY,-9)};S.ref.push({id:"rtbC",p:a[14].id,d:addD(TODAY,-9),by:"l20",code:"tb",urg:2});}
  if(a[8]&&!S.hv.some(x=>x.p===a[8].id))S.hv.push({id:"hv_"+a[8].id,p:a[8].id,art:true,src:"self",d:addD(TODAY,-60),by:"l20",lnOk:true,consent:{d:addD(TODAY,-60),by:"l20"}});
  if(a[11]&&!S.hv.some(x=>x.p===a[11].id))S.hv.push({id:"hv_"+a[11].id,p:a[11].id,art:true,src:"clinic",d:addD(TODAY,-90),by:"cl",lnOk:false,consent:{d:addD(TODAY,-90),by:"cl"}});}

document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset,A=d.act;
  if(A==="mod"&&me().role==="admin"){CFG.mods=Object.assign({},CFG.mods,{[d.k]:d.v==="on"});index();UI.keep=true;UI.pg=null;return render();}
  if(A==="units"&&me().role==="admin"){CFG.units=d.v==="us"?"us":"metric";UI.keep=true;return render();}
  if(A==="hvnew"&&modOn("hiv")){UI.pid=d.id;UI.F={pid:d.id,art:null,cons:null,lnOk:null,tried:false};UI.mode="hv";return render();}
  if(A==="savehv"&&modOn("hiv"))return saveHv();});
