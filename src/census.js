/* ---------- census (Enumerators) ----------
   The census is done once, before Care Groups are formed, by temporary Enumerators working in pairs.
   A census household belongs to the Enumerator account that entered it (h.ln) until the administrator
   gives it to a Leader Neighbor. h.cen holds the census facts: {st,d,by,gps,lm,ph,kids,tries,cbTime}.
   The screens are written for people with little training: one step per screen, with the words to say. */
const CZ={good:15,poor:50,full:35};   // metres for a good and a poor location fix; age for the full set of questions and measurements
const CST={done:["Completed","good"],cb:["Call back","warn"],ref:["Refused","bad"],vac:["Vacant, or not a home",""]};
/* outcomes at the door that lead to a call-back, and the words shown for each */
const CZCB={cb:"Nobody home",kids:"Only children home",busy:"Adult cannot talk now",ill:"Adult too ill or unable to answer",lang:"No shared language"};
const czHh=id=>S.hh.filter(h=>h.ln===id&&h.cen);
const czNo=()=>"C-"+UI.who.replace(/^w_/,"").slice(-3).toUpperCase()+"-"+String(S.hh.filter(h=>h.ln===UI.who).length+1).padStart(3,"0");
const czPend=h=>(IX.hhP[h.id]||[]).filter(p=>p.cen&&p.cen.st==="absent"&&alive(p));
const czBack=id=>czHh(id).filter(h=>h.cen.st==="cb"||(h.cen.st==="done"&&czPend(h).length));
const say=t=>'<div class="say">'+t+"</div>",todo=t=>'<div class="do">'+t+"</div>";
const cseg=(path,opts,val)=>'<div class="seg">'+opts.map(o=>'<button data-cf="'+path+'" data-v="'+esc(o[0])+'" class="'+(String(val)===String(o[0])?"on":"")+'">'+esc(o[1])+"</button>").join("")+"</div>";
const cnum=(path,val,ph,w)=>'<input type="number" inputmode="decimal" data-ci="'+path+'" value="'+esc(val??"")+'" placeholder="'+esc(ph||"")+'" style="width:'+(w||110)+'px">';
const ctxt=(path,val,ph)=>'<input data-ci="'+path+'" value="'+esc(val??"")+'" placeholder="'+esc(ph||"")+'" style="width:100%">';
const getPath=(o,path)=>path.split(".").reduce((a,k)=>a==null?a:a[k],o);

/* location */
function gpsHtml(o){const g=o.gps;let h="";
  if(o.gpsBusy)h+='<p><span class="chip info">Finding the location… keep the tablet still, under open sky</span></p>';
  else if(g)h+='<p><span class="chip '+(g.acc<=CZ.good?"good":g.acc<=CZ.poor?"warn":"bad")+'">Location saved, accurate to about '+Math.round(g.acc)+" m</span></p>"+
    (g.acc>CZ.good?'<p class="small">'+(g.acc>CZ.poor?"<b>This is a poor fix.</b> ":"")+"For a better fix, step outside, away from walls and roofs, hold the tablet flat and still, and tap Try again. If it does not improve after two tries, carry on and describe the place well below.</p>":"");
  else if(o.gpsMsg)h+='<div class="note warn">'+esc(o.gpsMsg)+"</div>";
  return h+'<div class="row"><button class="'+(g?"":"pri")+'" data-act="czgps">'+(g?"Try again":"Record the location of this house")+"</button></div>";}
function czLocate(o){if(!navigator.geolocation){o.gpsMsg="This tablet cannot give a location. Describe the place well below.";UI.keep=true;return render();}
  o.gpsBusy=true;o.gpsMsg="";UI.keep=true;render();
  navigator.geolocation.getCurrentPosition(p=>{o.gpsBusy=false;const g={lat:+p.coords.latitude.toFixed(6),lon:+p.coords.longitude.toFixed(6),acc:Math.round(p.coords.accuracy),t:Date.now()};
      if(!o.gps||g.acc<=o.gps.acc)o.gps=g;if(UI.F===o||UI.gt===o){UI.keep=true;render();}if(typeof afterAction==="function")afterAction();},
    e=>{o.gpsBusy=false;o.gpsMsg=e.code===1?"Location is switched off for this app. Ask the supervisor to allow it. For now, describe the place well below.":"No location found. Step outside, away from walls and roofs, and try again. If it still fails, describe the place well below.";if(UI.F===o||UI.gt===o){UI.keep=true;render();}},
    {enableHighAccuracy:true,timeout:30000,maximumAge:0});}

/* the form */
const czAdult=()=>({name:"",sex:null,age:"",here:null});
const czAns=a=>Object.assign(a,{dxH:null,rxH:null,dxD:null,rxD:null,st:null,mi:null,preg:null,fam:null,prev:null,r:[["",""],["",""],["",""]],nobp:false,warn:[],ht:"",waist:""});
function czStart(h){const F={cz:1,step:"arrive",hist:[],hid:h?h.id:null,gps:h?h.cen.gps:null,gpsMsg:"",lm:h?h.cen.lm||"":"",out:null,cbTime:h?h.cen.cbTime||"":"",lang:h?h.cen.lang||"":"",head:"",ph:h?h.cen.ph||"":"",nhis:null,kids:"",ad:[czAdult()],i:0,sub:"hx",tried:false};UI.F=F;UI.mode="cz";}
function czReturn(h){const F={cz:1,step:"person",hist:[],hid:h.id,revisit:true,ad:czPend(h).map(p=>czAns({pid:p.id,name:p.name,sex:p.sex,age:p.age,here:null})),i:0,sub:"here",tried:false};UI.F=F;UI.mode="cz";}
const czFull=a=>+a.age>=CZ.full||a.dxH==="y"||a.dxD==="y";
const czQueue=F=>F.ad.map((a,i)=>i).filter(i=>F.revisit||F.ad[i].here==="y");
function czGo(F,step,i,sub){F.hist.push([F.step,F.i,F.sub]);F.step=step;if(i!=null)F.i=i;if(sub)F.sub=sub;F.tried=false;}
function czNextPerson(F){const q=czQueue(F),k=q.indexOf(F.i);if(k>=0&&k<q.length-1)czGo(F,"person",q[k+1],F.revisit?"here":"hx");else czGo(F,"end");}
function czDec(a){if(a.nobp)return null;const v=avgBP({r:a.r});if(v.s==null)return null;const hi=v.s>=CFG.bp.prompt[0]||v.di>=CFG.bp.prompt[1];
  const d=decide({id:"_census",htn:{dx:a.dxH==="y"},bp:[],glu:[]},v.s,v.di,hi?a.warn.filter(x=>x!=="__none"):[],a.preg==="y",false);return Object.assign({s:v.s,di:v.di,need3:v.need3,hi},d);}
