# Sugar Rush Adventure — Admin Upgrade Deployment Guide

This bundle is prepared for the existing public repository:
https://github.com/sarfoCraft/sugar-rush-adventure

Current GitHub Pages site:
https://sarfocraft.github.io/sugar-rush-adventure/

## Files and folders

- `index.html` — replace the repository's existing `index.html` with this updated version.
- `admin-tools.js` — add this file to the repository root, beside `index.html`.
- `site-customizer.js` — public runtime that loads published branding, theme, ad placements and custom code.
- `assets/` — Sugar Rush Adventure logo and browser favicon used by the game.
- `backend/` — separate Node.js API for the live admin controls, bulk-level cloning, media uploads and persistent customization settings.
- `PRIVACY-NOTICE-TEMPLATE.md` — complete this before collecting IP addresses and activity data.

**Keep the existing `Audio/` folder unchanged.** The game still references its audio files by their current paths.
Keep your existing root `README.md` unless you want to merge these instructions into it.

## 1. Update the GitHub repository

1. Open the repository's `main` branch.
2. Replace the root `index.html` with this bundle's updated version.
3. Replace `admin-tools.js` in the repository root.
4. Upload the complete `assets/` folder so the new logo and favicon load correctly.
5. Update the complete `backend/` folder, including `server.js` and `package.json`. The bulk-clone feature needs the new backend route, not only the updated admin screen.
6. Upload the updated `PRIVACY-NOTICE-TEMPLATE.md` and optionally merge the updated `README.md`.
7. Do not delete or rename `Audio/`.
8. Do not upload a real `.env` file, Firebase service-account JSON, database password, or other credentials.

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
<script>window.SUGAR_RUSH_API_BASE_URL = ""; // Paste your deployed backend URL here, e.g. https://sugar-rush-adventure-api.onrender.com</script>
```

Replace the empty string with your deployed API URL, for example:

```html
<script>window.SUGAR_RUSH_API_BASE_URL = "https://YOUR-API-HOST";</script>
```

Use your actual HTTPS API host, without a trailing slash. Commit the updated `index.html`, `admin-tools.js`, `assets/`, and `backend/` to `main`. Wait for GitHub Pages to redeploy, and confirm the backend host also redeploys from the updated `backend/` folder. Then hard-refresh the live site.

## 7. Test the features

1. Open the live game and register a test player.
2. Play briefly while the page is visible.
3. Sign in with the admin account and open **Profile → Admin login / payment approvals**.
4. In **Game Administration**, test Players, Level manager, and Referrals.
5. Confirm a player's random ID, latest observed IP, last-seen time, play time, level progress, and ban/unban status.
6. Add a test level, clone it, edit it, and delete it only after confirming the effect on level numbering.
7. In Advanced Level Clone, select a source level, enter `5`, `10`, or `100`, review the new level range, and confirm. The API supports up to 500 copies per action.
8. Confirm referral applications stay pending until reviewed.

If admin data does not load, check that the API `/health` endpoint works, the Firebase web config is correct, the admin UID is correct, and `FRONTEND_ORIGINS` exactly matches `https://sarfocraft.github.io`.

## Privacy and safety

The backend records IP addresses and visible-tab activity time. Complete and publish the privacy notice before collecting this information. Limit access, state the purpose, set a retention/deletion policy, and collect only what you need. IP addresses can be personal data. The random player ID is pseudonymous, not a real-world identity.

This starter has server-side admin controls and database persistence, but a competitive production game should still validate gameplay moves and scoring server-side to reduce cheating. Review payment and referral claims before approving them.


## Advanced bulk level cloning

The Level manager includes an Advanced Level Clone tool. Select an active source level, enter a whole number from 1 to 500, and confirm the previewed new level range. The API creates all copies in one database transaction, keeps the source level unchanged, and assigns new sequential level positions. Mission type, target score, moves, time limit, jelly goal, and season settings are copied from the selected source.


## 8. No-code Ads, Branding and Customization Center

After deploying the updated frontend and backend, sign in with the Firebase administrator account and open **Profile → Admin login / payment approvals → Ads & Customization**.

### Branding and theme

- Edit the public game name and tagline.
- Upload a PNG, JPG, WEBP or GIF logo and favicon.
- Upload a background image, choose the theme colours and font, or select a preset.
- Use **Preview draft**, then **Save draft** and **Publish changes**.

### Google AdSense and custom advertisements

- In Google AdSense, create a display ad unit and copy its complete code snippet.
- Paste that snippet in **Advertisement Manager**. The backend extracts the `ca-pub-...` publisher ID and `data-ad-slot` value and the runtime builds the display unit.
- Select the pages where ads may appear: Home, Play, Rewards, Coins, Leaderboard or Profile.
- Alternatively upload a custom banner and add its HTTPS destination URL, paste safe static custom HTML, or paste an HTTPS iframe embed snippet from another ad provider. The iframe is sandboxed away from the game.
- Google must approve the site/account and ad unit before real ads can fill. Ad serving is not guaranteed just because code was added.
- Do not ask players to click ads or provide coins, progress or other rewards for ad clicks. Keep ads outside the active puzzle board and clearly distinguish sponsored content.
- The custom-ad HTML field is intentionally restricted to safe static markup. Script tags, iframe embeds, forms, event handlers and unsafe URLs are stripped.

### Custom code editor

- HTML is inserted at the selected display location and sanitized before it is published.
- CSS is applied to the public game after publish.
- JavaScript is disabled by default. If enabled, it executes on the public game page for every visitor. Only publish code you wrote or fully trust; never paste secrets, private API keys, Firebase service-account data or passwords.
- The game exposes a small `window.SugarRush` helper for custom scripts:
  - `SugarRush.navigate("home" | "play" | "rewards" | "coins" | "leaderboard" | "profile")`
  - `SugarRush.startLevel(7)`
  - `SugarRush.refreshLevels()`
  - `SugarRush.showMessage("Hello")`
  - `SugarRush.getState()` returns coins, current level, max unlocked level and best score.
- Published visual and ad settings are polled by open game pages about every 45 seconds. When published JavaScript changes, the game reloads once to apply the new code cleanly.

### Media Library and version history

- Upload images, audio and video from the dashboard. Each file can be up to 5 MB; SVG and HTML uploads are blocked.
- Assets are stored in the PostgreSQL `site_assets` table and delivered from the API. They are not written into GitHub Pages files.
- Draft/published configuration is stored in `app_meta`; each publish is saved in `site_config_versions`.
- Use **Publish History & Restore** to roll back to an earlier published version. Assets referenced by a current draft or published design cannot be deleted until replaced.

The new tables are created automatically by `backend/server.js` at startup. No additional environment variables are required beyond the backend setup above. The media library increases PostgreSQL storage usage, so remove unused assets from the dashboard periodically.
