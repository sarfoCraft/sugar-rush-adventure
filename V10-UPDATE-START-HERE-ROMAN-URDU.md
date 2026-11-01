# Sugar Rush Adventure V10 – Mobile Admin, Bulk Levels & Progress

## GitHub par sirf 3 files replace karein

- Root `index.html`
- Root `admin-tools.js`
- `backend/server.js` (backend folder ke andar)

GitHub par `main` branch mein commit karein. Prisma Deploy aur GitHub Pages dono green hone chahiye. `backend/server.js` update Prisma database schema migration automatically run karta hai: `game_levels.difficulty_override` aur `coin_orders.admin_archived_at` add hote hain. Purana level/player/payment data delete nahi hota. Deployment se pehle working V9 ka backup rakhein.

## Naye options

1. **Responsive Admin:** chhote phones par players, levels aur referrals tables cards ban jati hain.
2. **Bulk Edit Levels:** Level Manager me checkboxes se specific levels choose karein; Select All Loaded ya Change ALL active levels; Difficulty (Auto/Easy/Medium/Hard/Expert/Master), Mission (Score/Timed/Jelly), phir Apply Bulk Update. 1–2000 selected IDs per request; Change ALL full catalog.
3. **Difficulty:** Auto keeps original gameplay. Custom difficulty changes effective moves, targets, and relevant timer/jelly parameters; original base settings are preserved. Mission change to timed sets default 60 seconds if absent; Jelly sets default 14 tiles if absent.
4. **Payments:** Admin Payment Requests me Clear All Approved archives approved records from the admin queue ONLY. Coins are not reversed; players can still view their payment history. No permanent deletion, but archived rows can be recovered using direct database management if required.
5. **Player Progress:** Game Home & Profile show guest/account name and percentage progress; Admin Players shows registered player names, level completion, percentage and best score. Browser-only guests do not appear in cloud admin list, because they do not have a Firebase account.

## Verify

- `https://<your-prisma-api>/health` should report `version: cloud-rewards-v7-admin-mobile-bulk-v10`.
- On mobile, open Admin > Level manager and edit 2 selected levels.
- Admin > Payment requests > Clear All Approved should remove only approved entries from admin queue.
- Player Profile should display guest/registered name and progress bar.

## Security

Firebase settings, ADMIN_UIDS, IP privacy, and protected endpoints remain unchanged. Bulk level and payment archive APIs require authenticated admin role. Never upload Firebase service-account JSON or database credentials to GitHub.

## Tests

35 Node tests passed; isolated mobile browser UI test confirmed a bulk selection and 0px horizontal overflow at 390px viewport. Not yet deployed/tested against your live Prisma DB.
