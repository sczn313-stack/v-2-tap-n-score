import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildAuthorityPackage, canonicalPythonJson } from "./authority_adapter.mjs";

const point = (xPercent, yPercent, shotId) => ({ xPercent, yPercent, ...(shotId ? { shotId } : {}) });

const common = {
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  targetName: "25 Meter Zeroing Target — M4 Carbine",
  targetAuthorityGeometry: {
    bullCoordinate: {
      xPercent: 50,
      yPercent: 48.7,
      source: "M4-BULL-COORDINATE-AUTHORITY-2026-07-28"
    }
  },
  distance: { value: 25, unit: "m" },
  zeroingMission: {
    id: "M4_25M_300M_ZERO",
    label: "25m / 300m M4 zero",
    defaultDistance: { value: 25, unit: "m" },
    confirmationMinimumShots: 3,
    confirmationResidualToleranceInches: 1
  }
};

const fixtures = [
  {
    ...common,
    caseName: "registered-m4-detachable-carry-handle-iron-sight",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [
      point(59.67929544808918, 71.31765082202307, "controlled-1"),
      point(59.77929544808918, 71.41765082202306, "controlled-2"),
      point(59.87929544808918, 71.51765082202306, "controlled-3")
    ],
    equipmentAuthorityRecordId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28",
    shooterSetup: {
      opticType: "Iron Sights",
      adjustmentSystem: "M4_IRON_DCH_FSP",
      equipmentAuthorityRecordId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"
    }
  },
  {
    ...common,
    caseName: "opposite-axis-direction",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [point(45, 45, "s1"), point(46, 44, "s2"), point(44, 46, "s3")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "confirmation-pass",
    phase: "confirmation",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [point(50, 48.7, "c1"), point(50.2, 48.7, "c2"), point(49.8, 48.7, "c3")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "confirmation-fail",
    phase: "confirmation",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [point(54, 56, "c1"), point(55, 56, "c2"), point(54, 57, "c3")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "optic-moa",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [point(52, 53, "m1"), point(53, 54, "m2")],
    shooterSetup: {
      opticType: "Scope",
      adjustmentSystem: "OPTIC",
      opticAdjustmentUnit: "MOA",
      opticClickValue: 0.25
    }
  },
  {
    ...common,
    caseName: "optic-mrad",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [point(52, 53, "r1"), point(53, 54, "r2")],
    shooterSetup: {
      opticType: "Scope",
      adjustmentSystem: "OPTIC",
      opticAdjustmentUnit: "MRAD",
      opticClickValue: 0.1
    }
  },
  {
    ...common,
    caseName: "missing-aim",
    impactCoordinates: [point(52, 53, "u1")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "empty-impacts",
    aimCoordinate: point(50, 50, "aim"),
    impactCoordinates: [],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "unicode-profile",
    aimCoordinate: point(50, 50, "aim"),
    impactCoordinates: [point(51, 49, "ü-1"), point(50, 49, "ü-2")],
    shooterSetup: {
      opticType: "Iron Sights",
      adjustmentSystem: "M4_IRON",
      firearmProfile: "M4 — Founder"
    }
  }
];

let seed = 0x5c2a3;
function randomUnit() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

for (let caseIndex = 1; caseIndex <= 48; caseIndex += 1) {
  const aimX = 35 + randomUnit() * 30;
  const aimY = 35 + randomUnit() * 30;
  const impactCount = 1 + (caseIndex % 5);
  const adjustmentMode = caseIndex % 3;
  const shooterSetup = adjustmentMode === 0
    ? { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
    : adjustmentMode === 1
      ? {
          opticType: "Scope",
          adjustmentSystem: "OPTIC",
          opticAdjustmentUnit: "MOA",
          opticClickValue: 0.25
        }
      : {
          opticType: "Scope",
          adjustmentSystem: "OPTIC",
          opticAdjustmentUnit: "MRAD",
          opticClickValue: 0.1
        };
  const distance = caseIndex % 3 === 0
    ? { value: 25, unit: "m" }
    : caseIndex % 3 === 1
      ? { value: 50, unit: "yds" }
      : { value: 100, unit: "yds" };
  fixtures.push({
    ...common,
    caseName: `deterministic-sweep-${caseIndex}`,
    phase: caseIndex % 4 === 0 ? "confirmation" : "initial",
    distance,
    aimCoordinate: point(aimX, aimY, `aim-${caseIndex}`),
    impactCoordinates: Array.from({ length: impactCount }, (_, impactIndex) => {
      const x = Math.max(0, Math.min(100, aimX + (randomUnit() - 0.5) * 30));
      const y = Math.max(0, Math.min(100, aimY + (randomUnit() - 0.5) * 30));
      return point(x, y, `sweep-${caseIndex}-${impactIndex + 1}`);
    }),
    shooterSetup
  });
}

const referenceProcess = spawnSync("python3", ["docs/backend/m4_authority/parity/reference_runner.py"], {
  input: JSON.stringify(fixtures),
  encoding: "utf8"
});

if (referenceProcess.status !== 0) {
  process.stderr.write(referenceProcess.stderr);
  process.exit(referenceProcess.status || 1);
}

const referenceRows = JSON.parse(referenceProcess.stdout);
const references = referenceRows.map((row) => row.result);
const adapterResults = await Promise.all(fixtures.map((fixture) => buildAuthorityPackage(fixture)));

function normalized(value) {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy.computedAt;
  return copy;
}

fixtures.forEach((fixture, index) => {
  const adapterCore = { ...adapterResults[index] };
  delete adapterCore.computedAt;
  delete adapterCore.evidenceHash;
  const adapterCanonical = canonicalPythonJson(adapterCore);
  if (adapterCanonical !== referenceRows[index].canonical) {
    const mismatch = Array.from({ length: Math.max(adapterCanonical.length, referenceRows[index].canonical.length) })
      .findIndex((_, characterIndex) => adapterCanonical[characterIndex] !== referenceRows[index].canonical[characterIndex]);
    throw new Error(
      `Canonical parity failure: ${fixture.caseName} at ${mismatch}\n`
      + `adapter=${adapterCanonical.slice(Math.max(0, mismatch - 80), mismatch + 120)}\n`
      + `python=${referenceRows[index].canonical.slice(Math.max(0, mismatch - 80), mismatch + 120)}`
    );
  }
  assert.deepStrictEqual(
    normalized(adapterResults[index]),
    normalized(references[index]),
    `Parity failure: ${fixture.caseName}`
  );
  console.log(`PASS parity ${fixture.caseName}`);
});

console.log(`PASS ${fixtures.length} Python ↔ production-adapter parity cases`);
