# CBIO Cardiometabolic Disease Register (CMD Register)

A home visit register with built-in counselling pages for hypertension and diabetes (cardiometabolic disease, CMD). It is written for the Salvation Army and Impact Global Health Alliance (IGHA) demonstration of the census-based, impact-oriented approach with Care Groups (CBIO+) in urban Ghana.

Build 0.23. The app opens on a welcome screen with two choices:

- **Try it with example data.** Every person and result is fictitious. Nothing is sent to a server, and records entered are lost when the page is closed.
- **Sign in.** Workers sign in with a sign-in name and PIN. Records are kept on the tablet (so they survive closing the app and work offline) and are sent to the project's Supabase database whenever there is a connection. Use test data only until the hosting location and data protection requirements are settled and the security has been independently reviewed.

## Who uses it

| Role | What the role does in the app |
| --- | --- |
| Leader Neighbor | Sees the day's due list, runs the home visit (checks and counselling in one flow), records the monthly group lesson |
| Leader Neighbor Trainer | Follows the work of the Leader Neighbors in one Care Group and observes home visits with a quality checklist |
| Promoter (CHO) | Enters fingerstick blood-sugar results, repeats raised blood pressure readings, follows referrals |
| Clinic | Sees the referral list and enters confirmation, laboratory results (fasting venous glucose or HbA1c), diagnosis, medicines and the next review date |
| Administrator | Reads the reports, adds workers and their PINs, and sets the programme start date and the settings |

## Rules built in

The blood pressure and referral rules follow section 4.4 of the demonstration narrative (version 7). The blood-sugar values are the WHO diagnostic values. The counselling text is a draft taken from the Care Group module outline. All of it needs review by clinical staff in Ghana and pre-testing before field use.

### Referral follow-up (from build 0.18)

A referral stays open until the clinic records the person as seen, or a Trainer or a Promoter closes it as **declined** or **seen elsewhere** (self-reported). A Leader Neighbor cannot close a referral.

- A follow-up entry records what has happened (not yet gone; went, but the clinic has not recorded it; went to another facility; will not go), the reasons for not going (several may be chosen), and the action agreed (return visit, companion from the corps, other) with a short note. Every entry is kept.
- A Leader Neighbor adds an entry from the due-list task or during a home visit, where it is required when the person has an open referral. A Trainer or a Promoter adds one from the Referrals list.
- After a referral is closed as declined, a raised reading creates no new routine referral for 90 days (`CFG.declineWait`), unless the person says in the visit that he or she is now willing to go. A warning sign, or a reading in the emergency or prompt range, always creates a new referral, whatever happened to an earlier one.
- Report section 5 separates seen at the Salvation Army facility, seen elsewhere, declined and still open, and lists the reasons given for not going.

### Stroke and heart attack survivors (from build 0.21)

- Step 2 of every home visit asks two history questions: "Has a health worker ever told you that you had a stroke?" and "Has a health worker ever told you that you had a heart attack?". Both start unanswered and must be answered. Once answered they show as "on record"; the Leader Neighbor can tap "Change the stroke and heart attack answers" at a later visit.
- A yes to either makes the person a survivor (`p.cvd = {st, mi, d}`). Recording a Stroke or Heart attack event sets the same flag.
- A survivor is followed like a person with a diagnosis: the household is on monthly visits, the person is in the Leader Neighbor's group-lesson cohort, and the medicine question is asked at every visit.
- When the answer to "taking the medicine every day?" is No, the visit asks "Which ones are being missed?" from the medicines on the clinic's record (for every person, survivor or not). The answer is saved with the visit (`v.missed`).
- The survivor version of the Household emergency plan page (`e_plan_s`) is shown at the first visit made while the person is flagged and at every third visit after. It comes after referral and medicine pages and counts toward the limit of three pages, so it waits for the next visit when those fill the limit.
- Reports, section 4: survivors identified, survivors with a statin or aspirin recorded as prescribed, and survivors taking all their medicines every day.
- From build 0.22: a survivor who says the medicine is not taken every day, or who has no medicine on the clinic's record and has not been seen at the facility since being flagged, gets a routine referral ("Survivor: medicine review"). The 30-day and 90-day limits on routine referrals apply, and none is added while another referral is open.
- Leader Neighbors do not advise starting aspirin or any other medicine. No server change is needed for this build.

### The census (from build 0.23)

The census is done once, before Care Groups are formed, by temporary Enumerators working in pairs. Each pair has one sign-in name and one tablet (the administrator adds pairs on the Workers page). The census screens are green and marked CENSUS, with one step per screen, the words to say in yellow boxes and the actions in blue boxes.

