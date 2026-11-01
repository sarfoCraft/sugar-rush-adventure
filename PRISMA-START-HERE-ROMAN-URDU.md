# Sugar Rush Adventure V4 — Prisma backend deployment (FREE)

## Aapka architecture
- Game frontend: GitHub Pages (`https://sarfocraft.github.io/sugar-rush-adventure/`)
- API backend: Prisma Compute (`api` service)
- Persistent database: Prisma Postgres (`database` resource)
- Secure player/admin login: Firebase Authentication

## Pehle: Prisma project me production Environment variables set karein
Prisma Console -> sugar-rush-adventure -> Environment -> production:

1. **FIREBASE_SERVICE_ACCOUNT_JSON** (REQUIRED): Firebase Console -> Project settings -> Service accounts -> Generate new private key -> downloaded JSON ka *entire contents*, secret ke taur par add karein. Is private JSON ko kisi ko share, GitHub par commit, ya frontend mein paste NA karein.
2. **ADMIN_UIDS** (admin access): Firebase Console -> Authentication -> Users mein apne admin account ka UID (email nahi). Comma-separated UIDs supported.
3. **FRONTEND_ORIGINS**: `https://sarfocraft.github.io` (without `/sugar-rush-adventure/`).
4. **PAYMENT_INSTRUCTIONS_JSON**: optional, `{} ` rakhein agar configure karna ho. Real payments manually verify karein.

Is deployment path ke liye **DATABASE_URL manually set na karein**, kyunki `module.ts` rawPostgres provision karta hai. `module.ts` ka name bilkul `sugar-rush-adventure` hai.

## GitHub par upload
1. Is ZIP ko extract karein.
2. `Sugar-Rush-Adventure-V4-Prisma-Ready` folder ke **andar ki saari** files and folders `sarfoCraft/sugar-rush-adventure` ke repo root mein upload karein. Sirf ZIP upload karna kaafi nahi.
3. Especially `package.json`, `package-lock.json`, `prisma.config.ts`, `module.ts`, `backend/`, `.github/workflows/prisma-deploy.yml` sahi paths par hone chahiye. `.github/` hidden folder ko omit mat karein.
4. Commit to `main`. Push se GitHub Actions -> Prisma Deploy chalega. Action mein `install-command: npm ci` explicitly hai, isliye package-manager auto detection error avoid hota hai.
5. GitHub -> Actions -> Prisma Deploy -> job result check karein. Failure ho to **sirf error lines** share karein, secret kabhi nahi.
6. Prisma -> Project Overview -> Apps (`api`) / Builds: successful deploy ke baad real public service URL milega.

## Game ke saath API connect karein
Open live game -> Profile -> **Admin login / connection setup**. Wahan deployed API URL aur Firebase Web App public config (apiKey, authDomain, projectId, appId) enter karein. Private service-account JSON kabhi web game wizard mein nahi jaana chahiye.

- API health check: `https://YOUR-ACTUAL-API-URL/health` => `{"ok":true,"service":"sugar-rush-adventure-api"}`
- Admin access ke liye Firebase Authentication me Email/Password enable karein; GitHub Pages origin `sarfocraft.github.io` ko authorized domains me rakhein, aur `ADMIN_UIDS` exactly match karein.
- Do **not** put test/example `.prisma.build` URL in code. Copy actual URL from Prisma.

## Common errors
- `cannot determine package manager`: Updated workflow file, root `package.json` and `package-lock.json` ensure karein.
- `Missing FIREBASE_SERVICE_ACCOUNT_JSON`: Prisma Environment -> production secret save karein aur workflow rerun karein.
- `404` on /health: API URL galat ho sakta hai ya service deploy failed.
- `403` CORS: `FRONTEND_ORIGINS` ko origin only rakhein (`https://sarfocraft.github.io`).
- Admin panel inaccessible: `ADMIN_UIDS` Firebase Auth user UID hona chahiye (email nahi).
- V4 game website frontend localStorage par saved progress use karta hai; backend deployment khud-ba-khud purana browser progress migrate nahi karta.

**Testing note**: This repository package was syntax checked, but it has not been deployed to the user's Prisma workspace. A successful build and API/health check are required before declaring production live.
