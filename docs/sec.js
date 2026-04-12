/* ============================================================
   docs/sec.js — FULL REPLACEMENT
   FIXES:
   - Read SEC payload from URL param OR localStorage
   - Persist payload back to localStorage
   - Render score / shots / windage / elevation / dial
   - Keep Baker vendor button working
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const vendorBtn = $("vendorBtn");

  const KEY_PAYLOAD     = "SCZN3_SEC_PAYLOAD_V1";
  const KEY_VENDOR_URL  = "SCZN3_VENDOR_URL_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";

  function getUrl() {
    try {
      return new URL(window.location.href);
    } catch {
      return null;
    }
  }

  function getParam(name) {
    const u = getUrl();
    return u ? (u.searchParams.get(name) || "") : "";
  }

  function decodePayloadFromQuery() {
    const raw = getParam("payload");
    if (!raw) return null;

    try {
      const json = decodeURIComponent(escape(atob(raw)));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function loadPayloadFromStorage() {
    try {
      const s = localStorage.getItem(KEY_PAYLOAD) || "";
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }

  function savePayload(payload) {
    try {
      localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload));
    } catch {}
  }

  function loadPayload() {
    const fromQuery = decodePayloadFromQuery();
    if (fromQuery) {
      savePayload(fromQuery);
      return fromQuery;
    }

    const fromStorage = loadPayloadFromStorage();
    if (fromStorage) return fromStorage;

    return null;
  }

  function isBaker(url) {
    return (url || "").toLowerCase().includes("baker");
  }

  function resolveVendor(payload) {
    let vendorUrl = String(payload?.vendorUrl || "");

    const vParam = getParam("v").toLowerCase();

    if (!vendorUrl && vParam === "baker") {
      vendorUrl = "https://baker-targets.com/";
    }

    if (!vendorUrl) {
      vendorUrl = String(localStorage.getItem(KEY_VENDOR_URL) || "");
    }

    if (!vendorUrl && vParam === "baker") {
      vendorUrl = "https://baker-targets.com/";
    }

    let vendorName =
      String(payload?.vendorName || "") ||
      String(localStorage.getItem(KEY_VENDOR_NAME) || "");

    if (!vendorName) {
      vendorName = isBaker(vendorUrl) ? "BAKER TARGETS" : "VENDOR";
    }

    payload.vendorUrl = vendorUrl;
    payload.vendorName = vendorName;

    return { vendorUrl, vendorName };
  }

  function setTextByIds(ids, value) {
    const text = String(value ?? "");
    ids.forEach((id) => {
      const el = $(id);
      if (el) el.textContent = text;
    });
  }

  function setHrefByIds(ids, href) {
    ids.forEach((id) => {
      const el = $(id);
      if (el) el.href = href;
    });
  }

  function fmtClicks(obj) {
    if (!obj) return "—";
    const dir = String(obj.dir || "").trim();
    const clicks = Number(obj.clicks);
    if (!Number.isFinite(clicks)) return "—";
    return `${clicks.toFixed(2)} ${dir}`;
  }

  function fmtDial(dial) {
    if (!dial) return "—";
    const unit = String(dial.unit || "");
    const clickValue = Number(dial.clickValue);
    if (!unit || !Number.isFinite(clickValue)) return "—";
    return `${clickValue.toFixed(2)} ${unit}`;
  }

  function getScoreBand(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return "";
    if (n >= 90) return "STRONG";
    if (n >= 60) return "SOLID";
    return "NEEDS WORK";
  }

  function renderNoData() {
    setTextByIds(
      [
        "scoreValue", "scoreNumber", "score", "secScore",
        "shotsValue", "shotCount", "shots",
        "windageValue", "windageText",
        "elevationValue", "elevationText",
        "dialValue", "dialText",
        "bandLabel", "scoreBand"
      ],
      "—"
    );

    setTextByIds(
      ["statusText", "secStatus", "emptyState", "reportStatus"],
      "SEC data not found"
    );

    document.body?.setAttribute("data-sec-state", "empty");
  }

  function renderPayload(payload) {
    const score = Number(payload?.score);
    const shots = Number(payload?.shots);

    const windageText = fmtClicks(payload?.windage);
    const elevationText = fmtClicks(payload?.elevation);
    const dialText = fmtDial(payload?.dial);
    const band = getScoreBand(score);

    if (Number.isFinite(score)) {
      setTextByIds(
        ["scoreValue", "scoreNumber", "score", "secScore"],
        String(Math.round(score))
      );
    }

    if (Number.isFinite(shots)) {
      setTextByIds(
        ["shotsValue", "shotCount", "shots"],
        String(shots)
      );
    }

    setTextByIds(
      ["windageValue", "windageText"],
      windageText
    );

    setTextByIds(
      ["elevationValue", "elevationText"],
      elevationText
    );

    setTextByIds(
      ["dialValue", "dialText"],
      dialText
    );

    setTextByIds(
      ["bandLabel", "scoreBand"],
      band
    );

    setTextByIds(
      ["statusText", "secStatus", "emptyState", "reportStatus"],
      "Results loaded"
    );

    document.body?.setAttribute("data-sec-state", "ready");
  }

  function wireVendor(payload) {
    const { vendorUrl, vendorName } = resolveVendor(payload);

    const vendorIds = ["vendorBtn", "vendorLink", "buyBtn"];
    const buttonText = isBaker(vendorUrl) ? "Visit Baker" : `Visit ${vendorName}`;

    if (vendorUrl && vendorUrl.startsWith("http")) {
      setHrefByIds(vendorIds, vendorUrl);

      vendorIds.forEach((id) => {
        const el = $(id);
        if (!el) return;
        el.textContent = buttonText;
        el.style.pointerEvents = "auto";
        el.style.opacity = "1";
      });
    } else {
      vendorIds.forEach((id) => {
        const el = $(id);
        if (!el) return;
        el.href = "#";
        el.textContent = "Vendor Not Set";
        el.style.pointerEvents = "none";
        el.style.opacity = ".6";
      });
    }

    if (vendorBtn && !vendorBtn.getAttribute("target")) {
      vendorBtn.setAttribute("target", "_blank");
      vendorBtn.setAttribute("rel", "noopener noreferrer");
    }
  }

  function render() {
    const payload = loadPayload();

    if (!payload) {
      renderNoData();
      return;
    }

    wireVendor(payload);
    renderPayload(payload);
  }

  render();
})();
