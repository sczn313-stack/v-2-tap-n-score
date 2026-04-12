/* ============================================================
   docs/sec.js (FULL REPLACEMENT) — FIXED BAKER WIRING
   Purpose:
   - Vendor ALWAYS resolves (payload OR localStorage OR URL param)
   - Baker URL guaranteed when ?v=baker
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const vendorBtn = $("vendorBtn");

  const KEY_VENDOR_URL  = "SCZN3_VENDOR_URL_V1";
  const KEY_VENDOR_NAME = "SCZN3_VENDOR_NAME_V1";

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || "";
  }

  function isBaker(url) {
    return (url || "").toLowerCase().includes("baker");
  }

  function resolveVendor(payload) {
    let vendorUrl = String(payload?.vendorUrl || "");

    // 🔥 FORCE BAKER FROM URL PARAM
    const vParam = getParam("v").toLowerCase();
    if (!vendorUrl && vParam === "baker") {
      vendorUrl = "https://baker-targets.com/";
    }

    // fallback to storage
    if (!vendorUrl) {
      vendorUrl = String(localStorage.getItem(KEY_VENDOR_URL) || "");
    }

    // FINAL SAFETY — if still nothing but baker context
    if (!vendorUrl && vParam === "baker") {
      vendorUrl = "https://baker-targets.com/";
    }

    let vendorName = String(payload?.vendorName || "") 
                  || String(localStorage.getItem(KEY_VENDOR_NAME) || "");

    if (!vendorName) {
      vendorName = isBaker(vendorUrl) ? "BAKER TARGETS" : "VENDOR";
    }

    payload.vendorUrl = vendorUrl;
    payload.vendorName = vendorName;

    return { vendorUrl, vendorName };
  }

  function loadPayload() {
    const s = localStorage.getItem("SCZN3_SEC_PAYLOAD_V1") || "";
    try { return JSON.parse(s); } catch { return null; }
  }

  function render() {
    const payload = loadPayload();
    if (!payload) return;

    const { vendorUrl } = resolveVendor(payload);

    if (vendorBtn) {
      if (vendorUrl && vendorUrl.startsWith("http")) {
        vendorBtn.href = vendorUrl;
        vendorBtn.textContent = "Visit Baker";
        vendorBtn.style.pointerEvents = "auto";
        vendorBtn.style.opacity = "1";
      } else {
        vendorBtn.href = "#";
        vendorBtn.textContent = "Vendor Not Set";
        vendorBtn.style.pointerEvents = "none";
        vendorBtn.style.opacity = ".6";
      }
    }
  }

  render();
})();
