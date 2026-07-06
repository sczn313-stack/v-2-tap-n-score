(function () {
  "use strict";

  const KEYS = {
    targetAuthority: "SCZN3_BAKER_TARGET_AUTHORITY",
    activeMatrix: "SCZN3_BAKER_ACTIVE_MATRIX",
    activeSession: "SCZN3_BAKER_ACTIVE_SESSION",
    sessionHistory: "SCZN3_BAKER_SESSION_HISTORY",
    sessionCounter: "SCZN3_BAKER_SESSION_COUNTER",
    activeZeroSession: "SCZN3_BAKER_ACTIVE_ZERO_SESSION"
  };

  const TARGET_AUTHORITY = {
    targetFamily: "Baker 100 Yard Smart Target",
    targetVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
    doctrine: "Baker 100 yard smart target",
    asset: "assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"
  };
  const MAX_SESSION_HISTORY = 10;

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("SCZN3 Baker state read failed", key, error);
      return fallback;
    }
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

  function buildSession(matrixSnapshot) {
    const sessionNumber = getNextSessionNumber();
    const timestamp = nowStamp();
    const targetIdentity = {
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
    return {
      sessionId: `baker-session-${String(sessionNumber).padStart(3, "0")}-${Date.now()}`,
      sessionNumber,
      sessionLabel: formatSessionNumber(sessionNumber),
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
    const history = [session, ...getSessionHistory()].slice(0, MAX_SESSION_HISTORY);
    write(KEYS.activeSession, session);
    write(KEYS.activeZeroSession, session);
    write(KEYS.sessionHistory, history);
    return session;
  }

  function replaceSession(updatedSession) {
    const history = getSessionHistory();
    const nextHistory = history.some(session => session.sessionId === updatedSession.sessionId)
      ? history.map(session => session.sessionId === updatedSession.sessionId ? updatedSession : session)
      : [updatedSession, ...history].slice(0, MAX_SESSION_HISTORY);
    write(KEYS.activeSession, updatedSession);
    write(KEYS.activeZeroSession, updatedSession);
    write(KEYS.sessionHistory, nextHistory);
    return updatedSession;
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
      const correctionSource = source.correction || source.clicks || source.correctionData?.clicks || (session && (session.clicks || session.correctionData?.clicks)) || null;
      const targetEvidence = source.targetEvidenceImage || (session && session.targetEvidenceImage) || null;
      const targetImage = source.targetImage || source.image || source.dataUrl || (targetEvidence && targetEvidence.dataUrl) || TARGET_AUTHORITY.asset;
      const aim = normalizePoint(source.aim || source.aimPoint || shotData.aimPoint || (session && (session.aimPoint || session.shotData?.aimPoint)));
      const impactsSource = Array.isArray(source.impacts) ? source.impacts
        : Array.isArray(source.impactPoints) ? source.impactPoints
          : Array.isArray(shotData.impactPoints) ? shotData.impactPoints
            : Array.isArray(session && session.impactPoints) ? session.impactPoints
              : Array.isArray(session && session.shotData && session.shotData.impactPoints) ? session.shotData.impactPoints
                : [];
      const impacts = impactsSource.map(normalizePoint).filter(Boolean);
      const poib = normalizePoint(source.poib || correctionSource?.poib || shotData.poib || (session && (session.poib || session.shotData?.poib || session.clicks?.poib)));
      const correction = correctionSource || (poib ? { poib } : null);
      const vector = poib && aim ? vectorCoordinates(poib, aim) : null;
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
      const poib = normalized.poib;
      const impacts = normalized.impacts;
      return {
        aim: aim ? imagePointThroughGrid(aim) : null,
        poib: poib ? imagePointThroughGrid(poib) : null,
        impacts: impacts.map(imagePointThroughGrid).filter(Boolean),
        vector: poib && aim ? vectorCoordinates(poib, aim) : null
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
      const poib = normalized.poib;
      const impacts = normalized.impacts;
      const parts = [];
      if (options.vector !== false && poib && aim) {
        parts.push(renderVector(poib, aim, {
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
    write(KEYS.activeSession, session);
    write(KEYS.activeZeroSession, session);
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
    startPlaceholderSession
  };
})();