const CZSAY={ok:"Your blood pressure today is normal. Blood pressure can rise over the years without any sign, so it is good to check it from time to time. A volunteer from the project will visit this house in about three months to check it again, and about three times a year after that.",
  recheck:"Your blood pressure today is higher than normal. One reading does not mean that you have high blood pressure. A nurse from the project will come in the next few weeks to check it again.",
  relink:"Your blood pressure is raised today. Please go back to the health facility where you get your treatment. A volunteer from the project will visit you soon.",
  prompt:"Your blood pressure is very high today. Please go to the Salvation Army health facility in the next few days, even if you feel well. They will be expecting you.",
  preg:"Your blood pressure is raised today. In pregnancy this must be checked soon. Please go to the Salvation Army health facility in the next few days. They will be expecting you.",
  emerg:"Your blood pressure needs attention today. Please go to the health facility now. I am calling my supervisor to help."};
function czMissing(F){const a=F.ad[F.i];
  if(F.step==="arrive")return !F.out||(!F.gps&&!F.lm.trim())||(!!CZCB[F.out]&&!F.lm.trim())||(F.out==="lang"&&!(F.lang||"").trim());
  if(F.step==="list")return (F.ad[0].name=F.head.trim(),!F.head.trim())||!F.nhis||F.kids===""||F.ad.some(x=>!x.name.trim()||!x.sex||!(+x.age>=18&&+x.age<=110)||!x.here);
  if(F.step==="person"&&F.sub==="here")return !a.here;
  if(F.step==="person"&&F.sub==="hx"){if(!a.dxH||!a.dxD||(a.dxH==="y"&&!a.rxH)||(a.dxD==="y"&&!a.rxD))return true;
    return czFull(a)&&(!a.st||!a.mi||!a.fam||!a.prev||(a.sex==="F"&&+a.age<50&&!a.preg));}
  if(F.step==="person"&&F.sub==="ms"){const d=czDec(a);return !a.nobp&&(!d||(d.hi&&!a.warn.length));}
  return false;}

