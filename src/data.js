"use strict";
/* CMD Register: home visit register and counselling for hypertension and diabetes.
   Ghana CBIO+ demonstration (The Salvation Army and IGHA). Example-data build: nothing is sent to a server. */
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date());
const dn=s=>Math.round(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5);
const addD=(s,n)=>{const d=new Date(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))+Math.round(n)*864e5);return d.toISOString().slice(0,10)};
const diff=(a,b)=>dn(a)-dn(b);
const pct=(n,d)=>d?Math.round(100*n/d):null;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const fmtD=s=>{if(!s)return"";const m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return +s.slice(8,10)+" "+m[+s.slice(5,7)-1]+" "+s.slice(0,4)};
let SEQ=0;const uid=p=>p+(++SEQ);

/* ---------- settings ---------- */
const MLEN=30.4375;
const CFG={country:"Ghana",
  // The example programme is in its 8th month of home visits, in the second half of the month.
  start:addD(TODAY,-236),
  recheck:120,              // days: adults 35+ with a normal reading, and households with no patient (3 visits a year)
  // Blood pressure rules: section 4.4 of the demonstration narrative (version 7).
  bp:{hi:[140,90],prompt:[180,110],pregEmerg:[160,110]},
  // Blood glucose, mmol/L and HbA1c %: WHO diagnostic values. For clinical review before field use.
  glu:{fast:7.0,rand:11.1,a1c:6.5,a1cGoal:7.0,fastGoal:7.0},
  waist:{M:94,F:80},        // cm; raised waist (IDF values used for sub-Saharan Africa). Draft.
  riskFlag:3,               // draft diabetes-risk score that counts as raised
  targets:{screened:95,aware:70,linked:70,adherent:70,controlled:55,tested:95,dmLinked:70,active:50},
  // Modelled events averted. Relative risk per 10 mmHg lower systolic pressure: Ettehad et al., Lancet 2016;387:957-67.
  // Yearly rates without the fall in pressure are planning assumptions. Replace them with local figures.
  model:{rrCvd:.80,rrCvdLo:.77,rrCvdHi:.83,rrDeath:.87,rrDeathLo:.84,rrDeathHi:.91,cvdRate:1.5,deathRate:2.0},
  qivcFlag:70};
CFG.census=addD(CFG.start,-75);
const mIdx=d=>Math.floor(diff(d,CFG.start)/MLEN);            // 0 = first month of home visits
const mStart=m=>addD(CFG.start,m*MLEN);
const CUR=clamp(mIdx(TODAY),0,11);

/* ---------- the 12 monthly group lessons ---------- */
const LESSONS=[
 ["Two quiet conditions and the Four Helpers","Say why a person who feels well still needs to be checked. Name the four daily actions that control both conditions. Choose the Helper to work on first.","Our group agreement; hand signs for the Four Helpers","f_helpers"],
 ["What is high blood pressure?","Explain that high blood pressure usually has no signs. Name the organs it harms.","Water sachet demonstration of pressure","n_bp"],
 ["What is diabetes?","Recognise the signs of high blood sugar. Go for the blood-sugar test at the screening day. Show any sore on the foot to a health worker early.","Picture cards: signs of high sugar","d_signs"],
 ["Know your numbers","Know the two blood pressure numbers and the sugar number. Keep a record card. Know your own target.","Reading two numbers; making a record card","n_card"],
 ["Less salt, and hidden salt","Use no more than one level teaspoon of salt per person per day. Add salt at the end. Keep salt off the table. Limit seasoning cubes, koobi, momoni, tinned and packaged foods.","Measuring the household's daily salt","k_salt"],
 ["Less sugar, more water","Replace minerals, malt and sweetened drinks with water. Cut sugar in tea and porridge.","Spooning out the sugar in one bottle","k_drinks"],
 ["The healthy plate","Fill half the plate with vegetables. Serve smaller portions of kenkey, banku, fufu and rice. Eat two fruits a day and beans most days. Use about one tablespoon of oil per person per day.","Building a plate; planning a week of low-cost stews","k_plate"],
 ["Move more and keep a healthy weight","Walk briskly or do other activity for 30 minutes on at least five days a week. Sit less. Take small steps to lose weight if overweight.","Walking together; chair exercises","w_weight"],
 ["Alcohol, tobacco, stress and sleep","Drink less or no alcohol. Stop smoking. Use slow breathing. Keep a sleep routine. Share worries with someone trusted.","Counting the weekly cost; slow breathing practice","s_stress"],
 ["Medicine every day and every clinic visit","Take medicines every day, including when feeling well. Tie the dose to a daily routine. Keep every review visit. Keep NHIS active.","Making a personal medicine routine; packing the clinic bag","m_routine"],
 ["Low sugar, high sugar and emergencies","Treat low blood sugar at once with sugar. Never skip meals when on diabetes medicine. Recognise the signs of stroke and heart attack. Call 112 and go to hospital at once.","Low-sugar role play; stroke signs role play","e_plan"],
 ["Family support and staying on track","Have eyes, urine and feet checked as the health worker advises. Make a household plan. Eat the same healthy food together. Continue meeting as a group.","Check-up calendar; family pledge","f_family"]];

