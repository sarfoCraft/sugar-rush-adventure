# Sugar Rush Adventure — Admin Upgrade Deployment Guide

This bundle is prepared for the existing public repository:
https://github.com/sarfoCraft/sugar-rush-adventure

Current GitHub Pages site:
https://sarfocraft.github.io/sugar-rush-adventure/

## Files and folders

- `index.html` — replace the repository's existing `index.html` with this updated version.
- `admin-tools.js` — add this file to the repository root, beside `index.html`.
- `backend/` — separate Node.js API for the live admin controls.
- `PRIVACY-NOTICE-TEMPLATE.md` — complete this before collecting IP addresses and activity data.

**Keep the existing `Audio/` folder unchanged.** The game still references its audio files by their current paths.
Keep your existing root `README.md` unless you want to merge these instructions into it.

## 1. Update the GitHub repository

1. Open the repository's `main` branch.
2. Replace only the existing root `index.html` with this bundle's `index.html`.
3. Upload `admin-tools.js` to the root beside `index.html`.
4. Upload the `backend` folder and `PRIVACY-NOTICE-TEMPLATE.md`.
5. Do not delete or rename `Audio/`.
6. Do not upload a real `.env` file, Firebase service-account JSON, database password, or other credentials.

The frontend will still work in preview mode until Firebase and the API URL are configured. Live multi-user admin features require the backend setup below.

## 2. Configure Firebase Authentication

1. Open Firebase Console and select/create the project for this game.
2. Under **Authentication → Sign-in method**, enable Email/Password and the providers you plan to offer.
3. Enable **Anonymous** sign-in if guest players should be included in monitoring.
4. Under **Authentication → Settings → Authorized domains**, add `sarfocraft.github.io`.
5. In the new root `index.html`, find `const FIREBASE_CONFIG = { ... }` and replace the placeholders for `apiKey`, `authDomain`, `projectId`, and `appId` with the Firebase **web app** configuration.

The Firebase web configuration belongs in the frontend. Never put the Firebase Admin service-account private key in `index.html` or commit it to GitHub.

## 3. Create the PostgreSQL database

Create a managed PostgreSQL database from your hosting provider. Copy its connection string for the backend's `DATABASE_URL` environment variable.

The backend creates its tables and seeds 100 default levels on first startup. Use a persistent managed database; local files or browser `localStorage` are not shared across players.

## 4. Deploy the backend

Create a Node.js web service from this same GitHub repository (for example, on Render or Railway).

Use these settings:

- **Root directory:** `backend`
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Health-check path:** `/health`

Set these environment variables in the hosting dashboard:

- `DATABASE_URL` — your PostgreSQL connection string.
- `FIREBASE_SERVICE_ACCOUNT_JSON` — the complete Firebase service-account JSON, stored as a private hosting secret/environment value.
- `ADMIN_UIDS` — your administrator's Firebase Authentication UID (not their email address).
- `FRONTEND_ORIGINS` — `https://sarfocraft.github.io` (origin only; do not add `/sugar-rush-adventure/`).
- `NODE_ENV` — `production`.

Optional:
- `PAYMENT_INSTRUCTIONS_JSON` — only if you want to display your real payment instructions in the Coin Shop. Verify every detail before enabling it.

After deployment, visit `https://YOUR-API-HOST/health`. A healthy service returns JSON containing `"ok": true`.

## 5. Assign the admin account

1. Register/sign in to the game with the account you want to use as admin.
2. In Firebase Console → Authentication → Users, copy that account's **UID**.
3. Add the UID to the backend's `ADMIN_UIDS` environment variable.
4. Save/redeploy the backend.

Do not use a client-side username/password as the real admin security check. The backend verifies Firebase ID tokens and checks the UID allow-list.

## 6. Connect the frontend to the API

In the root `index.html`, find:

```html
<script>window.SWEET_MATCH_API_BASE_URL = ""; // Paste your deployed backend URL here, e.g. https://sweet-match-api.onrender.com</script>
```

Replace the empty string with your deployed API URL, for example:

```html
<script>window.SWEET_MATCH_API_BASE_URL = "https://YOUR-API-HOST";</script>
```

Use your actual HTTPS API host, without a trailing slash. Commit the updated `index.html` and `admin-tools.js` to `main`. Wait for GitHub Pages to redeploy, then hard-refresh the live site.

## 7. Test the features

1. Open the live game and register a test player.
2. Play briefly while the page is visible.
3. Sign in with the admin account and open **Profile → Admin login / payment approvals**.
4. In **Game Administration**, test Players, Level manager, and Referrals.
5. Confirm a player's random ID, latest observed IP, last-seen time, play time, level progress, and ban/unban status.
6. Add a test level, clone it, edit it, and delete it only after confirming the effect on level numbering.
7. Confirm referral applications stay pending until reviewed.

If admin data does not load, check that the API `/health` endpoint works, the Firebase web config is correct, the admin UID is correct, and `FRONTEND_ORIGINS` exactly matches `https://sarfocraft.github.io`.

## Privacy and safety

The backend records IP addresses and visible-tab activity time. Complete and publish the privacy notice before collecting this information. Limit access, state the purpose, set a retention/deletion policy, and collect only what you need. IP addresses can be personal data. The random player ID is pseudonymous, not a real-world identity.

This starter has server-side admin controls and database persistence, but a competitive production game should still validate gameplay moves and scoring server-side to reduce cheating. Review payment and referral claims before approving them.