- **At the door:** the location (with its accuracy in metres), a description of the place, and the outcome: an adult is home, nobody home, refused, or vacant.
- **Household:** head, phone, NHIS, the number of children under 18, and every adult aged 18 or older (name, sex, age, home now or out).
- **Each adult aged 35 or older who is home:** history of hypertension, diabetes, stroke and heart attack (and whether medicine is taken), pregnancy for women under 50, the two diabetes family-history questions, two blood pressure readings (a third if they differ by more than 10), height and waist. Adults under 35 get the hypertension and diabetes questions only, and the rest if either answer is yes.
- **Warning signs** are asked only when the reading is 180/110 or more. A referral is made at the census only for a warning sign, 180/110 or more, or raised pressure in pregnancy. Other raised readings wait for the Leader Neighbor's re-check.
- **Call-backs:** a house with nobody home stays on the pair's call-back list. An adult aged 35 or older who is out gets one call-back, and is then left for the Leader Neighbor.
- **Numbering:** each household gets a census number when it is saved (`C-` + three characters for the pair + a running number). The Care Group part is added when households are given to Leader Neighbors.
- **Data:** `h.cen = {st, d, by, gps:{lat,lon,acc}, lm, ph, kids, tries, cbTime}`; a census household has `h.ln` set to the Enumerator's id. People get `p.cen`, `p.ht`, `p.waist`, and the census reading in `p.bp` with `src:"census"` and the raw readings in `raw`. A person already on treatment at the census has `rxPre:true`, and the census date stands in for the unknown start date.
- **Administrator:** the Census tab shows progress by pair (completed, call-backs, refusals, location quality, share of readings ending in 0) and the counts needed to plan Care Groups. Census referrals appear on the clinic's and the administrator's Referrals lists.
- Census households are not in the reports until they are given to Leader Neighbors. The map and the forming of Care Groups come in later builds.
- **Server:** run `server/update-0.23.sql` once. It adds the Enumerator role and limits each pair to the households, people and referrals it entered.

## The server (live mode)

The design is the same as the CBIO+ Home Visit Register's. The app never reads or writes tables directly: every table has Row Level Security switched on with no policies, and the app calls functions (in `server/setup.sql`) that check the worker's session and limit each role to its own records.

| Role | Sees and writes |
| --- | --- |
| Leader Neighbor | Her own households, the adults in them, their visits, referrals and events, and her group meetings |
| Leader Neighbor Trainer | Everything in her Care Group, and QIVCs of her Leader Neighbors |
| Promoter (CHO) | The Care Groups of her Trainers: readings, fingerstick results, referrals and QIVCs |
| Clinic | Everything: confirmations, laboratory results, medicines, referrals and events (not households) |
| Administrator | Everything, plus workers and settings |

When the clinic and a Leader Neighbor change the same person's record before syncing, both sets of blood pressure, blood sugar and habit readings are kept; other fields come from the newer copy. A referral changed on two tablets keeps every follow-up entry from both. On the server, only the clinic or the administrator can mark a referral as seen at the facility, and only a Trainer, a Promoter or the administrator can close one.

A project set up before build 0.18 needs [`server/update-0.18.sql`](server/update-0.18.sql) run once in the SQL Editor. It replaces two functions and changes no table.

### Setting up (once)

1. In Supabase, create a project (for example `cmd-register`). Open **SQL Editor**, paste the whole of [`server/setup.sql`](server/setup.sql) and run it. It can be run again safely.
2. Put the project URL and publishable key in `src/live.js` (`SERVER`), run `build.sh`, and change `VERSION` in `sw.js`.
3. Open the app, choose **First-time setup (administrator only)** and create the administrator. This works once.
4. As administrator, set the date home visits started (Settings), then add workers (Workers): Promoters first, then Trainers (each starts a Care Group), then Leader Neighbors, and clinic users.

### Keeping the database awake

Supabase pauses a Free Plan project after about 7 days without database activity. The workflow in `.github/workflows/keepalive.yml` calls the small `cmd_ping` function every 3 days, using the address and key in `src/live.js`. Run it by hand from the Actions tab (Keep the database awake, then Run workflow). GitHub turns off scheduled workflows in a repository with no commits for 60 days and sends an email first; turning it back on is one click. A paid Supabase plan is never paused and also has daily backups.

## Files

- `index.html` is the whole app. It is built from the files in `src/` by `build.sh`: `data.js` (rules and example data), `qivc.js` (quality checklists), `ui.js` (screens) and `live.js` (sign-in, storage on the tablet and sync).
- `server/setup.sql` sets up the Supabase database.
- `sw.js` and `manifest.webmanifest` let a tablet keep the app for use without a connection.

Change `VERSION` in `sw.js` whenever `index.html` changes, so tablets fetch the new files.
