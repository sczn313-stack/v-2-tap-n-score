(function registerGovernedZeroingTargetProfiles(global) {
  "use strict";

  const platform = global.SCZN3ZeroingPlatform;
  if (!platform) throw new Error("The shared zeroing capability must load before its Target Profiles.");

  const shared = {
    capabilityId: platform.CAPABILITY_ID,
    schemaVersion: platform.EXPERIENCE_SCHEMA_VERSION
  };

  const standardM16A2Presentation = Object.freeze({
    confirmationInstruction: "Then shoot a new confirmation group. You can use this target or a new one. Take a photo of that target, then tap only the new confirmation bullet holes.",
    confirmationAudio: "assets/audio/episode60/chapter4/01-confirmation-sequence.wav",
    confirmedInstruction: "Your zero is confirmed. Turn the rear elevation drum one click COUNTERCLOCKWISE back to 8/3 for your 300-meter setting.",
    targetZero: "300 m"
  });

  function registerStandardM16A2Profile(profile) {
    platform.registerTargetProfile({
      ...shared,
      targetProfileId: profile.targetProfileId,
      targetProfileVersion: profile.targetProfileVersion,
      authorityFamily: "mfam",
      entryMode: "photo",
      confirmationMode: "governed",
      confirmationRules: Object.freeze({
        confirmationMinimumShots: 3,
        confirmationResidualToleranceInches: 1
      }),
      exactAsset: Object.freeze(profile.exactAsset),
      presentation: standardM16A2Presentation
    });
  }

  registerStandardM16A2Profile({
    targetProfileId: "baker_m16a2_25m_zero",
    targetProfileVersion: "BAKER_M16A2_25M_AUTHORITY_v1",
    exactAsset: {
      sha256: "250f77079bd13198a8d3c301e204f58c8e96752631f9aec479c29f8f2f5c7993",
      widthPx: 773,
      heightPx: 1000,
      authorityId: "baker-m16a2-25m-photo-registration-v1",
      authoritySource: "registered_exact_asset",
      coordinateSystemVersion: "BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1"
    }
  });

  registerStandardM16A2Profile({
    targetProfileId: "speedwell_dodm4_m16a2_25m_zero",
    targetProfileVersion: "SPEEDWELL_DODM4_M16A2_AUTHORITY_v1",
    exactAsset: {
      sha256: "1f728b8c8030ced399f9869105d7e2092866d550f28c4c9c00551786ea0cf5b4",
      widthPx: 480,
      heightPx: 639,
      authorityId: "speedwell-dodm4-m16a2-photo-registration-v1",
      authoritySource: "registered_exact_asset",
      coordinateSystemVersion: "SPEEDWELL_M16A2_PUBLISHER_FACE_AUTHORITY_v1"
    }
  });

  registerStandardM16A2Profile({
    targetProfileId: "army_nsn_6920_01_395_2949_m16a2_25m_zero",
    targetProfileVersion: "ARMY_NSN_6920_01_395_2949_M16A2_AUTHORITY_v1",
    exactAsset: {
      sha256: "b5ee5e8dd5bfb71c74d6c9faae3d730f052c25b9d3770e30c303c3cd70e650ed",
      widthPx: 522,
      heightPx: 668,
      authorityId: "army-nsn-6920-01-395-2949-m16a2-photo-registration-v1",
      authoritySource: "registered_exact_asset",
      coordinateSystemVersion: "ARMY_NSN_6920_01_395_2949_M16A2_FACE_AUTHORITY_v1"
    }
  });

  registerStandardM16A2Profile({
    targetProfileId: "qualification_m16a2_25m_zero",
    targetProfileVersion: "QUALIFICATION_M16A2_25M_AUTHORITY_v1",
    exactAsset: {
      sha256: "c3028042b6ba600ef983a2fd1cbb035d4f05c4687f8ec54c359ea86369896290",
      widthPx: 1500,
      heightPx: 1967,
      authorityId: "qualification-m16a2-photo-registration-v1",
      authoritySource: "registered_exact_asset",
      coordinateSystemVersion: "QUALIFICATION_M16A2_PUBLISHER_FACE_AUTHORITY_v1"
    }
  });

  registerStandardM16A2Profile({
    targetProfileId: "gunfun_32120_m16a2_green_25m_zero",
    targetProfileVersion: "GUNFUN_32120_M16A2_GREEN_AUTHORITY_v1",
    exactAsset: {
      sha256: "2be8f6e1b8e92e7ec6011042b8165314b8c83fda31a6b30f26bf44dec34859a3",
      widthPx: 400,
      heightPx: 480,
      authorityId: "gunfun-32120-m16a2-green-photo-registration-v1",
      authoritySource: "registered_exact_asset",
      coordinateSystemVersion: "GUNFUN_32120_M16A2_GREEN_FACE_AUTHORITY_v1"
    }
  });

  platform.registerTargetProfile({
    ...shared,
    targetProfileId: "m4_25m_zero",
    targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    authorityFamily: "mfam",
    entryMode: "registered-reference",
    confirmationMode: "governed",
    confirmationRules: Object.freeze({
      confirmationMinimumShots: 3,
      confirmationResidualToleranceInches: 1
    }),
    presentation: Object.freeze({ targetZero: "300 m" }),
    exactAsset: Object.freeze({
      sha256: "a562a0f5ce3e0c3ffd2ad3fbd886aed277dad82d99bd37edf8d6bed380b2b9d4",
      widthPx: 2550,
      heightPx: 3300,
      authorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      authoritySource: "governed_m4_workspace_asset"
    }),
    entryEvidence: Object.freeze({
      dataUrl: "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg",
      name: "M4/M16 Series Weapons 25M Zero Short Range and Pistol Marksmanship Target",
      type: "image/svg+xml",
      assetRole: "governed-registered-reference-target",
      registrationStatus: "complete",
      registrationAuthoritySource: "governed_m4_workspace_asset",
      registrationAuthorityId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      canonicalAssetSha256: "e2be00e15b82b8f775fcb0934aaac7413ee44abcb53df29e44f07ac2c2b25b70",
      presentationAssetSha256: "a562a0f5ce3e0c3ffd2ad3fbd886aed277dad82d99bd37edf8d6bed380b2b9d4",
      targetProfileId: "m4_25m_zero",
      targetId: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      publisher: "Baker",
      vendor: "Baker",
      sku: "ST-M16A2/M4",
      product: "M4/M16 Series Weapons • 25M Zero Target",
      authority: "M4 Zeroing",
      imageWidthPx: 2550,
      imageHeightPx: 3300
    })
  });

  platform.registerTargetProfile({
    ...shared,
    targetProfileId: "baker_st_100yd_smart_zero",
    targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
    authorityFamily: "universal",
    entryMode: "registered-reference",
    confirmationMode: "evidence",
    entryEvidence: Object.freeze({
      dataUrl: "assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png",
      name: "Baker 100 Yard Smart Target",
      type: "image/png",
      assetRole: "registered-reference-target",
      registrationStatus: "complete",
      registrationAuthoritySource: "registered_exact_asset",
      registrationAuthorityId: "baker-st-100yd-smart-photo-registration-v1",
      registrationPackageId: "baker-st-100yd-smart-photo-registration-v1",
      registrationPackageVersion: "1",
      canonicalCoordinateSystemVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
      canonicalAssetSha256: "0731aed37dc1e2a6ab0f57517bded6a9b97110dc73cf8c1a7a20d516175e3fbf",
      imageWidthPx: 1102,
      imageHeightPx: 1713,
      targetProfileId: "baker_st_100yd_smart_zero",
      targetId: "BAKER_ST_100YD_SMART",
      publisher: "Baker Targets"
    })
  });
})(window);
