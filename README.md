# CBIO Cardiometabolic Disease Register (CMD Register)

A home visit register with built-in counselling pages for hypertension and diabetes (cardiometabolic disease, CMD). It is written for the Salvation Army and Impact Global Health Alliance (IGHA) demonstration of the census-based, impact-oriented approach with Care Groups (CBIO+) in urban Ghana.

This is build 0.1, an example-data build. Every person and result in it is fictitious. Nothing is sent to a server, and records entered are lost when the page is closed.

## Who uses it

| Role | What the role does in the app |
| --- | --- |
| Leader Neighbor | Sees the day's due list, runs the home visit (checks and counselling in one flow), records the monthly group lesson |
| Leader Neighbor Trainer | Follows the work of the Leader Neighbors in one Care Group and observes home visits with a quality checklist |
| Promoter (CHO) | Enters fingerstick blood-sugar results, repeats raised blood pressure readings, follows referrals |
| Clinic | Sees the referral list and enters confirmation, laboratory results (fasting venous glucose or HbA1c), diagnosis, medicines and the next review date |
| Administrator | Reads the reports and the settings |

## Rules built in

The blood pressure and referral rules follow section 4.4 of the demonstration narrative (version 7). The blood-sugar values are the WHO diagnostic values. The counselling text is a draft taken from the Care Group module outline. All of it needs review by clinical staff in Ghana and pre-testing before field use.

## Files

- `index.html` is the whole app. It is built from the files in `src/` by `build.sh`.
- `sw.js` and `manifest.webmanifest` let a tablet keep the app for use without a connection.

Change `VERSION` in `sw.js` whenever `index.html` changes, so tablets fetch the new files.
