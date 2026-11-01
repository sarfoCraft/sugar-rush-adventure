# V9 · Admin IP private + player IP eye toggle

## What changed
- Admin accounts (matched by Firebase UID in the server's `ADMIN_UIDS` allowlist): IP address is **never returned** by the admin player-list or IP-reveal endpoint.
- After deployment, existing admin `last_ip` database values are cleared; future admin logins/session heartbeats do not store admin IPs in `players.last_ip`.
- Regular players: IP **hidden by default**. Admin may click the eye icon in Admin → Players to fetch that individual player's last IP. Click again to hide it. No IP address is embedded in the bulk players JSON or initial table HTML.
- Reveal endpoint is authenticated and admin-only. IP values are not written to browser local storage by this change. Each Players reload hides values again.
- Admin UID allowlist and normal gameplay are unchanged.

## Deploy
1. Back up your current V8 repository.
2. Extract ONLY-REPLACE-FILES ZIP and replace the paths exactly, including `backend/ip-privacy.js`.
3. Commit changes to `main`; wait for both GitHub Pages and Prisma Deploy to complete.
4. Check `/health`: `version` starts with `cloud-rewards-v7-ip-privacy-v9`.
5. Open the game, hard refresh, login as admin, and open Admin → Players. Admin row shows `Hidden (Admin)` and user rows have eye buttons.

## Notes
- IPs are private personal data; use for security and disclose collection/retention in your privacy notice.
- This hides admin IP from this application's player table and API. It cannot conceal network metadata held by hosting providers or network operators.
- Live deployment and real Prisma data are not accessible in the local tests.
