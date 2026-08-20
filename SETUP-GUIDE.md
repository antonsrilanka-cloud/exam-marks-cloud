# Setup Guide — Term Examination Marks Report System (Multi-User Cloud Version)

This version has real logins: one **Principal (Admin)** account and one
**Class Teacher** account per class, with a shared online database so the
Principal can see every class the moment a teacher submits it.

It runs entirely on **Firebase's free tier** (Google's backend platform) —
no monthly cost for a normal school's usage, and no server for you to
maintain. Follow these steps once; after that, everything happens from the
Admin Dashboard in the browser.

---

## Step 1 — Create your Firebase project (10 minutes)

1. Go to **https://console.firebase.google.com** and sign in with a Google account (use a school Google account if you have one).
2. Click **Add project**. Name it something like `stmarys-term-marks`. You can turn off Google Analytics for this project — it isn't needed.
3. Wait for the project to be created, then open it.

### Enable Email/Password sign-in
4. In the left menu: **Build → Authentication → Get started**.
5. Click the **Sign-in method** tab → **Email/Password** → enable it (the first toggle) → **Save**.

### Enable the database
6. In the left menu: **Build → Firestore Database → Create database**.
7. Choose **Start in production mode** → pick a location close to you (e.g. `asia-south1`) → **Enable**.

### Paste in the security rules
8. Still in Firestore, click the **Rules** tab.
9. Delete everything there and paste in the entire contents of `firestore.rules` (included in this download) → **Publish**.

### Get your config keys
10. Click the **gear icon (⚙) → Project settings**, scroll to **Your apps**, click the **</> (Web)** icon to register a web app. Name it anything (e.g. "Marks Report Web").
11. Firebase will show you a code block containing `apiKey`, `authDomain`, `projectId`, etc. Copy those six values.
12. Open `firebase-config.js` from this download and paste your six values in, replacing the placeholder text. Save the file.

### Turn on password-reset emails
13. Back in **Authentication → Templates** tab, you'll see a "Password reset" email template already active by default — no setup needed. You can click **Customize action URL** or edit the template's wording/logo later if you like, but it works out of the box.

---

## Step 2 — Create the first Principal (Admin) account

The app lets the Principal create *teacher* accounts, but the very first
Admin account has to be created once, directly in Firebase:

1. In Firebase Console: **Authentication → Users → Add user**.
2. Enter your email and a password you'll remember → **Add user**.
3. Copy the **User UID** shown next to the new user (a long string of letters/numbers).
4. Go to **Firestore Database → Data → Start collection**.
   - Collection ID: `users`
   - Document ID: paste the **User UID** you copied
   - Add fields:
     - `role` (string) → `admin`
     - `name` (string) → your name, e.g. `Mr. R. Antonraj`
     - `email` (string) → the email you used
   - Click **Save**.

That's it — that account is now the Principal/Admin account.

---

## Step 3 — Put the files online

You can host these files anywhere that serves static files — GitHub Pages,
Firebase Hosting, or your school's existing web space. GitHub Pages (free):

1. Create a new GitHub repository, e.g. `exam-marks-cloud`.
2. Upload every file in this download (`index.html`, `admin.html`,
   `teacher.html`, `shared.css`, `shared.js`, `firebase-init.js`,
   `firebase-config.js` — **with your keys already pasted in**).
3. In the repository: **Settings → Pages** → Source: "Deploy from a branch",
   branch `main`, folder `/ (root)` → **Save**.
4. Your site goes live at `https://<your-username>.github.io/exam-marks-cloud/`
5. In Firebase Console: **Authentication → Settings → Authorized domains →
   Add domain**, and add `<your-username>.github.io` so Firebase allows
   sign-ins from your live site.

---

## Step 4 — Start using it

1. Open your site's link → sign in with the Admin account from Step 2.
2. Go to **1 · School Setup**: enter school name, address, logo, exam title, year.
3. Go to **2 · Subjects**: add every subject for this term.
4. Go to **3 · Class Teachers**: for each class, enter the class name,
   teacher's name and email, then **Create Teacher Account**. The teacher
   receives an email with a secure link to set their own password, and you
   also get a shareable sign-in link to send them directly (e.g. by WhatsApp
   or your staff group).
5. Each teacher opens the link, sets their password on first login, and
   fills in their class's marks — the grid lets them press **Enter** to
   fly through student after student. When done, they click **Submit**.
6. You'll see their class turn to **"Submitted"** in **3 · Class Teachers**.
   Open **4 · View / Print / Download** to see the full class marksheet
   (A4 landscape) or any individual student's report card (A4 portrait),
   and print or download each as PDF.
7. If a teacher needs to fix something after submitting, click **"Reopen
   for Editing"** on that class in the View tab.

---

## Using this for a different school

Because each school's data lives in its **own** Firebase project, reuse is
simple: a new school repeats **Step 1** and **Step 2** with their own free
Google/Firebase account, pastes their own keys into `firebase-config.js`,
and deploys the same unchanged code. No two schools ever share data.

---

## A note on cost and limits

Everything above uses Firebase's free **Spark plan** — no credit card
required. The free tier easily covers a school with dozens of classes and
hundreds of students; you would need very large, very frequent usage
(tens of thousands of reads/writes a day) before Firebase asks you to
upgrade to a paid plan.

## A note on the "Submit lock"

Once a teacher clicks Submit, the on-screen form disables itself so they
can't accidentally keep editing — but see the note at the bottom of
`firestore.rules` for the one technical edge case (a teacher deliberately
using browser developer tools) this doesn't fully close off at the database
level. For normal use by class teachers through the app, this isn't a
concern; flag it to me if you'd like it hardened further.
