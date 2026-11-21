# CBIO Cardiometabolic Disease Register (CMD Register)

A home visit register with built-in counselling pages for hypertension and diabetes (cardiometabolic disease, CMD). It is written for the Salvation Army and Impact Global Health Alliance (IGHA) demonstration of the census-based, impact-oriented approach with Care Groups (CBIO+) in urban Ghana.

Build 0.16. The app opens on a welcome screen with two choices:

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

## The server (live mode)

The design is the same as the CBIO+ Home Visit Register's. The app never reads or writes tables directly: every table has Row Level Security switched on with no policies, and the app calls functions (in `server/setup.sql`) that check the worker's session and limit each role to its own records.

| Role | Sees and writes |
| --- | --- |
| Leader Neighbor | Her own households, the adults in them, their visits, referrals and events, and her group meetings |
| Leader Neighbor Trainer | Everything in her Care Group, and QIVCs of her Leader Neighbors |
| Promoter (CHO) | The Care Groups of her Trainers: readings, fingerstick results, referrals and QIVCs |
| Clinic | Everything: confirmations, laboratory results, medicines, referrals and events (not households) |
| Administrator | Everything, plus workers and settings |

When the clinic and a Leader Neighbor change the same person's record before syncing, both sets of blood pressure, blood sugar and habit readings are kept; other fields come from the newer copy.

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