/* ---------- home-visit counselling pages ----------
   Each page: icon, title, the question the Leader Neighbor asks, the messages, and commitments to choose from.
   Draft text from the Care Group module outline. For clinical review and pre-testing before field use. */
const PAGES={
 m_forget:["pill","Medicine: \"I forget\"","What do you do at the same time every day, without fail?",["The medicine works only on the days you take it.","Tie it to something you do every day: brushing your teeth, the morning meal, evening prayers.","Keep the medicine where you will see it at that time.","Ask one person at home to remind you."],["Take my medicine with the morning meal every day","Keep my medicine beside my toothbrush","A family member reminds me each day"]],
 m_well:["heart","Medicine: \"I feel well\"","How do you feel on the days you take the medicine, and on the days you do not?",["High blood pressure and diabetes are quiet. Most people feel no sign while the harm goes on.","You feel well because the medicine is working.","When the medicine stops, the pressure or the sugar rises again within days.","Only the health worker decides to change or stop a medicine."],["Take my medicine every day, also when I feel well","Go back to the facility this week to restart my medicine"]],
 m_side:["clinic","Medicine: it makes me feel unwell","What do you feel after you take the medicine?",["Some medicines cause problems such as swollen feet, a cough, dizziness or passing urine often.","Do not stop the medicine on your own.","Tell the health worker what you feel. There are other medicines that can be tried.","I will write a referral so that they know why you are coming."],["Go to the facility this week and say what I feel","Keep taking the medicine until I am seen"]],
 m_out:["card","Medicine: it ran out, or the cost","When did the medicine finish, and what stood in the way of getting more?",["With an active NHIS card, medicines for BP and sugar are covered at the facility.","Go for more medicine one week before it finishes.","Put a little money aside each week for transport.","If the NHIS card has expired, renew it now. I can show you how."],["Renew my NHIS card this week","Collect my medicine before it finishes","Save for transport every week"]],
 m_herbs:["leaf","Medicine, herbs and prayer","Besides the medicine from the health facility, what else do you take or do for your BP or sugar?",["Prayer gives strength. Pray, and also take the medicine.","Herbs do not replace the medicine. Some herbs harm the kidneys or change how the medicine works.","Tell the health worker about every herb or mixture you take.","Keep taking the prescribed medicine every day."],["Take my prescribed medicine every day, and keep praying","Tell the health worker about the herbs I use"]],
 m_other:["pill","Medicine: another reason","What makes it hard to take the medicine every day?",["The medicine protects the heart, the brain, the kidneys and the eyes.","Whatever the difficulty, the health worker can help to find a way.","Do not stop on your own. Go back to the facility and explain."],["Go back to the facility this week","Take my medicine every day"]],
 m_routine:["pill","My medicine routine","Show me where you keep your medicine, and tell me when you take it.",["Take the medicine at the same time every day.","Take it also when you feel well, when you fast, and when you travel.","Carry your medicines and your record card to every clinic visit.","Know the date of your next review."],["Take my medicine at the same time every day","Put my next review date where the family can see it"]],
 c_review:["calendar","A missed clinic review","What stood in the way of going for your review?",["The review visit is where the health worker checks whether the medicine is working.","Go even when you feel well, and even when medicine remains.","Someone from the corps can go with you if you wish.","Let us choose the day now."],["Go for my review on the day we chose","Go with a companion"]],
 c_between:["cuff","Checking between clinic visits","Where do you have your BP or sugar checked between clinic visits, and what do you do with the result?",["I will check your blood pressure at every visit and write it on your card.","Show the card to the health worker at each review.","If I find a high reading, I will refer you. Please go."],["Keep my record card and take it to every review"]],
 r_raised:["cuff","A raised reading today","Has anyone told you before that your blood pressure was high?",["Your reading is raised today. One reading does not show that you have a condition.","Pressure goes up with worry, pain, coffee or a rushed day.","I will check again at my next visit, within one month.","If it is raised again, I will refer you to the facility to be sure."],["Be at home for the re-check","Rest for five minutes before the next check"]],
 n_bp:["cuff","What high blood pressure does","Why does a person who feels well still need a check?",["High blood pressure usually has no signs.","Over years it harms the brain, the heart, the kidneys and the eyes.","The only way to know is to measure.","Every adult aged 35 or older in this house should be checked."],["Every adult in this house has a check this year"]],
 n_card:["card","Know your numbers","May we look at your record card together?",["Blood pressure has two numbers. For most adults the aim is below 140 over 90.","Your health worker may give you your own target.","Write each reading on the card with the date.","A person with diabetes also has a sugar number. Ask the health worker for yours."],["Keep my record card in one place","Ask the health worker for my target"]],
 d_signs:["drop","Signs of high blood sugar","Have you noticed great thirst, passing urine often, tiredness, or a sore that is slow to heal?",["Many people with diabetes have no signs for years.","Signs include great thirst, passing urine often, tiredness, blurred sight, and sores that heal slowly.","A small blood test from the finger shows the sugar level.","Every adult aged 35 or older should have the test at the screening day."],["Go for the blood-sugar test at the next screening day"]],
 d_test:["drop","Not yet tested for sugar","Have you ever had your blood sugar tested?",["The nurse does a finger test at the community screening day.","It takes a few minutes.","Every adult aged 35 or older should have it.","I will put your name down for the next screening day."],["Come to the next screening day"]],
 d_feet:["foot","Foot check","May we look at your feet together?",["Diabetes can take away feeling in the feet, so a sore may not hurt.","Check and wash your feet every day, and dry between the toes.","Never walk barefoot. Check inside your shoes before you put them on.","Show any sore, blister or dark spot to a health worker the same day."],["Check my feet every evening","Never walk barefoot","A family member checks the soles of my feet each week"]],
 d_low:["drop","When blood sugar is too low","When you felt shaky or sweaty, what did you do?",["Diabetes medicine can take the sugar too low, most often after a missed meal.","Signs: shaking, sweating, hunger, confusion.","Take sugar at once: about three teaspoons of sugar in water, or a sweet drink. Then eat a meal.","Never skip meals when you take diabetes medicine. Tell the health worker that it happened."],["Never skip a meal","Keep sugar or a sweet drink within reach","Tell the health worker at my next visit"]],
 k_salt:["salt","Kitchen: hidden salt","Which seasonings and salted foods went into yesterday's main meal?",["One level teaspoon of salt per person per day is enough, from all sources.","Seasoning cubes, koobi, momoni, tinned fish and tomato paste all carry salt.","Use one cube where you used two. Flavour with onion, ginger, garlic, pepper and herbs.","Add salt at the end of cooking, and keep salt off the table."],["Use half the seasoning cubes in our stew","Keep salt off the table","Cook with onion, ginger and garlic for flavour"]],
 k_drinks:["bottle","Drinks","What did you drink yesterday?",["One bottle of minerals or malt holds many spoons of sugar.","Sweet drinks raise the sugar in the blood and add weight.","Water is the best drink. Keep drinking water within reach.","Cut the sugar in tea and porridge by half, then by half again."],["Replace one sweet drink a day with water","Take tea and porridge with half the sugar"]],
 k_plate:["plate","Yesterday's plate, and oil","What was on your plate at yesterday's main meal, and how was it cooked?",["Fill half the plate with vegetables.","Take a smaller portion of kenkey, banku, fufu or rice: about the size of your fist.","Eat beans often, and fruit every day.","Use about one tablespoon of oil per person per day. Boil, grill or steam more often than you fry. Skim oil from soup."],["Half of my plate is vegetables at the main meal","Serve a fist-sized portion of banku, kenkey or rice","Skim the oil from our soup"]],
 w_weight:["scale","Weight and waist","Would you like to work on your weight?",["A large waist raises the risk of both conditions.","Small steps work: smaller portions, fewer sweet drinks, a walk every day.","Avoid slimming teas and crash diets.","We can measure again in three months."],["Walk for 30 minutes on five days a week","Take a smaller portion at the evening meal"]],
 a_move:["walk","Move more every day","On how many days last week did you walk briskly or work your body for 30 minutes?",["Thirty minutes of brisk walking on at least five days a week lowers pressure and sugar.","It can be three walks of ten minutes.","Sit less: stand up and move every hour.","Walk with a neighbour or a family member."],["Walk for 30 minutes on five days a week","Walk with a neighbour"]],
 t_tobacco:["nosmoke","Alcohol and tobacco","Does anyone in this house smoke, or drink alcohol on most days?",["Smoking damages the blood vessels and greatly raises the risk of stroke and heart attack.","Smoke also harms the family. Keep smoke away from the house.","Less alcohol means lower pressure. Have days with none.","The money saved in one week can buy vegetables for the house."],["Have alcohol-free days each week","Keep all smoke out of the house","Ask the health worker for help to stop smoking"]],
 s_stress:["moon","Stress and sleep","How have you been sleeping, and what has been on your mind?",["Worry and poor sleep raise the pressure and make it harder to care for yourself.","Slow breathing helps: breathe in for four counts and out for six, for five minutes.","Keep the same time for sleep each night.","Share your worries with someone you trust."],["Do slow breathing for five minutes each evening","Go to bed at the same time each night"]],
 e_plan:["phone","Household emergency plan","If someone in this house suddenly could not speak or lift an arm, what would you do?",["Signs of stroke: a drooping face, a weak arm or leg on one side, trouble speaking, sudden confusion.","Signs of heart attack: heavy chest pain, breathlessness, sweating.","Call 112 and go to hospital at once. Do not wait, and do not give herbs first.","Decide now: who calls, which hospital, how to get there, and where the NHIS cards are kept."],["Make our household emergency plan today","Keep NHIS cards and transport money in one known place"]],
 f_helpers:["hands","The Four Helpers","Which of the Four Helpers is hardest for you?",["Check your numbers.","Eat well and move more.","Take your medicine every day.","Help each other at home."],["Work on one Helper this month","A family member helps me with it"]],
 f_family:["family","Family support","What will each person here do to help?",["The whole household eats the same healthy food.","Family members remind and encourage. They do not scold.","Go to the clinic together when you can.","With the Four Helpers, a person with these conditions can live long and well."],["Each family member names one way to help","We eat the same healthy food together"]]};
