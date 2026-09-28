(function () {
  "use strict";

  window.SCZN3_M4_CONFIG = Object.freeze({
    target: Object.freeze({
      vendor: "Baker",
      sku: "ST-M16A2/M4",
      product: "M4/M16 Series Weapons • 25M Zero Target",
      authority: "M4 Zeroing",
      qrUrl: "https://tap-n-score.com/?v=baker&sku=ST-M16A2%2FM4",
      qrAsset: "assets/BAKER_ST-M16A2-M4_QR.png",
      targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      targetName: "M4/M16 Series Weapons 25M Zero",
      authorityAsset: "assets/M4_M16_25M_ZERO_AUTHORITY_v1.png",
      geometry: Object.freeze({
        imageWidth: 2550,
        imageHeight: 3300,
        gridLeftPx: 75,
        gridTopPx: 225,
        gridRightPx: 2475,
        gridBottomPx: 2625,
        gridSquarePx: 300,
        gridSquareInches: 1,
        bullCoordinate: Object.freeze({
          xPercent: 50,
          yPercent: 43.181818,
          source: "M4-M16-25M-BULL-AUTHORITY-2026-09-01"
        })
      })
    }),
    zeroingMission: Object.freeze({
      id: "M4_25M_300M_ZERO",
      label: "25m / 300m M4 zero",
      defaultDistance: Object.freeze({ value: 25, unit: "m" }),
      confirmationMinimumShots: 3,
      confirmationResidualToleranceInches: 1
    }),
    sightingSystems: Object.freeze({
      M4_IRON_DCH_FSP: Object.freeze({
        adjustmentSystem: "M4_IRON_DCH_FSP",
        equipmentAuthorityRecordId: "M4-M16-25M-ZERO-FSP-AUTHORITY-2026-09-01"
      }),
      M4_IRON: Object.freeze({
        adjustmentSystem: "M4_IRON",
        equipmentAuthorityRecordId: null
      }),
      OPTIC_MOA: Object.freeze({ label: "MOA optic", unit: "MOA", authorityStatus: "setup-dependent" }),
      OPTIC_MRAD: Object.freeze({ label: "MRAD optic", unit: "MRAD", authorityStatus: "setup-dependent" })
    }),
    firearmProfile: Object.freeze({
      family: "M4 / AR platform",
      defaultCaliber: "5.56 NATO"
    })
  });

  if (window.SCZN3ZeroingPlatform) {
    window.SCZN3ZeroingPlatform.registerMission({
      id: "M4_25M_300M_ZERO",
      aliases: ["m4_25m_zero", "M4_TARGET_AUTHORITY_v1_ORIGINAL", "ST-M16A2/M4"],
      targetAuthority: Object.freeze({
        id: window.SCZN3_M4_CONFIG.target.targetId,
        geometry: window.SCZN3_M4_CONFIG.target.geometry
      }),
      correctionAuthority: Object.freeze({ route: "/api/authority/m4", owner: "backend" }),
      sessionContext: Object.freeze({ fields: ["sightSystem", "distance", "distanceUnit", "adjustmentUnit"] }),
      confirmationRules: window.SCZN3_M4_CONFIG.zeroingMission,
      artwork: Object.freeze({
        workspace: "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg",
        authority: window.SCZN3_M4_CONFIG.target.authorityAsset
      })
    });
  }
})();
