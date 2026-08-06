(function () {
  "use strict";

  const KEYS = {
    targetAuthority: "SCZN3_BAKER_TARGET_AUTHORITY",
    activeMatrix: "SCZN3_BAKER_ACTIVE_MATRIX",
    activeSession: "SCZN3_BAKER_ACTIVE_SESSION",
    sessionHistory: "SCZN3_BAKER_SESSION_HISTORY",
    sessionCounter: "SCZN3_BAKER_SESSION_COUNTER",
    activeZeroSession: "SCZN3_BAKER_ACTIVE_ZERO_SESSION",
    sessionRecordPrefix: "SCZN3_BAKER_SESSION_RECORD_",
    mediaPrefix: "SCZN3_BAKER_MEDIA_"
  };

  const TARGET_AUTHORITY = {
    targetFamily: "Baker 100 Yard Smart Target",
    targetVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
    doctrine: "Baker 100 yard smart target",
    asset: "assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"
  };
  const MAX_SESSION_HISTORY = 10;
  const SESSION_REF_SCHEMA = "sczn3-session-ref-v1";
  const SESSION_RECORD_SCHEMA = "sczn3-canonical-session-v1";

  function rawWrite(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function rawRead(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("SCZN3 Baker state read failed", key, error);
      return fallback;
    }
  }

  function serializedByteSize(value) {
    if (typeof TextEncoder === "function") {
      return new TextEncoder().encode(value).byteLength;
    }
    return value.length * 2;
  }

  function sessionRecordKey(sessionId) {
    return `${KEYS.sessionRecordPrefix}${encodeURIComponent(String(sessionId || ""))}`;
  }

  function mediaKey(mediaId) {
    return `${KEYS.mediaPrefix}${encodeURIComponent(String(mediaId || ""))}`;
  }

  function mediaIdForDataUrl(dataUrl) {
    let hash = 2166136261;
    for (let index = 0; index < dataUrl.length; index += 1) {
      hash ^= dataUrl.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `media-${(hash >>> 0).toString(16).padStart(8, "0")}-${dataUrl.length}`;
  }

  function compactMediaValue(value, mediaRecords) {
    if (Array.isArray(value)) return value.map(entry => compactMediaValue(entry, mediaRecords));
    if (!value || typeof value !== "object") return value;
    if (typeof value.dataUrl === "string" && /^data:/i.test(value.dataUrl)) {
      const mediaId = mediaIdForDataUrl(value.dataUrl);
      if (!mediaRecords.has(mediaId)) {
        mediaRecords.set(mediaId, {
          mediaId,
          dataUrl: value.dataUrl,
          name: value.name || "",
          type: value.type || value.dataUrl.slice(5, value.dataUrl.indexOf(";")) || "",
          size: value.size || value.dataUrl.length,
          originalSize: value.originalSize || null,
          savedAt: value.savedAt || null,
          evidenceType: value.evidenceType || null
        });
      }
      const reference = {};
      Object.entries(value).forEach(([key, child]) => {
        if (key !== "dataUrl") reference[key] = compactMediaValue(child, mediaRecords);
      });
      reference.mediaRef = mediaId;
      return reference;
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, compactMediaValue(child, mediaRecords)])
    );
  }

  function hydrateMediaValue(value) {
    if (Array.isArray(value)) return value.map(hydrateMediaValue);
    if (!value || typeof value !== "object") return value;
    if (value.mediaRef) {
      const media = rawRead(mediaKey(value.mediaRef), null);
      if (!media) return { ...value };
      const hydrated = { ...value, ...media };
      delete hydrated.mediaRef;
      delete hydrated.mediaId;
      return hydrated;
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, hydrateMediaValue(child)])
    );
  }

  function canonicalAuthorityPackage(session = {}) {
    return session.authorityPackage
      || session.m4AuthorityPackage
      || session.backendAuthorityPackage
      || session.ugeoAuthorityPackage
      || session.correctionData?.clicks?.authorityPackage
      || session.clicks?.authorityPackage
      || null;
  }

  function compactAuthorityPackage(authorityPackage, mediaRecords) {
    if (!authorityPackage || typeof authorityPackage !== "object") return null;
    const compact = compactMediaValue(authorityPackage, mediaRecords);
    if (compact.frontendRequest) {
      delete compact.frontendRequest;
      compact.frontendRequestRef = "inputs";
    }
    return compact;
  }

  function compactSessionRecord(session = {}) {
    const mediaRecords = new Map();
    const authorityPackage = canonicalAuthorityPackage(session);
    const skipped = new Set([
      "backendAuthorityPackage",
      "ugeoAuthorityPackage",
      "m4AuthorityPackage",
      "clicks",
      "correctionData",
      "authorityPackage"
    ]);
    const compact = {};
    Object.entries(session).forEach(([key, value]) => {
      if (!skipped.has(key)) compact[key] = compactMediaValue(value, mediaRecords);
    });
    if (authorityPackage) compact.authorityPackage = compactAuthorityPackage(authorityPackage, mediaRecords);
    if (session.confirmationAuthorityPackage) {
      compact.confirmationAuthorityPackage = compactAuthorityPackage(session.confirmationAuthorityPackage, mediaRecords);
    }
    compact.persistenceSchema = SESSION_RECORD_SCHEMA;
    return { compact, mediaRecords };
  }

  function derivedClicks(authorityPackage) {
    if (!authorityPackage || typeof authorityPackage !== "object") return null;
    if (!authorityPackage.clicks || authorityPackage.mechanicalValidation?.status !== "calculated") return null;
    const clicks = authorityPackage.clicks || {};
    const correction = authorityPackage.correction || {};
    return {
      ...clicks,
      elevation: correction.elevation,
      windage: correction.windage,
      poib: authorityPackage.poib
    };
  }

  function derivedCorrectionData(authorityPackage, session = {}) {
    if (!authorityPackage || typeof authorityPackage !== "object") {
      return {
        status: session.correctionStatus || "not-calculated",
        clicks: null
      };
    }
    return {
      status: authorityPackage.status && authorityPackage.status.hasCorrection
        ? "backend-authority-calculated"
        : (session.correctionStatus || "not-calculated"),
      clicks: derivedClicks(authorityPackage),
      correction: authorityPackage.correction || null,
      angular: authorityPackage.angular || null,
      moa: authorityPackage.moa || null,
      vectors: authorityPackage.vectors || null,
      aimPointDiscrepancy: authorityPackage.aimPointDiscrepancy || null,
      geometryValidation: authorityPackage.geometryValidation || null,
      mechanicalValidation: authorityPackage.mechanicalValidation || null,
      evidenceHash: authorityPackage.evidenceHash || null
    };
  }

  function runtimeAlias(target, key, getter) {
    if (!target || Object.prototype.hasOwnProperty.call(target, key)) return;
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      get: getter
    });
  }

  function hydrateAuthorityPackage(storedPackage) {
    if (!storedPackage || typeof storedPackage !== "object") return null;
    const authorityPackage = hydrateMediaValue(storedPackage);
    if (authorityPackage.frontendRequestRef === "inputs" && !authorityPackage.frontendRequest) {
      runtimeAlias(authorityPackage, "frontendRequest", () => authorityPackage.inputs || null);
    }
    return authorityPackage;
  }

  function isM4StoredSession(session = {}) {
    const source = session.matrixSnapshot || session;
    const profile = String(
      source.target_profile_id
      || source.targetProfileId
      || source.targetId
      || ""
    ).toLowerCase();
    const name = String(source.targetName || source.targetFamily || session.product || "").toLowerCase();
    if (profile) return profile === "m4_25m_zero" || (profile.includes("m4") && profile.includes("25"));
    return String(session.sku || source.sku || "") === "ST-M16A2/M4"
      || (profile.includes("m4") && profile.includes("25"))
      || (name.includes("m4") && name.includes("25"));
  }

  function hydrateSessionRecord(storedSession) {
    if (!storedSession || typeof storedSession !== "object") return storedSession;
    const session = hydrateMediaValue(storedSession);
    if (!session.authoritativeSessionId && !session.sessionIdAuthority) {
      session.sessionIdAuthority = "legacy-device-local";
      session.legacyDeviceLocalSession = true;
    }
    if (storedSession.authorityPackage) {
      session.authorityPackage = hydrateAuthorityPackage(storedSession.authorityPackage);
    }
    if (storedSession.confirmationAuthorityPackage) {
      session.confirmationAuthorityPackage = hydrateAuthorityPackage(storedSession.confirmationAuthorityPackage);
    }
    const authorityPackage = canonicalAuthorityPackage(session);
    if (authorityPackage) {
      session.authorityPackage = authorityPackage;
      runtimeAlias(session, "backendAuthorityPackage", () => session.authorityPackage);
      runtimeAlias(session, "ugeoAuthorityPackage", () => session.authorityPackage);
      if (isM4StoredSession(session)) {
        runtimeAlias(session, "m4AuthorityPackage", () => session.authorityPackage);
      }
      runtimeAlias(session, "clicks", () => derivedClicks(session.authorityPackage));
      runtimeAlias(session, "correctionData", () => derivedCorrectionData(session.authorityPackage, session));
    }
    return session;
  }

  function sessionReference(sessionId) {
    return {
      persistenceSchema: SESSION_REF_SCHEMA,
      sessionId
    };
  }

  function historyReference(session) {
    return {
      persistenceSchema: SESSION_REF_SCHEMA,
      sessionId: session.sessionId,
      sessionLabel: session.sessionLabel || "",
      sessionNumberAuthority: session.sessionNumberAuthority || "device-local-temporary",
      savedIdentifier: session.savedIdentifier || "",
      targetName: session.targetName || session.product || "",
      product: session.product || session.targetName || "",
      timestamp: session.timestamp || session.savedAt || session.createdAt || "",
      savedAt: session.savedAt || "",
      savedToSEC: session.savedToSEC === true,
      confirmationStatus: session.confirmationStatus || "Pending",
      workflowStage: session.workflowStage || ""
    };
  }

  function isSessionReference(value) {
    return !!(value && value.persistenceSchema === SESSION_REF_SCHEMA && value.sessionId);
  }

  function readCanonicalSession(sessionId) {
    return hydrateSessionRecord(rawRead(sessionRecordKey(sessionId), null));
  }

  function persistCanonicalSession(session, operation = "persist-canonical-session") {
    if (!session || !session.sessionId) return null;
    const originalSerialized = JSON.stringify(session);
    const { compact, mediaRecords } = compactSessionRecord(session);
    const storedMatrix = rawRead(KEYS.activeMatrix, null);
    const compactMatrix = storedMatrix ? compactMediaValue(storedMatrix, mediaRecords) : null;
    mediaRecords.forEach((media, mediaId) => {
      writeSaveDiagnostic(mediaKey(mediaId), media, `${operation}-media`);
    });
    writeSaveDiagnostic(sessionRecordKey(session.sessionId), compact, operation);
    if (compactMatrix) rawWrite(KEYS.activeMatrix, compactMatrix);
    window.__SCZN3_SESSION_NORMALIZATION_REPORT__ = {
      sessionId: session.sessionId,
      originalPayloadBytes: serializedByteSize(originalSerialized),
      canonicalRecordBytes: serializedByteSize(JSON.stringify(compact)),
      mediaAssetBytes: [...mediaRecords.values()]
        .reduce((sum, media) => sum + serializedByteSize(JSON.stringify(media)), 0),
      mediaAssetCount: mediaRecords.size,
      completedAt: nowStamp()
    };
    try {
      if (typeof document === "undefined" || !document.documentElement) return hydrateSessionRecord(compact);
      document.documentElement.setAttribute(
        "data-sczn3-session-normalization-report",
        JSON.stringify(window.__SCZN3_SESSION_NORMALIZATION_REPORT__)
      );
    } catch (diagnosticError) {
      console.warn("SCZN3 normalization diagnostic publication failed", diagnosticError);
    }
    return hydrateSessionRecord(compact);
  }

  function ensureCanonicalHistory(sessions, operation = "migrate-history-session") {
    return sessions.map(session => {
      if (!session || !session.sessionId) return null;
      return readCanonicalSession(session.sessionId)
        || persistCanonicalSession(session, operation);
    }).filter(Boolean);
  }

  function storeMediaReferences(value) {
    const mediaRecords = new Map();
    const compact = compactMediaValue(value, mediaRecords);
    mediaRecords.forEach((media, mediaId) => rawWrite(mediaKey(mediaId), media));
    return compact;
  }

  function hydrateStoredMedia(value) {
    return hydrateMediaValue(value);
  }

  function write(key, value) {
    if (key === KEYS.activeMatrix) {
      const compact = storeMediaReferences(value);
      rawWrite(key, compact);
      return hydrateMediaValue(compact);
    }
    if ((key === KEYS.activeSession || key === KEYS.activeZeroSession) && value && value.sessionId && !isSessionReference(value)) {
      const session = persistCanonicalSession(value, `write-${key}`);
      rawWrite(key, sessionReference(value.sessionId));
      return session;
    }
    if (key === KEYS.sessionHistory && Array.isArray(value)) {
      const sessions = ensureCanonicalHistory(value, "write-session-history-record");
      rawWrite(key, sessions.slice(0, MAX_SESSION_HISTORY).map(historyReference));
      return sessions;
    }
    return rawWrite(key, value);
  }

  function approximateLocalStorageUsage() {
    let characters = 0;
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index) || "";
        const value = localStorage.getItem(key) || "";
        characters += key.length + value.length;
      }
    } catch (error) {
      return {
        bytes: null,
        readable: false,
        exceptionName: error && error.name || "Error",
        exceptionMessage: error && error.message || String(error)
      };
    }
    return {
      bytes: characters * 2,
      readable: true
    };
  }

  function publishSaveDiagnostic(record) {
    window.__SCZN3_SAVE_PERSISTENCE_DIAGNOSTIC__ = record;
    const records = Array.isArray(window.__SCZN3_SAVE_PERSISTENCE_DIAGNOSTICS__)
      ? window.__SCZN3_SAVE_PERSISTENCE_DIAGNOSTICS__
      : [];
    window.__SCZN3_SAVE_PERSISTENCE_DIAGNOSTICS__ = [...records, record].slice(-12);
    try {
      if (typeof document === "undefined" || !document.documentElement) return;
      document.documentElement.setAttribute(
        "data-sczn3-save-persistence-diagnostic",
        JSON.stringify(record)
      );
      document.documentElement.setAttribute(
        "data-sczn3-save-persistence-diagnostics",
        JSON.stringify(window.__SCZN3_SAVE_PERSISTENCE_DIAGNOSTICS__)
      );
    } catch (diagnosticError) {
      console.warn("SCZN3 save diagnostic publication failed", diagnosticError);
    }
  }

  function savePayloadCategory(fieldName) {
    if (/image|photo|dataurl|assetcontent/i.test(fieldName)) return "target/evidence image data";
    if (/shot|impact|aimpoint|mark|evidence/i.test(fieldName)) return "shot evidence";
    if (/authority/i.test(fieldName)) return "authority package";
    if (/correction|click|moa|mrad|poib/i.test(fieldName)) return "correction package";
    if (/matrix|registry|targetprofile|profile|target/i.test(fieldName)) return "target registry/profile data";
    return "session metadata";
  }

  function analyzeSavePayload(value, serialized) {
    const topLevelFields = [];
    const categoryBytes = {};
    const largeValues = [];
    const repeatedCandidates = new Map();
    const assetContent = [];
    const seen = new WeakSet();

    Object.entries(value || {}).forEach(([field, fieldValue]) => {
      const fieldSerialized = JSON.stringify(fieldValue);
      const bytes = serializedByteSize(fieldSerialized === undefined ? "null" : fieldSerialized);
      const category = savePayloadCategory(field);
      categoryBytes[category] = (categoryBytes[category] || 0) + bytes;
      topLevelFields.push({ path: field, bytes, category });
    });

    function inspect(node, path, depth) {
      if (node === null || node === undefined || depth > 7) return;
      if (typeof node === "string") {
        const bytes = serializedByteSize(JSON.stringify(node));
        if (bytes >= 1024) {
          largeValues.push({ path, bytes, type: "string" });
          const signature = `${node.length}:${node.slice(0, 96)}:${node.slice(-96)}`;
          const duplicate = repeatedCandidates.get(signature) || {
            bytes,
            count: 0,
            paths: []
          };
          duplicate.count += 1;
          duplicate.paths.push(path);
          repeatedCandidates.set(signature, duplicate);
        }
        if (/^data:/i.test(node)) {
          assetContent.push({
            path,
            bytes,
            type: node.slice(0, Math.max(0, node.indexOf(","))).slice(0, 120) || "data URL"
          });
        } else if (/<svg[\s>]/i.test(node)) {
          assetContent.push({ path, bytes, type: "embedded SVG" });
        }
        return;
      }
      if (typeof node !== "object" || seen.has(node)) return;
      seen.add(node);
      Object.entries(node).forEach(([key, child]) => {
        const childPath = path ? `${path}.${key}` : key;
        if (child && typeof child === "object") {
          const childSerialized = JSON.stringify(child);
          const bytes = serializedByteSize(childSerialized);
          if (bytes >= 1024) {
            largeValues.push({ path: childPath, bytes, type: Array.isArray(child) ? "array" : "object" });
            const signature = `${childSerialized.length}:${childSerialized.slice(0, 96)}:${childSerialized.slice(-96)}`;
            const duplicate = repeatedCandidates.get(signature) || {
              bytes,
              count: 0,
              paths: []
            };
            duplicate.count += 1;
            duplicate.paths.push(childPath);
            repeatedCandidates.set(signature, duplicate);
          }
        }
        inspect(child, childPath, depth + 1);
      });
    }

    inspect(value, "", 0);
    const duplicatedValues = [...repeatedCandidates.values()]
      .filter(entry => entry.count > 1)
      .map(entry => ({
        bytesEach: entry.bytes,
        count: entry.count,
        duplicatedBytes: entry.bytes * (entry.count - 1),
        paths: entry.paths
      }))
      .sort((a, b) => b.duplicatedBytes - a.duplicatedBytes)
      .slice(0, 10);

    return {
      serializedPayloadBytes: serializedByteSize(serialized),
      categoryBytes: Object.entries(categoryBytes)
        .map(([category, bytes]) => ({ category, bytes }))
        .sort((a, b) => b.bytes - a.bytes),
      topLevelFields: topLevelFields.sort((a, b) => b.bytes - a.bytes).slice(0, 20),
      largestNestedFields: largeValues.sort((a, b) => b.bytes - a.bytes).slice(0, 20),
      embeddedAssetContent: assetContent.sort((a, b) => b.bytes - a.bytes).slice(0, 10),
      duplicatedLargeValues: duplicatedValues
    };
  }

  function writeSaveDiagnostic(key, value, operation) {
    const serialized = JSON.stringify(value);
    const attemptedPayloadBytes = serializedByteSize(serialized);
    const currentUsage = approximateLocalStorageUsage();
    const attempt = {
      operation,
      key,
      attemptedPayloadBytes,
      approximateLocalStorageUsageBytes: currentUsage.bytes,
      localStorageReadable: currentUsage.readable,
      startedAt: nowStamp()
    };
    console.info("SCZN3 save persistence write", attempt);
    try {
      localStorage.setItem(key, serialized);
      const success = {
        ...attempt,
        ok: true,
        completedAt: nowStamp()
      };
      publishSaveDiagnostic(success);
      console.info("SCZN3 save persistence success", success);
      return value;
    } catch (error) {
      const failure = {
        ...attempt,
        ok: false,
        exceptionName: error && error.name || "Error",
        exceptionMessage: error && error.message || String(error),
        payloadComposition: analyzeSavePayload(value, serialized),
        failedAt: nowStamp()
      };
      publishSaveDiagnostic(failure);
      console.error("SCZN3 save persistence failure", failure);
      throw error;
    }
  }

  function read(key, fallback = null) {
    const stored = rawRead(key, fallback);
    if (key === KEYS.activeMatrix) {
      if (stored && JSON.stringify(stored).includes("\"dataUrl\":\"data:")) {
        const compact = storeMediaReferences(stored);
        rawWrite(key, compact);
        return hydrateMediaValue(compact);
      }
      return hydrateMediaValue(stored);
    }
    if (key === KEYS.activeSession || key === KEYS.activeZeroSession) {
      if (isSessionReference(stored)) return readCanonicalSession(stored.sessionId) || fallback;
      return hydrateSessionRecord(stored);
    }
    if (key === KEYS.sessionHistory && Array.isArray(stored)) {
      return stored.map(entry => {
        if (!isSessionReference(entry)) return hydrateSessionRecord(entry);
        return readCanonicalSession(entry.sessionId) || entry;
      }).filter(Boolean);
    }
    return stored;
  }

  function display(value, fallback = "--") {
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  function cleanProfileValue(value) {
    return /^(Select Manufacturer|Select Model Type|Select Model Caliber|Select Caliber|Select Gauge|Select Load|Select Grain)$/i.test(value || "") ? "" : display(value, "");
  }

  function weaponProfileDisplay(source = {}) {
    const model = cleanProfileValue(source.weaponCatalogModel) || cleanProfileValue(source.weaponModelCaliber);
    const caliber = cleanProfileValue(source.weaponCatalogCaliber) || cleanProfileValue(source.ammoCaliber) || cleanProfileValue(source.caliber);
    const manufacturer = cleanProfileValue(source.weaponCatalogManufacturer) || cleanProfileValue(source.weaponManufacturer);
    const category = cleanProfileValue(source.weaponCategory);
    const modelType = cleanProfileValue(source.weaponModelType);
    const modelLine = [manufacturer, model || modelType || category].filter(Boolean).join(" ");
    const summary = [category, manufacturer, model || modelType, caliber && model !== caliber ? caliber : ""].filter(Boolean).join(" / ");
    return {
      summary: summary || cleanProfileValue(source.rifle) || "Weapon profile not selected",
      short: modelLine || cleanProfileValue(source.rifle) || "Weapon Profile",
      caliber: caliber || cleanProfileValue(source.weaponModelCaliber) || "Caliber not set",
      frameCategory: cleanProfileValue(source.weaponFrameCategory),
      barrelLength: cleanProfileValue(source.barrelLength),
      sightRadius: cleanProfileValue(source.weaponSightRadius),
      variantFlags: cleanProfileValue(source.weaponVariantFlags),
      notes: cleanProfileValue(source.weaponCatalogNotes)
    };
  }

  function formatSessionNumber(number) {
    return `Session #${String(number || 0).padStart(3, "0")}`;
  }

  function nowStamp() {
    return new Date().toISOString();
  }

  function getSessionHistory() {
    return read(KEYS.sessionHistory, []);
  }

  function getLastSession() {
    return getSessionHistory()[0] || read(KEYS.activeSession, null);
  }

  function getLastConfirmedZero() {
    return getSessionHistory().find(session => session.confirmationStatus === "Confirmed") || null;
  }

  function getActiveMatrix() {
    const active = read(KEYS.activeMatrix, null);
    if (active) return active;
    const last = getLastSession();
    return last && last.matrixSnapshot ? last.matrixSnapshot : null;
  }

  function saveMatrixSnapshot(snapshot) {
    return write(KEYS.activeMatrix, {
      ...TARGET_AUTHORITY,
      ...snapshot,
      updatedAt: nowStamp()
    });
  }

  function getNextSessionNumber() {
    const next = Number(read(KEYS.sessionCounter, 0)) + 1;
    write(KEYS.sessionCounter, next);
    return next;
  }

  function cleanDistanceUnit(unit) {
    return String(unit || "").toUpperCase() === "M" ? "M" : "YDS";
  }

  function distanceUnitLabel(unit) {
    return cleanDistanceUnit(unit) === "M" ? "m" : "yds";
  }

  function distanceNumber(value, fallback = 100) {
    const match = String(value || "").match(/[\d.]+/);
    const number = match ? Number(match[0]) : Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function targetProfileIdFrom(source = {}) {
    return source.target_profile_id || source.targetProfileId || source.targetId || "";
  }

  function missionFamilyFrom(source = {}) {
    return source.mission_family || source.missionFamily || source.missionFamilyId || "";
  }

  function isM4DistanceGovernedTarget(source = {}) {
    const targetProfileId = String(targetProfileIdFrom(source)).toLowerCase();
    const targetName = String(source.targetName || source.targetFamily || "").toLowerCase();
    return (targetProfileId.includes("m4") && targetProfileId.includes("25"))
      || (targetName.includes("m4") && targetName.includes("25"));
  }

  function activeSessionDistance(source = {}, existingSession = null) {
    if (isM4DistanceGovernedTarget(source)) {
      return {
        value: 25,
        unit: "M",
        display: "25 m",
        source: "atp",
        locked: true,
        targetProfileId: targetProfileIdFrom(source),
        reason: "m4_25_meter_zero_atp"
      };
    }
    const existing = existingSession && existingSession.sessionDistance;
    if (existing && Number.isFinite(Number(existing.value))) {
      const unit = cleanDistanceUnit(existing.unit);
      const value = distanceNumber(existing.value);
      return {
        ...existing,
        value,
        unit,
        display: existing.display || `${value} ${distanceUnitLabel(unit)}`,
        source: existing.source || "session",
        locked: existing.locked === true
      };
    }
    const rawValue = source.targetDistanceValue || source.targetDistance || source.distance;
    const unit = cleanDistanceUnit(source.targetDistanceUnit || (/m(eters?)?$/i.test(String(rawValue || "")) ? "M" : "YDS"));
    const value = distanceNumber(rawValue, 100);
    return {
      value,
      unit,
      display: `${value} ${distanceUnitLabel(unit)}`,
      source: source.targetDistanceSource || "weapon_profile",
      locked: source.targetDistanceLocked === true,
      targetProfileId: targetProfileIdFrom(source)
    };
  }

  function buildActiveCalculationContext(source = {}, existingSession = null) {
    const sessionDistance = activeSessionDistance(source, existingSession);
    const angularUnit = String(source.opticAdjustmentUnit || source.adjustmentUnit || "MOA").toUpperCase() === "MRAD" ? "MRAD" : "MOA";
    const clickValue = Number(
      source.opticClickValue
      || source.clickValue
      || (angularUnit === "MRAD" ? source.opticClickValueMRAD || source.clickValueMRAD : source.opticClickValueMOA || source.clickValueMOA)
      || (angularUnit === "MRAD" ? 0.1 : 0.25)
    );
    return {
      contextVersion: "active-calculation-context-v1",
      target_profile_id: targetProfileIdFrom(source),
      targetProfileId: targetProfileIdFrom(source),
      mission_family: missionFamilyFrom(source),
      missionFamilyId: missionFamilyFrom(source),
      sessionDistance,
      establishedZero: source.establishedZero || existingSession?.establishedZero || null,
      angularUnit,
      clickValue: Number.isFinite(clickValue) && clickValue > 0 ? clickValue : (angularUnit === "MRAD" ? 0.1 : 0.25),
      clickValueSource: "weapon_profile",
      authorityStatus: "context-attached"
    };
  }

  function buildSession(matrixSnapshot) {
    const sessionNumber = getNextSessionNumber();
    const timestamp = nowStamp();
    const targetIdentity = {
      vendor: matrixSnapshot.vendor || "",
      sku: matrixSnapshot.sku || "",
      product: matrixSnapshot.product || "",
      authority: matrixSnapshot.authority || "",
      target_profile_id: matrixSnapshot.target_profile_id || matrixSnapshot.targetProfileId || matrixSnapshot.targetId || "",
      targetProfileId: matrixSnapshot.targetProfileId || matrixSnapshot.target_profile_id || matrixSnapshot.targetId || "",
      mission_family: matrixSnapshot.mission_family || matrixSnapshot.missionFamily || matrixSnapshot.missionFamilyId || "",
      missionFamilyId: matrixSnapshot.missionFamilyId || matrixSnapshot.mission_family || matrixSnapshot.missionFamily || "",
      targetId: matrixSnapshot.targetId || matrixSnapshot.target_profile_id || matrixSnapshot.targetProfileId || "",
      targetName: matrixSnapshot.targetName || "",
      targetFamily: matrixSnapshot.targetFamily || matrixSnapshot.targetName || ""
    };
    const hasMissionIdentity = !!(targetIdentity.target_profile_id || targetIdentity.mission_family || targetIdentity.targetName);
    const targetAuthority = hasMissionIdentity
      ? {
        ...targetIdentity,
        authorityStatus: matrixSnapshot.authorityStatus || "profile-selected"
      }
      : { ...TARGET_AUTHORITY };
    const activeCalculationContext = buildActiveCalculationContext(matrixSnapshot, null);
    return {
      sessionId: `baker-session-${String(sessionNumber).padStart(3, "0")}-${Date.now()}`,
      sessionNumber,
      sessionLabel: formatSessionNumber(sessionNumber),
      sessionNumberAuthority: "device-local-temporary",
      timestamp,
      createdAt: timestamp,
      ...(hasMissionIdentity ? targetIdentity : {}),
      matrixSnapshot: {
        ...TARGET_AUTHORITY,
        ...matrixSnapshot,
        ...(hasMissionIdentity ? targetIdentity : {}),
        frozenAt: timestamp
      },
      targetAuthority,
      activeCalculationContext,
      sessionDistance: activeCalculationContext.sessionDistance,
      shotData: {
        status: "not-started",
        group: [],
        poib: null,
        score: 0,
        hits: 0,
        shotCount: 0
      },
      correctionData: {
        windage: null,
        elevation: null,
        clicks: null,
        status: "pending"
      },
      confirmationStatus: "Pending",
      distanceProgressionStatus: "25m zero session",
      notes: matrixSnapshot.shooterNotes || matrixSnapshot.environmentalNotes || ""
    };
  }

  function createSession(matrixSnapshot) {
    const frozenMatrix = saveMatrixSnapshot(matrixSnapshot);
    const session = buildSession(frozenMatrix);
    session.sessionIdAuthority = "legacy-device-local";
    session.legacyDeviceLocalSession = true;
    const canonical = persistCanonicalSession(session, "create-canonical-session");
    const history = ensureCanonicalHistory([canonical, ...getSessionHistory()]
      .filter((item, index, source) => item && source.findIndex(candidate => candidate.sessionId === item.sessionId) === index)
      .slice(0, MAX_SESSION_HISTORY), "migrate-create-history-session");
    rawWrite(KEYS.activeSession, sessionReference(session.sessionId));
    if (frozenMatrix.experienceMode !== "simulation") {
      rawWrite(KEYS.activeZeroSession, sessionReference(session.sessionId));
    }
    rawWrite(KEYS.sessionHistory, history.map(historyReference));
    return canonical;
  }

  function createAuthoritativeSession(authorityPackage, matrixSnapshot) {
    if (!authorityPackage || authorityPackage.ok !== true || !authorityPackage.authoritativeSessionId) {
      throw new Error("A backend-issued session is required.");
    }
    const target = authorityPackage.target || {};
    const mission = authorityPackage.missionIdentity || {};
    const distance = authorityPackage.governedDistance || {};
    const selectedEquipment = authorityPackage.selectedEquipment || {};
    const standardSetup = selectedEquipment.source === "backend_standard_setup" ? {
      setupId: "",
      setupName: "Standard Setup",
      weaponCategory: selectedEquipment.weaponCategory || "",
      weaponManufacturer: selectedEquipment.manufacturer || "",
      weaponModelType: selectedEquipment.modelType || "",
      weaponModelCaliber: selectedEquipment.modelCaliber || "",
      opticType: selectedEquipment.opticType || "",
      opticAdjustmentUnit: selectedEquipment.adjustmentUnit || "",
      opticClickValue: selectedEquipment.clickValue || "",
      adjustmentSystem: selectedEquipment.adjustmentSystem || "",
      equipmentAuthorityRecordId: selectedEquipment.equipmentAuthorityRecordId || "",
      axisAdjustment: selectedEquipment.axisAdjustment || {},
      setupAuthority: selectedEquipment.setupAuthority || "backend-target-authority",
      setupAuthorityId: selectedEquipment.setupAuthorityId || "",
      setupMode: "standard"
    } : {};
    const authoritySnapshot = {
      ...matrixSnapshot,
      ...standardSetup,
      target_profile_id: target.targetId || "",
      targetProfileId: target.targetId || "",
      targetId: target.targetAuthorityId || target.targetId || "",
      targetName: target.targetName || matrixSnapshot.targetName || "",
      targetProfileVersion: target.targetProfileVersion || "",
      atpId: target.atpId || "",
      mission_family: mission.missionFamily || "",
      missionFamily: mission.missionFamily || "",
      missionFamilyId: mission.missionFamily || "",
      missionId: mission.missionId || "",
      resultPackageType: mission.resultPackageType || "",
      targetDistanceValue: distance.value === null || distance.value === undefined
        ? matrixSnapshot.targetDistanceValue
        : String(distance.value),
      targetDistanceUnit: distance.unit || matrixSnapshot.targetDistanceUnit || "",
      targetDistanceLocked: distance.locked === true,
      sessionAuthorityOwner: "backend"
    };
    const frozenMatrix = saveMatrixSnapshot(authoritySnapshot);
    const session = buildSession(frozenMatrix);
    session.sessionId = authorityPackage.authoritativeSessionId;
    session.authoritativeSessionId = authorityPackage.authoritativeSessionId;
    session.sessionIdAuthority = "backend";
    session.legacyDeviceLocalSession = false;
    session.sessionLifecycle = authorityPackage.sessionLifecycle || "created";
    session.backendSessionAuthority = authorityPackage;
    session.targetProfileVersion = target.targetProfileVersion || "";
    session.atpId = target.atpId || "";
    session.targetAuthority = {
      ...session.targetAuthority,
      targetId: target.targetAuthorityId || target.targetId || "",
      target_profile_id: target.targetId || "",
      targetProfileId: target.targetId || "",
      targetProfileVersion: target.targetProfileVersion || "",
      atpId: target.atpId || "",
      mission_family: mission.missionFamily || "",
      missionFamilyId: mission.missionFamily || "",
      authorityStatus: "backend-session-authority"
    };
    if (distance.value !== null && distance.value !== undefined) {
      session.sessionDistance = {
        value: Number(distance.value),
        unit: distance.unit || "YDS",
        display: `${distance.value} ${distance.unit === "M" ? "m" : "yds"}`,
        source: "backend-atp",
        locked: distance.locked === true,
        targetProfileId: target.targetId || ""
      };
      session.activeCalculationContext = {
        ...session.activeCalculationContext,
        sessionDistance: session.sessionDistance,
        mission_family: mission.missionFamily || "",
        missionFamilyId: mission.missionFamily || "",
        authorityStatus: "backend-session-authority"
      };
    }
    const canonical = persistCanonicalSession(session, "create-authoritative-session");
    const history = ensureCanonicalHistory([canonical, ...getSessionHistory()]
      .filter((item, index, source) => item && source.findIndex(candidate => candidate.sessionId === item.sessionId) === index)
      .slice(0, MAX_SESSION_HISTORY), "migrate-authoritative-history-session");
    rawWrite(KEYS.activeSession, sessionReference(session.sessionId));
    if (frozenMatrix.experienceMode !== "simulation") {
      rawWrite(KEYS.activeZeroSession, sessionReference(session.sessionId));
    }
    rawWrite(KEYS.sessionHistory, history.map(historyReference));
    return canonical;
  }

  function replaceSession(updatedSession) {
    const history = getSessionHistory();
    const canonical = persistCanonicalSession(updatedSession, "persist-canonical-session");
    const nextHistory = history.some(session => session.sessionId === canonical.sessionId)
      ? history.map(session => session.sessionId === canonical.sessionId ? canonical : session)
      : [canonical, ...history].slice(0, MAX_SESSION_HISTORY);
    const canonicalHistory = ensureCanonicalHistory(nextHistory, "migrate-save-history-session");
    writeSaveDiagnostic(KEYS.sessionHistory, canonicalHistory.map(historyReference), "persist-session-history-references");
    writeSaveDiagnostic(KEYS.activeSession, sessionReference(canonical.sessionId), "persist-active-session-reference");
    if (canonical.experienceMode !== "simulation") {
      writeSaveDiagnostic(KEYS.activeZeroSession, sessionReference(canonical.sessionId), "persist-active-zero-session-reference");
    }
    return canonical;
  }

  function updateActiveSession(patch) {
    const active = read(KEYS.activeSession, null);
    if (!active) return null;
    return replaceSession({
      ...active,
      ...patch,
      updatedAt: nowStamp()
    });
  }

  function attachCorrection(correctionData) {
    const active = read(KEYS.activeSession, null);
    if (!active) return null;
    return replaceSession({
      ...active,
      correctionData: {
        ...(active.correctionData || {}),
        ...correctionData,
        status: "saved",
        savedAt: nowStamp()
      },
      updatedAt: nowStamp()
    });
  }

  function confirmActiveZero(notes = "") {
    const active = read(KEYS.activeSession, null);
    if (!active) return null;
    return replaceSession({
      ...active,
      confirmationStatus: "Confirmed",
      confirmedAt: nowStamp(),
      confirmationNotes: notes,
      updatedAt: nowStamp()
    });
  }

  function saveTargetEvidenceImage(imageData) {
    const active = read(KEYS.activeSession, null);
    if (!active) return null;
    return replaceSession({
      ...active,
      targetEvidenceImage: {
        ...imageData,
        savedAt: nowStamp(),
        evidenceType: "uploaded-target-image"
      },
      updatedAt: nowStamp()
    });
  }

  function clearTargetEvidenceImage() {
    const active = read(KEYS.activeSession, null);
    if (!active) return null;
    const next = { ...active, updatedAt: nowStamp() };
    delete next.targetEvidenceImage;
    next.aimPoint = null;
    next.impactPoints = [];
    next.shotData = {
      ...(active.shotData || {}),
      aimPoint: null,
      impactPoints: [],
      shotCount: 0,
      hits: 0,
      score: 0,
      status: "evidence-cleared",
      savedAt: nowStamp()
    };
    return replaceSession(next);
  }

  const UGEO = (() => {
    const geometry = {
      imageWidth: 1102,
      imageHeight: 1713,
      gridLeftPx: 68,
      gridTopPx: 282,
      gridRightPx: 1047,
      gridBottomPx: 1652,
      squarePx: 49
    };

    function normalizePoint(point) {
      if (!point) return null;
      const x = Number(point.xPercent);
      const y = Number(point.yPercent);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return {
        xPercent: Math.max(0, Math.min(100, x)),
        yPercent: Math.max(0, Math.min(100, y))
      };
    }

    function imagePercentToPixels(point) {
      const safe = normalizePoint(point);
      if (!safe) return null;
      return {
        xPx: (safe.xPercent / 100) * geometry.imageWidth,
        yPx: (safe.yPercent / 100) * geometry.imageHeight
      };
    }

    function imagePercentToGridCoordinate(point) {
      const px = imagePercentToPixels(point);
      if (!px) return null;
      return {
        xInches: Number(((px.xPx - geometry.gridLeftPx) / geometry.squarePx).toFixed(4)),
        yInches: Number(((px.yPx - geometry.gridTopPx) / geometry.squarePx).toFixed(4))
      };
    }

    function gridCoordinateToImagePercent(gridPoint) {
      if (!gridPoint) return null;
      const xInches = Number(gridPoint.xInches);
      const yInches = Number(gridPoint.yInches);
      if (!Number.isFinite(xInches) || !Number.isFinite(yInches)) return null;
      return normalizePoint({
        xPercent: ((geometry.gridLeftPx + (xInches * geometry.squarePx)) / geometry.imageWidth) * 100,
        yPercent: ((geometry.gridTopPx + (yInches * geometry.squarePx)) / geometry.imageHeight) * 100
      });
    }

    function imagePointThroughGrid(point) {
      return gridCoordinateToImagePercent(imagePercentToGridCoordinate(point));
    }

    function displayedImageContentBox(image, frame) {
      if (!image || !frame) return null;
      const imageRect = image.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      if (!imageRect.width || !imageRect.height) return null;
      const style = window.getComputedStyle ? window.getComputedStyle(image) : null;
      const borderLeft = style ? Number.parseFloat(style.borderLeftWidth) || 0 : 0;
      const borderRight = style ? Number.parseFloat(style.borderRightWidth) || 0 : 0;
      const borderTop = style ? Number.parseFloat(style.borderTopWidth) || 0 : 0;
      const borderBottom = style ? Number.parseFloat(style.borderBottomWidth) || 0 : 0;
      const paddingLeft = style ? Number.parseFloat(style.paddingLeft) || 0 : 0;
      const paddingRight = style ? Number.parseFloat(style.paddingRight) || 0 : 0;
      const paddingTop = style ? Number.parseFloat(style.paddingTop) || 0 : 0;
      const paddingBottom = style ? Number.parseFloat(style.paddingBottom) || 0 : 0;
      const contentLeft = imageRect.left + borderLeft + paddingLeft;
      const contentTop = imageRect.top + borderTop + paddingTop;
      const contentWidth = Math.max(0, imageRect.width - borderLeft - borderRight - paddingLeft - paddingRight);
      const contentHeight = Math.max(0, imageRect.height - borderTop - borderBottom - paddingTop - paddingBottom);
      if (!contentWidth || !contentHeight) return null;
      const naturalWidth = image.naturalWidth || imageRect.width || 1;
      const naturalHeight = image.naturalHeight || imageRect.height || 1;
      const naturalRatio = naturalWidth / naturalHeight;
      const elementRatio = contentWidth / contentHeight;
      let width = contentWidth;
      let height = contentHeight;
      let left = contentLeft;
      let top = contentTop;
      if (elementRatio > naturalRatio) {
        width = contentHeight * naturalRatio;
        left = contentLeft + ((contentWidth - width) / 2);
      } else {
        height = contentWidth / naturalRatio;
        top = contentTop + ((contentHeight - height) / 2);
      }
      return {
        naturalWidth,
        naturalHeight,
        left: left - frameRect.left,
        top: top - frameRect.top,
        width,
        height,
        pageLeft: left,
        pageTop: top
      };
    }

    function syncEvidenceLayerToImage(layer, image, frame) {
      const box = displayedImageContentBox(image, frame || (layer && layer.parentElement));
      if (!layer || !box) return null;
      layer.style.left = `${box.left}px`;
      layer.style.top = `${box.top}px`;
      layer.style.width = `${box.width}px`;
      layer.style.height = `${box.height}px`;
      return box;
    }

    function pointStyle(point) {
      const safe = imagePointThroughGrid(point);
      return safe ? `left:${safe.xPercent}%;top:${safe.yPercent}%` : "";
    }

    function renderPoint(className, point, content = "", attributes = "", styleExtra = "") {
      const style = pointStyle(point);
      if (!style) return "";
      const extra = styleExtra ? `;${styleExtra}` : "";
      return `<span class="${className}" style="${style}${extra}"${attributes ? ` ${attributes}` : ""}>${content}</span>`;
    }

    function renderImpacts(points, className, options = {}) {
      const impacts = Array.isArray(points) ? points : [];
      return impacts.map((point, index) => {
        const content = options.numbered ? String(index + 1) : "";
        return renderPoint(className, point, content, options.attributes || "", options.styleExtra || "");
      }).join("");
    }

    function vectorCoordinates(start, end) {
      const startPoint = imagePointThroughGrid(start);
      const endPoint = imagePointThroughGrid(end);
      if (!startPoint || !endPoint) return null;
      return { start: startPoint, end: endPoint };
    }

    function renderVector(start, end, options = {}) {
      const vector = vectorCoordinates(start, end);
      if (!vector) return "";
      const marker = options.markerId ? ` marker-end="url(#${options.markerId})"` : "";
      const markerDef = options.markerDef || "";
      const attrs = options.lineAttributes ? ` ${options.lineAttributes}` : "";
      return `<svg class="${options.svgClass || "ugeo-vector"}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${markerDef}<line x1="${vector.start.xPercent}" y1="${vector.start.yPercent}" x2="${vector.end.xPercent}" y2="${vector.end.yPercent}"${attrs}${marker}></line></svg>`;
    }

    function vectorAngle(start, end) {
      const vector = vectorCoordinates(start, end);
      if (!vector) return -45;
      return Math.atan2(vector.end.yPercent - vector.start.yPercent, vector.end.xPercent - vector.start.xPercent) * 180 / Math.PI;
    }

    function normalizeEvidencePackage(sessionOrEvidence) {
      const source = sessionOrEvidence || {};
      const session = source.session || (source.sessionId || source.matrixSnapshot || source.shotData || source.targetEvidenceImage ? source : null);
      const snapshot = source.matrixSnapshot || (session && session.matrixSnapshot) || {};
      const shotData = source.shotData || (session && session.shotData) || {};
      const authoritative = source.authorityPackage
        || source.m4AuthorityPackage
        || (session && (session.authorityPackage || session.m4AuthorityPackage))
        || null;
      const authoritativeRender = authoritative && authoritative.renderCoordinates || {};
      const correctionSource = source.correction || source.clicks || source.correctionData?.clicks || (session && (session.clicks || session.correctionData?.clicks)) || null;
      const targetEvidence = source.targetEvidenceImage || (session && session.targetEvidenceImage) || null;
      const targetImage = source.targetImage || source.image || source.dataUrl || (targetEvidence && targetEvidence.dataUrl) || TARGET_AUTHORITY.asset;
      const aim = normalizePoint(authoritativeRender.aim || source.aim || source.aimPoint || shotData.aimPoint || (session && (session.aimPoint || session.shotData?.aimPoint)));
      const bull = normalizePoint(authoritativeRender.bull || (authoritative && authoritative.inputs && authoritative.inputs.registeredBullCoordinate));
      const impactsSource = Array.isArray(source.impacts) ? source.impacts
        : Array.isArray(source.impactPoints) ? source.impactPoints
          : Array.isArray(shotData.impactPoints) ? shotData.impactPoints
            : Array.isArray(session && session.impactPoints) ? session.impactPoints
              : Array.isArray(session && session.shotData && session.shotData.impactPoints) ? session.shotData.impactPoints
                : [];
      const impacts = impactsSource.map(normalizePoint).filter(Boolean);
      const poib = normalizePoint(authoritativeRender.poib || source.poib || correctionSource?.poib || shotData.poib || (session && (session.poib || session.shotData?.poib || session.clicks?.poib)));
      const correction = correctionSource || (poib ? { poib } : null);
      const vector = authoritativeRender.vector
        ? vectorCoordinates(authoritativeRender.vector.start, authoritativeRender.vector.end)
        : poib && aim ? vectorCoordinates(poib, aim) : null;
      const distance = source.distance || source.targetDistance || source.display?.distance || (session && (session.targetDistance || session.distance)) || snapshot.targetDistance || snapshot.distance || null;
      const hitCount = Number.isFinite(Number(source.hitCount)) ? Number(source.hitCount)
        : Number.isFinite(Number(source.hits)) ? Number(source.hits)
          : Number.isFinite(Number(session && session.hits)) ? Number(session.hits)
            : Number.isFinite(Number(shotData.hits)) ? Number(shotData.hits)
              : impacts.length;
      const score = Number.isFinite(Number(source.score)) ? Number(source.score)
        : Number.isFinite(Number(session && session.score)) ? Number(session.score)
          : Number.isFinite(Number(shotData.score)) ? Number(shotData.score)
            : null;
      return {
        session: session || source.session || null,
        sessionId: source.sessionId || (session && session.sessionId) || null,
        sessionNumber: source.sessionNumber || (session && session.sessionNumber) || null,
        metadata: {
          sessionId: source.sessionId || (session && session.sessionId) || null,
          sessionNumber: source.sessionNumber || (session && session.sessionNumber) || null,
          sessionLabel: source.sessionLabel || (session && session.sessionLabel) || null,
          timestamp: source.timestamp || (session && (session.timestamp || session.createdAt)) || null
        },
        targetImage,
        targetType: source.targetType || snapshot.targetType || snapshot.targetFamily || TARGET_AUTHORITY.targetFamily,
        vendor: source.vendor || snapshot.vendor || "Baker Smart Targets",
        targetName: source.targetName || snapshot.targetName || snapshot.targetFamily || TARGET_AUTHORITY.targetFamily,
        distance,
        aim,
        bull,
        impacts,
        poib,
        vector,
        correction,
        clicks: correction,
        hitCount,
        score,
        display: source.display || null,
        raw: source
      };
    }

    function evidenceCoordinates(evidence) {
      const normalized = normalizeEvidencePackage(evidence);
      const aim = normalized.aim;
      const bull = normalized.bull;
      const poib = normalized.poib;
      const impacts = normalized.impacts;
      return {
        aim: aim ? imagePointThroughGrid(aim) : null,
        bull: bull ? imagePointThroughGrid(bull) : null,
        poib: poib ? imagePointThroughGrid(poib) : null,
        impacts: impacts.map(imagePointThroughGrid).filter(Boolean),
        vector: normalized.vector
          ? {
              start: imagePointThroughGrid(normalized.vector.start),
              end: imagePointThroughGrid(normalized.vector.end)
            }
          : poib && aim ? vectorCoordinates(poib, aim) : null
      };
    }

    function coordinateSignature(evidence) {
      const coords = evidenceCoordinates(evidence);
      const round = (point) => point ? {
        xPercent: Number(point.xPercent.toFixed(4)),
        yPercent: Number(point.yPercent.toFixed(4))
      } : null;
      return JSON.stringify({
        aim: round(coords.aim),
        bull: round(coords.bull),
        poib: round(coords.poib),
        impacts: coords.impacts.map(round),
        vector: coords.vector ? { start: round(coords.vector.start), end: round(coords.vector.end) } : null
      });
    }

    function regressionCheck(evidence, surfaces = ["Home", "Target", "SEC Thumbnail", "SEC Detail"]) {
      const signature = coordinateSignature(evidence);
      return {
        passed: surfaces.every(() => signature === coordinateSignature(evidence)),
        signature,
        surfaces
      };
    }

    function renderEvidenceUGEO(evidence, options = {}) {
      const normalized = normalizeEvidencePackage(evidence);
      const aim = normalized.aim;
      const bull = normalized.bull;
      const poib = normalized.poib;
      const impacts = normalized.impacts;
      const parts = [];
      const correctionVector = normalized.vector || (poib && aim ? vectorCoordinates(poib, aim) : null);
      if (options.vector !== false && correctionVector) {
        parts.push(renderVector(correctionVector.start, correctionVector.end, {
          svgClass: options.vectorClass || "ugeo-vector",
          markerId: options.vectorMarkerId,
          markerDef: options.vectorMarkerDef,
          lineAttributes: options.vectorLineAttributes
        }));
      }
      (options.extraPoints || []).forEach((extra) => {
        const point = extra.point === "aim" ? aim : extra.point === "poib" ? poib : normalizePoint(extra.point);
        parts.push(renderPoint(extra.className, point, extra.content || "", extra.attributes || "", extra.styleExtra || ""));
      });
      if (options.impacts !== false) {
        parts.push(renderImpacts(impacts, options.impactClass || "ugeo-impact", {
          numbered: !!options.impactNumbered,
          attributes: options.impactAttributes || "",
          styleExtra: options.impactStyleExtra || ""
        }));
      }
      if (options.aim !== false) {
        const aimStyleExtra = typeof options.aimStyleExtra === "function" ? options.aimStyleExtra({ aim, poib }) : (options.aimStyleExtra || "");
        parts.push(renderPoint(options.aimClass || "ugeo-aim", aim, options.aimContent || "", options.aimAttributes || "", aimStyleExtra));
      }
      if (options.bull !== false) {
        parts.push(renderPoint(options.bullClass || "bull-marker", bull, options.bullContent || "", 'aria-label="Registered bull"', options.bullStyleExtra || ""));
      }
      if (options.poib !== false) {
        parts.push(renderPoint(options.poibClass || "ugeo-poib", poib, options.poibContent || "", options.poibAttributes || "", options.poibStyleExtra || ""));
      }
      return parts.join("");
    }

    return {
      geometry,
      normalizePoint,
      imagePercentToPixels,
      imagePercentToGridCoordinate,
      gridCoordinateToImagePercent,
      imagePointThroughGrid,
      displayedImageContentBox,
      syncEvidenceLayerToImage,
      pointStyle,
      renderPoint,
      renderImpacts,
      vectorCoordinates,
      renderVector,
      vectorAngle,
      evidenceCoordinates,
      coordinateSignature,
      regressionCheck,
      normalizeEvidencePackage,
      renderEvidenceUGEO
    };
  })();

  function calculateTapCorrection(aimPoint, impactPoints) {
    const impacts = Array.isArray(impactPoints) ? impactPoints : [];
    if (!aimPoint || !impacts.length) return null;
    const activeSession = read(KEYS.activeSession, null);
    const activeMatrix = getActiveMatrix() || {};
    const setupSource = activeSession && activeSession.matrixSnapshot ? activeSession.matrixSnapshot : activeMatrix;
    const rawDistance = activeSession && (activeSession.targetDistanceValue || activeSession.targetDistance || activeSession.distance)
      || setupSource.targetDistanceValue
      || setupSource.targetDistance
      || setupSource.distance
      || "100";
    const distanceYards = Math.max(1, Number(String(rawDistance).match(/\d+/)?.[0] || 100));
    const rawClickValue = setupSource.opticClickValueMOA
      || setupSource.clickValueMOA
      || setupSource.opticClickValue
      || setupSource.clickValue
      || 0.25;
    const opticClickValueMOA = Math.max(0.01, Number(String(rawClickValue).match(/[\d.]+/)?.[0] || 0.25));
    const inchesToClicks = (inches) => {
      const moa = Math.abs(inches) / ((distanceYards / 100) * 1.047);
      return Math.round(moa / opticClickValueMOA);
    };
    const poib = {
      xPercent: Number((impacts.reduce((sum, point) => sum + Number(point.xPercent || 0), 0) / impacts.length).toFixed(2)),
      yPercent: Number((impacts.reduce((sum, point) => sum + Number(point.yPercent || 0), 0) / impacts.length).toFixed(2))
    };
    const xOffset = Number((poib.xPercent - Number(aimPoint.xPercent || 0)).toFixed(2));
    const yOffset = Number((poib.yPercent - Number(aimPoint.yPercent || 0)).toFixed(2));
    const poibGrid = UGEO.imagePercentToGridCoordinate(poib);
    const aimGrid = UGEO.imagePercentToGridCoordinate(aimPoint);
    const xGridOffset = Number((poibGrid.xInches - aimGrid.xInches).toFixed(2));
    const yGridOffset = Number((poibGrid.yInches - aimGrid.yInches).toFixed(2));
    const windageClicks = inchesToClicks(xGridOffset);
    const elevationClicks = inchesToClicks(yGridOffset);
    const windageDirection = xOffset > 0 ? "LEFT" : xOffset < 0 ? "RIGHT" : "CENTER";
    const elevationDirection = yOffset > 0 ? "UP" : yOffset < 0 ? "DOWN" : "CENTER";
    const windage = windageDirection === "CENTER"
      ? "0 clicks CENTER"
      : `${windageClicks} clicks ${windageDirection}`;
    const elevation = elevationDirection === "CENTER"
      ? "0 clicks CENTER"
      : `${elevationClicks} clicks ${elevationDirection}`;
    return {
      poib,
      xOffset,
      yOffset,
      xGridOffset,
      yGridOffset,
      distanceYards,
      opticClickValueMOA,
      windage,
      elevation,
      windageClicks,
      elevationClicks,
      windageDirection,
      elevationDirection,
      model: "baker-grid-moa-clicks-v1"
    };
  }

  function frontendScoreUnavailable() {
    return { score: null, rawScore: null, qualityPossible: null, perShot: [], model: "backend-authority-required" };
  }

  function saveTargetMarks(aimPoint, impactPoints) {
    const active = read(KEYS.activeSession, null);
    if (!active) return null;
    const impacts = Array.isArray(impactPoints) ? impactPoints : [];
    const hitCount = impacts.length;
    const correction = calculateTapCorrection(aimPoint, impacts);
    const scoreResult = frontendScoreUnavailable();
    const poib = correction ? correction.poib : null;
    const correctionStatus = correction ? "calculated" : "not-calculated";
    return replaceSession({
      ...active,
      aimPoint: aimPoint || null,
      impactPoints: impacts,
      poib,
      clicks: correction,
      score: null,
      rawScore: scoreResult.rawScore,
      qualityPossible: scoreResult.qualityPossible,
      scoreData: scoreResult,
      hits: hitCount,
      shotCount: hitCount,
      scoreStatus: "Backend authority required",
      correctionStatus,
      shotData: {
        ...(active.shotData || {}),
        aimPoint: aimPoint || null,
        impactPoints: impacts,
        shotCount: hitCount,
        hits: hitCount,
        score: null,
        rawScore: scoreResult.rawScore,
        qualityPossible: scoreResult.qualityPossible,
        scoreData: scoreResult,
        poib,
        scoreStatus: "Backend authority required",
        correctionStatus,
        status: "marks-saved",
        savedAt: nowStamp()
      },
      correctionData: {
        ...(active.correctionData || {}),
        clicks: correction,
        windage: correction ? correction.windage : null,
        elevation: correction ? correction.elevation : null,
        status: correctionStatus,
        savedAt: nowStamp()
      },
      updatedAt: nowStamp()
    });
  }

  function loadSession(sessionId) {
    const session = getSessionHistory().find(item => item.sessionId === sessionId);
    if (!session) return null;
    if (!readCanonicalSession(sessionId)) persistCanonicalSession(session, "migrate-loaded-session");
    rawWrite(KEYS.activeSession, sessionReference(session.sessionId));
    rawWrite(KEYS.activeZeroSession, sessionReference(session.sessionId));
    if (session.matrixSnapshot) write(KEYS.activeMatrix, session.matrixSnapshot);
    return session;
  }

  function usePreviousSetup() {
    const last = getLastSession();
    if (!last || !last.matrixSnapshot) return null;
    return saveMatrixSnapshot({ ...last.matrixSnapshot, reloadedFromSessionId: last.sessionId });
  }

  function createSessionFromSession(sessionId) {
    const session = getSessionHistory().find(item => item.sessionId === sessionId);
    if (!session || !session.matrixSnapshot) return null;
    return createSession({
      ...session.matrixSnapshot,
      clonedFromSessionId: session.sessionId
    });
  }

  function registerTargetAuthority(authority) {
    return write(KEYS.targetAuthority, {
      ...TARGET_AUTHORITY,
      ...authority,
      platform: "docs-v4-baker",
      registeredAt: nowStamp()
    });
  }

  function sessionPills(session = read(KEYS.activeSession, null), matrix = getActiveMatrix()) {
    const source = session && session.matrixSnapshot ? session.matrixSnapshot : matrix || {};
    const weapon = weaponProfileDisplay(source);
    return [
      weapon.short,
      display(source.opticModel || source.opticBrand, "Optic"),
      display(source.ammoLoad || source.ammoManufacturer, "Ammo"),
      session ? session.sessionLabel : "No Session",
      session ? display(session.confirmationStatus, "Pending") : "Matrix Ready"
    ];
  }

  function startPlaceholderSession() {
    return createSession({
      rifle: "Baker ST-100YD-SMART",
      rifleVariant: "Standard",
      opticBrand: "Iron Sights",
      opticModel: "Iron Sights",
      ammoLoad: "M855",
      missionProfile: "25m / 300m",
      shooterNotes: "Placeholder session"
    });
  }

  window.SCZN3M4 = {
    KEYS,
    TARGET_AUTHORITY,
    UGEO,
    read,
    write,
    display,
    weaponProfileDisplay,
    formatSessionNumber,
    registerTargetAuthority,
    getActiveMatrix,
    saveMatrixSnapshot,
    createSession,
    createAuthoritativeSession,
    buildActiveCalculationContext,
    replaceSession,
    updateActiveSession,
    attachCorrection,
    confirmActiveZero,
    saveTargetEvidenceImage,
    clearTargetEvidenceImage,
    calculateTapCorrection,
    saveTargetMarks,
    getSessionHistory,
    getLastSession,
    getLastConfirmedZero,
    loadSession,
    usePreviousSetup,
    createSessionFromSession,
    sessionPills,
    storeMediaReferences,
    hydrateStoredMedia,
    startPlaceholderSession
  };
})();