function vCz(){const F=UI.F,a=F.ad[F.i],miss=k=>F.tried&&k,q8=czQueue(F),pos=q8.indexOf(F.i)+1;
  let o='<div class="row"><button class="link" data-act="czback">‹ Back</button><span class="grow"></span><button class="link" data-act="czquit">Stop without saving</button></div>';
  if(F.step==="arrive"){
    o+="<h1>"+(F.hid?"Call-back: "+esc(IX.hh[F.hid].no):"New household")+'</h1><div class="card"><h3>1. At the door</h3>'+todo("Stand at the door of the house. Record the location before you knock.")+gpsHtml(F)+
      q("Describe the place so that another person can find it",ctxt("lm",F.lm,"For example: blue gate behind the mosque, second door on the left"),miss(!F.lm.trim()&&(!F.gps||!!CZCB[F.out])),"Many houses share one compound, so write which door.")+
      q("What did you find?",cseg("out",[["home","An adult is home and can talk"],["busy","An adult is home but cannot talk now"],["ill","The only adult home is too ill, or unable to answer"],["lang","We have no language in common"],["kids","Only children are home"],["cb","Nobody home"],["ref","They refuse"],["vac","Vacant, or not a home"]],F.out),miss(!F.out),"An adult is a person aged 18 or older who lives here. A visitor, or a house help who does not live here, cannot answer for the household.")+
      (F.out==="kids"?todo("Do not ask a child any of the questions, and do not go inside. Ask only when an adult will be home, then save. The house goes to your Call-backs list."):"")+
      (F.out==="ill"?todo("Do not try to interview or measure this person. Ask when another adult of the household will be home, then save. If the person looks very ill and is alone, phone the supervisor. The house goes to your Call-backs list."):"")+
      (F.out==="lang"?todo("Find out which language the household speaks, and write it below. The supervisor will send a pair who speaks it, or someone to interpret. Do not use a child to interpret the health questions.")+q("Which language do they speak?",ctxt("lang",F.lang,"For example: Hausa, Ga, Ewe, French"),miss(!(F.lang||"").trim())):"")+
      (F.out==="busy"?todo("Do not press. Ask when it would suit them, then save. The house goes to your Call-backs list."):"")+
      (CZCB[F.out]?q(F.out==="cb"?"Best time to come back, if a neighbour knows":"Best time to come back",ctxt("cbTime",F.cbTime,"For example: Saturday morning")):"")+
      (F.tried&&czMissing(F)?'<div class="note bad">Please complete the items marked with *.</div>':"")+'<div class="row"><button class="pri tap" data-act="cznext">'+(F.out==="home"?"Next":"Save")+"</button></div></div>";}
  else if(F.step==="consent"){
    o+='<h1>2. Ask permission</h1><div class="card">'+say("Good day. We are working with a Salvation Army health project. We are visiting every house in this area to list the adults who live here and to check the blood pressure of everyone aged 35 or older. It is free. It takes about 15 minutes. What you tell us is kept private, and you may say no to any part. May we go ahead?")+
      '<div class="row"><button class="pri tap" data-act="czyes">They agree</button></div><div class="row"><button data-act="czno">They do not agree</button></div></div>';}
  else if(F.step==="list"){
    o+='<h1>3. Who lives here</h1><div class="card">'+todo("First ask every adult aged 35 or older who is home to sit down and rest. Their blood pressure will be ready to take when you finish this list.")+
      q("Name of the head of the household",ctxt("head",F.head,"Name"),miss(!F.head.trim()))+q("A phone number for this household",ctxt("ph",F.ph,"Optional"))+
      q("Does the household have an active NHIS card?",cseg("nhis",[["y","Yes"],["n","No"],["u","Not sure"]],F.nhis),miss(!F.nhis))+
      q("How many children under 18 live here?",cnum("kids",F.kids,"0 if none",120),miss(F.kids===""))+"</div>";
    o+='<div class="card"><h3>Every adult aged 18 or older who lives here</h3>'+say("Please tell me the name and age of each adult who usually sleeps in this house. Include those who are out now.");F.ad[0].name=F.head.trim();
    F.ad.forEach((x,i)=>{o+='<div class="q'+(miss(!x.name.trim()||!x.sex||!(+x.age>=18&&+x.age<=110)||!x.here)?" miss":"")+'"><label class="t">Adult '+(i+1)+(i?"":": the head of the household")+'</label><div class="row"><div class="grow">'+(i?ctxt("ad."+i+".name",x.name,"Name"):'<div id="czhead" class="fixed">'+(esc(F.head.trim())||'<span class="muted">Type the name of the head of the household above</span>')+"</div>")+"</div>"+cnum("ad."+i+".age",x.age,"Age",90)+"</div>"+(i?"":'<p class="small muted">The head is already on the list. Fill in the age, sex and whether he or she is home now.</p>')+
      '<div class="pick"><div><span class="lab'+(F.tried&&!x.sex?" need":"")+'">Sex</span>'+cseg("ad."+i+".sex",[["F","Woman"],["M","Man"]],x.sex)+'</div><div><span class="lab'+(F.tried&&!x.here?" need":"")+'">Home now?</span>'+cseg("ad."+i+".here",[["y","Here now"],["n","Out"]],x.here)+"</div>"+(i?'<button class="link" data-act="czdel" data-i="'+i+'" style="margin-left:auto">Remove this adult</button>':"")+"</div></div>";});
    o+='<div class="row"><button data-act="czadd">Add another adult who lives here</button></div>'+(F.tried&&czMissing(F)?'<div class="note bad">Please complete the items marked with *. An adult is 18 or older.</div>':"")+'<div class="row"><button class="pri tap" data-act="cznext">Next</button></div></div>';}
  else if(F.step==="person"){const who="<h1>"+esc(a.name)+'</h1><p class="muted">'+(a.sex==="F"?"Woman":"Man")+", "+esc(a.age)+" years. Person "+pos+" of "+q8.length+" to see in this household.</p>";
    if(F.sub==="here")o+=who+'<div class="card">'+q("Is this person home now?",cseg("ad."+F.i+".here",[["y","Yes"],["n","No"]],a.here),miss(!a.here),"This is the one call-back for this person. If the person is out again, the Leader Neighbor will see them later.")+'<div class="row"><button class="pri tap" data-act="cznext">Next</button></div></div>';
    else if(F.sub==="hx"){const P="ad."+F.i+".",full=czFull(a)||+a.age>=CZ.full;
      o+=who+'<div class="card"><h3>Questions</h3>'+say("I will ask a few questions about your health. Answer only what a health worker has told you.")+
        q("Has a health worker ever told you that you have high blood pressure?",cseg(P+"dxH",YN,a.dxH),miss(!a.dxH))+(a.dxH==="y"?q("Are you taking medicine for it now?",cseg(P+"rxH",YN,a.rxH),miss(!a.rxH)):"")+
        q("Has a health worker ever told you that you have diabetes, or sugar disease?",cseg(P+"dxD",YN,a.dxD),miss(!a.dxD))+(a.dxD==="y"?q("Are you taking medicine for it now?",cseg(P+"rxD",YN,a.rxD),miss(!a.rxD)):"")+
        (full?q("Has a health worker ever told you that you had a stroke?",cseg(P+"st",YN,a.st),miss(!a.st))+q("Has a health worker ever told you that you had a heart attack?",cseg(P+"mi",YN,a.mi),miss(!a.mi))+
          q("Does a parent, brother or sister have diabetes?",cseg(P+"fam",YN,a.fam),miss(!a.fam))+q("Has a health worker ever said that your sugar was high?",cseg(P+"prev",YN,a.prev),miss(!a.prev))+
          (a.sex==="F"&&+a.age<50?q("Are you pregnant?",cseg(P+"preg",YN,a.preg),miss(!a.preg)):""):'<p class="small muted">This person is under 35. If both answers are No, there is nothing more to ask.</p>')+
        (F.tried&&czMissing(F)?'<div class="note bad">Please complete the items marked with *.</div>':"")+'<div class="row"><button class="pri tap" data-act="cznext">Next</button></div></div>';}
    else if(F.sub==="ms"){const P="ad."+F.i+".",d=czDec(a),v=a.nobp?{}:avgBP({r:a.r});
      o+=who+'<div class="card"><h3>Blood pressure</h3>'+todo("The person has been sitting for 5 minutes, back against the chair, feet flat on the floor, legs not crossed, and is not talking. Put the cuff on the bare upper arm, level with the heart. Take two readings, one minute apart. Type the numbers exactly as the machine shows them.")+
        '<div class="q'+(miss(!a.nobp&&!d)?" miss":"")+'"><label class="t">Readings</label>'+(a.nobp?"":[0,1,2].map(i=>'<div class="row" id="cr'+i+'"'+(i===2&&!v.need3?" hidden":"")+'><span style="width:110px">'+(i===2?"Third reading":"Reading "+(i+1))+"</span>"+cnum(P+"r."+i+".0",a.r[i][0],"upper",90)+"<span>/</span>"+cnum(P+"r."+i+".1",a.r[i][1],"lower",90)+(i===2?'<span class="small muted">The first two are far apart. Wait one minute and take a third.</span>':"")+"</div>").join(""))+
        '<label class="row"><input type="checkbox" data-cc="'+P+'nobp"'+(a.nobp?" checked":"")+' style="min-height:0"> No reading (the person said no, or the machine failed)</label></div>'+
        '<div id="czdyn">'+czDyn(F)+"</div></div>";
      o+='<div class="card"><h3>Height and waist</h3>'+todo("Height: shoes and head covering off if the person agrees, heels against the stand, looking straight ahead. Waist: over light clothing, tape level around the body at the navel, after a normal breath out. A woman is measured by the woman of the pair where possible, in private.")+
        (imp()?'<div class="row"><label>Height '+cnum(P+"htFt",a.htFt,"feet",90)+" "+cnum(P+"htIn",a.htIn,"inches",100)+"</label><label>Waist (inches) "+cnum(P+"waistIn",a.waistIn,"inches",110)+"</label></div>":'<div class="row"><label>Height (cm) '+cnum(P+"ht",a.ht,"cm",110)+"</label><label>Waist (cm) "+cnum(P+"waist",a.waist,"cm",110)+"</label></div>")+'<p class="small muted">Leave a box empty if the person does not want that measurement.</p>'+
        (F.tried&&czMissing(F)?'<div class="note bad">Please complete the blood pressure items marked with *.</div>':"")+'<div class="row"><button class="pri tap" data-act="cznext">Next</button></div></div>';}
    else if(F.sub==="res"){const d=czDec(a);
      o+=who+'<div class="card"><h3>Tell the person</h3>'+(d?'<div class="big">'+d.s+"/"+d.di+"</div>"+(d.urg===1?'<div class="note bad"><b>EMERGENCY.</b> Phone the supervisor now. Do not leave until someone is taking the person to the health facility.</div>':d.urg===2?'<div class="note warn"><b>Referral.</b> Tell the supervisor about this person at the end of today\'s shift. The clinic will see the referral on its list.</div>':"")+say(esc(CZSAY[d.code]||CZSAY.ok)):say("We could not take your blood pressure today. A volunteer from the project will visit this house in about three months and can check it then."))+
        '<p class="small muted">Do not give any other medical advice. If the person asks a health question, say that the project volunteer or the health facility will answer it.</p><div class="row"><button class="pri tap" data-act="cznext">'+(pos<q8.length?"Next person":"Finish this household")+"</button></div></div>";}}
  else if(F.step==="end"){const out=F.ad.filter(x=>x.here==="n"&&+x.age>=CZ.full).length;
    o+='<h1>Finish</h1><div class="card">'+say("Thank you. A volunteer from the health project will visit this house in about three months, to check blood pressure and to talk about staying healthy."+(out&&!F.revisit?" We will come back once to see the adults who are out today.":""))+
      (out&&!F.revisit?'<div class="note warn">'+out+" adult"+(out===1?"":"s")+" aged 35 or older "+(out===1?"is":"are")+" out. Ask when they are usually home, and write it here.</div>"+ctxt("cbTime",F.cbTime,"Best time to come back"):"")+
      '<div class="row"><button class="pri tap" data-act="czsave">Save this household</button></div></div>';}
  return o;}
