(function () {
  "use strict";

  window.SCZN3_M4_CONFIG = Object.freeze({
    target: Object.freeze({
      vendor: "Baker",
      sku: "ST-M16A2/M4",
      product: "M4 Carbine • 25 Meter Zeroing Target",
      authority: "M4 Zeroing",
      qrUrl: "https://tap-n-score.com/?v=baker&sku=ST-M16A2%2FM4",
      qrAsset: "assets/BAKER_ST-M16A2-M4_QR.png",
      targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      targetName: "M4 Carbine • 25 Meter Zeroing Target",
      authorityAsset: "assets/BAKER_ST-M16A2-M4_SMART_TARGET.svg",
      geometry: Object.freeze({
        imageWidth: 1024,
        imageHeight: 1270,
        gridLeftPx: 95,
        gridTopPx: 147,
        gridRightPx: 932,
        gridBottomPx: 1012,
        gridSquarePx: 59.8,
        gridSquareInches: 1,
        bullCoordinate: Object.freeze({
          xPercent: 50,
          yPercent: 48.7,
          source: "M4-BULL-COORDINATE-AUTHORITY-2026-07-28"
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
        equipmentAuthorityRecordId: "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"
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
