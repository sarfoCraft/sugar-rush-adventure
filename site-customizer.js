/* Sugar Rush Adventure - published no-code customization runtime.
   Public settings are read-only. All writes remain protected by Firebase admin authorization on the API. */
(() => {
  "use strict";
  const API = () => String(window.SUGAR_RUSH_API_BASE_URL || window.SWEET_MATCH_API_BASE_URL || "").replace(/\/+$/, "");
  let currentRevision = -1;
  let currentConfig = null;
  let currentCustomJs = "";
  let pollHandle = null;
  const $ = (selector, root = document) => root.querySelector(selector);
  const assetUrl = id => id && API() ? `${API()}/api/public/assets/${encodeURIComponent(id)}` : "";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function setVar(name, value) { if (value) document.documentElement.style.setProperty(name, value); }
  function applyBrand(config) {
    const brand = config.brand || {};
    const name = brand.name || "Sugar Rush Adventure";
    document.title = `${name} — Match 3 Puzzle Game`;
    document.querySelectorAll(".brand-logo-image").forEach(img => {
      if (brand.logoAssetId) img.src = assetUrl(brand.logoAssetId);
      img.alt = name;
    });
    document.querySelectorAll(".app-logo p").forEach(el => { el.textContent = brand.tagline || "Match 3 Puzzle Adventure"; });
    const icon = $("link[rel~='icon']");
    if (icon && brand.faviconAssetId) { icon.href = assetUrl(brand.faviconAssetId); icon.removeAttribute("type"); }
    document.querySelectorAll(".brand h1, .auth-brand h1").forEach(el => { if (el.dataset.sraManagedName === "1") el.textContent = name; });
  }
  function applyTheme(config) {
    const theme = config.theme || {};
    setVar("--purple", theme.primary);
    setVar("--pink", theme.accent);
    setVar("--ink", theme.textColor);
    setVar("--cream", theme.panelBackground);
    setVar("--line", theme.primary ? `${theme.primary}30` : "");
    setVar("--sra-primary", theme.primary || "#7650d8");
    setVar("--sra-accent", theme.accent || "#ff5d9e");
    setVar("--sra-panel", theme.panelBackground || "#ffffff");
    setVar("--sra-text", theme.textColor || "#35234d");
    const fonts = { system: "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif", rounded: "Trebuchet MS,Arial,sans-serif", serif: "Georgia,serif" };
    if (fonts[theme.fontFamily]) document.body.style.fontFamily = fonts[theme.fontFamily];
    if (theme.backgroundAssetId) {
      document.body.style.backgroundImage = `linear-gradient(135deg,${theme.pageBackground || "#fff7e8"}cc,${theme.pageBackground || "#fff7e8"}88),url("${assetUrl(theme.backgroundAssetId)}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundPosition = "center";
    } else if (theme.pageBackground) {
      document.body.style.backgroundImage = `radial-gradient(circle at 12% 10%,${theme.accent || "#ff5d9e"}22 0,transparent 32%),linear-gradient(135deg,${theme.pageBackground},${theme.primary || "#7650d8"}18)`;
    }
    let themeStyle = $("#sra-theme-overrides");
    if (!themeStyle) { themeStyle = document.createElement("style"); themeStyle.id = "sra-theme-overrides"; document.head.appendChild(themeStyle); }
    themeStyle.textContent = `:root{--sra-primary:${theme.primary || "#7650d8"};--sra-accent:${theme.accent || "#ff5d9e"};--sra-panel:${theme.panelBackground || "#fff"};--sra-text:${theme.textColor || "#35234d"}}body{color:var(--sra-text)}.app-topbar{background:linear-gradient(120deg,var(--sra-primary),var(--sra-accent))}.content-card,.panel,.card,.auth-card{background:var(--sra-panel)}button:not(.soft):not(.green):not(.home-plus){background:linear-gradient(135deg,var(--sra-primary),var(--sra-accent))}`;
    let customStyle = $("#sra-admin-custom-css");
    if (!customStyle) { customStyle = document.createElement("style"); customStyle.id = "sra-admin-custom-css"; document.head.appendChild(customStyle); }
    customStyle.textContent = String(config.customCode?.css || "");
  }
  function sanitizeMarkup(html) {
    const parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    parsed.querySelectorAll("script,style,iframe,object,embed,form,input,button,textarea,select,svg,math,video,audio,link,meta,base").forEach(node => node.remove());
    parsed.body.querySelectorAll("*").forEach(node => {
      const allowed = ["A","IMG","DIV","P","SPAN","STRONG","EM","SMALL","BR","UL","OL","LI"];
      if (!allowed.includes(node.tagName)) { node.replaceWith(...node.childNodes); return; }
      [...node.attributes].forEach(attr => {
        const key = attr.name.toLowerCase(), value = attr.value.trim();
        const safe = ["alt","title","class","width","height"].includes(key) || ((key === "href" || key === "src") && /^https:\/\//i.test(value)) || (key === "target" && value === "_blank");
        if (!safe || key.startsWith("on")) node.removeAttribute(attr.name);
      });
      if (node.tagName === "A" && node.target === "_blank") node.rel = "noopener noreferrer";
      if (node.tagName === "IMG" && !node.src) node.remove();
    });
    return parsed.body.innerHTML;
  }
  function insertCustomHtml(config) {
    document.querySelectorAll("#sra-custom-html-slot").forEach(node => node.remove());
    const html = String(config.customCode?.html || "").trim();
    if (!html) return;
    const placement = config.customCode?.htmlPlacement || "home-bottom";
    const targets = {
      "home-top": $("#view-home .home-world"),
      "home-bottom": $("#view-home .home-feature-grid"),
      "play-top": $("#view-play .play-grid"),
      footer: $(".footer-note")
    };
    const target = targets[placement];
    if (!target) return;
    const slot = document.createElement("div");
    slot.id = "sra-custom-html-slot";
    slot.className = "sra-custom-html-slot";
    slot.innerHTML = sanitizeMarkup(html); // Sanitize preview too; server applies the same allow-list before publishing.
    if (placement === "home-top" || placement === "play-top") target.prepend(slot);
    else target.parentNode.insertBefore(slot, placement === "footer" ? target : target.nextSibling);
  }
  function adTarget(placement) {
    const targets = {
      home: $("#view-home .home-world"),
      play: $("#view-play .play-grid"),
      rewards: $("#view-rewards"),
      coins: $("#view-coins"),
      leaderboard: $("#view-leaderboard"),
      profile: $("#view-profile")
    };
    return targets[placement] || null;
  }
  function ensureAdStyles() {
    if ($("#sra-ad-styles")) return;
    const style = document.createElement("style");
    style.id = "sra-ad-styles";
    style.textContent = `.sra-ad-slot{display:block;max-width:100%;margin:12px auto;padding:10px;border:1px solid #e8d9f6;border-radius:15px;background:#ffffffd9;box-shadow:0 5px 18px #4d2a7610;overflow:hidden;text-align:center}.sra-ad-label{display:block;margin:0 0 7px;color:#8b7899;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.sra-ad-slot img{display:block;max-width:100%;height:auto;max-height:180px;object-fit:contain;margin:auto;border-radius:10px}.sra-ad-slot .adsbygoogle{min-height:90px}.sra-custom-html-slot{margin:12px 0}`;
    document.head.appendChild(style);
  }
  function loadAdSenseScript(publisherId) {
    if (!publisherId) return;
    const existing = $("script[data-sra-adsense]");
    if (existing && existing.dataset.publisherId === publisherId) return;
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.sraAdsense = "1";
    script.dataset.publisherId = publisherId;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
    document.head.appendChild(script);
  }
  function renderAds(config) {
    document.querySelectorAll(".sra-ad-slot").forEach(node => node.remove());
    const ads = config.ads || {};
    if (!ads.enabled) return;
    const placements = Array.isArray(ads.placements) ? ads.placements : [];
    const hasPublisher = /^ca-pub-[0-9]{8,24}$/.test(ads.publisherId || "");
    const hasAdSense = hasPublisher && /^[0-9]{5,24}$/.test(ads.slotId || "");
    const hasAutoAds = hasPublisher && Boolean(ads.autoAds);
    if (hasAdSense || hasAutoAds) loadAdSenseScript(ads.publisherId);
    ensureAdStyles();
    if (hasAdSense) placements.forEach(placement => {
      const target = adTarget(placement);
      if (!target) return;
      const box = document.createElement("aside");
      box.className = "sra-ad-slot";
      box.dataset.placement = placement;
      const label = document.createElement("span");
      label.className = "sra-ad-label";
      label.textContent = "Advertisement";
      box.appendChild(label);
      if (hasAdSense) {
        const ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.dataset.adClient = ads.publisherId;
        ins.dataset.adSlot = ads.slotId;
        ins.dataset.adFormat = "auto";
        ins.dataset.fullWidthResponsive = "true";
        box.appendChild(ins);
      }
      target.prepend(box);
      if (hasAdSense) {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
      }
    });
    const customPlacement = ads.customAdPlacement || "home";
    const customTarget = adTarget(customPlacement);
    if (customTarget && (ads.customAdHtml || ads.customAdImageAssetId || ads.customAdEmbedUrl)) {
      const box = document.createElement("aside");
      box.className = "sra-ad-slot";
      box.dataset.placement = customPlacement;
      const label = document.createElement("span");
      label.className = "sra-ad-label";
      label.textContent = ads.customAdLabel || "Sponsored";
      box.appendChild(label);
      if (ads.customAdImageAssetId) {
        const image = document.createElement("img");
        image.src = assetUrl(ads.customAdImageAssetId);
        image.alt = ads.customAdLabel || "Sponsored content";
        if (ads.customAdTargetUrl) {
          const link = document.createElement("a");
          link.href = ads.customAdTargetUrl;
          link.target = "_blank";
          link.rel = "sponsored noopener noreferrer";
          link.appendChild(image);
          box.appendChild(link);
        } else box.appendChild(image);
      }
      if (ads.customAdHtml) {
        const html = document.createElement("div");
        html.innerHTML = sanitizeMarkup(ads.customAdHtml);
        box.appendChild(html);
      }
      if (ads.customAdEmbedUrl && /^https:\/\//i.test(ads.customAdEmbedUrl)) {
        const frame = document.createElement("iframe");
        frame.src = ads.customAdEmbedUrl;
        frame.title = ads.customAdLabel || "Sponsored content";
        frame.loading = "lazy";
        frame.referrerPolicy = "no-referrer";
        frame.setAttribute("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
        frame.style.cssText = "display:block;width:100%;min-height:120px;height:160px;border:0;border-radius:10px;background:#fff";
        box.appendChild(frame);
      }
      customTarget.prepend(box);
    }
  }
  function applyCustomJs(config, preview) {
    if (preview) return;
    const code = config.customCode?.jsEnabled ? String(config.customCode?.js || "") : "";
    if (!code || code === currentCustomJs) return;
    currentCustomJs = code;
    const script = document.createElement("script");
    script.id = "sra-published-custom-js";
    script.textContent = `/* Sugar Rush Adventure published custom code */\n${code}`;
    document.body.appendChild(script);
  }
  function applyConfig(config, options = {}) {
    if (!config || typeof config !== "object") return;
    applyBrand(config);
    applyTheme(config);
    insertCustomHtml(config);
    renderAds(config);
    applyCustomJs(config, Boolean(options.preview));
    currentConfig = config;
    window.SUGAR_RUSH_PUBLISHED_CONFIG = config;
  }
  async function fetchPublishedConfig({allowReload = true} = {}) {
    if (!API()) return null;
    try {
      const response = await fetch(`${API()}/api/public/site-config`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      const revision = Number(payload.revision) || 0;
      const config = payload.config || {};
      if (currentRevision >= 0 && revision !== currentRevision && allowReload) {
        const nextJs = config.customCode?.jsEnabled ? String(config.customCode?.js || "") : "";
        if (nextJs !== currentCustomJs) {
          // JS updates (including disabling JS) are applied on a clean page load to avoid stacking old event listeners.
          window.location.reload();
          return payload;
        }
      }
      currentRevision = revision;
      applyConfig(config);
      return payload;
    } catch (_) { return null; }
  }
  window.SugarRushApplyConfig = (config, options) => applyConfig(config, options || {preview: true});
  window.SugarRushRefreshSiteConfig = () => fetchPublishedConfig({allowReload: false});
  fetchPublishedConfig({allowReload: false}).then(() => {
    if (!pollHandle && API()) pollHandle = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchPublishedConfig({allowReload: true});
    }, 45000);
  });
})();