function czDyn(F){const a=F.ad[F.i],d=czDec(a);if(!d)return"";let b='<div class="big">'+d.s+"/"+d.di+' <span class="small muted" style="font-size:14px">average</span></div>';
  if(d.hi)b+='<div class="q'+(F.tried&&!a.warn.length?" miss":"")+'"><label class="t">This reading is very high. Ask: do you have any of these today?</label><div class="seg multi">'+WARN.map(w=>'<button data-cm="ad.'+F.i+'.warn" data-v="'+esc(w)+'" class="'+(a.warn.includes(w)?"on":"")+'">'+esc(w)+"</button>").join("")+'<button data-cm="ad.'+F.i+'.warn" data-v="__none" class="none '+(a.warn.includes("__none")?"on":"")+'">None of these</button></div></div>';
  return b;}

/* saving */
function czPerson(h,a,F){let p=a.pid?IX.p[a.pid]:null;const seen=a.here==="y";
  if(!p){p={id:uid("p"),hh:h.id,name:a.name.trim(),sex:a.sex,age:+a.age,bp:[],glu:[],htn:{},dm:{},meds:[]};S.p.push(p);}
  if(!seen){p.cen=F.revisit?{st:"left",d:TODAY}:{st:+a.age>=CZ.full?"absent":"listed",d:TODAY};return;}
  p.cen={st:"seen",d:TODAY};
  // rxPre: already on treatment at the census; the start date is not known, so the census date stands in for it
  if(a.dxH==="y")p.htn=Object.assign({dx:true,src:"self",base:true},a.rxH==="y"?{rx:true,rxStart:TODAY,rxPre:true}:{});
  if(a.dxD==="y")p.dm=Object.assign({dx:true,src:"self",base:true},a.rxD==="y"?{rx:true,rxStart:TODAY,rxPre:true}:{});
  if(!czFull(a))return;
  if(a.st){const st=a.st==="y",mi=a.mi==="y";p.cvd={st,mi,d:st||mi?TODAY:null,by:UI.who};}
  if(a.fam){p.fam=a.fam==="y";p.riskD=TODAY;}if(a.prev)p.prevSugar=a.prev==="y";if(a.preg)p.preg=a.preg==="y";
  const ht=imp()?(+a.htFt?inCm(+a.htFt*12+(+a.htIn||0)):0):+a.ht,wa=imp()?(+a.waistIn?inCm(+a.waistIn):0):+a.waist;
  if(ht>=100&&ht<=230)p.ht=ht;if(wa>=40&&wa<=200)p.waist=wa;
  const d=czDec(a);if(d){p.bp.push({d:TODAY,s:d.s,di:d.di,by:UI.who,src:"census",raw:a.r.filter(x=>+x[0]&&+x[1]).map(x=>[+x[0],+x[1]])});
    if(d.urg===1||d.urg===2)S.ref.push({id:uid("r"),p:p.id,d:TODAY,by:UI.who,code:d.code,urg:d.urg});}}