const PREV_TOPICS=["k_salt","k_drinks","k_plate","a_move","t_tobacco"];   // screening visits: one topic not yet covered
const WARN=["Severe headache","Chest pain","Breathlessness","Sudden change in sight","Weakness or numbness on one side","Drooping face","Trouble speaking","Confusion"];
const WHY={forget:["I forget","m_forget"],well:["I feel well","m_well"],side:["It makes me feel unwell","m_side"],out:["It ran out, or the cost","m_out"],herbs:["I use herbs or prayer instead","m_herbs"],other:["Another reason","m_other"]};
const MEDS=["Calcium-channel blocker (for example amlodipine)","ACE inhibitor or ARB (for example lisinopril, losartan)","Thiazide-type diuretic","Beta-blocker","Metformin","Sulfonylurea (for example glibenclamide, gliclazide)","Insulin","Statin","Aspirin","Other"];
const EVENTS=["Stroke","Heart attack","Hospital admission for BP or sugar","Foot ulcer","Amputation"];
const CAUSES=["Stroke","Heart attack or sudden collapse","Heart failure","Kidney failure","Diabetes complication","Other illness","Injury","Not known"];
const QIVC=["Greeted the family and asked permission to visit","Invited the person who cooks and other adults to sit in","Asked about warning signs","Person rested five minutes, seated, arm at heart level","Took two readings and entered both","Explained the reading in plain words","Asked about medicine without scolding","Showed the counselling page and asked its question before telling","Agreed on one or two small actions","Recorded the visit, gave a referral slip if needed, fixed the next visit"];

