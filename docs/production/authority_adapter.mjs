/*
 * Production transport adapter for backend/authority_service.py.
 *
 * The Python service remains the governing reference implementation.
 * This module is a mechanical, dependency-free port for the Cloudflare Worker
 * runtime. production/parity_test.mjs blocks release on any deterministic
 * output discrepancy.
 */

import { resolveProvenEquipmentRecord } from "./generated_weapon_equipment_registry.mjs";

const MOA_INCHES_AT_100_YARDS = 1.047;
const MRAD_INCHES_AT_100_YARDS = 3.6;

class PythonFloat {
  constructor(value) {
    this.value = Number(value);
  }

  valueOf() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

function pythonFloat(value) {
  return value instanceof PythonFloat ? value : new PythonFloat(value);
}

const M4_BULL_AUTHORITY = Object.freeze({
  authorityId: "M4-BULL-COORDINATE-AUTHORITY-2026-07-28",
  status: "founder-approved",
  xPercent: pythonFloat(50.0),
  yPercent: pythonFloat(48.7),
  coordinateSystem: "continuous-edge-origin-normalized-percent",
  sourceDimensionsPx: { width: 773, height: 1000 },
  sourceCoordinatePx: { x: pythonFloat(386.5), y: pythonFloat(487.0) },
  toleranceSourcePx: { x: pythonFloat(1.0), y: pythonFloat(1.0) },
  sourceAssetSha256: "d7912799f7462335ed1487dd19c437e1cf9c749615136c9acd735cc20bc49bff",
  validationReportSha256: "b9f0c485e01a03142d8b066bd208422f84a781b9dec218253ebf292784cec283",
  founderApprovedDate: "2026-07-28",
  scope: "normalized bull coordinate only"
});
const M4_GEOMETRY = Object.freeze({
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  imageWidth: 1024,
  imageHeight: 1270,
  gridLeftPx: 95,
  gridTopPx: 147,
  gridRightPx: 932,
  gridBottomPx: 1012,
  gridSquarePx: 59.8,
  gridSquareInches: 1,
  unit: "inch",
  bullCoordinate: {
    xPercent: M4_BULL_AUTHORITY.xPercent,
    yPercent: M4_BULL_AUTHORITY.yPercent,
    source: M4_BULL_AUTHORITY.authorityId
  }
});

function number(value, fallback = null) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    return fallback;
  }
  const result = Number(value);
  return Number.isFinite(result) ? pythonFloat(result) : fallback;
}

function bankersRound(value) {
  const lower = Math.floor(value);
  const difference = value - lower;
  if (difference === 0.5) {
    return lower % 2 === 0 ? lower : lower + 1;
  }
  return Math.round(value);
}

function rounded(value, places = 4) {
  if (Object.is(Number(value), -0)) return pythonFloat(-0);
  if (places === 0) return pythonFloat(bankersRound(Number(value)));
  return pythonFloat(Number(Number(value).toFixed(places)));
}

function normalizePoint(point, defaultId = "") {
  if (!point || typeof point !== "object" || Array.isArray(point)) return null;
  const x = number(point.xPercent);
  const y = number(point.yPercent);
  if (x === null || y === null) return null;
  return {
    xPercent: rounded(Math.max(0, Math.min(100, Number(x)))),
    yPercent: rounded(Math.max(0, Math.min(100, Number(y)))),
    shotId: String(point.shotId || defaultId)
  };
}

function normalizeImpacts(impacts) {
  if (!Array.isArray(impacts)) return [];
  return impacts
    .map((item, index) => normalizePoint(item, `shot-${index + 1}`))
    .filter(Boolean);
}

function geometryFor(payload) {
  const supplied = payload.targetAuthorityGeometry;
  const geometry = { ...M4_GEOMETRY };
  if (supplied && typeof supplied === "object" && !Array.isArray(supplied)) {
    Object.entries(supplied).forEach(([key, value]) => {
      if (value !== null && value !== undefined) geometry[key] = value;
    });
  }
  // The M4 route consumes registered bull authority. A client payload may not
  // replace it with an implementation assumption or compatibility value.
  geometry.bullCoordinate = { ...M4_GEOMETRY.bullCoordinate };
  geometry.targetId = String(payload.targetId || geometry.targetId);
  return geometry;
}

