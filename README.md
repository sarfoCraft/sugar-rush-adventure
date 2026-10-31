# 🍬 Sugar Rush Adventure

**Sugar Rush Adventure** is a feature-rich HTML5 match-3 puzzle game built with HTML, CSS, JavaScript Canvas, and an optional secure Node.js/PostgreSQL admin backend. Dive into 100 challenging levels across 5 magical seasons (from Candy Forest to the Chocolate Kingdom), complete jelly and timed missions, unlock special combos, and enjoy custom local audio tracks!

## ✨ Features
- **100 Levels & 5 Seasons:** Progressive difficulty spanning magical worlds.
- **Mission Variety:** Score targets, jelly clearing, and timed countdown challenges.
- **Rich Polish:** Smooth animations, floating score text, and responsive layout.
- **Local Audio System:** Built-in support for background music and sound effects (`Audio/`).
- **AI Auto-Play & Hints:** Built-in hint system and solver options.
- **Client-Side Storage:** Full game state persistence using browser localStorage.

## 🚀 Play Live
Play the game directly in your browser:
👉 [https://sarfocraft.github.io/sugar-rush-adventure/](https://sarfocraft.github.io/sugar-rush-adventure/)

## 🛠️ Built With
- HTML5 Canvas & Vanilla JavaScript
- CSS3 (Custom variables, responsive grid & flexbox layouts)

## 🧰 Admin tools
- **Advanced bulk level cloning:** choose a source level and create 1–500 sequential copies in one action (for example 5, 10, or 100). Copies retain the source mission settings and are appended to the level list.
- **Sugar Rush Adventure branding:** the game uses a custom SVG wordmark and favicon in `assets/`.
- **No-code Customization Center:** change the game name, tagline, logo, favicon, page background, theme colours, panel colour and font from the admin dashboard.
- **Advertisement Manager:** paste an approved Google AdSense display-unit snippet, choose screens where it may appear, or upload a custom banner / add safe static HTML ads.
- **Custom Code Editor:** save HTML, CSS and trusted JavaScript as a draft, preview it, then publish without editing the repository. Custom JavaScript can use the small `window.SugarRush` API exposed by the game.
- **Media Library:** upload and manage game images, audio and video (5 MB per file). Assets are stored in PostgreSQL and served through the backend.
- **Publish history:** every publish creates a version that can be restored from the dashboard. Published visual settings are fetched by the game automatically; custom-JS changes trigger a clean page reload.