/* ---------- data ---------- */
const S={w:[],hh:[],p:[],v:[],ref:[],gm:[],q:[],ev:[]};
const IX={};
function index(){IX.w=Object.fromEntries(S.w.map(x=>[x.id,x]));IX.hh=Object.fromEntries(S.hh.map(x=>[x.id,x]));IX.p=Object.fromEntries(S.p.map(x=>[x.id,x]));
  IX.hhP={};for(const p of S.p)(IX.hhP[p.hh]=IX.hhP[p.hh]||[]).push(p);IX.lnH={};for(const h of S.hh)(IX.lnH[h.ln]=IX.lnH[h.ln]||[]).push(h);}

/* ---------- status rules ---------- */
const elev=r=>r&&(r.s>=CFG.bp.hi[0]||r.d>=CFG.bp.hi[1]);
const lastBP=p=>p.bp[p.bp.length-1];
const elevDays=p=>new Set(p.bp.filter(elev).map(r=>r.d)).size;
const alive=p=>!p.death&&!p.out;
const isPatient=p=>p.htn.dx||p.dm.dx;
const fingers=p=>p.glu.filter(g=>g.t==="finger");
const labs=p=>p.glu.filter(g=>g.t!=="finger");
const gluPos=g=>g.t==="a1c"?g.v>=CFG.glu.a1c:g.t==="finger"&&!g.fast?g.v>=CFG.glu.rand:g.v>=CFG.glu.fast;
const screenPos=p=>!p.dm.dx&&!p.dm.ruledOut&&fingers(p).some(gluPos);
function riskScore(p){return (p.age>=45?1:0)+(p.waist&&p.waist>=CFG.waist[p.sex]?1:0)+(p.fam?1:0)+(p.inactive?1:0)+(p.prevSugar?1:0);}
function raisedOnce(p){const l=lastBP(p);return !p.htn.dx&&!p.htn.ruledOut&&elev(l);}
const atRisk=p=>alive(p)&&!isPatient(p)&&(raisedOnce(p)||screenPos(p)||(p.age>=35&&riskScore(p)>=CFG.riskFlag));
const hhMonthly=h=>(IX.hhP[h.id]||[]).some(p=>alive(p)&&(isPatient(p)||atRisk(p)));
function htnLabel(p){if(p.htn.dx)return p.htn.rx?["On BP treatment","info"]:["BP diagnosed, not on treatment","bad"];
  if(p.htn.ruledOut&&!elev(lastBP(p)))return["BP normal at clinic","good"];
  if(!p.bp.length)return p.age>=35?["BP not checked","warn"]:null;
  if(elev(lastBP(p)))return elevDays(p)>=2?["BP raised twice: refer","bad"]:["BP raised once: re-check","warn"];return["BP normal","good"];}