function distanceYards(payload) {
  const distance = payload.distance || {};
  let value;
  let unit;
  if (distance && typeof distance === "object" && !Array.isArray(distance)) {
    value = number(distance.value, pythonFloat(25)) || pythonFloat(25);
    unit = String(distance.unit || "m").toLowerCase();
  } else {
    value = number(distance, pythonFloat(25)) || pythonFloat(25);
    unit = "m";
  }
  return Math.max(1, Number(value) * (unit.startsWith("m") ? 1.0936133 : 1));
}

function gridInches(point, geometry) {
  const xPx = (Number(point.xPercent) / 100) * Number(geometry.imageWidth);
  const yPx = (Number(point.yPercent) / 100) * Number(geometry.imageHeight);
  const scale = Number(geometry.gridSquareInches || 1) / Number(geometry.gridSquarePx);
  return {
    xInches: rounded((xPx - Number(geometry.gridLeftPx)) * scale),
    yInches: rounded((yPx - Number(geometry.gridTopPx)) * scale)
  };
}

function averagePoint(points) {
  if (!points.length) return null;
  return {
    xPercent: rounded(points.reduce((sum, point) => sum + Number(point.xPercent), 0) / points.length),
    yPercent: rounded(points.reduce((sum, point) => sum + Number(point.yPercent), 0) / points.length)
  };
}

function authorityModelFromRecord(record) {
  const axes = record.axes || {};
  const windage = axes.windage || {};
  const elevation = axes.elevation || {};
  const source = (record.sourceDocumentation || [])[0] || null;
  const identity = record.equipmentIdentity || {};
  return {
    system: record.adjustmentSystem,
    label: record.displayName,
    unit: record.adjustmentUnit,
    windagePerClick: pythonFloat(windage.movementPerClick),
    elevationPerClick: pythonFloat(elevation.movementPerClick),
    authorityStatus: record.status,
    authorityId: record.recordId,
    equipmentAuthorityRecordId: record.recordId,
    authoritySource: source,
    exactSightIdentity: {
      weapon: record.militaryDesignation,
      rearSight: [identity.rearSight, identity.rearAperture, identity.rearElevationSetting]
        .filter(Boolean)
        .join("; "),
      windageControl: windage.control,
      elevationControl: elevation.control,
      mountingConfiguration: identity.mountingConfiguration
    },
    roundingRule: record.roundingRule,
    turnDirections: {
      windage: windage.directionConvention || {},
      elevation: elevation.directionConvention || {}
    },
    authorityRecord: record
  };
}

function adjustmentModel(payload) {
  const setup = payload.shooterSetup && typeof payload.shooterSetup === "object" && !Array.isArray(payload.shooterSetup)
    ? payload.shooterSetup
    : {};
  const optic = setup.optic && typeof setup.optic === "object" && !Array.isArray(setup.optic)
    ? setup.optic
    : {};
  const opticType = String(optic.type || setup.opticType || "Iron Sights");
  const requested = String(
    optic.adjustmentSystem
      || setup.adjustmentSystem
      || (opticType.toLowerCase().includes("iron") ? "M4_IRON" : "OPTIC")
  ).toUpperCase();
  if (requested.startsWith("M4_IRON")) {
    const requestedAuthorityId = String(
      payload.equipmentAuthorityRecordId
      || setup.equipmentAuthorityRecordId
      || payload.mechanicalSightAuthorityId
      || setup.mechanicalSightAuthorityId
      || ""
    );
    const authorityRecord = resolveProvenEquipmentRecord(requestedAuthorityId, requested);
    const authority = authorityRecord ? authorityModelFromRecord(authorityRecord) : {};
    const proven = Boolean(authorityRecord);
    return {
      system: requested,
      label: authority.label || "Unspecified M4 iron sights",
      unit: "MOA",
      windagePerClick: authority.windagePerClick || null,
      elevationPerClick: authority.elevationPerClick || null,
      authorityStatus: proven ? "proven" : "unproven",
      authorityId: authority.authorityId || null,
      authoritySource: authority.sourceCitation || null,
      exactSightIdentity: authority.exactSightIdentity || null,
      roundingRule: authority.roundingRule || null,
      turnDirections: authority.turnDirections || null,
      equipmentAuthorityRecordId: authority.equipmentAuthorityRecordId || null,
      authorityRecord: authority.authorityRecord || null
    };
  }
  const authority = payload.mechanicalAuthority && typeof payload.mechanicalAuthority === "object"
    ? payload.mechanicalAuthority
    : setup.mechanicalAuthority && typeof setup.mechanicalAuthority === "object"
      ? setup.mechanicalAuthority
      : {};
  const proven = String(authority.status || "unproven").toLowerCase() === "proven";

  const unit = String(optic.adjustmentUnit || setup.opticAdjustmentUnit || "MOA").toUpperCase() === "MRAD"
    ? "MRAD"
    : "MOA";
  const clickValue = proven ? number(
    optic.clickValue
      || setup.opticClickValue
      || optic[unit === "MRAD" ? "clickValueMRAD" : "clickValueMOA"]
  ) : null;
  return {
    system: "OPTIC",
    label: clickValue ? `Optic · ${Number(clickValue)} ${unit}/click` : `${unit} optic`,
    unit,
    windagePerClick: clickValue,
    elevationPerClick: clickValue,
    authorityStatus: proven && clickValue ? "proven" : "unproven",
    authoritySource: authority.source || null,
    turnDirections: authority.turnDirections || null
  };
}

