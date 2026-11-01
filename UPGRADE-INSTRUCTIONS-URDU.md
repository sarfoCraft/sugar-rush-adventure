# Sugar Rush Adventure v3 — update karne ka tareeqa

Ye **poora project** hai; sirf patch files nahi. Pehle apni GitHub repository ka backup/download rakh lein.

## GitHub par upload
1. ZIP download aur extract karein.
2. `sugar-rush-adventure-main/` ke ANDAR wali files/folders select karein. ZIP ya outer folder repository ki root par upload na karein.
3. GitHub repo `sarfoCraft/sugar-rush-adventure` mein **Add file > Upload files** use karein, ya local Git clone mein sab updated files copy karein.
4. Existing files ko replace karein; `Audio/` aur `assets/` folders ko preserve karein.
5. Commit karein; GitHub Pages refresh karke browser cache hard-refresh karein.
6. Game > **Settings** se Music/SFX on/off aur volume test karein.
7. Game > **Play** par disco-ball purchase, color clearing aur 1-level AI test karein.

## Important
- Existing browser save key retain ki gayi hai. Page reload current board ko restart kar sakta hai, lekin unlocked level/coin progress ko jan-boojh kar reset nahi kiya gaya.
- AI Auto-Play ek click par **sirf ek level** complete karta hai; ek hi level ki retry par dobara 5,000 coins nahi leta. Fail hone par maximum 20 attempts ke baad stop karta hai. Demo mein failed AI purchase automatic refund nahi hoti.
- Disco Ball booster: 750 coins. Rainbow ball ko tap karein, phir **kisi bhi distance** par color candy tap karein. Us color ki sab candies clear hongi; move count se 1 move use hoga.
- 4 in a row = striped candy (row/column clear); 5 in a row = disco ball; T/L = wrapped candy (3x3 clear). Adjacent striped/wrapped candy swap karne par power activate hoti hai.
- Browser demo rewards aur local saves production anti-cheat protection ke barabar nahi. Payment/AdMob go-live se pehle server-side game and reward validation zaroori hai.
- AdMob banner/interstitial/rewarded integration sirf native Android/iOS wrapper ke saath SDK setup ke baad hogi; filhal koi real ads nahi.
