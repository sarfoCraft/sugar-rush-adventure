# 🍬 Sugar Rush Adventure V7 — Cloud Coins & Player Progress

## Bina purani game kharab kiye update (Roman Urdu)

1. **Working V6 ZIP ka backup rakho.** Pehle wali GitHub working commit ko delete mat karo. Puri ZIP ka back up apne computer mein bhi rakho.
2. **V7-only-replace ZIP** ko extract karo. Ismein index.html, bonus-features.js, backend/server.js, backend/reward-policy.js, README.md, tests/cloud-rewards.test.js aur ye guide hain. Inko apni GitHub repository mein same folders ke andar replace/upload karo; root mein ek extra nested folder mat banao.
3. `main` branch par **Commit changes** karo. GitHub Actions → Prisma Deploy ka green successful run check karo. **Sirf frontend ka GitHub Pages green hona kaafi nahi.**
4. API health check kholo: `https://uqwoghlmc2prvme3xhq3oh1a.sin.prisma.build/health` — response mein `"version":"cloud-rewards-v7"` hona chahiye. Agar purana version aaye, V7 backend deploy nahi hua.
5. Game `https://sarfocraft.github.io/sugar-rush-adventure/` open karke hard refresh karo. Firebase user se login karo. **Profile → Sync coins & progress from cloud** button dabao. Rewards tab mein **Free Coins** aur **Daily Login Bonus** claim kar ke balance check karo; reload ke baad same balance aur remaining claims rehne chahiye.
6. Doosre browser/device mein **same Firebase account** se login karke progress check karo. Do not share passwords, Firebase service account JSON, DB URL, or tokens.

## Features

- Firebase sign-in ke baad coins, level progress, completed levels, stars, best score Prisma DB par already stored rehte hain. V7 mein `Sync coins & progress from cloud` button add hai.
- Free coins: har 3-hour UTC window mein **5 claims × 2,500 coins**. Database count enforce karta hai, refresh se reset nahi hota.
- Daily streak: UTC ke mutabiq har din ek dafa, rewards: **500, 1,000, 1,500, 2,000, 3,000, 4,000, 10,000**. Agar ek UTC din skip ho jaye to Day 1 reset.
- Weekend Candy Rush: UTC Saturday/Sunday par **3 different levels** complete/replay karke **5,000 coins** ek dafa weekend. Completion server mein record hoti hai.
- AI Auto-Play paid session (5,000 coins) API par track hoti hai; bina paid active AI session ke AI finish endpoint reject karta hai.
- Browser test reward ad cloud wallets mein disabled hai; cloud users ko free coins ke liye ads ki zaroorat nahi.
- Profile ka `Reset demo data` live cloud wallet ko delete nahi karta.

## Existing save safety

V7 ki migration add-only hai: `players` mein 4 nullable/default columns add hote hain aur reward tables create hoti hain. Existing coins, profiles, login, progress ya purchased orders delete nahi honge. **Database ke live rows ko automatically import/migrate from browser localStorage nahi kiya jata**: browser values trusted proof nahi hain. Same Firebase account use karo; server balance is authoritative.

## Real anti-cheat limitation

Coin balance, bonus cooldown, event claim limits aur payments server validate karta hai, lekin match-3 gameplay score / jelly completion abhi browser report karta hai. Iska matlab **full anti-cheat proof nahi**, aur user forged level-result requests bhej sakta hai. Public paid gaming economy, cash-out aur real rewarded ads enable karne se pehle server-side gameplay verification aur actual AdMob/AdSense policies implement karna zaroori hai.

## Backend API paths (Firebase bearer token required)

- `GET /api/player/state`
- `GET /api/player/rewards/status`
- `POST /api/player/rewards/claim` JSON `{"kind":"free"}`, `{"kind":"daily"}` or `{"kind":"event"}`
- `POST /api/player/complete-level`
- `POST /api/ai/start-level`, `POST /api/ai/finish-level`

*Server source of truth; no secrets or player UID are embedded in this ZIP.*