function axisClicks(moa, mrad, model, axis) {
  const magnitude = model.unit === "MRAD" ? Number(mrad) : Number(moa);
  return bankersRound(magnitude / Number(model[`${axis}PerClick`]));
}

function reconcileClickAxis(axis, moa, mrad, model, displayedClicks) {
  const unit = String(model.unit || "").toUpperCase();
  const angularValue = unit === "MRAD" ? Number(mrad) : Number(moa);
  const displayedAngularValue = Number(angularValue.toFixed(2));
  const clickConstant = Number(model[`${axis}PerClick`]);
  const roundingRule = String(model.roundingRule || "");
  if (!Number.isFinite(clickConstant) || clickConstant <= 0) {
    return {
      status: "mismatch",
      axis,
      reason: "missing positive axis-specific click constant"
    };
  }
  const rawClicks = angularValue / clickConstant;
  const displayedRawClicks = displayedAngularValue / clickConstant;
  const expectedClicks = bankersRound(rawClicks);
  const displayedExpectedClicks = bankersRound(displayedRawClicks);
  const reconciled =
    roundingRule === "nearest-whole-click-half-to-even"
    && expectedClicks === displayedClicks
    && displayedExpectedClicks === displayedClicks;
  return {
    status: reconciled ? "reconciled" : "mismatch",
    axis,
    chain: "measured offset → MOA/MRAD → sight constant → raw clicks → rounding → displayed clicks",
    adjustmentUnit: unit,
    angularValue: rounded(angularValue),
    displayedAngularValue: rounded(displayedAngularValue, 2),
    clickConstant: rounded(clickConstant),
    rawClicks: rounded(rawClicks),
    displayedRawClicks: rounded(displayedRawClicks),
    roundingRule,
    expectedClicks,
    displayedExpectedClicks,
    displayedClicks
  };
}

function reconcileClickCalculation(angular, model, windageClicks, elevationClicks) {
  const axes = {
    windage: reconcileClickAxis(
      "windage",
      angular.windageMOA,
      angular.windageMRAD,
      model,
      windageClicks
    ),
    elevation: reconcileClickAxis(
      "elevation",
      angular.elevationMOA,
      angular.elevationMRAD,
      model,
      elevationClicks
    )
  };
  const reconciled = Object.values(axes).every((axis) => axis.status === "reconciled");
  return {
    status: reconciled ? "reconciled" : "mismatch",
    method: "m4-mechanical-calculation-reconciliation-v1",
    axes
  };
}

