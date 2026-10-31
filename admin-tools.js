(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const API_BASE = () => String(window.SUGAR_RUSH_API_BASE_URL || window.SWEET_MATCH_API_BASE_URL || "").replace(/\/+$/, "");
  let loadedOnce = false;
  let activePane = "players";
  let cachedReferrals = [];
  let cachedLevels = [];
  let customizationDraft = null;
  let customizationHistory = [];
  let cachedAssets = [];

  const css = `
  #adminOpsPanel .sma-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:12px 0 16px}
  #adminOpsPanel .sma-stat{padding:12px;border:1px solid var(--line);border-radius:13px;background:#fff;min-width:0}
  #adminOpsPanel .sma-stat small{display:block;color:var(--muted);font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;font-weight:850}
  #adminOpsPanel .sma-stat strong{display:block;font-size:1.25rem;margin-top:4px;overflow-wrap:anywhere}
  #adminOpsPanel .sma-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}
  #adminOpsPanel .sma-tabs button{background:#fff;color:var(--muted);border:1px solid var(--line);box-shadow:none}
  #adminOpsPanel .sma-tabs button.active{background:#7650d8;color:#fff;border-color:#7650d8}
  #adminOpsPanel .sma-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}
  #adminOpsPanel .sma-toolbar .field{flex:1;min-width:180px}
  #adminOpsPanel .sma-scroll{width:100%;overflow:auto;border:1px solid var(--line);border-radius:13px;background:#fff}
  #adminOpsPanel table{border-collapse:collapse;width:100%;min-width:850px;font-size:.78rem}
  #adminOpsPanel th,#adminOpsPanel td{padding:10px 9px;border-bottom:1px solid #f0e7f6;text-align:left;vertical-align:top;white-space:normal;max-width:260px;overflow-wrap:anywhere}
  #adminOpsPanel th{background:#faf6ff;color:#6d557f;font-size:.68rem;text-transform:uppercase;letter-spacing:.4px;position:sticky;top:0}
  #adminOpsPanel tr:last-child td{border-bottom:0}
  #adminOpsPanel .sma-actions{display:flex;gap:5px;flex-wrap:wrap;min-width:130px}
  #adminOpsPanel .sma-actions button{padding:7px 9px;font-size:.7rem;box-shadow:none}
  #adminOpsPanel .sma-actions .sma-danger{background:#fff0f3;color:#a12e58;border:1px solid #ffc9d5}
  #adminOpsPanel .sma-actions .sma-edit{background:#f3edff;color:#6842ac;border:1px solid #e4d7fa}
  #adminOpsPanel .sma-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;padding:13px;border:1px solid var(--line);border-radius:14px;background:#fff}
  #adminOpsPanel .sma-form label{display:block;font-size:.7rem;font-weight:850;color:var(--muted);text-transform:uppercase;margin-bottom:5px}
  #adminOpsPanel .sma-form .sma-full{grid-column:1/-1}
  #adminOpsPanel .sma-form .sma-buttons{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
  #adminOpsPanel .sma-note{font-size:.76rem;line-height:1.5;color:var(--muted)}
  #adminOpsPanel .sma-status{min-height:1.2em;font-size:.8rem;font-weight:750;color:#6842ac;margin:7px 0}
  #adminOpsPanel .sma-banned{display:inline-block;border-radius:99px;background:#ffe8ef;color:#a12e58;padding:3px 7px;font-size:.68rem;font-weight:900}
  #adminOpsPanel .sma-pending{display:inline-block;border-radius:99px;background:#fff0c4;color:#81520b;padding:3px 7px;font-size:.68rem;font-weight:900}
  #adminOpsPanel .sma-active{display:inline-block;border-radius:99px;background:#dff8ee;color:#087d65;padding:3px 7px;font-size:.68rem;font-weight:900}
  #adminOpsPanel .sma-clone-card{margin:13px 0 16px;padding:15px;border:1px solid #d9c2ff;border-radius:16px;background:linear-gradient(135deg,#fbf7ff 0%,#fff7fb 100%);box-shadow:inset 0 1px 0 #fff,0 5px 14px #6031a00d}
  #adminOpsPanel .sma-clone-head{display:flex;align-items:center;gap:9px;margin-bottom:5px}
  #adminOpsPanel .sma-clone-head strong{font-size:.98rem;color:#4e267f}
  #adminOpsPanel .sma-new-tag{font-size:.62rem;font-weight:950;letter-spacing:.5px;padding:4px 7px;border-radius:99px;background:#fff0b8;color:#86520a}
  #adminOpsPanel .sma-clone-grid{display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(140px,.7fr) minmax(210px,1fr);gap:10px;align-items:end;margin-top:12px}
  #adminOpsPanel .sma-clone-grid label{display:block;font-size:.68rem;font-weight:900;color:#755d8d;text-transform:uppercase;margin-bottom:5px}
  #adminOpsPanel .sma-clone-preview{padding:10px 12px;border-radius:12px;background:#eaf8f0;color:#176b4d;font-size:.76rem;font-weight:850;line-height:1.4;min-height:42px;display:flex;align-items:center}
  #adminOpsPanel .sma-clone-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:11px}
  #adminOpsPanel .sma-clone-presets{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  #adminOpsPanel .sma-clone-presets button{padding:7px 11px;border:1px solid #d9c7f1;background:#fff;color:#6b43a0;box-shadow:none;font-size:.72rem}
  #adminOpsPanel .sma-clone-presets button:hover{background:#f0e7ff}
  #adminOpsPanel #smaBulkCloneBtn{background:linear-gradient(135deg,#9b43e8,#6e2cc0);box-shadow:0 4px 0 #4d1e91}
  #adminOpsPanel .sma-custom-card{margin:12px 0;padding:15px;border:1px solid #e3d5f2;border-radius:16px;background:linear-gradient(145deg,#fff,#fcf8ff)}
  #adminOpsPanel .sma-custom-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
  #adminOpsPanel .sma-custom-grid .wide{grid-column:1/-1}
  #adminOpsPanel .sma-custom-card label{display:block;font-size:.7rem;font-weight:850;color:#755d8d;text-transform:uppercase;margin:0 0 5px}
  #adminOpsPanel .sma-custom-card textarea{min-height:92px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.75rem;line-height:1.45}
  #adminOpsPanel .sma-custom-card input[type=color]{width:100%;height:42px;padding:4px;border:1px solid var(--line);border-radius:10px;background:#fff}
  #adminOpsPanel .sma-custom-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
  #adminOpsPanel .sma-custom-preview{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px;border:1px dashed #d7c5ec;border-radius:12px;background:#fff}
  #adminOpsPanel .sma-custom-preview img{max-width:170px;max-height:64px;object-fit:contain;background:#f8f4ff;border-radius:8px;padding:5px}
  #adminOpsPanel .sma-checks{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}
  #adminOpsPanel .sma-checks label{display:flex;align-items:center;gap:6px;text-transform:none;font-size:.76rem;font-weight:750;margin:0}
  #adminOpsPanel .sma-warning{padding:10px 12px;border-radius:11px;background:#fff5d9;border:1px solid #f0d99b;color:#76520d;font-size:.75rem;line-height:1.5;margin:9px 0}
  #adminOpsPanel .sma-code-field{width:100%;min-height:145px;padding:10px;border:1px solid var(--line);border-radius:10px;background:#211a31;color:#f7edff;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}
  #adminOpsPanel .sma-assets{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:10px}
  #adminOpsPanel .sma-asset{padding:10px;border:1px solid var(--line);border-radius:12px;background:#fff;min-width:0}
  #adminOpsPanel .sma-asset img{width:100%;height:75px;object-fit:contain;background:#faf7ff;border-radius:8px}
  #adminOpsPanel .sma-asset strong{display:block;font-size:.73rem;overflow-wrap:anywhere;margin:6px 0}
  #adminOpsPanel .sma-asset small{display:block;color:var(--muted);font-size:.66rem}
  #adminOpsPanel .sma-asset-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
  #adminOpsPanel .sma-asset-actions button{padding:6px 8px;font-size:.65rem;box-shadow:none}
  @media(max-width:760px){#adminOpsPanel .sma-custom-grid{grid-template-columns:1fr}#adminOpsPanel .sma-custom-grid .wide{grid-column:auto}}
  @media(max-width:760px){#adminOpsPanel .sma-clone-grid{grid-template-columns:1fr 1fr}#adminOpsPanel .sma-clone-preview{grid-column:1/-1}}
  @media(max-width:650px){#adminOpsPanel .sma-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#adminOpsPanel .sma-form{grid-template-columns:1fr}#adminOpsPanel .sma-form .sma-full{grid-column:auto}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
  function formatDate(value) {
    if (!value) return "Never";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  }
  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}m`;
  }
  async function api(path, options = {}) {
    if (!API_BASE()) throw new Error("Set SUGAR_RUSH_API_BASE_URL in index.html first (the old SWEET_MATCH_API_BASE_URL is also supported).");
    if (!window.firebase?.auth) throw new Error("Firebase Authentication is not configured.");
    const user = window.firebase.auth().currentUser;
    if (!user) throw new Error("Sign in first, then reopen Admin.");
    const token = await user.getIdToken();
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${API_BASE()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }
  function setStatus(message, isError = false) {
    const el = $("smaStatus");
    if (el) {
      el.textContent = message;
      el.style.color = isError ? "#a12e58" : "#6842ac";
    }
  }
  function ensurePanel() {
    const root = $("view-admin");
    if (!root || $("adminOpsPanel")) return;
    const panel = document.createElement("section");
    panel.id = "adminOpsPanel";
    panel.className = "content-card";
    panel.innerHTML = `
      <div class="card-head"><div><h3>🛠️ Sugar Rush Adventure · Admin</h3><p class="sma-note">Live game data · access is checked on the backend for every admin request.</p></div><button class="soft" id="smaRefreshAll" type="button">Refresh data</button></div>
      <div class="sma-stats" id="smaStats">
        <div class="sma-stat"><small>Total players</small><strong>—</strong></div>
        <div class="sma-stat"><small>Active in 24h</small><strong>—</strong></div>
        <div class="sma-stat"><small>Total play time</small><strong>—</strong></div>
        <div class="sma-stat"><small>Active levels</small><strong>—</strong></div>
      </div>
      <div class="sma-tabs"><button class="active" type="button" data-sma-pane="players">👥 Players</button><button type="button" data-sma-pane="levels">🧩 Level manager</button><button type="button" data-sma-pane="referrals">🤝 Referrals</button><button type="button" data-sma-pane="customization">🎨 Ads & Customization</button></div>
      <p id="smaStatus" class="sma-status" role="status" aria-live="polite">Admin data will load when this screen opens.</p>
      <div id="smaPlayersPane">
        <div class="sma-toolbar"><input class="field" id="smaPlayerSearch" placeholder="Search name, email, player ID or IP address"><button class="secondary" id="smaSearchPlayers" type="button">Search</button></div>
        <p class="sma-note">IP addresses are sensitive data. Use them only for legitimate security and abuse-prevention purposes, and explain collection/retention in your privacy notice.</p>
        <div class="sma-scroll"><table><thead><tr><th>Player</th><th>Random player ID</th><th>Email</th><th>IP address</th><th>Last seen</th><th>Play time</th><th>Level</th><th>Referrals</th><th>Status</th><th>Action</th></tr></thead><tbody id="smaPlayersRows"><tr><td colspan="10">Loading players…</td></tr></tbody></table></div>
      </div>
      <div id="smaReferralsPane" hidden>
        <p class="sma-note">Referral applications stay pending until you review them. Approving a valid referral awards 3,000 coins to the referrer once; rejected or already reviewed referrals cannot be paid again.</p>
        <div class="sma-toolbar"><button class="secondary" id="smaRefreshReferrals" type="button">Refresh referrals</button></div>
        <div class="sma-scroll"><table><thead><tr><th>Referrer</th><th>Referred player</th><th>Referral code</th><th>Status</th><th>Applied</th><th>Action</th></tr></thead><tbody id="smaReferralsRows"><tr><td colspan="6">Loading referrals…</td></tr></tbody></table></div>
      </div>
      <div id="smaLevelsPane" hidden>
        <p class="sma-note">Difficulty is assigned automatically by level position: 1–20 Easy, 21–40 Medium, 41–60 Hard, 61–80 Expert, and 81+ Master. New levels get scaled defaults. Deleting a level shifts the following level numbers, so player progress may be affected.</p>
        <form class="sma-form" id="smaLevelForm">
          <input type="hidden" id="smaLevelId">
          <div><label for="smaLevelName">Level name</label><input class="field" id="smaLevelName" maxlength="60" required value="New Level"></div>
          <div><label for="smaLevelSeason">World / season</label><input class="field" id="smaLevelSeason" maxlength="60" required value="Candy Forest"></div>
          <div><label for="smaLevelType">Mission type</label><select class="field" id="smaLevelType"><option value="score">Score mission</option><option value="timed">Timed challenge</option><option value="jelly">Jelly mission</option></select></div>
          <div><label for="smaTargetScore">Score target</label><input class="field" id="smaTargetScore" type="number" min="100" max="1000000" required value="850"></div>
          <div><label for="smaMoves">Moves</label><input class="field" id="smaMoves" type="number" min="1" max="100" required value="20"></div>
          <div><label for="smaTimeLimit">Time limit (seconds)</label><input class="field" id="smaTimeLimit" type="number" min="0" max="3600" value="0"></div>
          <div><label for="smaJellyGoal">Jelly goal</label><input class="field" id="smaJellyGoal" type="number" min="0" max="64" value="0"></div>
          <div class="sma-full sma-buttons"><button id="smaSaveLevel" type="submit">➕ Add level</button><button class="soft" id="smaCancelLevelEdit" type="button">Clear form</button><button class="secondary" id="smaAutoDefaults" type="button">Use auto defaults</button></div>
        </form>
        <section class="sma-clone-card" aria-labelledby="smaCloneTitle">
          <div class="sma-clone-head"><span aria-hidden="true">🧬</span><strong id="smaCloneTitle">Advanced Level Clone</strong><span class="sma-new-tag">NEW</span></div>
          <p class="sma-note">Choose any existing level, enter how many copies you want, and create them all in one action. Each copy is added sequentially with the selected level’s mission settings.</p>
          <div class="sma-clone-grid">
            <div><label for="smaCloneSource">Source level</label><select class="field" id="smaCloneSource"><option value="">Load levels first…</option></select></div>
            <div><label for="smaCloneCount">Number of clones</label><input class="field" id="smaCloneCount" type="number" min="1" max="500" step="1" value="5" inputmode="numeric"></div>
            <div class="sma-clone-preview" id="smaClonePreview" aria-live="polite">Select a source level to preview the new level range.</div>
          </div>
          <div class="sma-clone-bottom">
            <div class="sma-clone-presets"><span class="sma-note">Quick set:</span><button type="button" data-clone-count="5">5</button><button type="button" data-clone-count="10">10</button><button type="button" data-clone-count="100">100</button></div>
            <button id="smaBulkCloneBtn" type="button">🧬 Clone levels</button>
          </div>
          <p class="sma-note" style="margin:9px 0 0">Safety limit: 500 clones per action. Existing levels and player progress are not deleted.</p>
        </section>
        <div class="sma-scroll"><table><thead><tr><th>#</th><th>Name / season</th><th>Mission</th><th>Target</th><th>Moves</th><th>Time</th><th>Jelly</th><th>Auto difficulty</th><th>Actions</th></tr></thead><tbody id="smaLevelsRows"><tr><td colspan="9">Loading levels…</td></tr></tbody></table></div>
      </div>
      <div id="smaCustomizationPane" hidden>
        <div class="sma-custom-actions"><button id="smaLoadCustomization" class="soft" type="button">↻ Load saved settings</button><button id="smaPreviewCustomization" class="secondary" type="button">👁 Preview draft</button><button id="smaRevertPreview" class="soft" type="button">Undo preview</button><button id="smaSaveCustomization" class="soft" type="button">💾 Save draft</button><button id="smaPublishCustomization" type="button">🚀 Publish changes</button></div>
        <p class="sma-note">Manage your game without editing project files. Save Draft keeps changes private; Publish makes them live for players. Published settings are stored in your database.</p>
        <section class="sma-custom-card">
          <div class="sma-clone-head"><strong>🎨 Brand & Theme Manager</strong><span class="sma-new-tag">NO-CODE</span></div>
          <div class="sma-custom-grid">
            <div><label for="smaBrandName">Game name</label><input class="field" id="smaBrandName" maxlength="60" value="Sugar Rush Adventure"></div>
            <div><label for="smaBrandTagline">Tagline</label><input class="field" id="smaBrandTagline" maxlength="120" value="Match 3 Puzzle Adventure"></div>
            <div><label for="smaThemePrimary">Primary colour</label><input id="smaThemePrimary" type="color" value="#7650d8"></div>
            <div><label for="smaThemeAccent">Accent colour</label><input id="smaThemeAccent" type="color" value="#ff5d9e"></div>
            <div><label for="smaThemeBackground">Page background</label><input id="smaThemeBackground" type="color" value="#fff7e8"></div>
            <div><label for="smaThemePanel">Panel background</label><input id="smaThemePanel" type="color" value="#ffffff"></div>
            <div><label for="smaThemeText">Text colour</label><input id="smaThemeText" type="color" value="#35234d"></div>
            <div><label for="smaThemeFont">Game font</label><select class="field" id="smaThemeFont"><option value="system">Modern / System</option><option value="rounded">Rounded / Friendly</option><option value="serif">Classic / Serif</option></select></div>
            <div><label for="smaLogoUpload">Upload game logo</label><input class="field" id="smaLogoUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div>
            <div><label for="smaFaviconUpload">Upload favicon</label><input class="field" id="smaFaviconUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div>
            <div class="wide"><label for="smaBackgroundUpload">Upload game background</label><input class="field" id="smaBackgroundUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div>
          </div>
          <input type="hidden" id="smaLogoAssetId"><input type="hidden" id="smaFaviconAssetId"><input type="hidden" id="smaBackgroundAssetId">
          <div class="sma-custom-preview"><img id="smaLogoPreview" alt="Current game logo" hidden><span id="smaBrandPreviewText">Sugar Rush Adventure · Match 3 Puzzle Adventure</span></div>
          <div class="sma-checks"><label><input type="radio" name="smaThemePreset" value="candy" checked> Candy Pink</label><label><input type="radio" name="smaThemePreset" value="forest"> Candy Forest</label><label><input type="radio" name="smaThemePreset" value="royal"> Royal Purple</label></div>
        </section>
        <section class="sma-custom-card">
          <div class="sma-clone-head"><strong>📢 Advertisement Manager</strong><span class="sma-new-tag">ADSENSE + CUSTOM ADS</span></div>
          <div class="sma-checks"><label><input id="smaAdsEnabled" type="checkbox"> Enable advertisements on the game</label></div>
          <div><label for="smaAdsenseCode">Paste your Google AdSense display ad code</label><textarea class="sma-code-field" id="smaAdsenseCode" placeholder='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-..." crossorigin="anonymous"></script>
<ins class="adsbygoogle" data-ad-client="ca-pub-..." data-ad-slot="1234567890"></ins>'></textarea><p class="sma-note">Paste the complete AdSense snippet. The dashboard extracts your publisher ID and display slot. A snippet with only a publisher ID can enable Auto ads if Auto ads are already switched on in your AdSense account. Your site/account must be approved by Google.</p></div>
          <label>Show AdSense on these screens</label>
          <div class="sma-checks"><label><input type="checkbox" name="smaAdPlacement" value="home"> Home</label><label><input type="checkbox" name="smaAdPlacement" value="play"> Play page</label><label><input type="checkbox" name="smaAdPlacement" value="rewards"> Rewards</label><label><input type="checkbox" name="smaAdPlacement" value="coins"> Coin shop</label><label><input type="checkbox" name="smaAdPlacement" value="leaderboard"> Leaderboard</label><label><input type="checkbox" name="smaAdPlacement" value="profile"> Profile</label></div>
          <hr style="border:0;border-top:1px solid #eee3f7;margin:12px 0">
          <div class="sma-custom-grid">
            <div><label for="smaCustomAdPlacement">Custom ad placement</label><select class="field" id="smaCustomAdPlacement"><option value="home">Home</option><option value="play">Play page</option><option value="rewards">Rewards</option><option value="coins">Coin shop</option><option value="leaderboard">Leaderboard</option><option value="profile">Profile</option></select></div>
            <div><label for="smaCustomAdLabel">Ad label</label><input class="field" id="smaCustomAdLabel" maxlength="40" value="Sponsored"></div>
            <div><label for="smaCustomAdUrl">Custom ad destination URL</label><input class="field" id="smaCustomAdUrl" type="url" placeholder="https://example.com"></div>
            <div><label for="smaCustomAdImage">Upload custom ad banner</label><input class="field" id="smaCustomAdImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div>
            <div class="wide"><label for="smaCustomAdHtml">Paste safe custom HTML ad code</label><textarea class="field" id="smaCustomAdHtml" placeholder='<a href="https://example.com"><img src="https://example.com/banner.jpg" alt="Sponsored offer"></a>'></textarea></div>
            <div class="wide"><label for="smaCustomAdEmbedCode">Or paste a custom ad iframe embed code</label><textarea class="field" id="smaCustomAdEmbedCode" placeholder='<iframe src="https://ad-provider.example/embed/your-ad" width="100%" height="160"></iframe>'></textarea><p class="sma-note">Only the HTTPS iframe source is extracted. It runs in a restricted sandbox, separate from the game. Script, form and event-handler tags in the static HTML field are removed.</p></div>
          </div>
          <input type="hidden" id="smaCustomAdImageAssetId">
          <div class="sma-custom-preview"><img id="smaCustomAdPreview" alt="Custom ad banner preview" hidden><span id="smaCustomAdPreviewText">No custom banner uploaded.</span></div>
          <div class="sma-warning">Never ask players to click ads or offer coins/rewards for ad clicks. Keep ads separate from gameplay controls. Rewarded ads must use a supported provider and server-verified completion.</div>
        </section>
        <section class="sma-custom-card">
          <div class="sma-clone-head"><strong>🧩 Custom Code Editor</strong><span class="sma-new-tag">PASTE & PUBLISH</span></div>
          <div class="sma-custom-grid">
            <div><label for="smaCustomHtmlPlacement">HTML display location</label><select class="field" id="smaCustomHtmlPlacement"><option value="home-top">Home · Top</option><option value="home-bottom">Home · Bottom</option><option value="play-top">Play · Top</option><option value="footer">Footer</option></select></div>
            <div><label for="smaCustomJsEnabled">JavaScript execution</label><div class="sma-checks"><label><input id="smaCustomJsEnabled" type="checkbox"> Enable trusted custom JS</label></div></div>
            <div class="wide"><label for="smaCustomHtml">Custom HTML</label><textarea class="sma-code-field" id="smaCustomHtml" placeholder="Paste a custom section or widget HTML here..."></textarea></div>
            <div class="wide"><label for="smaCustomCss">Custom CSS</label><textarea class="sma-code-field" id="smaCustomCss" placeholder="/* Paste CSS to change game cards, buttons, layouts and colours */"></textarea></div>
            <div class="wide"><label for="smaCustomJs">Custom JavaScript</label><textarea class="sma-code-field" id="smaCustomJs" placeholder="// Paste trusted JavaScript here. It runs on the game website after publishing."></textarea></div>
          </div>
          <div class="sma-warning"><strong>Security warning:</strong> Enabled JavaScript runs on the public game website for every visitor with the same permissions as the game page. Only paste code you wrote or fully trust. Never paste passwords, API secrets, Firebase service keys or private tokens. Keep a backup and test with Preview first. Custom HTML is sanitized and does not run scripts.</div>
        </section>
        <section class="sma-custom-card">
          <div class="sma-clone-head"><strong>🗂️ Media Library</strong><span class="sma-new-tag">UPLOAD</span></div>
          <div class="sma-custom-grid"><div><label for="smaMediaUpload">Upload image, audio or video</label><input class="field" id="smaMediaUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm"></div><div class="sma-custom-actions" style="align-items:end"><button id="smaUploadMedia" type="button">⬆ Upload to Media Library</button><button id="smaRefreshAssets" class="soft" type="button">Refresh library</button></div></div>
          <p class="sma-note">Supported files: JPG, PNG, WEBP, GIF, MP3, OGG, WAV, MP4 and WEBM. Maximum 5 MB per file. SVG and HTML files are not accepted.</p>
          <div id="smaAssetList" class="sma-assets"><p class="sma-note">Load your media library to see uploaded files.</p></div>
        </section>
        <section class="sma-custom-card">
          <div class="sma-clone-head"><strong>🕘 Publish History & Restore</strong></div>
          <div class="sma-custom-grid"><div><label for="smaHistoryRevision">Previous published version</label><select class="field" id="smaHistoryRevision"><option value="">No history loaded</option></select></div><div class="sma-custom-actions" style="align-items:end"><button id="smaRollbackCustomization" class="soft" type="button">↶ Restore selected version</button></div></div>
          <p class="sma-note">Every publish creates a version. Restore a previous version if a design or custom-code update causes a problem.</p>
        </section>
      </div>`;
    root.appendChild(panel);
    $("smaRefreshAll").addEventListener("click", () => loadAll(true));
    $("smaSearchPlayers").addEventListener("click", () => loadPlayers());
    $("smaRefreshReferrals").addEventListener("click", () => loadReferrals());
    $("smaPlayerSearch").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); loadPlayers(); } });
    panel.querySelectorAll("[data-sma-pane]").forEach(button => button.addEventListener("click", () => setPane(button.dataset.smaPane)));
    $("smaLevelForm").addEventListener("submit", saveLevel);
    $("smaCancelLevelEdit").addEventListener("click", resetLevelForm);
    $("smaAutoDefaults").addEventListener("click", setAutoDefaults);
    $("smaPlayersRows").addEventListener("click", handlePlayerAction);
    $("smaLevelsRows").addEventListener("click", handleLevelAction);
    $("smaReferralsRows").addEventListener("click", handleReferralAction);
    $("smaCloneSource").addEventListener("change", updateClonePreview);
    $("smaCloneCount").addEventListener("input", updateClonePreview);
    $("smaBulkCloneBtn").addEventListener("click", bulkCloneLevels);
    panel.querySelectorAll("[data-clone-count]").forEach(button => button.addEventListener("click", () => {
      $("smaCloneCount").value = button.dataset.cloneCount;
      updateClonePreview();
    }));
    $("smaLoadCustomization").addEventListener("click", loadCustomization);
    $("smaSaveCustomization").addEventListener("click", saveCustomizationDraft);
    $("smaPublishCustomization").addEventListener("click", publishCustomization);
    $("smaPreviewCustomization").addEventListener("click", previewCustomization);
    $("smaRevertPreview").addEventListener("click", () => window.SugarRushRefreshSiteConfig?.());
    $("smaRollbackCustomization").addEventListener("click", rollbackCustomization);
    $("smaRefreshAssets").addEventListener("click", loadAssets);
    $("smaUploadMedia").addEventListener("click", () => uploadGeneralMedia());
    $("smaLogoUpload").addEventListener("change", () => uploadToConfig("smaLogoUpload", "smaLogoAssetId", "logo"));
    $("smaFaviconUpload").addEventListener("change", () => uploadToConfig("smaFaviconUpload", "smaFaviconAssetId", "favicon"));
    $("smaBackgroundUpload").addEventListener("change", () => uploadToConfig("smaBackgroundUpload", "smaBackgroundAssetId", "background"));
    $("smaCustomAdImage").addEventListener("change", () => uploadToConfig("smaCustomAdImage", "smaCustomAdImageAssetId", "custom-ad"));
    $("smaAssetList").addEventListener("click", handleAssetAction);
    panel.querySelectorAll("[name='smaThemePreset']").forEach(input => input.addEventListener("change", applyThemePreset));
    ["smaBrandName", "smaBrandTagline"].forEach(id => $(id).addEventListener("input", updateBrandPreview));
    setAutoDefaults();
  }
  function setPane(name) {
    activePane = ["levels", "referrals", "customization"].includes(name) ? name : "players";
    $("smaPlayersPane").hidden = activePane !== "players";
    $("smaLevelsPane").hidden = activePane !== "levels";
    $("smaReferralsPane").hidden = activePane !== "referrals";
    $("smaCustomizationPane").hidden = activePane !== "customization";
    document.querySelectorAll("#adminOpsPanel [data-sma-pane]").forEach(button => button.classList.toggle("active", button.dataset.smaPane === activePane));
    if (activePane === "players") loadPlayers();
    else if (activePane === "levels") loadLevels();
    else if (activePane === "referrals") loadReferrals();
    else loadCustomization();
  }
  async function loadAnalytics() {
    const data = await api("/api/admin/analytics");
    const a = data.analytics || {};
    const totalHours = Math.floor((Number(a.totalPlaySeconds) || 0) / 3600);
    $("smaStats").innerHTML = `
      <div class="sma-stat"><small>Total players</small><strong>${Number(a.totalPlayers)||0}</strong></div>
      <div class="sma-stat"><small>Active in 24h</small><strong>${Number(a.active24h)||0}</strong></div>
      <div class="sma-stat"><small>Total play time</small><strong>${totalHours.toLocaleString()} h</strong></div>
      <div class="sma-stat"><small>Active levels</small><strong>${Number(a.totalLevels)||0}</strong></div>`;
  }
  async function loadPlayers() {
    const target = $("smaPlayersRows");
    if (!target) return;
    target.innerHTML = `<tr><td colspan="10">Loading players…</td></tr>`;
    try {
      const q = $("smaPlayerSearch").value.trim();
      const data = await api(`/api/admin/players${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const players = Array.isArray(data.players) ? data.players : [];
      target.innerHTML = players.length ? players.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.displayName || "Player")}</strong><br><span class="sma-note">${escapeHtml(p.countryCode || "")}</span></td>
          <td>${escapeHtml(p.playerId || "—")}</td><td>${escapeHtml(p.email || "Guest / anonymous")}</td>
          <td>${escapeHtml(p.lastIp || "—")}</td><td>${escapeHtml(formatDate(p.lastSeen))}</td>
          <td>${escapeHtml(formatTime(p.totalPlaySeconds))}</td><td>${Number(p.currentLevel)||1} / ${Number(p.maxUnlocked)||1}</td>
          <td>${Number(p.referralCount)||0}</td><td>${p.banned ? `<span class="sma-banned">BANNED</span>` : `<span class="sma-active">ACTIVE</span>`}${p.banReason ? `<br><span class="sma-note">${escapeHtml(p.banReason)}</span>` : ""}</td>
          <td><div class="sma-actions">${p.banned ? `<button class="sma-edit" type="button" data-unban="${escapeHtml(p.uid)}">Unban</button>` : `<button class="sma-danger" type="button" data-ban="${escapeHtml(p.uid)}" data-name="${escapeHtml(p.displayName||"Player")}">Ban user</button>`}</div></td>
        </tr>`).join("") : `<tr><td colspan="10">No players found yet.</td></tr>`;
      setStatus(`${players.length} player record(s) loaded.`);
    } catch (error) {
      target.innerHTML = `<tr><td colspan="10">${escapeHtml(error.message)}</td></tr>`;
      setStatus(error.message, true);
    }
  }
  async function handlePlayerAction(event) {
    const ban = event.target.closest("[data-ban]");
    const unban = event.target.closest("[data-unban]");
    if (!ban && !unban) return;
    const uid = (ban || unban).dataset.ban || (ban || unban).dataset.unban;
    try {
      if (ban) {
        const reason = window.prompt(`Why are you banning ${ban.dataset.name || "this player"}?`, "Violation of game rules");
        if (reason === null) return;
        await api(`/api/admin/players/${encodeURIComponent(uid)}/ban`, { method: "POST", body: { reason } });
        setStatus("Player banned. Their next backend request will be blocked.");
      } else {
        if (!window.confirm("Unban this player?")) return;
        await api(`/api/admin/players/${encodeURIComponent(uid)}/unban`, { method: "POST", body: {} });
        setStatus("Player unbanned.");
      }
      await loadPlayers(); await loadAnalytics();
    } catch (error) { setStatus(error.message, true); }
  }
  async function loadReferrals() {
    const target = $("smaReferralsRows");
    if (!target) return;
    target.innerHTML = `<tr><td colspan="6">Loading referrals…</td></tr>`;
    try {
      const data = await api("/api/admin/referrals");
      cachedReferrals = Array.isArray(data.referrals) ? data.referrals : [];
      target.innerHTML = cachedReferrals.length ? cachedReferrals.map(item => {
        const status = String(item.status || "pending").toLowerCase();
        const pill = status === "approved" ? `<span class="sma-active">APPROVED</span>` : status === "rejected" ? `<span class="sma-banned">REJECTED</span>` : `<span class="sma-pending">PENDING</span>`;
        const actions = status === "pending" ? `<div class="sma-actions"><button class="green" type="button" data-approve-referral="${escapeHtml(item.id)}">Approve +3,000</button><button class="sma-danger" type="button" data-reject-referral="${escapeHtml(item.id)}">Reject</button></div>` : `<span class="sma-note">Reviewed</span>`;
        return `<tr><td><strong>${escapeHtml(item.referrerName || "Player")}</strong><br><span class="sma-note">${escapeHtml(item.referrerEmail || item.referrerPlayerId || "")}</span></td><td><strong>${escapeHtml(item.referredName || "Player")}</strong><br><span class="sma-note">${escapeHtml(item.referredEmail || item.referredPlayerId || "")}</span></td><td>${escapeHtml(item.code || "—")}</td><td>${pill}</td><td>${escapeHtml(formatDate(item.createdAt))}</td><td>${actions}</td></tr>`;
      }).join("") : `<tr><td colspan="6">No referral applications recorded yet.</td></tr>`;
      setStatus(`${cachedReferrals.length} referral record(s) loaded.`);
    } catch (error) {
      target.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
      setStatus(error.message, true);
    }
  }
  async function handleReferralAction(event) {
    const approve = event.target.closest("[data-approve-referral]");
    const reject = event.target.closest("[data-reject-referral]");
    if (!approve && !reject) return;
    const id = (approve || reject).dataset.approveReferral || (approve || reject).dataset.rejectReferral;
    const action = approve ? "approve" : "reject";
    if (!window.confirm(approve ? "Approve this referral and award 3,000 coins to the referrer?" : "Reject this referral application?")) return;
    try {
      const result = await api(`/api/admin/referrals/${encodeURIComponent(id)}/${action}`, { method: "POST", body: {} });
      setStatus(approve ? `Referral approved. ${Number(result.rewardCoins)||3000} coins awarded to the referrer.` : "Referral rejected.");
      await loadReferrals(); await loadAnalytics(); await loadPlayers();
    } catch (error) { setStatus(error.message, true); }
  }
  function setAutoDefaults() {
    const n = cachedLevels.length + 1;
    const type = n % 5 === 0 ? "timed" : n % 3 === 0 ? "jelly" : "score";
    const seasons = ["Candy Forest", "Sugar Desert", "Frosting Peaks", "Gummy Galaxy", "Chocolate Kingdom"];
    $("smaLevelId").value = "";
    $("smaLevelName").value = `Level ${n}`;
    $("smaLevelSeason").value = seasons[Math.floor((n - 1) / 20)] || `Bonus World ${Math.floor((n - 1) / 20) + 1}`;
    $("smaLevelType").value = type;
    $("smaTargetScore").value = 450 + (n - 1) * 4;
    $("smaMoves").value = Math.max(20, 24 - Math.floor((n - 1) / 20));
    $("smaTimeLimit").value = type === "timed" ? 60 + Math.floor((n - 1) / 20) * 15 : 0;
    $("smaJellyGoal").value = type === "jelly" ? Math.min(30, 14 + Math.floor(n / 10) * 2) : 0;
    $("smaSaveLevel").textContent = "➕ Add level";
  }
  function resetLevelForm() { setAutoDefaults(); setStatus("Level form cleared."); }
  function editLevel(level) {
    $("smaLevelId").value = level.id;
    $("smaLevelName").value = level.name || "";
    $("smaLevelSeason").value = level.season || "Candy Forest";
    $("smaLevelType").value = level.type || "score";
    $("smaTargetScore").value = Number(level.targetScore) || 450;
    $("smaMoves").value = Number(level.moves) || 24;
    $("smaTimeLimit").value = Number(level.timeLimit) || 0;
    $("smaJellyGoal").value = Number(level.jellyGoal) || 0;
    $("smaSaveLevel").textContent = "💾 Save changes";
    $("smaLevelName").focus();
    setStatus(`Editing Level ${level.number}. Difficulty will still be assigned by level position.`);
  }
  async function loadLevels() {
    const target = $("smaLevelsRows");
    if (!target) return;
    target.innerHTML = `<tr><td colspan="9">Loading levels…</td></tr>`;
    try {
      const data = await api("/api/admin/levels");
      cachedLevels = Array.isArray(data.levels) ? data.levels : [];
      populateCloneSources();
      target.innerHTML = cachedLevels.length ? cachedLevels.map(level => `
        <tr><td>${Number(level.number)||0}</td><td><strong>${escapeHtml(level.name)}</strong><br><span class="sma-note">${escapeHtml(level.season)}</span></td>
        <td>${escapeHtml(level.type)}</td><td>${Number(level.targetScore)||0}</td><td>${Number(level.moves)||0}</td><td>${Number(level.timeLimit)||0}s</td><td>${Number(level.jellyGoal)||0}</td><td><strong>${escapeHtml(level.difficulty||"—")}</strong></td>
        <td><div class="sma-actions"><button class="sma-edit" type="button" data-edit-level="${escapeHtml(level.id)}">Edit</button><button class="secondary" type="button" data-clone-level="${escapeHtml(level.id)}">Clone</button><button class="sma-danger" type="button" data-delete-level="${escapeHtml(level.id)}" data-number="${Number(level.number)||0}">Delete</button></div></td></tr>`).join("") : `<tr><td colspan="9">No active levels. Add one to start the level map.</td></tr>`;
      setStatus(`${cachedLevels.length} active level(s) loaded. Difficulty is automatic.`);
    } catch (error) {
      target.innerHTML = `<tr><td colspan="9">${escapeHtml(error.message)}</td></tr>`;
      setStatus(error.message, true);
    }
  }
  function populateCloneSources() {
    const select = $("smaCloneSource");
    if (!select) return;
    const previous = select.value;
    select.innerHTML = cachedLevels.length
      ? cachedLevels.map(level => `<option value="${escapeHtml(level.id)}">Level ${Number(level.number) || 0} · ${escapeHtml(level.name || level.season || "Untitled")}</option>`).join("")
      : `<option value="">No active levels available</option>`;
    if (cachedLevels.some(level => String(level.id) === previous)) select.value = previous;
    else if (cachedLevels.length) select.value = String(cachedLevels[0].id);
    updateClonePreview();
  }
  function updateClonePreview() {
    const preview = $("smaClonePreview");
    const countInput = $("smaCloneCount");
    const sourceSelect = $("smaCloneSource");
    if (!preview || !countInput || !sourceSelect) return;
    const source = cachedLevels.find(level => String(level.id) === sourceSelect.value);
    const count = Number(countInput.value);
    if (!source) { preview.textContent = "Select a source level to preview the new level range."; return; }
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      preview.textContent = "Enter a whole number from 1 to 500.";
      return;
    }
    const first = cachedLevels.length + 1;
    const last = first + count - 1;
    preview.textContent = `This will create ${count} new level${count === 1 ? "" : "s"}: Level ${first}–${last}, using the settings from Level ${Number(source.number) || "?"}.`;
  }
  async function bulkCloneLevels() {
    const sourceId = $("smaCloneSource").value;
    const count = Number($("smaCloneCount").value);
    const source = cachedLevels.find(level => String(level.id) === sourceId);
    if (!source) { setStatus("Choose an active source level first.", true); return; }
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setStatus("Enter a whole number from 1 to 500.", true);
      $("smaCloneCount").focus();
      return;
    }
    const first = cachedLevels.length + 1;
    const last = first + count - 1;
    const sourceNumber = Number(source.number) || 0;
    const confirmed = window.confirm(`Create ${count} new level${count === 1 ? "" : "s"} from Level ${sourceNumber}?

New range: Level ${first} to Level ${last}.
The source level will stay unchanged.`);
    if (!confirmed) return;
    const button = $("smaBulkCloneBtn");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = `Creating ${count} levels…`;
    setStatus(`Creating ${count} new levels from Level ${sourceNumber}. Please keep this page open…`);
    try {
      const result = await api(`/api/admin/levels/${encodeURIComponent(sourceId)}/clone-bulk`, { method: "POST", body: { count } });
      await loadLevels();
      await loadAnalytics();
      if (typeof window.sugarRushRefreshLevels === "function") await window.sugarRushRefreshLevels();
      else if (typeof window.sweetMatchRefreshLevels === "function") await window.sweetMatchRefreshLevels();
      const created = Number(result.clonedCount) || count;
      const start = Number(result.startLevel) || first;
      const end = Number(result.endLevel) || last;
      setStatus(`Success! ${created} level${created === 1 ? "" : "s"} cloned from Level ${sourceNumber}. New levels: ${start}–${end}.`);
      updateClonePreview();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
  async function saveLevel(event) {
    event.preventDefault();
    const id = $("smaLevelId").value;
    const body = {
      name: $("smaLevelName").value.trim(), season: $("smaLevelSeason").value.trim(), type: $("smaLevelType").value,
      targetScore: Number($("smaTargetScore").value), moves: Number($("smaMoves").value),
      timeLimit: Number($("smaTimeLimit").value), jellyGoal: Number($("smaJellyGoal").value)
    };
    try {
      if (id) {
        await api(`/api/admin/levels/${encodeURIComponent(id)}`, { method: "PUT", body });
        setStatus("Level updated.");
      } else {
        await api("/api/admin/levels", { method: "POST", body });
        setStatus("Level added. Its difficulty was assigned automatically.");
      }
      await loadLevels();
      resetLevelForm();
      await loadAnalytics();
      if (typeof window.sugarRushRefreshLevels === "function") await window.sugarRushRefreshLevels();
      else if (typeof window.sweetMatchRefreshLevels === "function") await window.sweetMatchRefreshLevels();
    } catch (error) { setStatus(error.message, true); }
  }
  async function handleLevelAction(event) {
    const edit = event.target.closest("[data-edit-level]");
    const clone = event.target.closest("[data-clone-level]");
    const remove = event.target.closest("[data-delete-level]");
    if (!edit && !clone && !remove) return;
    try {
      if (edit) {
        const level = cachedLevels.find(item => item.id === edit.dataset.editLevel);
        if (level) editLevel(level);
        return;
      }
      if (clone) {
        if (!window.confirm("Clone this level and add the copy to the end of the level list?")) return;
        await api(`/api/admin/levels/${encodeURIComponent(clone.dataset.cloneLevel)}/clone`, { method: "POST", body: {} });
        setStatus("Level cloned. Its difficulty is assigned from its new position.");
      } else if (remove) {
        if (cachedLevels.length <= 1) { setStatus("Keep at least one active level.", true); return; }
        if (!window.confirm(`Delete Level ${remove.dataset.number}? Levels after it will shift down by one position and player progress may be affected.`)) return;
        await api(`/api/admin/levels/${encodeURIComponent(remove.dataset.deleteLevel)}`, { method: "DELETE" });
        setStatus("Level deleted and active levels renumbered.");
      }
      await loadLevels();
      resetLevelForm();
      await loadAnalytics();
      if (typeof window.sugarRushRefreshLevels === "function") await window.sugarRushRefreshLevels();
      else if (typeof window.sweetMatchRefreshLevels === "function") await window.sweetMatchRefreshLevels();
    } catch (error) { setStatus(error.message, true); }
  }
  function defaultCustomization() {
    return {
      brand:{name:"Sugar Rush Adventure",tagline:"Match 3 Puzzle Adventure",logoAssetId:"",faviconAssetId:""},
      theme:{primary:"#7650d8",accent:"#ff5d9e",pageBackground:"#fff7e8",panelBackground:"#ffffff",textColor:"#35234d",fontFamily:"system",backgroundAssetId:""},
      ads:{enabled:false,adsenseCode:"",placements:["home"],customAdHtml:"",customAdEmbedCode:"",customAdPlacement:"home",customAdImageAssetId:"",customAdTargetUrl:"",customAdLabel:"Sponsored"},
      customCode:{html:"",htmlPlacement:"home-bottom",css:"",js:"",jsEnabled:false}
    };
  }
  function updateBrandPreview() {
    const text = $("smaBrandPreviewText");
    if (text) text.textContent = `${$("smaBrandName").value || "Sugar Rush Adventure"} · ${$("smaBrandTagline").value || ""}`;
  }
  function showAssetPreview(imgId, assetId, fallbackTextId) {
    const img = $(imgId), fallback = fallbackTextId ? $(fallbackTextId) : null;
    if (assetId && API_BASE()) {
      img.src = `${API_BASE()}/api/public/assets/${encodeURIComponent(assetId)}`;
      img.hidden = false;
      if (fallback) fallback.hidden = true;
    } else {
      if (img) img.hidden = true;
      if (fallback) fallback.hidden = false;
    }
  }
  function fillCustomizationForm(config) {
    const c = config || defaultCustomization(), b = c.brand || {}, t = c.theme || {}, a = c.ads || {}, code = c.customCode || {};
    $("smaBrandName").value = b.name || "Sugar Rush Adventure";
    $("smaBrandTagline").value = b.tagline || "Match 3 Puzzle Adventure";
    $("smaThemePrimary").value = t.primary || "#7650d8";
    $("smaThemeAccent").value = t.accent || "#ff5d9e";
    $("smaThemeBackground").value = t.pageBackground || "#fff7e8";
    $("smaThemePanel").value = t.panelBackground || "#ffffff";
    $("smaThemeText").value = t.textColor || "#35234d";
    $("smaThemeFont").value = t.fontFamily || "system";
    $("smaLogoAssetId").value = b.logoAssetId || "";
    $("smaFaviconAssetId").value = b.faviconAssetId || "";
    $("smaBackgroundAssetId").value = t.backgroundAssetId || "";
    $("smaAdsEnabled").checked = Boolean(a.enabled);
    $("smaAdsenseCode").value = a.adsenseCode || "";
    document.querySelectorAll("[name='smaAdPlacement']").forEach(input => input.checked = (a.placements || []).includes(input.value));
    $("smaCustomAdPlacement").value = a.customAdPlacement || "home";
    $("smaCustomAdLabel").value = a.customAdLabel || "Sponsored";
    $("smaCustomAdUrl").value = a.customAdTargetUrl || "";
    $("smaCustomAdHtml").value = a.customAdHtml || "";
    $("smaCustomAdEmbedCode").value = a.customAdEmbedCode || "";
    $("smaCustomAdImageAssetId").value = a.customAdImageAssetId || "";
    $("smaCustomHtml").value = code.html || "";
    $("smaCustomHtmlPlacement").value = code.htmlPlacement || "home-bottom";
    $("smaCustomCss").value = code.css || "";
    $("smaCustomJs").value = code.js || "";
    $("smaCustomJsEnabled").checked = Boolean(code.jsEnabled);
    showAssetPreview("smaLogoPreview", b.logoAssetId, "smaBrandPreviewText");
    showAssetPreview("smaCustomAdPreview", a.customAdImageAssetId, "smaCustomAdPreviewText");
    updateBrandPreview();
  }
  function collectCustomizationForm() {
    const base = customizationDraft || defaultCustomization();
    return {
      brand:{name:$("smaBrandName").value.trim(),tagline:$("smaBrandTagline").value.trim(),logoAssetId:$("smaLogoAssetId").value,faviconAssetId:$("smaFaviconAssetId").value},
      theme:{primary:$("smaThemePrimary").value,accent:$("smaThemeAccent").value,pageBackground:$("smaThemeBackground").value,panelBackground:$("smaThemePanel").value,textColor:$("smaThemeText").value,fontFamily:$("smaThemeFont").value,backgroundAssetId:$("smaBackgroundAssetId").value},
      ads:{enabled:$("smaAdsEnabled").checked,adsenseCode:$("smaAdsenseCode").value,placements:[...document.querySelectorAll("[name='smaAdPlacement']:checked")].map(input=>input.value),customAdHtml:$("smaCustomAdHtml").value,customAdEmbedCode:$("smaCustomAdEmbedCode").value,customAdPlacement:$("smaCustomAdPlacement").value,customAdImageAssetId:$("smaCustomAdImageAssetId").value,customAdTargetUrl:$("smaCustomAdUrl").value.trim(),customAdLabel:$("smaCustomAdLabel").value.trim()},
      customCode:{html:$("smaCustomHtml").value,htmlPlacement:$("smaCustomHtmlPlacement").value,css:$("smaCustomCss").value,js:$("smaCustomJs").value,jsEnabled:$("smaCustomJsEnabled").checked}
    };
  }
  async function loadCustomization() {
    if (!$("smaCustomizationPane")) return;
    try {
      const data = await api("/api/admin/site-config");
      customizationDraft = data.draft || defaultCustomization();
      customizationHistory = Array.isArray(data.history) ? data.history : [];
      fillCustomizationForm(customizationDraft);
      $("smaHistoryRevision").innerHTML = customizationHistory.length ? customizationHistory.map(item => `<option value="${Number(item.revision)}">Version ${Number(item.revision)} · ${escapeHtml(formatDate(item.createdAt))} · ${escapeHtml(item.note || "Published")}</option>`).join("") : `<option value="">No previous versions yet</option>`;
      await loadAssets();
      setStatus("Branding, ads, custom code and media settings loaded.");
    } catch (error) { setStatus(`Customization settings could not load: ${error.message}`, true); }
  }
  async function saveCustomizationDraft() {
    try {
      const config = collectCustomizationForm();
      const data = await api("/api/admin/site-config/draft", {method:"PUT",body:{config}});
      customizationDraft = data.draft || config;
      setStatus("Draft saved privately. Press Publish changes when you are ready to make it live.");
      return customizationDraft;
    } catch (error) { setStatus(`Draft save failed: ${error.message}`, true); throw error; }
  }
  async function previewCustomization() {
    try {
      const config = collectCustomizationForm();
      if (window.SugarRushApplyConfig) window.SugarRushApplyConfig(config, {preview:true});
      setStatus("Draft preview applied to this browser only. It is not live for players.");
    } catch (error) { setStatus(`Preview failed: ${error.message}`, true); }
  }
  async function publishCustomization() {
    const config = collectCustomizationForm();
    const previousPublishedJs = window.SUGAR_RUSH_PUBLISHED_CONFIG?.customCode?.jsEnabled ? String(window.SUGAR_RUSH_PUBLISHED_CONFIG.customCode.js || "") : "";
    const nextPublishedJs = config.customCode.jsEnabled ? String(config.customCode.js || "") : "";
    const customJsChanged = previousPublishedJs !== nextPublishedJs;
    if (config.customCode.jsEnabled && config.customCode.js.trim()) {
      if (!window.confirm("You enabled custom JavaScript. It will execute for every visitor on the public game website. Only continue if you trust this code and have tested it. Publish now?")) return;
    }
    if (config.ads.enabled && config.ads.adsenseCode && !/ca-pub-[0-9]{8,24}/i.test(config.ads.adsenseCode)) {
      if (!window.confirm("The AdSense snippet does not appear to include a ca-pub publisher ID. AdSense may not display. Publish the other settings anyway?")) return;
    }
    try {
      await saveCustomizationDraft();
      const result = await api("/api/admin/site-config/publish", {method:"POST",body:{note:"Published from Admin Dashboard"}});
      setStatus(`Published successfully (version ${Number(result.revision)||"new"}). Players will receive the update automatically.`);
      if (customJsChanged) {
        setTimeout(() => window.location.reload(), 900);
      } else if (window.SugarRushRefreshSiteConfig) {
        await window.SugarRushRefreshSiteConfig();
      }
      await loadCustomization();
    } catch (error) { setStatus(`Publish failed: ${error.message}`, true); }
  }
  async function rollbackCustomization() {
    const revision = Number($("smaHistoryRevision").value);
    if (!revision) { setStatus("Choose a previous published version first.", true); return; }
    if (!window.confirm(`Restore version ${revision}? This will publish that previous design and settings as a new version.`)) return;
    try {
      const result = await api(`/api/admin/site-config/rollback/${revision}`, {method:"POST",body:{}});
      setStatus(`Restored version ${revision}. New published version: ${result.revision}. Reloading game settings…`);
      setTimeout(() => window.location.reload(), 700);
    } catch (error) { setStatus(`Restore failed: ${error.message}`, true); }
  }
  function readFileDataUrl(file) {
    return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(new Error("Could not read the selected file.")); reader.readAsDataURL(file); });
  }
  async function uploadAssetFile(file) {
    if (!file) throw new Error("Choose a file first.");
    if (file.size > 5*1024*1024) throw new Error("Maximum upload size is 5 MB per file.");
    const dataUrl = await readFileDataUrl(file);
    const data = await api("/api/admin/assets", {method:"POST",body:{filename:file.name,mimeType:file.type,dataUrl}});
    return data.asset;
  }
  async function uploadToConfig(inputId, hiddenId, kind) {
    const input = $(inputId), file = input.files?.[0];
    if (!file) return;
    try {
      setStatus(`Uploading ${kind}…`);
      const asset = await uploadAssetFile(file);
      $(hiddenId).value = asset.id;
      if (kind === "logo") showAssetPreview("smaLogoPreview", asset.id, "smaBrandPreviewText");
      if (kind === "custom-ad") showAssetPreview("smaCustomAdPreview", asset.id, "smaCustomAdPreviewText");
      setStatus(`${file.name} uploaded. Save Draft and Publish to make it live.`);
      await loadAssets();
    } catch (error) { setStatus(`Upload failed: ${error.message}`, true); }
    finally { input.value = ""; }
  }
  async function uploadGeneralMedia() {
    const input = $("smaMediaUpload"), file = input.files?.[0];
    if (!file) { setStatus("Choose a media file first.", true); return; }
    try { setStatus(`Uploading ${file.name}…`); await uploadAssetFile(file); input.value=""; await loadAssets(); setStatus(`${file.name} added to the Media Library.`); }
    catch (error) { setStatus(`Media upload failed: ${error.message}`, true); }
  }
  async function loadAssets() {
    const target = $("smaAssetList");
    if (!target) return;
    try {
      const data = await api("/api/admin/assets");
      cachedAssets = Array.isArray(data.assets) ? data.assets : [];
      target.innerHTML = cachedAssets.length ? cachedAssets.map(asset => {
        const image = String(asset.mimeType || "").startsWith("image/");
        const url = `${API_BASE()}${asset.url}`;
        return `<article class="sma-asset">${image ? `<img src="${escapeHtml(url)}" alt="">` : `<div style="height:75px;display:grid;place-items:center;background:#faf7ff;border-radius:8px;font-size:2rem">${String(asset.mimeType||"").startsWith("audio/")?"🎵":"🎞️"}</div>`}<strong>${escapeHtml(asset.filename)}</strong><small>${escapeHtml(asset.mimeType)} · ${(Number(asset.sizeBytes)/1024).toFixed(1)} KB</small><div class="sma-asset-actions">${image ? `<button class="soft" type="button" data-asset-use="logo" data-asset-id="${escapeHtml(asset.id)}">Use logo</button><button class="soft" type="button" data-asset-use="favicon" data-asset-id="${escapeHtml(asset.id)}">Use favicon</button><button class="soft" type="button" data-asset-use="background" data-asset-id="${escapeHtml(asset.id)}">Use background</button><button class="soft" type="button" data-asset-use="custom-ad" data-asset-id="${escapeHtml(asset.id)}">Use ad</button>` : ""}<button class="sma-danger" type="button" data-asset-delete="${escapeHtml(asset.id)}">Delete</button></div></article>`;
      }).join("") : `<p class="sma-note">Your Media Library is empty. Upload a logo, background, banner or other game asset above.</p>`;
    } catch (error) { target.innerHTML = `<p class="sma-note">${escapeHtml(error.message)}</p>`; }
  }
  async function handleAssetAction(event) {
    const use = event.target.closest("[data-asset-use]"), remove = event.target.closest("[data-asset-delete]");
    if (use) {
      const id = use.dataset.assetId;
      if (use.dataset.assetUse === "logo") { $("smaLogoAssetId").value=id; showAssetPreview("smaLogoPreview",id,"smaBrandPreviewText"); }
      if (use.dataset.assetUse === "favicon") $("smaFaviconAssetId").value=id;
      if (use.dataset.assetUse === "background") $("smaBackgroundAssetId").value=id;
      if (use.dataset.assetUse === "custom-ad") { $("smaCustomAdImageAssetId").value=id; showAssetPreview("smaCustomAdPreview",id,"smaCustomAdPreviewText"); }
      setStatus("Asset selected. Save Draft and Publish to apply it.");
      return;
    }
    if (remove) {
      if (!window.confirm("Delete this uploaded asset? Assets used by a draft or published design cannot be deleted.")) return;
      try { await api(`/api/admin/assets/${encodeURIComponent(remove.dataset.assetDelete)}`,{method:"DELETE",body:{}}); await loadAssets(); setStatus("Asset deleted."); }
      catch(error){setStatus(error.message,true);}
    }
  }
  function applyThemePreset(event) {
    const presets = {
      candy:{primary:"#7650d8",accent:"#ff5d9e",page:"#fff7e8",panel:"#ffffff",text:"#35234d"},
      forest:{primary:"#328b65",accent:"#f4a340",page:"#eaf8df",panel:"#fffdf4",text:"#244b37"},
      royal:{primary:"#4f2a91",accent:"#e64c9b",page:"#f1e9ff",panel:"#fffaff",text:"#29134d"}
    };
    const p=presets[event.target.value]; if(!p)return;
    $("smaThemePrimary").value=p.primary; $("smaThemeAccent").value=p.accent; $("smaThemeBackground").value=p.page; $("smaThemePanel").value=p.panel; $("smaThemeText").value=p.text;
    setStatus(`${event.target.value} theme selected. Preview it before publishing.`);
  }

  async function loadAll(showMessage = false) {
    ensurePanel();
    try {
      await Promise.all([loadAnalytics(), activePane === "levels" ? loadLevels() : activePane === "referrals" ? loadReferrals() : activePane === "customization" ? loadCustomization() : loadPlayers()]);
      loadedOnce = true;
      if (showMessage) setStatus("Admin data refreshed.");
    } catch (error) { setStatus(error.message, true); }
  }
  function onAdminVisible() {
    ensurePanel();
    if (!loadedOnce) loadAll(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensurePanel);
  else ensurePanel();
  const adminView = $("view-admin");
  if (adminView) {
    const observer = new MutationObserver(() => {
      if (adminView.classList.contains("active")) onAdminVisible();
    });
    observer.observe(adminView, { attributes: true, attributeFilter: ["class", "style"] });
    if (adminView.classList.contains("active")) onAdminVisible();
  }
})();
