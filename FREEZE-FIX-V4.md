# v4 Gameplay Freeze Hotfix (2026-11-01)

- Fixed Level 3 and other jelly levels not completing promptly when jelly reaches zero mid-cascade.
- Added exception-safe swap handling that releases busy state and stops animations.
- Added free **Fix Stuck Board** button that restores play while preserving score, moves, jelly progress and coins.
- Fixed stale moves mutating a newly started or repaired board via board-generation guards.
- Cut cascading stalls to 12 combos max and automatically reshuffle when no valid moves remain.
- Updated hint logic for special candies, and power-up-preserving reshuffle.
- Fixed status messaging to distinguish AI play, level finish and board resolution.

How to update: Replace repository contents with the extracted folder files, retaining correct root paths. Refresh with Ctrl+Shift+R. Existing local saved progress is retained.

Security: Browser storage rewards are still demonstration-only; online currencies need authenticated backend validation.
