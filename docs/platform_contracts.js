(function (global) {
  "use strict";

  const VERSION = "episode54-item3-v1";
  const SEC_ADAPTER_SCHEMA_VERSION = "sczn3-sec-adapter-v1";
  const PENDING_TARGET_PROFILE_KEY = "SCZN3_PENDING_TARGET_PROFILE";
  const SEMANTIC_ORDER = Object.freeze([
    "evidence",
    "measurement",
    "recommendation",
    "execution",
    "validation",
    "preservation"
  ]);
  const PLATFORM_OWNERS = Object.freeze({
    smartTargetWorkspace: "SCZN3SmartTargetWorkspace",
    secFramework: "SCZN3SEC",
    secComponents: "SCZN3SECComponents",
    targetAdapters: "SCZN3TargetAdapters",
    partnershipIdentity: "SCZN3PartnershipIdentity"
  });
  const FORBIDDEN_ADAPTER_KEYS = Object.freeze([
    "shellHtml",
    "shellGeometry",
    "outerShell",
    "structuralCss",
    "gridRows",
    "accordionBehavior",
    "navigation",
    "actionRegionGeometry",
    "responsiveBehavior",
    "viewportBehavior",
    "processingSystem",
    "score",
    "scoringFormula",
    "classify",
    "calculateCorrection",
    "calculatePenalty",
    "qualificationDecision",
    "missionRules",
    "executeMission"
  ]);
  const SCORING_PRESENTATION_FAMILIES = Object.freeze({
    EVIDENCE_ONLY: "evidence-only",
    ZEROING_CORRECTION: "zeroing-correction",
    HIGHEST_SCORE_WINS: "highest-score-wins",
    LOWEST_SCORE_WINS: "lowest-score-wins",
    QUALIFICATION_PASS_FAIL: "qualification-pass-fail"
  });
  const REGISTERED_PRESENTATION_FAMILIES = Object.freeze(Object.values(SCORING_PRESENTATION_FAMILIES));
  const secAdapterRegistry = new Map();
  const executionFamilyAdapterRegistry = new Map();
  const TARGET_PROFILE_DEFINITIONS = Object.freeze([
    Object.freeze({
      targetProfileId: "baker_m16a2_25m_zero",
      targetProfileVersion: "BAKER_M16A2_25M_AUTHORITY_v1",
      targetProfileLabel: "Baker M16A2 25 Meter Zeroing Target",
      missionLabel: "25 Meter Zero",
      aliases: Object.freeze(["BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "ST-M16A2", sku: "ST-M16A2", productLabel: "Baker M16A2 25 Meter Zeroing Target", productUrl: "https://bakertargets.com/product/2-sided-25-meter-m16a2m4-zeroing-target/" })
    }),
    Object.freeze({
      targetProfileId: "speedwell_dodm4_m16a2_25m_zero",
      targetProfileVersion: "SPEEDWELL_DODM4_M16A2_AUTHORITY_v1",
      targetProfileLabel: "Speedwell DODM4 M16A2 25 Meter Zeroing Target",
      missionLabel: "25 Meter Zero",
      aliases: Object.freeze(["SPEEDWELL_M16A2_PUBLISHER_FACE_AUTHORITY_v1"]),
      publisherIdentity: Object.freeze({ publisherId: "speedwell", publisherLabel: "Speedwell", publisherUrl: "https://www.speedwelltargets.com", publisherLinkLabel: "SpeedwellTargets.com" }),
      productIdentity: Object.freeze({ productId: "DODM4-M16A2", sku: "DODM4", nsn: "6920-01-395-2949", productLabel: "DOD M4 / M16A2 Two-Sided Target — M16A2 Face" })
    }),
    Object.freeze({
      targetProfileId: "army_nsn_6920_01_395_2949_m16a2_25m_zero",
      targetProfileVersion: "ARMY_NSN_6920_01_395_2949_M16A2_AUTHORITY_v1",
      targetProfileLabel: "Army-Issued M16A2 25 Meter Zeroing Target",
      missionLabel: "25 Meter Zero",
      aliases: Object.freeze(["ARMY_NSN_6920_01_395_2949_M16A2_FACE_AUTHORITY_v1"]),
      publisherIdentity: Object.freeze({ publisherId: "us-army", publisherLabel: "Headquarters, Department of the Army", publisherUrl: "https://www.army.mil", publisherLinkLabel: "Army.mil" }),
      productIdentity: Object.freeze({ productId: "NSN-6920-01-395-2949-M16A2", nsn: "6920-01-395-2949", productLabel: "Issued M16A2/A3 25 Meter Zero Target Face" })
    }),
    Object.freeze({
      targetProfileId: "m4_25m_zero",
      targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
      targetProfileLabel: "M4 25m Zero",
      missionLabel: "25 Meter Zero",
      aliases: Object.freeze(["M4_TARGET_AUTHORITY_v1_ORIGINAL"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "ST-M16A2/M4", sku: "ST-M16A2/M4", productLabel: "M4/M16 Series Weapons • 25M Zero Target" })
    }),
    Object.freeze({
      targetProfileId: "baker_st_100yd_smart_zero",
      targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
      targetProfileLabel: "100 Yard Bullseye",
      missionLabel: "100 Yard Zero",
      aliases: Object.freeze(["BAKER_ST_100YD_SMART"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "ST-100YD-SMART", sku: "ST-100YD-SMART", productLabel: "Baker 100 Yard Smart Target", productUrl: "https://bakertargets.com/product/100-yard-bulls-eye-rifle-target-smart-target-version/" })
    }),
    Object.freeze({
      targetProfileId: "gssf_ac_1",
      targetProfileVersion: "1",
      targetProfileLabel: "GSSF Practice",
      missionLabel: "",
      aliases: Object.freeze([]),
      publisherIdentity: Object.freeze({ publisherId: "gssf", publisherLabel: "Glock Sport Shooting Foundation", publisherUrl: "", publisherLinkLabel: "" }),
      productIdentity: Object.freeze({ productId: "gssf_ac_1", sku: "AC-1", productLabel: "GSSF AC-1" })
    }),
    Object.freeze({
      targetProfileId: "baker_sl_st1_practice",
      targetProfileVersion: "1",
      targetProfileLabel: "USPSA Practice Target",
      missionLabel: "",
      aliases: Object.freeze(["BAKER_SL_ST1", "baker_sl_st1"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "BAKER_SL_ST1", sku: "SL-ST1", productLabel: "Silhouette Target (USPSA)" })
    }),
    Object.freeze({
      targetProfileId: "gunfun_22740_vital_dude",
      targetProfileVersion: "1",
      targetProfileLabel: "Vital Dude",
      missionLabel: "Evidence Capture",
      aliases: Object.freeze(["GUNFUN_22740_VITAL_DUDE", "gunfun-22740-vital-dude", "gunfun_22740"]),
      publisherIdentity: Object.freeze({ publisherId: "gunfun", publisherLabel: "GunFun", publisherUrl: "https://gunfun.com", publisherLinkLabel: "GunFun.com" }),
      productIdentity: Object.freeze({ productId: "GUNFUN_22740_VITAL_DUDE", sku: "22740", productLabel: "Vital Dude" })
    }),
    Object.freeze({
      targetProfileId: "idpa_silhouette_sl_st2",
      targetProfileVersion: "1",
      targetProfileLabel: "Silhouette Target (IDPA)",
      missionLabel: "Timed Pair — 7 Yards",
      aliases: Object.freeze(["BAKER_SL_ST2", "baker_sl_st2", "baker-sl-st2"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "BAKER_SL_ST2", sku: "SL-ST2", productLabel: "Silhouette Target (IDPA)" })
    }),
    Object.freeze({
      targetProfileId: "baker_gf_db",
      targetProfileVersion: "1",
      targetProfileLabel: "Dartboard Target",
      missionLabel: "Baker Range Games",
      aliases: Object.freeze(["BAKER_GF_DB", "GF-DB", "baker-gf-db"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "BAKER_GF_DB", sku: "GF-DB", productLabel: "Dartboard Target" })
    }),
    Object.freeze({
      targetProfileId: "baker_gf_bp",
      targetProfileVersion: "1",
      targetProfileLabel: "Bowling Pins Target",
      missionLabel: "Ten-Shot Pin Challenge",
      aliases: Object.freeze(["BAKER_GF_BP", "GF-BP", "baker-gf-bp"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "BAKER_GF_BP", sku: "GF-BP", productLabel: "Bowling Pins Target" })
    }),
    Object.freeze({
      targetProfileId: "ez2c_dot_torture_17",
      targetProfileVersion: "1",
      targetProfileLabel: "Dot Torture",
      missionLabel: "50-Round Course",
      aliases: Object.freeze(["EZ2C_STYLE_17", "dot-torture", "dot_torture_ez2c_style_17"]),
      publisherIdentity: Object.freeze({ publisherId: "ez2c-targets", publisherLabel: "EZ2C Targets", publisherUrl: "https://www.ez2ctargets.com", publisherLinkLabel: "EZ2CTargets.com" }),
      productIdentity: Object.freeze({ productId: "EZ2C_STYLE_17", sku: "Style 17", productLabel: "Dot Torture Target" })
    }),
    Object.freeze({
      targetProfileId: "baker_gf_bb_c",
      targetProfileVersion: "1",
      targetProfileLabel: "Billiard Balls",
      missionLabel: "Ordered Billiard Sequence",
      aliases: Object.freeze(["BAKER_GF_BB_C", "GF-BB-C", "billiard-balls"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "BAKER_GF_BB_C", sku: "GF-BB-C", productLabel: "Billiard Ball Color Target" })
    }),
    Object.freeze({
      targetProfileId: "baker_gf_battleship",
      targetProfileVersion: "1",
      targetProfileLabel: "Battleship Target",
      missionLabel: "Battle for the Seas",
      aliases: Object.freeze(["BAKER_GF_BATTLESHIP", "GF-Battleship", "baker-gf-battleship"]),
      publisherIdentity: Object.freeze({ publisherId: "baker-targets", publisherLabel: "Baker Targets", publisherUrl: "https://bakertargets.com", publisherLinkLabel: "BakerTargets.com" }),
      productIdentity: Object.freeze({ productId: "BAKER_GF_BATTLESHIP", sku: "GF-Battleship", productLabel: "Battleship Target" })
    })
  ]);

  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function inspectForbiddenAdapterOwnership(value, path = "adapter", errors = [], seen = new Set()) {
    if (!value || typeof value !== "object" || seen.has(value)) return errors;
    seen.add(value);
    Object.entries(value).forEach(([key, nested]) => {
      if (FORBIDDEN_ADAPTER_KEYS.includes(key)) errors.push(`platform_or_authority_owned_${path}.${key}`);
      if (typeof nested === "function") errors.push(`adapter_function_not_allowed_${path}.${key}`);
      else inspectForbiddenAdapterOwnership(nested, `${path}.${key}`, errors, seen);
    });
    return errors;
  }

  function validateLegacyTargetAdapter(definition) {
    const errors = [];
    if (!isRecord(definition)) return { ok: false, errors: ["adapter_definition_required"] };
    if (typeof definition.adapterId !== "string" || !definition.adapterId.trim()) errors.push("adapter_id_required");
    if (typeof definition.targetProfileId !== "string" || !definition.targetProfileId.trim()) errors.push("target_profile_id_required");
    if (!isRecord(definition.contentModel)) errors.push("content_model_required");
    FORBIDDEN_ADAPTER_KEYS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(definition, key)) errors.push(`platform_owned_${key}`);
    });
    return { ok: errors.length === 0, errors };
  }

  function validateAuthorityReference(reference, name, errors) {
    if (!isRecord(reference)) {
      errors.push(`${name}_authority_reference_required`);
      return;
    }
    if (!clean(reference.packageType)) errors.push(`${name}_package_type_required`);
    if (reference.source !== "backend-authoritative") errors.push(`${name}_must_be_backend_authoritative`);
  }

  function validateTargetAdapter(definition) {
    const errors = [];
    if (!isRecord(definition)) return { ok: false, errors: ["adapter_definition_required"] };
    if (definition.schemaVersion !== SEC_ADAPTER_SCHEMA_VERSION) errors.push("sec_adapter_schema_version_invalid");
    if (typeof definition.adapterId !== "string" || !definition.adapterId.trim()) errors.push("adapter_id_required");
    if (!isRecord(definition.targetProfileRef)) errors.push("target_profile_reference_required");
    else {
      const profile = registeredTargetProfile(definition.targetProfileRef.targetProfileId);
      if (!profile) errors.push("target_profile_unregistered");
      else if (profile.targetProfileVersion !== clean(definition.targetProfileRef.targetProfileVersion)) errors.push("target_profile_version_mismatch");
    }
    if (!isRecord(definition.authorityReferences)) errors.push("authority_references_required");
    else {
      validateAuthorityReference(definition.authorityReferences.session, "session", errors);
      validateAuthorityReference(definition.authorityReferences.result, "result", errors);
    }
    if (!REGISTERED_PRESENTATION_FAMILIES.includes(definition.scoringPresentationFamily)) errors.push("scoring_presentation_family_unregistered");
    if (definition.scoringPresentationFamily === SCORING_PRESENTATION_FAMILIES.QUALIFICATION_PASS_FAIL) {
      const qualification = definition.authorityReferences && definition.authorityReferences.qualification;
      if (!isRecord(qualification) || qualification.source !== "backend-authoritative" || !clean(qualification.packageType)) {
        errors.push("qualification_presentation_requires_backend_authority");
      }
    }
    if (!isRecord(definition.contentModel)) errors.push("content_model_required");
    else {
      const componentValidation = validateSECComponentModel(definition.contentModel);
      errors.push(...componentValidation.errors);
      if (!isRecord(definition.contentModel.result)) errors.push("result_model_required");
      else if (!clean(definition.contentModel.result.authorityRef)) errors.push("result_authority_reference_required");
    }
    inspectForbiddenAdapterOwnership(definition, "adapter", errors);
    return { ok: errors.length === 0, errors };
  }

  function validateSECComponentModel(model) {
    const errors = [];
    if (!isRecord(model)) return { ok: false, errors: ["component_model_required"] };
    const components = Array.isArray(model.components)
      ? model.components
      : (Array.isArray(model.stages) ? model.stages.map(stage => ({ stage })) : []);
    components.forEach((component, index) => {
      if (!isRecord(component)) errors.push(`semantic_component_${index}_invalid`);
      else {
        if (!clean(component.modelRef)) errors.push(`semantic_component_${index}_model_reference_required`);
        if (!clean(component.authorityRef)) errors.push(`semantic_component_${index}_authority_reference_required`);
      }
    });
    const stages = components.map(component => isRecord(component) ? component.stage : component);
    let priorIndex = -1;
    stages.forEach(stage => {
      if (stage === "result") {
        errors.push("result_is_not_a_semantic_stage");
        return;
      }
      const index = SEMANTIC_ORDER.indexOf(stage);
      if (index < 0) errors.push(`unknown_semantic_stage_${stage}`);
      else if (index <= priorIndex) errors.push("semantic_order_invalid");
      priorIndex = Math.max(priorIndex, index);
    });
    return { ok: errors.length === 0, errors };
  }

  function deepFreeze(value, seen = new Set()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    Object.values(value).forEach(nested => deepFreeze(nested, seen));
    return Object.freeze(value);
  }

  function registerSECAdapter(definition) {
    const validation = validateTargetAdapter(definition);
    if (!validation.ok) throw new Error(`invalid_sec_adapter:${validation.errors.join(",")}`);
    if (secAdapterRegistry.has(definition.adapterId)) throw new Error(`duplicate_sec_adapter:${definition.adapterId}`);
    const frozen = deepFreeze(definition);
    secAdapterRegistry.set(definition.adapterId, frozen);
    return frozen;
  }

  function registeredSECAdapter(adapterId) {
    return secAdapterRegistry.get(clean(adapterId)) || null;
  }

  function registeredSECAdapters() {
    return Object.freeze(Array.from(secAdapterRegistry.values()));
  }

  function validateExecutionFamilyAdapter(definition) {
    const errors = [];
    if (!isRecord(definition)) return { ok: false, errors: ["execution_family_adapter_required"] };
    ["adapterId", "missionFamily", "resultPackageType", "resultPackageVersion"].forEach(key => {
      if (!clean(definition[key])) errors.push(`${key}_required`);
    });
    if (!REGISTERED_PRESENTATION_FAMILIES.includes(definition.scoringPresentationFamily)) errors.push("scoring_presentation_family_unregistered");
    if (!isRecord(definition.authorityReferences)) errors.push("authority_references_required");
    else {
      validateAuthorityReference(definition.authorityReferences.session, "session", errors);
      validateAuthorityReference(definition.authorityReferences.result, "result", errors);
      validateAuthorityReference(definition.authorityReferences.executionContract, "execution_contract", errors);
    }
    if (!isRecord(definition.contentModel)) errors.push("content_model_required");
    else errors.push(...validateSECComponentModel(definition.contentModel).errors);
    inspectForbiddenAdapterOwnership(definition, "executionFamilyAdapter", errors);
    return { ok: errors.length === 0, errors };
  }

  function registerExecutionFamilyAdapter(definition) {
    const validation = validateExecutionFamilyAdapter(definition);
    if (!validation.ok) throw new Error(`invalid_execution_family_adapter:${validation.errors.join(",")}`);
    if (executionFamilyAdapterRegistry.has(definition.adapterId)) throw new Error(`duplicate_execution_family_adapter:${definition.adapterId}`);
    const frozen = deepFreeze(definition);
    executionFamilyAdapterRegistry.set(definition.adapterId, frozen);
    return frozen;
  }

  function createExecutionFamilyViewModel(adapterId, input) {
    const definition = executionFamilyAdapterRegistry.get(clean(adapterId));
    const session = input && input.session;
    const result = input && input.resultPackage || canonicalAuthorityPackage(session);
    const contract = result && result.executionContract;
    const target = result && result.target;
    const errors = [];
    if (!definition) errors.push("execution_family_adapter_unregistered");
    if (!isRecord(session)) errors.push("authoritative_session_required");
    if (!isRecord(result) || result.authoritySource !== "backend-authoritative") errors.push("backend_authoritative_result_required");
    if (!isRecord(contract) || !clean(contract.contractId) || !clean(contract.contractVersion) || !clean(contract.contractFingerprint)) errors.push("execution_contract_identity_required");
    if (definition && contract && contract.secAdapterFamilyId !== definition.adapterId) errors.push("execution_family_adapter_mismatch");
    if (definition && result && (result.missionFamily !== definition.missionFamily || result.resultPackageType !== definition.resultPackageType || result.resultPackageVersion !== definition.resultPackageVersion)) errors.push("execution_family_result_mismatch");
    if (!isRecord(target) || !clean(target.id) || !clean(target.version) || !isRecord(target.publisher) || !isRecord(target.product)) errors.push("registered_product_identity_required");
    if (errors.length) return { ok: false, errors, value: null };
    return { ok: true, errors: [], value: Object.freeze({
      adapterId: definition.adapterId,
      targetProfileIdentity: Object.freeze({
        targetProfileId: clean(target.id), targetProfileVersion: clean(target.version),
        targetProfileLabel: clean(target.product.name), missionLabel: clean(definition.missionLabel),
        publisherIdentity: target.publisher, productIdentity: target.product
      }),
      scoringPresentationFamily: definition.scoringPresentationFamily,
      semanticComponents: definition.contentModel.components,
      result: Object.freeze({ authorityRef: definition.contentModel.result.authorityRef, package: result }),
      session,
      executionContract: contract,
      preservationCapabilities: definition.preservationCapabilities || Object.freeze([])
    }) };
  }

  function canonicalAuthorityPackage(session) {
    if (!isRecord(session)) return null;
    return session.authorityPackage
      || session.backendAuthorityPackage
      || session.ugeoAuthorityPackage
      || session.m4AuthorityPackage
      || null;
  }

  function authorityPackageType(pkg) {
    return clean(pkg && (pkg.resultPackageType || pkg.result_package_type));
  }

  function explicitTargetProfileVersions(session, resultPackage) {
    const target = isRecord(resultPackage && resultPackage.target) ? resultPackage.target : {};
    return [
      session && (session.targetProfileVersion || session.target_profile_version),
      resultPackage && (resultPackage.targetProfileVersion || resultPackage.target_profile_version),
      target.targetProfileVersion || target.target_profile_version
    ].map(clean).filter((value, index, values) => value && values.indexOf(value) === index);
  }

  function createSECViewModel(adapterId, input) {
    const definition = registeredSECAdapter(adapterId);
    if (!definition) return { ok: false, errors: ["sec_adapter_unregistered"], value: null };
    if (!isRecord(input) || !isRecord(input.session)) return { ok: false, errors: ["authoritative_session_required"], value: null };
    const session = input.session;
    const suppliedResultPackage = isRecord(input.resultPackage);
    const resultPackage = suppliedResultPackage ? input.resultPackage : canonicalAuthorityPackage(session);
    const errors = [];
    const profile = identityRecord(session, resultPackage);
    if (!profile) errors.push("authoritative_target_profile_required");
    else {
      if (profile.targetProfileId !== definition.targetProfileRef.targetProfileId) errors.push("target_profile_adapter_mismatch");
      if (profile.targetProfileVersion !== definition.targetProfileRef.targetProfileVersion) errors.push("target_profile_version_adapter_mismatch");
      if (explicitTargetProfileVersions(session, resultPackage).some(version => version !== definition.targetProfileRef.targetProfileVersion)) {
        errors.push("authoritative_target_profile_version_conflict");
      }
    }
    if (!isRecord(resultPackage)) errors.push("authoritative_result_package_required");
    else {
      const expected = clean(definition.authorityReferences.result.packageType).toLowerCase();
      const actual = authorityPackageType(resultPackage).toLowerCase();
      if (!actual) errors.push("authoritative_result_package_type_required");
      else if (actual !== expected) errors.push("authoritative_result_package_type_mismatch");
      const source = clean(input.resultSource || resultPackage.authoritySource || resultPackage.authority_source);
      if ((suppliedResultPackage && source !== "backend-authoritative") || (source && source !== "backend-authoritative")) {
        errors.push("frontend_result_authority_rejected");
      }
    }
    if (errors.length) return { ok: false, errors, value: null };
    return {
      ok: true,
      errors: [],
      value: Object.freeze({
        schemaVersion: SEC_ADAPTER_SCHEMA_VERSION,
        adapterId: definition.adapterId,
        targetProfileIdentity: profile,
        publisherIdentity: profile.publisherIdentity,
        productIdentity: profile.productIdentity,
        scoringPresentationFamily: definition.scoringPresentationFamily,
        result: Object.freeze({ authorityRef: definition.contentModel.result.authorityRef, package: resultPackage }),
        semanticComponents: definition.contentModel.components,
        session,
        preservationCapabilities: definition.preservationCapabilities || Object.freeze([])
      })
    };
  }

  function validatePartnershipIdentity(identity) {
    if (identity === null || identity === undefined) return { ok: true, errors: [] };
    if (!isRecord(identity)) return { ok: false, errors: ["partnership_identity_invalid"] };
    const errors = [];
    if (Object.prototype.hasOwnProperty.call(identity, "targetProfileLabel")) errors.push("target_profile_identity_must_remain_separate");
    if (Object.prototype.hasOwnProperty.call(identity, "missionLabel")) errors.push("mission_identity_must_remain_separate");
    return { ok: errors.length === 0, errors };
  }

  function clean(value) {
    return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  }

  function identityCandidates(source) {
    if (!isRecord(source)) return [];
    const target = isRecord(source.target) ? source.target : {};
    const authority = isRecord(source.targetAuthority) ? source.targetAuthority : {};
    const snapshot = isRecord(source.matrixSnapshot) ? source.matrixSnapshot : {};
    return [
      source.targetProfileId, source.target_profile_id, source.targetId, source.smartTargetId,
      target.targetProfileId, target.target_profile_id, target.targetId, target.smartTargetId,
      authority.targetProfileId, authority.target_profile_id, authority.targetId,
      snapshot.targetProfileId, snapshot.target_profile_id, snapshot.targetId
    ].map(clean).filter(Boolean);
  }

  function targetProfileId(source) {
    return identityCandidates(source)[0] || clean(source);
  }

  function writePendingTargetProfile(source) {
    const targetId = targetProfileId(source);
    if (!targetId) return;
    const encoded = JSON.stringify({ targetId });
    try {
      localStorage.setItem(PENDING_TARGET_PROFILE_KEY, encoded);
      sessionStorage.setItem(PENDING_TARGET_PROFILE_KEY, encoded);
    } catch (error) {}
  }

  function registeredTargetProfile(value) {
    const candidate = clean(value).toLowerCase();
    if (!candidate) return null;
    return TARGET_PROFILE_DEFINITIONS.find(definition => (
      definition.targetProfileId.toLowerCase() === candidate
      || definition.aliases.some(alias => alias.toLowerCase() === candidate)
    )) || null;
  }

  function resolveTargetProfile(...sources) {
    for (const source of sources) {
      for (const candidate of identityCandidates(source)) {
        const definition = registeredTargetProfile(candidate);
        if (definition) return definition;
      }
      const direct = registeredTargetProfile(source);
      if (direct) return direct;
    }
    return null;
  }

  function validateTargetProfileIdentity(identity) {
    if (!isRecord(identity)) return { ok: false, errors: ["target_profile_identity_required"] };
    const required = ["targetProfileId", "targetProfileVersion", "targetProfileLabel"];
    const errors = required.filter(key => !clean(identity[key])).map(key => `${key}_required`);
    const partnership = validatePartnershipIdentity(identity.publisherIdentity);
    errors.push(...partnership.errors);
    if (identity.productIdentity !== null && identity.productIdentity !== undefined && !isRecord(identity.productIdentity)) {
      errors.push("product_identity_invalid");
    }
    return { ok: errors.length === 0, errors };
  }

  function targetProfileDisplay(identity) {
    const resolved = resolveTargetProfile(identity);
    if (!resolved) return "";
    return [resolved.targetProfileLabel, resolved.missionLabel].filter(Boolean).join(" • ");
  }

  function identityRecord(...sources) {
    const resolved = resolveTargetProfile(...sources);
    if (!resolved) return null;
    return Object.freeze({
      targetProfileId: resolved.targetProfileId,
      targetProfileVersion: resolved.targetProfileVersion,
      targetProfileLabel: resolved.targetProfileLabel,
      missionLabel: resolved.missionLabel,
      publisherIdentity: resolved.publisherIdentity,
      productIdentity: resolved.productIdentity
    });
  }

  function applyTargetProfileIdentity(element, ...sources) {
    if (!element) return null;
    const identity = identityRecord(...sources, element.dataset.targetProfileIdentity || "");
    if (!identity) return null;
    element.textContent = targetProfileDisplay(identity);
    element.dataset.targetProfileId = identity.targetProfileId;
    element.dataset.targetProfileVersion = identity.targetProfileVersion;
    return identity;
  }

  function hydrateTargetProfileIdentities(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    return Array.from(root.querySelectorAll("[data-sczn3-target-profile-identity]"))
      .map(element => applyTargetProfileIdentity(element, element.dataset.sczn3TargetProfileIdentity))
      .filter(Boolean);
  }

  function applyPartnershipIdentity(element, ...sources) {
    if (!element) return null;
    const identity = identityRecord(...sources, element.dataset.sczn3PartnershipSurface || "");
    const publisher = identity && identity.publisherIdentity;
    if (!publisher) {
      element.hidden = true;
      return null;
    }
    element.hidden = false;
    element.dataset.publisherId = publisher.publisherId;
    const label = element.querySelector("[data-sczn3-publisher-label]");
    if (label) label.textContent = publisher.publisherLabel;
    const link = element.querySelector("[data-sczn3-publisher-link]");
    if (link && publisher.publisherUrl) {
      link.hidden = false;
      link.href = publisher.publisherUrl;
      link.textContent = publisher.publisherLinkLabel || publisher.publisherLabel;
    } else if (link) link.hidden = true;
    return publisher;
  }

  function hydratePartnershipIdentities(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return [];
    return Array.from(root.querySelectorAll("[data-sczn3-partnership-surface]"))
      .map(element => applyPartnershipIdentity(element, element.dataset.sczn3PartnershipSurface))
      .filter(Boolean);
  }

  function directionalAuthorityRelease(authorityPackage) {
    if (!authorityPackage || typeof authorityPackage !== "object") {
      return Object.freeze({ releasable: false, status: "unavailable", reason: "authority_package_unavailable" });
    }
    const registration = authorityPackage.targetImageRegistrationEvidence;
    const audit = authorityPackage.authorityAuditEnvelope || {};
    const hasDirectionalResult = !!(
      authorityPackage.correction
      || authorityPackage.clicks
      || (authorityPackage.renderCoordinates && authorityPackage.renderCoordinates.vector)
      || audit.calculatedCorrection
    );
    if (!hasDirectionalResult || !registration) {
      return Object.freeze({ releasable: true, status: "not-applicable", reason: null });
    }
    const exactCanonical = registration.registrationMethod === "exact_canonical_representation";
    const orientation = registration.orientationEvidence || {};
    const reconciliation = authorityPackage.directionalReconciliation || {};
    const orientationProven = exactCanonical || orientation.status === "proven";
    const reconciliationProven = reconciliation.status === "reconciled"
      || (exactCanonical && !reconciliation.status);
    const releaseRecorded = !audit.releaseStatus || audit.releaseStatus === "released";
    if (!orientationProven) {
      return Object.freeze({ releasable: false, status: "withheld", reason: "target_orientation_unverified" });
    }
    if (!reconciliationProven || !releaseRecorded) {
      return Object.freeze({ releasable: false, status: "withheld", reason: "source_direction_reconciliation_failed" });
    }
    return Object.freeze({ releasable: true, status: "released", reason: null });
  }

  global.SCZN3PlatformContracts = Object.freeze({
    version: VERSION,
    secAdapterSchemaVersion: SEC_ADAPTER_SCHEMA_VERSION,
    owners: PLATFORM_OWNERS,
    semanticOrder: SEMANTIC_ORDER,
    scoringPresentationFamilies: SCORING_PRESENTATION_FAMILIES,
    forbiddenAdapterKeys: FORBIDDEN_ADAPTER_KEYS,
    validateTargetAdapter,
    validateSECComponentModel,
    validatePartnershipIdentity,
    validateTargetProfileIdentity,
    validateExecutionFamilyAdapter,
    directionalAuthorityRelease
  });

  global.SCZN3TargetAdapters = Object.freeze({
    contractVersion: VERSION,
    schemaVersion: SEC_ADAPTER_SCHEMA_VERSION,
    scoringPresentationFamilies: SCORING_PRESENTATION_FAMILIES,
    validate: validateLegacyTargetAdapter,
    validateSEC: validateTargetAdapter,
    register: registerSECAdapter,
    get: registeredSECAdapter,
    all: registeredSECAdapters,
    createViewModel: createSECViewModel
  });

  global.SCZN3ExecutionFamilyAdapters = Object.freeze({
    contractVersion: VERSION,
    register: registerExecutionFamilyAdapter,
    get: adapterId => executionFamilyAdapterRegistry.get(clean(adapterId)) || null,
    all: () => Object.freeze(Array.from(executionFamilyAdapterRegistry.values())),
    createViewModel: createExecutionFamilyViewModel,
    validate: validateExecutionFamilyAdapter
  });

  global.SCZN3PartnershipIdentity = Object.freeze({
    contractVersion: VERSION,
    validate: validatePartnershipIdentity,
    resolve: (...sources) => identityRecord(...sources)?.publisherIdentity || null,
    apply: applyPartnershipIdentity,
    hydrate: hydratePartnershipIdentities
  });

  global.SCZN3ProductIdentity = Object.freeze({
    contractVersion: VERSION,
    resolve: (...sources) => identityRecord(...sources)?.productIdentity || null
  });

  global.SCZN3TargetProfiles = Object.freeze({
    contractVersion: VERSION,
    PENDING_TARGET_PROFILE_KEY,
    definitions: TARGET_PROFILE_DEFINITIONS,
    targetProfileId,
    writePending: writePendingTargetProfile,
    resolve: resolveTargetProfile,
    identityRecord,
    display: targetProfileDisplay,
    validate: validateTargetProfileIdentity,
    apply: applyTargetProfileIdentity,
    hydrate: hydrateTargetProfileIdentities
  });

  global.SCZN3TargetProfileIdentity = Object.freeze({
    contractVersion: VERSION,
    apply: applyTargetProfileIdentity,
    hydrate: hydrateTargetProfileIdentities,
    display: targetProfileDisplay
  });

  if (typeof document !== "undefined") {
    const hydrateIdentitySurfaces = () => {
      hydrateTargetProfileIdentities();
      hydratePartnershipIdentities();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hydrateIdentitySurfaces);
    else hydrateIdentitySurfaces();
  }
})(window);
