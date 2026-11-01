# Sugar Rush Adventure V8 — Guest, Profile and Logout Fix

## What changed
- **Play as Guest** works locally even if Firebase Anonymous Authentication is disabled. Guest sessions do not use Firebase Identity or cloud coins/progress. Existing signed-in accounts are signed out when switching to Guest.
- Clicking the **top-right email/name** opens **Player profile**, not the login page.
- **Player profile → Log out of account** explicitly signs out Firebase.
- **Admin dashboard → Log out** is an additional visible logout action. **Player profile** beside it returns to profile without signing out.
- Administrator verification on Prisma remains required; this update does not bypass permissions.

## Deploy
Replace `index.html` at the GitHub repository root with the included file; commit to `main`. GitHub Pages will publish it. The Prisma API and Firebase environment variables do not need changes for these UI fixes.

## Important
Guest saves are device-local (not linked to Firebase/Prisma) and can be lost if browser storage is cleared. Use a signed-in account for cloud sync. Switching from an account to Guest signs out from Firebase; never use Guest for an admin session.

## Verification
1. Open game while signed in and click top-right email → Player profile appears.
2. Click Profile → Log out of account → login page appears.
3. Click Play as Guest → main game opens without `auth/admin-restricted-operation`.
4. Sign in again, open Admin Dashboard and click Log out → login page appears.
