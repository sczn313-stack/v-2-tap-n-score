import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildAuthorityPackage, canonicalPythonJson } from "./authority_adapter.mjs";

const point = (xPercent, yPercent, shotId) => ({ xPercent, yPercent, ...(shotId ? { shotId } : {}) });

const common = {
  targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  targetName: "M4/M16 Series Weapons 25M Zero",
  targetAuthorityGeometry: {
    bullCoordinate: {
      xPercent: 50,
      yPercent: 43.181818,
      source: "M4-M16-25M-BULL-AUTHORITY-2026-09-01"
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
    caseName: "standard-baker-m16a2-governed-profile",
    target_profile_id: "baker_m16a2_25m_zero",
    targetProfileId: "baker_m16a2_25m_zero",
    targetId: "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1",
    targetName: "Baker M16A2 25 Meter Zeroing Target",
    aimCoordinate: point(50, 48.7, "aim"),
    impactCoordinates: [
      point(58.3, 41.1, "initial-1"),
      point(58.5, 41.3, "initial-2"),
      point(58.7, 41.5, "initial-3")
    ],
    adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011",
    shooterSetup: {
      opticType: "Iron Sights",
      adjustmentSystem: "M16A2_IRON_FSP_REAR_DRUM",
      equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
      adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
    }
  },
  {
    ...common,
    caseName: "army-m16a1-issuer-printed-click-grid",
    target_profile_id: "army_nsn_6920_01_167_1392_m16a1_25m_zero",
    targetProfileId: "army_nsn_6920_01_167_1392_m16a1_25m_zero",
    targetId: "ARMY_FM_3_22_9_FIGURE_5_18_M16A1_FACE_v1",
    targetName: "Army-Issued M16A1 25 Meter Zeroing Target",
    aimCoordinate: point(50.75528700906344, 45.62171628721541, "aim"),
    impactCoordinates: [
      point(40.0, 48.0, "initial-1"),
      point(40.1, 48.1, "initial-2"),
      point(39.9, 47.9, "initial-3")
    ],
    shooterSetup: {
      opticType: "Iron Sights",
      adjustmentSystem: "M16A1_IRON_PRINTED_GRID",
      equipmentConfigurationId: "M16A1-STANDARD-IRON-L-APERTURE"
    }
  },
  {
    ...common,
    caseName: "registered-m4-detachable-carry-handle-iron-sight",
    aimCoordinate: point(50, 43.181818, "aim"),
    impactCoordinates: [
      point(59.67929544808918, 71.31765082202307, "controlled-1"),
      point(59.77929544808918, 71.41765082202306, "controlled-2"),
      point(59.87929544808918, 71.51765082202306, "controlled-3")
    ],
    equipmentAuthorityRecordId: "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01",
    shooterSetup: {
      opticType: "Iron Sights",
      adjustmentSystem: "M4_IRON_DCH_FSP",
      equipmentAuthorityRecordId: "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01"
    }
  },
  {
    ...common,
    caseName: "opposite-axis-direction",
    aimCoordinate: point(50, 43.181818, "aim"),
    impactCoordinates: [point(45, 45, "s1"), point(46, 44, "s2"), point(44, 46, "s3")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "confirmation-pass",
    phase: "confirmation",
    aimCoordinate: point(50, 43.181818, "aim"),
    impactCoordinates: [point(50, 43.181818, "c1"), point(50.2, 43.181818, "c2"), point(49.8, 43.181818, "c3")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "confirmation-fail",
    phase: "confirmation",
    aimCoordinate: point(50, 43.181818, "aim"),
    impactCoordinates: [point(54, 56, "c1"), point(55, 56, "c2"), point(54, 57, "c3")],
    shooterSetup: { opticType: "Iron Sights", adjustmentSystem: "M4_IRON" }
  },
  {
    ...common,
    caseName: "optic-moa",
    aimCoordinate: point(50, 43.181818, "aim"),
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
    aimCoordinate: point(50, 43.181818, "aim"),
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
