(function () {
  "use strict";

  const PENDING_TARGET_PROFILE_KEY = "SCZN3_PENDING_TARGET_PROFILE";
  const BAKER_M4_SKU = "ST-M16A2/M4";
  const BAKER_M4_QR_URL = "https://tap-n-score.com/?v=baker&sku=ST-M16A2%2FM4";
  const BAKER_M4_IDENTITY = Object.freeze({
    vendor: "Baker",
    sku: BAKER_M4_SKU,
    product: "M4/M16 Series Weapons • 25M Zero Target",
    authority: "M4 Zeroing",
    qrUrl: BAKER_M4_QR_URL,
    qrAsset: "assets/BAKER_ST-M16A2-M4_QR.png",
    qr_id: BAKER_M4_SKU,
    qrId: BAKER_M4_SKU,
    target_profile_id: "m4_25m_zero",
    targetProfileId: "m4_25m_zero",
    mission_family: "zeroingCorrection",
    missionFamily: "zeroingCorrection",
    missionFamilyId: "zeroingCorrection",
    targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    targetVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    targetName: "M4/M16 Series Weapons 25M Zero",
    targetFamily: "Military 25 Meter M4 Zeroing Target",
    targetDistance: "25 m",
    targetDistanceValue: "25",
    targetDistanceUnit: "M",
    targetDistanceLocked: true
  });

  function canonicalVendor(value) {
    return String(value || "").trim().toLowerCase() === "baker" ? "Baker" : "";
  }

  function canonicalSku(value) {
    return String(value || "").trim() === BAKER_M4_SKU ? BAKER_M4_SKU : "";
  }

  function resolve(search) {
    const params = search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search || "");
    const vendor = canonicalVendor(params.get("v") || params.get("vendor"));
    const sku = canonicalSku(params.get("sku"));
    return vendor === "Baker" && sku === BAKER_M4_SKU
      ? { ...BAKER_M4_IDENTITY }
      : null;
  }

  function isM4(source) {
    const value = source && source.matrixSnapshot ? source.matrixSnapshot : source || {};
    return canonicalSku(value.sku) === BAKER_M4_SKU
      || String(value.target_profile_id || value.targetProfileId || "").toLowerCase() === "m4_25m_zero";
  }

  function preserve(source) {
    if (!isM4(source)) return source;
    const next = { ...(source || {}), ...BAKER_M4_IDENTITY };
    if (source && source.matrixSnapshot) {
      next.matrixSnapshot = { ...source.matrixSnapshot, ...BAKER_M4_IDENTITY };
    }
    if (source && source.targetAuthority) {
      next.targetAuthority = { ...source.targetAuthority, ...BAKER_M4_IDENTITY };
    }
    return next;
  }

  function targetProfileId(identity) {
    return String(identity && (identity.target_profile_id || identity.targetProfileId || identity.targetId) || "").trim();
  }

  function writePending(identity) {
    if (window.SCZN3TargetProfiles && window.SCZN3TargetProfiles.writePending !== writePending) {
      return window.SCZN3TargetProfiles.writePending(identity);
    }
    if (!identity) return;
    const targetId = targetProfileId(identity);
    if (!targetId) return;
    const encoded = JSON.stringify({ targetId });
    try {
      localStorage.setItem(PENDING_TARGET_PROFILE_KEY, encoded);
      sessionStorage.setItem(PENDING_TARGET_PROFILE_KEY, encoded);
    } catch (error) {}
  }

  function matrixUrl(identity = BAKER_M4_IDENTITY) {
    const params = new URLSearchParams({
      v: identity.vendor.toLowerCase(),
      sku: identity.sku,
      target_profile_id: identity.target_profile_id,
      targetName: identity.targetName
    });
    return `matrix.html?${params.toString()}`;
  }

  // Item 2 keeps the governed profile registry owned by platform_contracts.js.
  // Pending-profile navigation remains a compatibility helper here and never
  // reconstructs display identity from publisher or product strings.
  window.SCZN3TargetProfileNavigation = Object.freeze({
    PENDING_TARGET_PROFILE_KEY,
    targetProfileId,
    writePending
  });
  if (!window.SCZN3TargetProfiles) {
    window.SCZN3TargetProfiles = Object.freeze({
      PENDING_TARGET_PROFILE_KEY,
      targetProfileId,
      writePending
    });
  }

  window.SCZN3PartnerProducts = Object.freeze({
    BAKER_M4: Object.freeze({
      sku: BAKER_M4_SKU,
      qrUrl: BAKER_M4_QR_URL,
      identity: BAKER_M4_IDENTITY,
      resolve,
      matches: isM4,
      preserve,
      matrixUrl
    })
  });

  // Backward-compatible facade. Platform profile state and Baker product
  // resolution are owned by the separate namespaces above.
  window.SCZN3SmartTargetIdentity = Object.freeze({
    PENDING_TARGET_PROFILE_KEY,
    BAKER_M4_SKU,
    BAKER_M4_QR_URL,
    BAKER_M4_IDENTITY,
    resolve,
    isM4,
    preserve,
    writePending,
    matrixUrl
  });
})();
