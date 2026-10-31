(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const API_BASE = () => String(window.SUGAR_RUSH_API_BASE_URL || window.SWEET_MATCH_API_BASE_URL || "").replace(/\/+$/, "");
  let loadedOnce = false;
  let activePane = "players";
  let cachedReferrals = [];
  let cachedLevels = [];

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
      <div class="sma-tabs"><button class="active" type="button" data-sma-pane="players">👥 Players</button><button type="button" data-sma-pane="levels">🧩 Level manager</button><button type="button" data-sma-pane="referrals">🤝 Referrals</button></div>
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
    setAutoDefaults();
  }
  function setPane(name) {
    activePane = ["levels", "referrals"].includes(name) ? name : "players";
    $("smaPlayersPane").hidden = activePane !== "players";
    $("smaLevelsPane").hidden = activePane !== "levels";
    $("smaReferralsPane").hidden = activePane !== "referrals";
    document.querySelectorAll("#adminOpsPanel [data-sma-pane]").forEach(button => button.classList.toggle("active", button.dataset.smaPane === activePane));
    if (activePane === "players") loadPlayers();
    else if (activePane === "levels") loadLevels();
    else loadReferrals();
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
  async function loadAll(showMessage = false) {
    ensurePanel();
    try {
      await Promise.all([loadAnalytics(), activePane === "levels" ? loadLevels() : activePane === "referrals" ? loadReferrals() : loadPlayers()]);
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