function dmLabel(p){if(p.dm.dx)return p.dm.rx?["On diabetes treatment","info"]:["Diabetes diagnosed, not on treatment","bad"];
  if(screenPos(p))return["Sugar screen raised: needs clinic test","bad"];if(fingers(p).length||labs(p).length)return["Sugar normal","good"];return p.age>=35?["Sugar not tested","warn"]:null;}
const openRef=p=>S.ref.filter(r=>r.p===p.id&&!r.seen);
/* What to do with a reading (narrative 4.4). warn = list of warning signs present. */
function decide(p,s,d,warn,preg,medNo,on){on=on||TODAY;
  const hi=s>=140||d>=90;
  if(warn&&warn.length)return{urg:1,code:"emerg",t:"Emergency. Warning sign present. The person goes to the health facility today. Help to arrange transport and call the Promoter.",refer:1};
  if(preg&&(s>=160||d>=110))return{urg:1,code:"emerg",t:"Emergency. Pregnant with 160 over 110 or more. She goes to the health facility today.",refer:1};
  if(preg&&hi)return{urg:2,code:"preg",t:"Refer now. In pregnancy, one raised reading is enough.",refer:1};
  if(s>=180||d>=110)return{urg:2,code:"prompt",t:"Refer promptly. 180 over 110 or more with no warning sign: to be seen at the facility within days. Tell the Promoter today.",refer:1};
  if(p.htn.dx&&(hi||medNo))return{urg:3,code:"relink",t:"Refer back to the facility. "+(hi?"The reading is raised":"The medicine is not being taken")+" in a person already diagnosed. No second reading is needed.",refer:1};
  if(s==null)return null;
  if(!p.htn.dx&&hi){const before=p.bp.some(r=>elev(r)&&r.d!==on);
    return before?{urg:3,code:"confirm",t:"Refer to the facility for confirmation and treatment. The reading is raised on a second day.",refer:1}:{urg:0,code:"recheck",t:"Raised today. One reading does not show a condition. Check again at the next visit, within one month."};}
  return{urg:0,code:"ok",t:"Below 140 over 90. Praise the person."+(p.htn.dx?" Continue the medicine.":" Check again in about four months.")};}
const REASON={emerg:"Emergency",preg:"Raised BP in pregnancy",prompt:"BP 180/110 or more",relink:"Back to care (diagnosed)",confirm:"BP raised twice: confirm",glu:"Sugar screen raised: confirm",side:"Medicine side effects",feet:"Foot sore"};