function czSave(){const F=UI.F;let h=F.hid?IX.hh[F.hid]:null;
  if(F.revisit){for(const a of F.ad)czPerson(h,a,F);index();UI.note=[h.no+": call-back saved.",""];}
  else if(F.out!=="home"){const st=CZCB[F.out]?"cb":F.out,c={st,why:CZCB[F.out]?F.out:undefined,lang:F.out==="lang"?F.lang.trim():undefined,d:TODAY,by:UI.who,gps:F.gps||null,lm:F.lm.trim(),ph:F.ph,cbTime:F.cbTime.trim(),tries:h?(h.cen.tries||1)+1:1};
    if(h)h.cen=c;else{h={id:uid("h"),ln:UI.who,no:czNo(),head:(CZCB[F.out]||(F.out==="ref"?"Refused":"Vacant"))+": "+(F.lm.trim()||"place not described"),nhis:false,topics:[],reg:TODAY,cen:c};S.hh.push(h);}
    h.head=h.cen.st==="cb"?CZCB[F.out]+": "+(F.lm.trim()||"place not described"):h.head;
    index();UI.note=[h.no+": saved as "+(CZCB[F.out]?CZCB[F.out].toLowerCase()+", for a call-back":CST[F.out][0].toLowerCase())+".",""];}
  else{const c={st:"done",d:TODAY,by:UI.who,gps:F.gps||null,lm:F.lm.trim(),ph:F.ph.trim(),kids:+F.kids||0,cbTime:F.cbTime.trim(),tries:h?(h.cen.tries||1)+1:1};
    if(h){h.cen=c;h.head=F.head.trim();h.nhis=F.nhis==="y";}else{h={id:uid("h"),ln:UI.who,no:czNo(),head:F.head.trim(),nhis:F.nhis==="y",topics:[],reg:TODAY,census:TODAY,cen:c};S.hh.push(h);}
    h.census=TODAY;for(const a of F.ad)czPerson(h,a,F);index();UI.note=[h.no+": household saved. "+F.ad.length+" adult"+(F.ad.length===1?"":"s")+" listed.",""];}
  UI.F=null;UI.mode=null;UI.tab="census";render();}

/* lists */
const czRow=(h,btn)=>{const ps=IX.hhP[h.id]||[],g=h.cen.gps,pend=czPend(h).length;
  return '<div class="card"><div class="row" style="align-items:flex-start"><div class="grow"><h2>'+esc(h.head)+' <span class="muted small">'+esc(h.no)+"</span></h2><p class='small muted'>"+fmtD(h.cen.d)+(h.cen.lm&&h.cen.st==="done"?". "+esc(h.cen.lm):"")+(h.cen.cbTime?". Best time: "+esc(h.cen.cbTime):"")+(h.cen.st==="cb"&&h.cen.lang?". <b>Language: "+esc(h.cen.lang)+"</b>":"")+"</p>"+
    '<div class="row">'+chip(CST[h.cen.st])+(h.cen.st==="done"?chip([ps.length+" adult"+(ps.length===1?"":"s")+", "+ps.filter(p=>p.bp.length).length+" measured",""]):"")+(pend?chip([pend+" out: one call-back","warn"]):"")+(h.cen.st==="cb"&&h.cen.tries>1?chip(["Tried "+h.cen.tries+" times","warn"]):"")+chip(g?["Location "+Math.round(g.acc)+" m",g.acc<=CZ.good?"good":g.acc<=CZ.poor?"warn":"bad"]:["No location","bad"])+"</div></div>"+(btn||"")+"</div></div>";};
function vCensus(){const hs=czHh(UI.who).slice().reverse(),today=hs.filter(h=>h.cen.d===TODAY),cb=czBack(UI.who).length;
  let o="<h1>Census</h1>";if(UI.note){o+='<div class="note '+(UI.note[1]||"")+'">'+esc(UI.note[0])+"</div>";UI.note=null;}
  o+='<div class="row"><button class="pri tap" data-act="cznew">Start a new household</button></div>';
  o+='<div class="grid"><div class="card"><h3>Completed today</h3><div class="big">'+today.filter(h=>h.cen.st==="done").length+'</div></div><div class="card"><h3>Completed in all</h3><div class="big">'+hs.filter(h=>h.cen.st==="done").length+'</div></div><div class="card"><h3>Call-backs waiting</h3><div class="big">'+cb+"</div></div></div>";
  o+='<p class="muted">One tablet for each pair. One of you asks and measures, the other types. Open "How to" if you are not sure what to do.</p>';
  o+=hs.slice(0,UI.all?999:20).map(h=>czRow(h)).join("")+(hs.length>20&&!UI.all?'<button data-act="all">Show all '+hs.length+"</button>":"");
  if(!hs.length)o+='<div class="note">No household recorded yet.</div>';return o;}
function vCallbacks(){const hs=czBack(UI.who);let o="<h1>Call-backs</h1><p class='muted'>Houses where the interview could not be done (nobody home, only children home, the adult could not talk or was too ill, or no shared language), and houses where an adult aged 35 or older was out. An adult who is out again at the call-back is left for the Leader Neighbor.</p>";
  if(!hs.length)return o+'<div class="note">No call-back is waiting.</div>';
  return o+hs.map(h=>czRow(h,'<button class="pri" style="white-space:nowrap" data-act="czcb" data-id="'+h.id+'">Go back now</button>')).join("");}
