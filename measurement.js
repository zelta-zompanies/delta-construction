/* Basic US-only measurement. Failure, unknown geography and opt-out are closed. */
(() => {
  if (window.deltaMeasurement) return;
  const ga = "G-SHRRZRKLZN";
  const key = "delta_measurement";
  const convertedForms = new Set();
  const restrictions = Object.freeze({
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    allow_enhanced_conversions: false,
    restricted_data_processing: true,
    // Never supply customer fields here. Account-level user-provided-data
    // capabilities and enhanced conversions must also remain disabled.
    user_data: {},
  });
  const hasGpc = () => navigator.globalPrivacyControl === true;
  let storageFailed = false;
  const savedOff = () => {
    try { return localStorage.getItem(key) === "off" || /(?:^|;\s*)delta_measurement=off(?:;|$)/.test(document.cookie); }
    catch { storageFailed = true; return true; }
  };
  const draft = document.querySelector('meta[name="delta-measurement"][content="disabled"]');
  let active = false, started = false, blocked = false, region = "pending";
  let notice;
  const enabled = () => active && !hasGpc() && !savedOff();
  function raw() { window.dataLayer.push(arguments); }
  const persist = (off) => {
    try {
      localStorage.setItem(key, off ? "off" : "on");
      document.cookie = `${key}=${off ? "off" : "on"}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
      storageFailed = false;
      return true;
    } catch { storageFailed = true; return false; }
  };
  const clearMeasurementCookies = () => {
    const domains = ["", location.hostname, `.${location.hostname}`];
    const parts = location.hostname.split(".");
    if (parts.length > 2) domains.push(`.${parts.slice(-2).join(".")}`);
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.trim().split("=")[0];
      if (!/^_(?:ga|gid|gat|gcl|gac)(?:_|$)/.test(name)) return;
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
      });
    });
  };
  const statusText = () => hasGpc() ? "Google measurement is off. Your Global Privacy Control signal is honored."
    : storageFailed ? "Google measurement is off because your browser could not save a privacy choice."
    : savedOff() ? "Google measurement is off on this browser. Your choice is saved."
    : draft ? "Google measurement is off on this draft page."
    : active ? "Basic Google measurement is on for this US visit. You can turn it off at any time."
    : region === "pending" ? "Google measurement is off while we check the region."
    : "Google measurement is off. It runs only when our host verifies a US visit.";
  const render = () => {
    document.querySelectorAll("[data-measurement-status]").forEach((el) => { el.textContent = statusText(); });
    document.querySelectorAll("[data-measurement-choice]").forEach((button) => {
      button.hidden = false;
      button.textContent = savedOff() ? "Allow basic US measurement" : "Turn off measurement";
      button.disabled = hasGpc() || !!draft || storageFailed;
    });
    if (notice) notice.hidden = !active || sessionStorageValue("delta_notice_seen") === "yes";
  };
  const sessionStorageValue = (name) => { try { return sessionStorage.getItem(name); } catch { return null; } };
  const stop = () => {
    active = false;
    window[`ga-disable-${ga}`] = true;
    // Denied consent can still send cookieless pings. Install a browser network
    // barrier before updating Google's consent state; retain map/Facebook hosts.
    if (started && !blocked) {
      blocked = true;
      const barrier = document.createElement("meta");
      barrier.httpEquiv = "Content-Security-Policy";
      barrier.content = "connect-src 'self' https://*.facebook.com https://*.facebook.net https://*.fbcdn.net https://*.cartocdn.com https://unpkg.com; img-src 'self' data: blob: https://*.facebook.com https://*.fbcdn.net https://*.cartocdn.com https://unpkg.com; script-src 'self' 'unsafe-inline' https://connect.facebook.net https://unpkg.com; frame-src 'self' https://www.facebook.com; worker-src 'self' blob:;";
      document.head.append(barrier);
      document.querySelectorAll('iframe').forEach((frame) => {
        if (/google|doubleclick|gstatic/.test(frame.src)) frame.remove();
      });
      raw("consent", "update", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    }
    clearMeasurementCookies();
    window.dispatchEvent(new Event("delta:measurement-off"));
    render();
  };
  const off = () => { persist(true); stop(); };
  const track = (name, parameters) => {
    if (!enabled()) return;
    // Fixed allowlist: callers cannot pass URLs, form contents or arbitrary fields.
    if (name === "generate_lead" && ["quote", "contact"].includes(parameters?.form_id)) {
      window.gtag("event", name, { send_to: ga, form_id: parameters.form_id, method: "netlify_form", ...restrictions });
    } else if (name === "contact_intent" && ["phone", "email"].includes(parameters?.method)) {
      window.gtag("event", name, { send_to: ga, method: parameters.method, ...restrictions });
    }
  };
  window.deltaMeasurement = Object.freeze({ enabled, track, restrictions, optOut: off,
    conversion: (formId) => {
      if (!enabled() || !["quote", "contact"].includes(formId) || convertedForms.has(formId)) return;
      convertedForms.add(formId);
      window.gtag("event", "conversion", { send_to: "AW-18296392613/2RuSCI28pJ8dEKWXs5RE", ...restrictions });
    },
  });
  const load = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src; script.async = true;
    script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  });
  const start = async () => {
    if (started || draft || hasGpc() || savedOff()) return;
    // Enhanced measurement can inspect the browser URL independently of
    // page_location (for example, a ?q= value becomes a search event). This
    // static site has no query-driven UI. Keep only ad-click identifiers;
    // preserve anchors used by the gallery and existing navigation.
    try {
      const url = new URL(location.href);
      const clickKeys = new Set(["gclid", "gclsrc", "dclid", "gbraid", "wbraid"]);
      for (const name of [...url.searchParams.keys()]) {
        if (!clickKeys.has(name)) url.searchParams.delete(name);
      }
      if (url.href !== location.href) history.replaceState(history.state, "", url.href);
    } catch { stop(); return; }
    started = true; active = true;
    window[`ga-disable-${ga}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { if (enabled()) raw(...arguments); };
    // Eligible US visitors permit ordinary click/cookie measurement. This is
    // separate from customer-field collection, which stays disabled, and
    // personalized advertising, which remains denied.
    raw("consent", "default", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" });
    raw("set", { ...restrictions, ads_data_redaction: true, url_passthrough: false });
    raw("js", new Date());
    // Static canonical paths keep arbitrary query/hash and unknown 404 paths out
    // of page metadata. Google can still read genuine click IDs for its linker.
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const cleanPath = canonical ? new URL(canonical).pathname : "/404.html";
    const cleanLocation = `${location.origin}${cleanPath}`;
    raw("set", { page_location: cleanLocation, page_referrer: "" });
    raw("config", ga, { ...restrictions, page_location: cleanLocation, page_referrer: "" });
    raw("config", "AW-18296392613", restrictions);
    raw("config", "AW-18296392613/ax3SCMbpq58dEKWXs5RE", {
      ...restrictions,
      phone_conversion_number: "9015684128",
      phone_conversion_callback: (formatted, mobile) => window.deltaAds?.replacePhone(formatted, mobile),
    });
    render();
    try {
      if (!window.deltaAds) await load("/ads-tracking.js");
      if (enabled()) await load(`https://www.googletagmanager.com/gtag/js?id=${ga}`);
    } catch { /* Forms and real phone numbers continue when tags are blocked. */ }
  };
  const decide = async () => {
    if (draft || hasGpc() || savedOff()) { stop(); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch("/measurement-policy", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      if (!response.ok) throw new Error("Region unavailable");
      const policy = await response.json();
      region = policy.region;
      if (policy.version === 1 && policy.source === "netlify-edge" && policy.region === "US" && policy.eligible === true && !hasGpc() && !savedOff()) await start();
      else stop();
    } catch { region = "unknown"; stop(); }
    finally { clearTimeout(timeout); render(); }
  };
  const mount = () => {
    notice = document.createElement("aside");
    notice.className = "measurement-notice";
    notice.setAttribute("aria-label", "Privacy notice");
    notice.hidden = true;
    notice.innerHTML = '<p>Basic Google measurement is on for US visits. No personalized ads or customer-data uploads. <a href="privacy.html">Privacy &amp; choices</a></p><div><button type="button" data-measurement-choice>Turn off measurement</button><button type="button" data-dismiss-notice aria-label="Dismiss privacy notice">Dismiss</button></div>';
    document.body.append(notice);
    document.querySelectorAll("[data-measurement-choice]").forEach((button) => button.addEventListener("click", () => {
      if (!savedOff()) off();
      else if (!hasGpc() && persist(false)) {
        if (blocked) location.reload();
        else decide();
      }
      render();
    }));
    notice.querySelector("[data-dismiss-notice]").addEventListener("click", () => {
      try { sessionStorage.setItem("delta_notice_seen", "yes"); } catch { /* Dismiss for this page. */ }
      notice.hidden = true;
    });
    render(); decide();
  };
  window.addEventListener("storage", (event) => { if (event.key === key && savedOff()) stop(); });
  window.addEventListener("pageshow", () => { if (hasGpc() || savedOff()) stop(); });
  window.addEventListener("focus", () => { if (hasGpc() || savedOff()) stop(); });
  document.addEventListener("visibilitychange", () => { if (hasGpc() || savedOff()) stop(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
