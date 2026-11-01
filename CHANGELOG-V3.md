# Sugar Rush Adventure — v3 upgrade

## Player features
- New Settings tab and quick Sound button during play, with separate music/sound on-off and 0–100% volume sliders; low/medium/high presets. Browser setting persists between sessions.
- Original music, button tap, and candy pop sound assets are reused. Browser playback begins after an interaction (autoplay restrictions).
- AI Auto-Play is **one level per click**. It costs 5,000 coins once, retries only that level if necessary (max 20 attempts), stops at the level results screen, and never automatically advances or charges for the next level. Next Level button remains under player control. The 20-attempt cap guards against infinite loops; a failed paid AI run is not automatically refunded.
- New special candies: match 4 for row/column striped candy, match 5 for color-clearing rainbow disco ball, or T/L shape for wrapped 3×3 candy. Matching a special triggers its effect and chains into others.
- Instant disco ball button costs 750 coins and places one rainbow candy on the current board. Tap disco ball, then a candy color (anywhere) to remove all candies with that color.

## Security and gameplay notes
- Original player data key and backend files retained; existing saved profiles/progress are not intentionally reset.
- Local demo coins and rewards can be changed by the player. Production usage requires authoritative server-side checks for rewards, score verification, paid items and ad completion.
- Existing base engine's board state is session-based: refreshing/restarting the page restarts the selected level, not previously completed level progress.
- Match-3 specials are generated in the browser and not independently verified by the server. Harden the server before launching a paid economy.
- AdMob is **not** integrated: native Android/iOS integration is still required. No real ad calls occur.