function vCHelp(){UI.gt=UI.gt||{};const c=(t,items)=>'<div class="card"><h3>'+t+'</h3><ul style="margin:0;padding-left:20px;line-height:1.55">'+items.map(i=>"<li>"+i+"</li>").join("")+"</ul></div>";
  return "<h1>How to do the census</h1>"+
    c("Before the shift",["Charge the tablet. Check that it shows your pair's name at the top.","Carry: the blood pressure machine and spare batteries, the height stand, the tape measure, your badge, and the supervisor's phone number.","Work only in the streets the supervisor gave your pair."])+
    c("At each house",["Record the location at the door, then knock.","Read the words in the yellow boxes aloud. Do the actions in the blue boxes.","List every adult aged 18 or older who usually sleeps there, including those who are out.","Everyone aged 35 or older who is home: questions, blood pressure, height and waist.","Adults under 35: two questions only.","If nobody is home, only children are home, the adult cannot talk now or is too ill, or you have no language in common, save the house with that answer. It goes to your Call-backs list.","Never ask a child the questions."])+
    c("Blood pressure",["The person sits and rests for 5 minutes first: back supported, feet flat, legs not crossed, no talking.","Bare upper arm, cuff level with the heart.","Two readings, one minute apart. If they are far apart, the tablet asks for a third.","Type the numbers exactly as the machine shows them. Never round them."])+
    c("If something is wrong",["If the tablet shows EMERGENCY, phone the supervisor at once and stay with the person.","If anyone looks very ill, phone the supervisor, whatever the reading.","Do not give medical advice. The project volunteer or the health facility will answer health questions.","What you see and hear in a house is private. Do not talk about it with neighbours."])+
    c("At the end of the shift",["Meet the supervisor. Connect the tablet to the internet and wait until the top of the screen says Synced.","Tell the supervisor about every referral and every problem."])+
    '<div class="card"><h3>Test this tablet\'s location</h3><p class="small">Stand outside, turn Wi-Fi and mobile data off, and tap the button. A good tablet gives a location accurate to '+CZ.good+" m or better within a minute.</p>"+gpsHtml(UI.gt)+(UI.gt.gps?'<p class="small muted">Latitude '+UI.gt.gps.lat+", longitude "+UI.gt.gps.lon+".</p>":"")+"</div>";}

/* administrator: census progress */
function vCProg(){const en=S.w.filter(w=>w.role==="enum"&&w.active!==false),all=en.flatMap(w=>czHh(w.id));
  const st=hs=>{const ps=hs.flatMap(h=>IX.hhP[h.id]||[]),done=hs.filter(h=>h.cen.st==="done"),o35=ps.filter(p=>p.age>=CZ.full),raw=ps.flatMap(p=>p.bp.filter(b=>b.src==="census"&&b.raw).flatMap(b=>b.raw.flat()));
    return{n:hs.length,done:done.length,cb:hs.filter(h=>h.cen.st==="cb").length,ref:hs.filter(h=>h.cen.st==="ref").length,vac:hs.filter(h=>h.cen.st==="vac").length,ad:ps.length,o35:o35.length,bp:o35.filter(p=>p.bp.length).length,out:ps.filter(p=>p.cen&&p.cen.st==="absent").length,
      gps:done.filter(h=>h.cen.gps&&h.cen.gps.acc<=CZ.good).length,gpsAny:done.filter(h=>h.cen.gps).length,kids:done.reduce((a,h)=>a+(h.cen.kids||0),0),zero:raw.length>=20?pct(raw.filter(x=>x%10===0).length,raw.length):null,days:new Set(hs.map(h=>h.cen.d)).size,mo:done.filter(hhMonthly).length};};
  let o="<h1>Census</h1><p class='muted'>Households recorded by the Enumerators and not yet given to a Leader Neighbor."+(live()?"":" Example data.")+"</p>";
  if(!en.length)return o+'<div class="note">No Enumerator has been added yet. Add each pair on the Workers page.</div>';
  const T=st(all);
  o+='<div class="grid"><div class="card"><h3>Households completed</h3><div class="big">'+T.done+'</div></div><div class="card"><h3>Adults listed</h3><div class="big">'+T.ad+'</div><p class="small muted">and '+T.kids+' children under 18</p></div><div class="card"><h3>Adults 35+ measured</h3><div class="big">'+(pct(T.bp,T.o35)??0)+'%</div><p class="small muted">'+T.bp+" of "+T.o35+'</p></div><div class="card"><h3>Call-backs waiting</h3><div class="big">'+(T.cb+all.filter(h=>h.cen.st==="done"&&czPend(h).length).length)+"</div></div></div>";
  o+='<div class="card"><h3>By pair</h3>'+tbl(["Pair","#Days worked","#Completed","#To call back","#Refused","#Vacant","#Adults 35+ measured","#Location within "+CZ.good+" m","#Readings ending in 0"],en.map(w=>{const s=st(czHh(w.id));
    return "<tr><td>"+esc(w.name)+"</td><td class='n'>"+s.days+"</td><td class='n'><b>"+s.done+"</b></td><td class='n'>"+s.cb+"</td><td class='n'>"+s.ref+"</td><td class='n'>"+s.vac+"</td><td class='n'>"+s.bp+" of "+s.o35+"</td><td class='n'>"+s.gps+" of "+s.done+"</td><td class='n'>"+(s.zero==null?'<span class="muted">too few</span>':(s.zero>30?"<b>"+s.zero+"%</b>":s.zero+"%"))+"</td></tr>";}))+
    '<p class="small muted">Readings ending in 0: about 1 in 10 is expected from an automatic machine. A much higher share suggests that a pair is rounding the numbers, and the pair should be re-trained. Shown once a pair has 20 numbers.</p></div>';
  {const cb=all.filter(h=>h.cen.st==="cb"),lg={};for(const h of cb)if(h.cen.lang){const k=h.cen.lang.trim().toLowerCase().replace(/^./,c=>c.toUpperCase());lg[k]=(lg[k]||0)+1;}
   if(cb.length)o+='<div class="card"><h3>Houses to call back, by reason</h3>'+tbl(["Reason","#Houses"],Object.keys(CZCB).map(k=>"<tr><td>"+CZCB[k]+"</td><td class='n'>"+cb.filter(h=>(h.cen.why||"cb")===k).length+"</td></tr>"))+(Object.keys(lg).length?"<p class='small'><b>Languages needed:</b> "+Object.entries(lg).sort((a,b)=>b[1]-a[1]).map(([k,n])=>esc(k)+" ("+n+")").join(", ")+".</p>":"")+"</div>";}
  o+='<div class="card"><h3>For planning the Care Groups</h3>'+tbl(["Measure","#Number"],[["Completed households with a person who has hypertension or diabetes, a stroke or heart attack survivor, or a person at risk (monthly visits)",T.mo],["Other completed households (screening visits)",T.done-T.mo],["Completed households with a location of any quality",T.gpsAny+" of "+T.done]].map(r=>"<tr><td>"+r[0]+"</td><td class='n'>"+r[1]+"</td></tr>"))+
    '<p class="small muted">A person at risk is an adult with one raised reading at the census, or an adult aged 35 or older with a raised diabetes-risk score (age, waist and blood pressure). These numbers change when Leader Neighbors re-check raised readings and Promoters test blood sugar.</p></div>';
  return o;}

