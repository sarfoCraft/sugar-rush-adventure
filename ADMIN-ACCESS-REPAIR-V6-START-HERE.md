# V6 admin UID injection repair (Roman Urdu)

## Asal bug

`backend/service.ts` mein adminUids optional tha. Prisma Composer optional `envParam` ko unset hone par omit karta hai. Is wajah se GitHub action green tha magar running API ko 0 admin UIDs mil rahe thay.

## Code change

- `module.ts` now binds `ADMIN_UIDS` using `envSecret` (runtime-injected rather than optional plain input).
- `backend/service.ts` now requires `adminUids: secretString()`; missing key deploy ke waqt error banegi, silent success nahi.
- `backend/prisma-server.ts` uses `input.adminUids.expose()`.
- API version `admin-access-fix-v6`. Your secure Firebase UID allowlist remains enforced; **no auth bypass**.

## Karna kya hai

1. Prisma Console -> Environment -> Production -> **existing `ADMIN_UIDS` edit**. Firebase Authentication -> Users -> User UID ka exact value paste karke Save karo. *Email address ya JSON object nahi*, sirf User UID; multiple admins ke liye commas se separate. Never paste passwords or Firebase service account keys in chat.
2. `Sugar-Rush-Adventure-V6-ADMIN-RUNTIME-FIX-FULL.zip` extract karo. Files ko **GitHub repo root** mein replace/commit to `main`. `.github/workflows/prisma-deploy.yml` intact hai.
3. GitHub Actions -> Prisma Deploy ka **latest** run green confirm karo. Missing `ADMIN_UIDS` par ab deployment fail ho sakta hai; ye deliberate hai so you see real config problem instead of a false success.
4. Prisma Console -> Overview -> Apps latest deployment LIVE confirm karo.
5. Browser mein API endpoint `/health` par `"version":"admin-access-fix-v6"` check karo.
6. Game hard refresh (Ctrl+Shift+R); Profile -> Admin login/connection setup. Agar signed in user ki UID `ADMIN_UIDS` se exactly match hai to dashboard open hoga.

Agar latest deployment fail ho, GitHub Actions -> Prisma Deploy -> latest run -> failed step ka error screenshot bhejna; **kabhi secrets nahin**.

## Restrictions

- Existing player database and game assets unchanged.
- Tests confirm config wiring and auth outcomes; cannot access the private live Prisma environment here. Do not claim live admin login has been verified.
- Real payment and coin integrity requires server-side validation before public monetization.