/* ---------- example data (fictitious) ---------- */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function build(){
  const R=rng(20261120),N=(m,sd)=>{let u=0;for(let i=0;i<6;i++)u+=R();return m+sd*(u-3)*1.414},pick=a=>a[Math.floor(R()*a.length)];
  const FN=["Ama","Akosua","Abena","Adwoa","Yaa","Afia","Esi","Efua","Akua","Araba","Naa","Dede","Korkor","Mawusi","Dzifa","Fati","Amina","Hawa","Mariama","Rukaya","Comfort","Grace","Mercy","Patience","Gifty","Joyce","Vida","Felicia"];
  const MN=["Kofi","Kwame","Kwabena","Kwaku","Yaw","Kojo","Kwesi","Nii","Tetteh","Kodzo","Selorm","Ibrahim","Abdulai","Issah","Musah","Emmanuel","Samuel","Daniel","Isaac","Joseph","Ebenezer","Francis","Richard"];
  const SN=["Mensah","Owusu","Boateng","Asante","Osei","Appiah","Agyeman","Addo","Lamptey","Quaye","Tetteh","Nartey","Ofori","Darko","Amoah","Ansah","Acheampong","Adjei","Agbeko","Dogbe","Abubakar","Mohammed","Alhassan","Yakubu","Annan","Quartey","Sarpong","Frimpong","Donkor","Baah"];
  const nm=sex=>pick(sex==="F"?FN:MN)+" "+pick(SN);
  S.w.push({id:"adm",role:"admin",name:"Administrator"},{id:"cl",role:"clinic",name:"Clinic staff, Salvation Army facility (example)"});
  for(let i=1;i<=2;i++)S.w.push({id:"pr"+i,role:"prom",name:nm("F")});
  for(let i=1;i<=7;i++)S.w.push({id:"t"+i,role:"lnt",name:nm(R()<.8?"F":"M"),prom:i<=4?"pr1":"pr2",cg:i});
  for(let i=1;i<=48;i++){const t=Math.min(7,Math.ceil(i/7));S.w.push({id:"l"+i,role:"ln",name:nm(R()<.7?"F":"M"),lnt:"t"+t,cg:t,q:i%11===5?.55:.74+R()*.23});}
  const LN=S.w.filter(w=>w.role==="ln");let hn=0;
  for(const ln of LN){const n=+ln.id.slice(1)<=16?27:26;
    for(let k=0;k<n;k++){hn++;const h={id:"h"+hn,ln:ln.id,no:"CG"+ln.cg+"-"+String(hn).padStart(4,"0"),nhis:R()<.68,topics:[]};S.hh.push(h);
      const u=R(),na=u<.2?1:u<.7?2:u<.92?3:4;
      for(let j=0;j<na;j++){const sex=j===0?(R()<.55?"F":"M"):(R()<.5?"F":"M"),old=R()<.495;let age;
        if(old){const a=R();age=a<.4?35+Math.floor(R()*10):a<.68?45+Math.floor(R()*10):a<.86?55+Math.floor(R()*10):65+Math.floor(R()*20);}else age=18+Math.floor(R()*17);
        const pH=age<35?.06:age<45?.22:age<55?.37:age<65?.5:.6,pD=age<35?.015:age<45?.06:age<55?.10:age<65?.14:.16;
        const H=R()<pH,D=R()<pD,p={id:"p"+(S.p.length+1),hh:h.id,name:nm(sex),sex,age,bp:[],glu:[],htn:{},dm:{},meds:[],
          fam:R()<.18,inactive:R()<.5,prevSugar:D&&R()<.3,waist:Math.round(N(sex==="F"?88:86,11)+(D?6:0)),tob:R()<(sex==="M"?.09:.01),
          _t:{H,D,s:H?Math.max(141,N(158,13)):Math.min(137,N(121,9)),d:H?N(95,8):N(77,6),eff:Math.max(5,N(17,7)),away:R()<.045,ad:.35+R()*.35,g:D?Math.max(9.5,N(13.5,3)):Math.max(3.9,N(5.6,.9)),n:0}};
        if(j===0)h.head=p.name;
        if(H&&age>=30&&R()<.48){p.htn.dx=true;p.htn.src="self";p.htn.base=true;if(R()<.6){p.htn.rx=true;p.htn.rxStart=addD(CFG.census,-200-R()*900);p.meds=[MEDS[0]];}}
        if(D&&age>=30&&R()<.5){p.dm.dx=true;p.dm.src="self";p.dm.base=true;if(R()<.75){p.dm.rx=true;p.dm.rxStart=addD(CFG.census,-200-R()*900);p.meds=p.meds.concat(MEDS[4]);}}
        if(sex==="F"&&age<42&&R()<.05)p.preg=true;
        S.p.push(p);}}}
  index();
  // deaths and events since the census (rare)
  for(const p of S.p){if(p.age<35)continue;const risk=(p._t.H||p._t.D)?.013:.004;
    if(R()<risk){const c=(p._t.H||p._t.D)?pick([0,0,1,2,4,5,5,7]):pick([5,5,5,6,7]);p.death={d:addD(CFG.census,30+R()*(diff(TODAY,CFG.census)-35)),cause:CAUSES[c]};}
    else if(p._t.H&&R()<.007)S.ev.push({id:uid("e"),p:p.id,d:addD(CFG.start,R()*230),type:EVENTS[0]});
    else if((p._t.H||p._t.D)&&R()<.012)S.ev.push({id:uid("e"),p:p.id,d:addD(CFG.start,R()*230),type:EVENTS[2]});
    else if(p._t.D&&R()<.03)S.ev.push({id:uid("e"),p:p.id,d:addD(CFG.start,R()*230),type:EVENTS[3]});}
  const live=(p,d)=>!p.death||p.death.d>d;
  const taking=p=>p._t.tk!==false;
  const read=(p,d)=>{let s=p._t.s,di=p._t.d;if(p.htn.rx&&taking(p)){const ramp=clamp(diff(d,p.htn.rxStart)/60,0.2,1);s-=p._t.eff*ramp;di-=p._t.eff*.5*ramp;}
    return{s:Math.round(s+N(0,6)),d:Math.round(di+N(0,4))};};
  function refer(p,d,by,code,urg){if(S.ref.some(r=>r.p===p.id&&!r.seen))return;const r={id:uid("r"),p:p.id,d,by,code,urg};S.ref.push(r);
    const u=R(),delay=urg===1?(u<.95?R()*1.2:null):urg===2?(u<.85?1+R()*5:null):(u<.6?4+R()*22:null);if(delay==null)return;const seen=addD(d,delay);if(seen>TODAY)return;
    r.seen=seen;clinic(p,seen,code);}
  function clinic(p,d,code){pushBP(p,d,"cl","clinic");
    if(code==="glu"){const v=p._t.D?Math.max(6.6,N(8.6,1.4)):N(5.5,.35);p.glu.push({d,t:"a1c",v:+v.toFixed(1),by:"cl"});
      if(v>=CFG.glu.a1c){p.dm={dx:true,src:"clinic",dxDate:d,rx:true,rxStart:d};p.meds=p.meds.concat(MEDS[4]);}else p.dm.ruledOut=d;return;}
    if(p.htn.dx){p.htn.rx=true;if(!p.htn.rxStart||!taking(p))p.htn.rxStart=p.htn.rxStart||d;p._t.tk=true;p._t.ad=Math.min(.92,p._t.ad+.15);p._t.eff+=3;if(!p.meds.length)p.meds=[MEDS[0]];}
    else if(p._t.H){p.htn={dx:true,src:"clinic",dxDate:d,rx:true,rxStart:d};p._t.tk=true;p.meds=p.meds.concat(R()<.3?[MEDS[0],MEDS[2]]:[MEDS[0]]);}
    else p.htn.ruledOut=d;
    p.review=addD(d,R()<.5?30:60);}
  // fix the reading shape: {d:date,s,di}
  const pushBP=(p,d,by,src)=>{const r=read(p,d);const o={d,s:r.s,di:r.d,by,src};p.bp.push(o);return o;};
  // census
  for(const h of S.hh){const d=addD(CFG.census,R()*50);h.census=d;h.last=d;
    for(const p of IX.hhP[h.id]){if(!live(p,d))continue;if(!p._t.away&&(p.age>=35?R()<.96:R()<.25))pushBP(p,d,h.ln,"census");
      if(p.age>=35)p.hab=[{d,salt:R()<.62,drinks:R()<.55?(R()<.5?1:2):0,act:R()<.34?5+Math.floor(R()*3):Math.floor(R()*5),tob:p.tob}];}}
  // fingerstick screening days run by the Promoters in the first months
  for(const p of S.p){if(p.age<35)continue;const cg=IX.w[IX.hh[p.hh].ln].cg,d=addD(CFG.start,10+cg*11+R()*25);if(!live(p,d)||p._t.away||R()>.92)continue;
    const treated=p.dm.rx,v=treated?Math.max(4.5,N(9.5,3)):p._t.g+N(0,1);p.glu.push({d,t:"finger",fast:false,v:+Math.max(3.2,v).toFixed(1),by:cg<=4?"pr1":"pr2"});
    p._t.gd=d;}
  // month by month: group meetings and home visits
  for(let m=0;m<=CUR;m++){const ms=mStart(m);
    // sugar referrals raised at the screening day fall in their month
    for(const p of S.p){if(p._t.gd&&mIdx(p._t.gd)===m&&screenPos(p))refer(p,p._t.gd,"pr",  "glu",3);}
    for(const ln of LN){const hs=IX.lnH[ln.id],cohort=hs.filter(hhMonthly).length;
      const gd=addD(ms,2+R()*11);if(gd<=TODAY&&R()<ln.q+.05&&cohort)S.gm.push({id:uid("g"),ln:ln.id,m,d:gd,lesson:m,att:Math.max(2,Math.round(cohort*(.5+R()*.4))),cohort});
      for(const h of hs){const monthly=hhMonthly(h);let d=addD(ms,15+R()*14);
        if(monthly){if(R()>ln.q*(m===CUR?.62:1))continue;}else{if(diff(d,h.last)<CFG.recheck||R()>ln.q*.85*(m===CUR?.6:1))continue;}
        if(d>TODAY){if(m<CUR)continue;d=addD(TODAY,-Math.floor(R()*8));if(d<addD(ms,15))continue;}
        visitSim(h,d,ln,monthly,m);}}
    // clinic follow-up tests for people on diabetes treatment
    for(const p of S.p){if(p.dm.rx&&!p._t.fu&&live(p,ms)&&diff(ms,p.dm.rxStart)>110&&R()<.12){p._t.fu=1;const d=addD(ms,R()*25);if(d<=TODAY)p.glu.push({d,t:"a1c",v:+Math.max(5.6,N(7.3,1.1)).toFixed(1),by:"cl"});}}}
  function visitSim(h,d,ln,monthly,m){h.last=d;let any=false;
    for(const p of IX.hhP[h.id]){if(!live(p,d)||p._t.away||R()<.14)continue;const l=lastBP(p),due=isPatient(p)||(p.age>=35&&(!l||elev(l)||diff(d,l.d)>=CFG.recheck));if(!due&&p.age<35)continue;
      const v={id:uid("v"),d,hh:h.id,p:p.id,by:ln.id,kind:monthly?"home":"screen",warn:[],pages:[]};any=true;p._t.n++;
      for(const r of S.ref)if(r.p===p.id&&!r.seen&&diff(d,r.d)>20&&R()<.22){r.seen=addD(d,-1-Math.floor(R()*6));clinic(p,r.seen,r.code);}
      const onMed=(p.htn.dx&&p.htn.rx)||(p.dm.dx&&p.dm.rx);let medNo=false;
      if(isPatient(p)){if(onMed){const a=Math.min(.93,p._t.ad+.035*p._t.n);p._t.tk=R()<a;v.med=p._t.tk?"y":"n";if(!p._t.tk){medNo=true;v.why=pick(["forget","forget","forget","well","well","out","out","side","herbs","other"]);v.pages.push(WHY[v.why][1]);}}
        else{v.med="n";medNo=true;v.why=pick(["well","well","out","herbs","side"]);v.pages.push(WHY[v.why][1]);}
        v.medHome=!medNo||R()<.4;v.nhis=h.nhis||R()<.3;if(v.nhis)h.nhis=true;}
      if(due){const r=pushBP(p,d,ln.id,"visit");v.s=r.s;v.di=r.di;
        if(p._t.H&&R()<.004)v.warn=[WARN[Math.floor(R()*3)]];const dec=decide(p,r.s,r.di,v.warn,p.preg,medNo&&p.htn.dx,d);if(dec){v.act=dec.code;if(dec.refer)refer(p,d,ln.id,dec.code,dec.urg);else if(dec.code==="recheck")v.pages.push("r_raised");}}
      else if(medNo&&p.dm.dx&&!p.dm.rx)refer(p,d,ln.id,"relink",3);
      if(!v.pages.length)v.pages.push(monthly?LESSONS[m][3]:(PREV_TOPICS.find(t=>!h.topics.includes(t))||PREV_TOPICS[0]));
      if(!monthly&&!h.topics.includes(v.pages[0]))h.topics.push(v.pages[0]);
      v.commit=PAGES[v.pages[0]][4][0];if(p._t.n>1)v.kept=R()<.6;
      if(p.age>=35&&p.hab&&p._t.n%3===0){const b=p.hab[0];p.hab.push({d,salt:b.salt&&R()<.6,drinks:b.drinks&&R()<.65?b.drinks:0,act:Math.min(7,b.act+Math.floor(R()*3)),tob:b.tob&&R()<.9});p.inactive=p.hab[p.hab.length-1].act<3;}
      S.v.push(v);}
    return any;}
  // Trainers observe Leader Neighbors with the quality checklist
  for(const ln of LN){for(let m=1;m<=CUR;m+=2+Math.floor(R()*2)){const d=addD(mStart(m),16+R()*12);if(d>TODAY)break;
    const ok=QIVC.map(()=>R()<ln.q+.1+m*.012);S.q.push({id:uid("q"),ln:ln.id,by:ln.lnt,d,ok,score:pct(ok.filter(Boolean).length,ok.length)});}}
  for(const p of S.p)p.bp=p.bp.filter(r=>r.s!=null).sort((a,b)=>a.d<b.d?-1:1);
}