/* example data: three pairs, with a few households for the first, so that the screens can be tried */
function czSeed(){S.w.push({id:"e1",role:"enum",name:"Census pair A (example)"},{id:"e2",role:"enum",name:"Census pair B (example)"},{id:"e3",role:"enum",name:"Census pair C (example)"});
  // positions of real buildings in Nima (from the built-in map), so that the example squares sit on the map
  const XY={e1:[[5.58221,-0.19893],[5.5822,-0.1989],[5.58234,-0.19906],[5.58217,-0.19882],[5.58199,-0.19896],[5.58215,-0.19878],[5.58204,-0.19882],[5.58215,-0.19876],[5.5823,-0.19878],[5.58231,-0.19925],[5.58223,-0.19872],[5.58197,-0.19882],[5.5824,-0.19922],[5.58213,-0.19869],[5.58189,-0.19883],[5.58242,-0.19932],[5.5819,-0.19925],[5.5825,-0.19925],[5.58182,-0.19914],[5.5821,-0.1986],[5.58193,-0.19868],[5.58179,-0.1989],[5.58212,-0.19942],[5.58263,-0.19908],[5.58176,-0.199],[5.58226,-0.19856],[5.58209,-0.19944],[5.58208,-0.19855],[5.58187,-0.19866],[5.58172,-0.19895],[5.58176,-0.1992],[5.58255,-0.19866],[5.58221,-0.19851],[5.58255,-0.19935]],e2:[[5.58609,-0.19657],[5.58612,-0.19652],[5.58604,-0.19637],[5.58597,-0.19667],[5.5861,-0.19665],[5.58616,-0.19658],[5.58614,-0.19634],[5.5861,-0.19668],[5.58582,-0.19663],[5.58611,-0.19672],[5.58598,-0.19675],[5.58605,-0.19676],[5.58624,-0.19663],[5.58578,-0.19668],[5.58607,-0.19622],[5.58629,-0.19649]]};
  const y=addD(TODAY,-1),mk=(ln,k,d,st,head,lm,acc,people,extra)=>{const h={id:"hc"+ln+k,ln,no:"C-"+ln.toUpperCase()+"-"+String(k).padStart(3,"0"),head,nhis:k%2===0,topics:[],reg:d,cen:Object.assign({st,d,by:ln,gps:acc&&XY[ln][k-1]?{lat:XY[ln][k-1][0],lon:XY[ln][k-1][1],acc,t:0}:null,lm,ph:"",kids:k%4,tries:1},extra||{})};
      if(st==="done")h.census=d;S.hh.push(h);
      (people||[]).forEach((a,j)=>{const p={id:h.id+"p"+j,hh:h.id,name:a[0],sex:a[1],age:a[2],bp:[],glu:[],htn:{},dm:{},meds:[],cen:{st:a[3]==null?(a[2]>=35?"absent":"listed"):"seen",d}};
        if(a[3]!=null){p.bp.push({d,s:a[3],di:a[4],by:ln,src:"census",raw:[[a[3]+2,a[4]-1],[a[3]-2,a[4]+1]]});p.waist=a[5];p.ht=a[6];p.fam=false;p.riskD=d;p.cvd={st:false,mi:false,d:null,by:ln};}
        if(a[7]==="h")p.htn={dx:true,src:"self",base:true,rx:true,rxStart:d,rxPre:true};if(a[7]==="d")p.dm={dx:true,src:"self",base:true};if(a[7]==="s")p.cvd={st:true,mi:false,d,by:ln};
        S.p.push(p);});return h;};
  mk("e1",1,y,"done","Kwame Sarpong","Green kiosk by the gutter, first door",8,[["Kwame Sarpong","M",58,152,94,96,171,"h"],["Abena Sarpong","F",51,126,80,88,160]]);
  mk("e1",2,y,"done","Fati Yakubu","Compound behind the mosque, third door on the right",12,[["Fati Yakubu","F",44,148,92,97,158],["Musah Yakubu","M",47,null]]);
  mk("e1",3,y,"cb","Nobody home: blue gate opposite the tailor","blue gate opposite the tailor",22,[],{cbTime:"Saturday morning"});
  mk("e1",4,y,"done","Comfort Quartey","Upstairs room over the phone shop",64,[["Comfort Quartey","F",67,138,84,101,155,"d"],["Joseph Quartey","M",29,null]]);
  mk("e1",5,TODAY,"vac","Vacant: locked store beside the chop bar","locked store beside the chop bar",9);
  mk("e1",6,TODAY,"done","Ibrahim Alhassan","Yellow house at the junction, back door",6,[["Ibrahim Alhassan","M",62,184,112,104,168,"s"],["Hawa Alhassan","F",55,132,82,90,159]]);
  mk("e1",7,TODAY,"ref","Refused: white storey building, ground floor","white storey building, ground floor",null);
  mk("e2",1,y,"done","Esi Nartey","Wooden house beside the borehole",10,[["Esi Nartey","F",39,118,76,82,162]]);
  mk("e2",2,TODAY,"done","Kojo Agbeko","Container shop, room behind",15,[["Kojo Agbeko","M",49,144,96,99,174],["Mawusi Agbeko","F",46,122,78,91,161]]);
  // more example households, so that the map has enough on it to judge
  const FN=["Ama","Kofi","Abena","Yaw","Esi","Kwame","Adwoa","Musah","Fati","Kojo","Akua","Ibrahim","Efua","Nii"],SN=["Mensah","Owusu","Boateng","Tetteh","Alhassan","Quaye","Addo","Yakubu","Lamptey","Darko","Agbeko"];
  for(const [ln,from] of [["e1",8],["e2",3]])for(let k=from;k<=XY[ln].length;k++){const d=addD(TODAY,-(k%4)),nm=i=>FN[(k*3+i*5)%FN.length]+" "+SN[(k*7)%SN.length],acc=5+(k*7)%19;
    if(k%11===5){mk(ln,k,d,"vac","Vacant: empty room, row "+k,"empty room, row "+k,acc);continue;}
    if(k%9===4){mk(ln,k,d,"cb","Nobody home: house "+k+" on the lane","house "+k+" on the lane",acc,[],{why:k%2?"cb":"kids",cbTime:"evening"});continue;}
    if(k%17===8){mk(ln,k,d,"ref","Refused: house "+k+" on the lane","house "+k+" on the lane",acc);continue;}
    const h=k%5===0,dm=k%7===0,hi=h||k%6===1,age=38+(k*11)%34;
    mk(ln,k,d,"done",nm(0),"House "+k+" on the lane",acc,[[nm(0),k%2?"M":"F",age,hi?146+(k%12):118+(k%14),hi?92+(k%6):74+(k%8),84+(k*5)%22,155+(k*3)%22,h?"h":dm?"d":0],[nm(1),k%2?"F":"M",24+(k*5)%40,k%3?120+(k%10):null,78,82,160]]);
    if(h&&dm){const p=S.p[S.p.length-1];p.dm={dx:true,src:"self",base:true};}}
  S.ref.push({id:"rc1",p:"hce16p0",d:TODAY,by:"e1",code:"prompt",urg:2});}