function scoreAndClassify(aim, impacts, geometry) {
  const result = {
    value: null,
    status: "unavailable",
    method: "m4-authority-distance-v1",
    perShot: []
  };
  if (!aim || !impacts.length) {
    result.reason = "confirmed aim point and confirmed impacts required";
    return result;
  }
  const aimGrid = gridInches(aim, geometry);
  const rows = impacts.map((impact) => {
    const location = gridInches(impact, geometry);
    const x = rounded(Number(location.xInches) - Number(aimGrid.xInches));
    const y = rounded(Number(location.yInches) - Number(aimGrid.yInches));
    const distance = rounded(Math.hypot(Number(x), Number(y)));
    let points;
    let classification;
    if (Number(distance) <= 1) {
      points = 10;
      classification = "CENTERED";
    } else if (Number(distance) <= 2) {
      points = 8;
      classification = "NEAR AIM POINT";
    } else if (Number(distance) <= 4) {
      points = 6;
      classification = "CORRECTION ZONE";
    } else if (Number(distance) <= 6) {
      points = 4;
      classification = "OUTER GROUP";
    } else {
      points = 0;
      classification = "OUTSIDE ZERO STANDARD";
    }
    return {
      shotId: impact.shotId,
      xInches: x,
      yInches: y,
      distanceInches: distance,
      points,
      classification
    };
  });
  const possible = rows.length * 10;
  const raw = rows.reduce((sum, row) => sum + row.points, 0);
  const value = bankersRound((raw / possible) * 100);
  const band = value >= 90 ? "excellent" : value >= 80 ? "good" : value >= 70 ? "developing" : "corrective";
  return {
    ...result,
    value,
    band,
    rawScore: raw,
    possibleScore: possible,
    status: "calculated",
    perShot: rows
  };
}

function groupMeasurement(impacts, geometry, yards) {
  if (impacts.length < 2) {
    return { status: "unavailable", reason: "two confirmed impacts required" };
  }
  const points = impacts.map((point) => gridInches(point, geometry));
  let spread = 0;
  points.forEach((first, index) => {
    points.slice(index + 1).forEach((second) => {
      spread = Math.max(
        spread,
        Math.hypot(
          Number(second.xInches) - Number(first.xInches),
          Number(second.yInches) - Number(first.yInches)
        )
      );
    });
  });
  const moa = spread / ((yards / 100) * MOA_INCHES_AT_100_YARDS);
  return {
    status: "calculated",
    diameterInches: rounded(spread),
    valueMOA: rounded(moa, 2),
    display: `${spread.toFixed(2)}" · ${moa.toFixed(2)} MOA`,
    method: "m4-authority-max-spread-v1"
  };
}

function pythonFloatString(value) {
  if (!Number.isFinite(value)) throw new TypeError("Non-finite numbers are not valid authority values");
  if (Object.is(value, -0)) return "-0.0";
  if (Number.isInteger(value)) return `${value}.0`;
  return String(value).replace(/e([+-]?)(\d)$/i, "e$10$2");
}

