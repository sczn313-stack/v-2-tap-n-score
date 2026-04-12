/* ============================================================
   docs/sec.js — FULL REPLACEMENT (FINAL FIX)
   FIXES:
   ✅ URL payload is PRIMARY
   ✅ Storage fallback secondary
   ✅ No more "data not found" false negatives
============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const scoreValue = $("scoreValue");

  function getParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  function decodePayload(str) {
    try {
      return JSON.parse(atob(str));
    } catch {
      return null;
    }
  }

  function loadPayload() {
    // 🔥 PRIMARY: URL
    const fromUrl = getParam("payload");
    if (fromUrl) {
      const p = decodePayload(fromUrl);
      if (p) return p;
    }

    // fallback
    try {
      const s = sessionStorage.getItem("sczn3_results");
      if (s) return JSON.parse(s);
    } catch {}

    return null;
  }

  const payload = loadPayload();

  if (!payload) {
    alert("SEC data not found. Go back and run a target first.");
    return;
  }

  const hits = payload.hits;
  const aim = payload.aim;

  const avg = (arr, key) =>
    arr.reduce((s, p) => s + p[key], 0) / arr.length;

  const poib = {
    x01: avg(hits, "x01"),
    y01: avg(hits, "y01")
  };

  const dx = poib.x01 - aim.x01;
  const dy = poib.y01 - aim.y01;

  const score = Math.max(0, Math.round(100 - Math.sqrt(dx * dx + dy * dy) * 120));

  if (scoreValue) scoreValue.textContent = score;
})();