/* actions */
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset,A=d.act,F=UI.F;
  if(d.cf&&F){const cur=getPath(F,d.cf);setPath(F,d.cf,cur===d.v?null:d.v);UI.keep=true;return render();}
  if(d.cm&&F){const arr=getPath(F,d.cm);if(d.v==="__none"){arr.length=0;arr.push("__none");}else{const n=arr.indexOf("__none");if(n>=0)arr.splice(n,1);const j=arr.indexOf(d.v);if(j>=0)arr.splice(j,1);else arr.push(d.v);}UI.keep=true;return render();}
  if(!A||!A.startsWith("cz"))return;
  if(A==="czgps")return czLocate(UI.mode==="cz"?F:UI.gt);
  if(A==="cznew"){czStart(null);return render();}
  if(A==="czcb"){const h=IX.hh[d.id];if(h.cen.st==="cb")czStart(h);else czReturn(h);return render();}
  if(!F||!F.cz)return;
  if(A==="czquit"){if(confirm("Stop and lose what you typed for this household?")){UI.F=null;UI.mode=null;}return render();}
  if(A==="czback"){const p=F.hist.pop();if(!p){if(confirm("Leave this household without saving?")){UI.F=null;UI.mode=null;}return render();}[F.step,F.i,F.sub]=p;F.tried=false;return render();}
  if(A==="czadd"){F.ad[0].name=F.head.trim();F.ad.push(czAdult());UI.keep=true;return render();}
  if(A==="czdel"){F.ad.splice(+d.i,1);UI.keep=true;return render();}
  if(A==="czyes"){czGo(F,"list");return render();}
  if(A==="czno"){F.out="ref";return czSave();}
  if(A==="czsave")return czSave();
  if(A==="cznext"){if(czMissing(F)){F.tried=true;UI.keep=true;return render();}
    if(F.step==="arrive"){if(F.out!=="home")return czSave();czGo(F,"consent");}
    else if(F.step==="list"){F.ad[0].name=F.head.trim();F.ad.forEach(a=>{if(a.dxH===undefined)czAns(a);});const q8=czQueue(F);if(q8.length)czGo(F,"person",q8[0],"hx");else czGo(F,"end");}
    else if(F.step==="person"){const a=F.ad[F.i];
      if(F.sub==="here"){if(a.here==="y")czGo(F,"person",F.i,"hx");else czNextPerson(F);}
      else if(F.sub==="hx"){if(czFull(a))czGo(F,"person",F.i,"ms");else czNextPerson(F);}
      else if(F.sub==="ms")czGo(F,"person",F.i,"res");
      else czNextPerson(F);}
    return render();}});
document.addEventListener("input",e=>{const el=e.target,d=el.dataset,F=UI.F;if(!F||!F.cz)return;
  if(d.ci){setPath(F,d.ci,el.value);if(d.ci==="head"){F.ad[0].name=el.value.trim();const hd=$("#czhead");if(hd)hd.textContent=el.value.trim()||"Type the name of the head of the household above";}if(/\.r\.\d\.\d$/.test(d.ci)){const dy=$("#czdyn");if(dy){const a=F.ad[F.i],v=avgBP({r:a.r}),sig=(czDec(a)||{}).s+"/"+(czDec(a)||{}).di+"/"+((czDec(a)||{}).hi?1:0);if(dy.dataset.k!==sig){dy.dataset.k=sig;dy.innerHTML=czDyn(F);}const r3=$("#cr2");if(r3)r3.hidden=!v.need3;}}return;}
  if(d.cc){setPath(F,d.cc,el.checked);UI.keep=true;render();}});