function pythonJsonString(value) {
  return JSON.stringify(String(value)).replace(/[^\x00-\x7f]/g, (character) => {
    return `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

export function canonicalPythonJson(value) {
  if (value instanceof PythonFloat) return pythonFloatString(value.value);
  if (value === null) return "null";
  if (typeof value === "string") return pythonJsonString(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (Array.isArray(value)) return `[${value.map(canonicalPythonJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${pythonJsonString(key)}:${canonicalPythonJson(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`Unsupported authority value: ${typeof value}`);
}

async function stableHash(payload) {
  const bytes = new TextEncoder().encode(canonicalPythonJson(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildAuthorityPackage(input) {
  const payload = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const geometry = geometryFor(payload);
  const aim = normalizePoint(payload.aimCoordinate || payload.aimPoint, "aim");
  const bull = normalizePoint(geometry.bullCoordinate, "registered-bull");
  const impacts = normalizeImpacts(payload.impactCoordinates || payload.impactPoints);
  const yards = distanceYards(payload);
  const model = adjustmentModel(payload);
  const poib = averagePoint(impacts);
  const score = scoreAndClassify(aim, impacts, geometry);
  const group = groupMeasurement(impacts, geometry, yards);
  let correction = null;
  let clicks = null;
  let angular = null;
  let vector = null;
  let calculationReconciliation = {
    status: "unavailable",
    reason: "mechanical recommendation not calculated"
  };
  let geometryValidation = {
    status: "unavailable",
    reason: "confirmed aim point and confirmed impacts required"
  };
  let mechanicalValidation = {
    status: "unavailable",
    reason: "mechanical sight authority is not independently proven",
    model
  };
  const aimPointDiscrepancy = {
    status: !aim || !bull ? "unavailable" : "measured",
    judgment: "unavailable",
    reason: "materiality tolerance is not founder-approved"
  };

  if (aim && bull) {
    const aimGrid = gridInches(aim, geometry);
    const bullGrid = gridInches(bull, geometry);
    const discrepancyX = rounded(Number(aimGrid.xInches) - Number(bullGrid.xInches));
    const discrepancyY = rounded(Number(aimGrid.yInches) - Number(bullGrid.yInches));
    aimPointDiscrepancy.aimMinusBullInches = { x: discrepancyX, y: discrepancyY };
    aimPointDiscrepancy.magnitudeInches = rounded(Math.hypot(Number(discrepancyX), Number(discrepancyY)));
  }

  if (aim && poib) {
    const aimGrid = gridInches(aim, geometry);
    const poibGrid = gridInches(poib, geometry);
    const impactX = rounded(Number(poibGrid.xInches) - Number(aimGrid.xInches));
    const impactY = rounded(Number(poibGrid.yInches) - Number(aimGrid.yInches));
    const correctionX = rounded(-Number(impactX));
    const correctionY = rounded(-Number(impactY));
    const windageMoa = Math.abs(Number(correctionX)) / ((yards / 100) * MOA_INCHES_AT_100_YARDS);
    const elevationMoa = Math.abs(Number(correctionY)) / ((yards / 100) * MOA_INCHES_AT_100_YARDS);
    const windageMrad = Math.abs(Number(correctionX)) / ((yards / 100) * MRAD_INCHES_AT_100_YARDS);
    const elevationMrad = Math.abs(Number(correctionY)) / ((yards / 100) * MRAD_INCHES_AT_100_YARDS);
    const windageDirection = Number(correctionX) > 0 ? "RIGHT" : Number(correctionX) < 0 ? "LEFT" : "CENTER";
    const elevationDirection = Number(correctionY) > 0 ? "DOWN" : Number(correctionY) < 0 ? "UP" : "CENTER";
    correction = {
      impactOffsetInches: { x: impactX, y: impactY },
      aimMinusPOIBInches: { x: correctionX, y: correctionY },
      windageDirection,
      elevationDirection,
      windage: null,
      elevation: null
    };
    angular = {
      windageMOA: rounded(windageMoa),
      elevationMOA: rounded(elevationMoa),
      windageMRAD: rounded(windageMrad),
      elevationMRAD: rounded(elevationMrad)
    };
    vector = { start: poib, end: aim, intent: "POIB_TO_CONFIRMED_AIM" };
    geometryValidation = {
      status: "calculated",
      method: "confirmed-aim-minus-confirmed-poib-v1",
      vectorStart: "POIB",
      vectorEnd: "CONFIRMED_AIM_POINT",
      physicalDisplacementInches: { x: correctionX, y: correctionY },
      magnitudeInches: rounded(Math.hypot(Number(correctionX), Number(correctionY)))
    };
    if (model.authorityStatus === "proven") {
      const windageClicks = axisClicks(windageMoa, windageMrad, model, "windage");
      const elevationClicks = axisClicks(elevationMoa, elevationMrad, model, "elevation");
      const turnDirections = model.turnDirections || {};
      const windageTurn = (turnDirections.windage || {})[windageDirection] || null;
      const elevationTurn = (turnDirections.elevation || {})[elevationDirection] || null;
      correction.windage = `${windageClicks} clicks ${windageDirection}`;
      correction.elevation = `${elevationClicks} clicks ${elevationDirection}`;
      clicks = {
        windageClicks,
        elevationClicks,
        windageDirection,
        elevationDirection,
        windageTurnDirection: windageTurn,
        elevationTurnDirection: elevationTurn,
        model
      };
      calculationReconciliation = reconcileClickCalculation(
        angular,
        model,
        windageClicks,
        elevationClicks
      );
      if (calculationReconciliation.status === "reconciled") {
        mechanicalValidation = {
          status: "calculated",
          method: "registered-sight-mechanics-v1",
          calculationReconciliation: "reconciled",
          model
        };
      } else {
        correction.windage = null;
        correction.elevation = null;
        clicks = null;
        mechanicalValidation = {
          status: "failed",
          reason: "mechanical calculation chain did not reconcile",
          calculationReconciliation: "mismatch",
          model
        };
      }
    }
  }

  const phase = String(payload.phase || "initial").toLowerCase();
  const mission = payload.zeroingMission && typeof payload.zeroingMission === "object" && !Array.isArray(payload.zeroingMission)
    ? payload.zeroingMission
    : {};
  let validation = { status: "not-requested", outcome: "PENDING" };
  if (phase === "confirmation") {
    const minimumShots = Math.trunc(Number(number(mission.confirmationMinimumShots, pythonFloat(3)) || pythonFloat(3)));
    const tolerance = number(mission.confirmationResidualToleranceInches, pythonFloat(1)) || pythonFloat(1);
    const residual = correction
      ? Math.hypot(Number(correction.impactOffsetInches.x), Number(correction.impactOffsetInches.y))
      : null;
    const mechanicalChainValid =
      model.authorityStatus !== "proven"
      || calculationReconciliation.status === "reconciled";
    const confirmed =
      impacts.length >= minimumShots
      && residual !== null
      && residual <= Number(tolerance)
      && mechanicalChainValid;
    validation = {
      status: correction
        ? mechanicalChainValid ? "calculated" : "integrity-failed"
        : "unavailable",
      outcome: confirmed
        ? "CONFIRMED"
        : correction && !mechanicalChainValid
          ? "CALCULATION INTEGRITY FAILED"
          : "REQUIRES ADDITIONAL CORRECTION",
      confirmed,
      minimumShotsMet: impacts.length >= minimumShots,
      residualOffsetInches: residual !== null ? rounded(residual) : null,
      standard: `${minimumShots}+ confirmed shots; POIB within ${Number(tolerance).toFixed(2)} inch of confirmed aim point`,
      method: "zeroing-confirmation-authority-v1"
    };
  }

  const shotIds = impacts.map((impact) => impact.shotId);
  const core = {
    authorityVersion: "sczn3-m4-authority-v1",
    target: {
      targetId: geometry.targetId,
      targetName: payload.targetName || "Zeroing target"
    },
    zeroingMission: mission,
    phase,
    inputs: {
      aimCoordinate: aim,
      confirmedAimPoint: aim,
      registeredBullCoordinate: bull,
      impactCoordinates: impacts,
      distanceYards: rounded(yards),
      shooterSetup: payload.shooterSetup || {}
    },
    poib,
    groupCenter: poib,
    group,
    score,
    correction,
    clicks,
    angular,
    vectors: vector ? { poibToConfirmedAim: vector } : {},
    aimPointDiscrepancy,
    geometryValidation,
    mechanicalValidation,
    calculationReconciliation,
    validation,
    renderCoordinates: { aim, bull, impacts, poib, vector },
    confirmedAimPointAuthority: {
      status: aim ? "confirmed" : "unavailable",
      coordinate: aim,
      source: aim ? "shooter-selected-session-evidence" : null,
      method: aim ? "confirmed-aim-point-v1" : null
    },
    bullCoordinateAuthority: { ...M4_BULL_AUTHORITY },
    mechanicalSightAuthority: model.authorityStatus === "proven"
      ? model.authorityRecord
      : {
          status: "unavailable",
          reason: "exact registered sight configuration required",
          requestedSystem: model.system,
          requestedEquipmentAuthorityRecordId: model.equipmentAuthorityRecordId || null
        },
    geometryMetadata: geometry,
    lineage: {
      sourceShotIds: shotIds,
      poibDerivedFrom: shotIds,
      confirmedAimPointDerivedFrom: aim ? ["session-aim-evidence"] : [],
      correctionDerivedFrom: aim && poib ? ["confirmed-aim-point", "poib"] : [],
      aimPointDiscrepancyDerivedFrom: aim && bull ? ["aim", "registered-bull"] : [],
      validationDerivedFrom: phase === "confirmation" ? shotIds : []
    },
    status: {
      hasAim: aim !== null,
      hasConfirmedAim: aim !== null,
      hasRegisteredBull: bull !== null,
      impactCount: impacts.length,
      hasPOIB: poib !== null,
      hasCorrection: correction !== null,
      hasMechanicalRecommendation: clicks !== null
    }
  };
  core.evidenceHash = await stableHash(core);
  core.computedAt = new Date().toISOString().replace("Z", "+00:00");
  return core;
}
