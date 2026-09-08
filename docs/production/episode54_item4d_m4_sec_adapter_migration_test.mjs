import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const platformSource = await readFile("platform_contracts.js", "utf8");
const adapterSource = await readFile("sec_adapter_model.js", "utf8");
const rendererSource = await readFile("m4_zeroing_sec.js", "utf8");
const componentsSource = await readFile("sec_framework.js", "utf8");
const secSource = await readFile("sec.html", "utf8");
const renderedModels = [];
const context = { window: {} };
context.window.window = context.window;
context.window.SCZN3SEC = {
  render(model) { renderedModels.push(model); return `<article data-sec-shell="universal-v1" data-sec-record-id="${model.recordId}"></article>`; },
  renderUnavailable(message) { return `unavailable:${message}`; }
};
vm.createContext(context);
vm.runInContext(platformSource, context, { filename: "platform_contracts.js" });
vm.runInContext(adapterSource, context, { filename: "sec_adapter_model.js" });
vm.runInContext(componentsSource, context, { filename: "sec_framework.js" });
vm.runInContext(rendererSource, context, { filename: "m4_zeroing_sec.js" });

const impacts = [{ xPercent: 41, yPercent: 44 }, { xPercent: 51, yPercent: 54 }, { xPercent: 61, yPercent: 64 }];
const pkg = {
  ok: true,
  resultPackageType: "zeroCorrectionResult",
  authoritySource: "backend-authoritative",
  target_profile_id: "m4_25m_zero",
  targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  mission_family: "zeroingCorrection",
  evidenceHash: "m4-evidence-hash-unchanged",
  score: { value: 93 },
  renderCoordinates: { impacts, aim: { xPercent: 50, yPercent: 50 }, poib: { xPercent: 54, yPercent: 56 } },
  correction: { elevation: "5 clicks UP", windage: "6 clicks LEFT" }
};
const session = {
  sessionId: "item4d-m4-session",
  sessionLabel: "Session #003",
  targetProfileId: "m4_25m_zero",
  targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
  targetEvidenceImage: { dataUrl: "data:image/png;base64,bTQtZXZpZGVuY2U=", sha256: "m4-photo-hash-unchanged" },
  m4AuthorityPackage: pkg
};

const mapped = context.window.SCZN3M4SEC.secAdapterViewModel(session);
assert(mapped, "M4 adapter must accept the authoritative zeroing session");
assert.equal(mapped.result.package, pkg);
assert.equal(mapped.session, session);
assert.equal(mapped.scoringPresentationFamily, "zeroing-correction");
assert.deepEqual(Array.from(mapped.semanticComponents, component => component.stage), ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"]);
assert.equal(mapped.targetProfileIdentity.targetProfileLabel, "M4 25m Zero");
assert.equal(mapped.targetProfileIdentity.missionLabel, "25 Meter Zero");
assert.equal(mapped.publisherIdentity.publisherId, "baker-targets");
assert.equal(mapped.productIdentity.productId, "ST-M16A2/M4");

const html = context.window.SCZN3M4SEC.render(session);
assert.match(html, /data-sec-shell="universal-v1"/);
assert.equal(renderedModels.length, 1);
const model = renderedModels[0];
assert.equal(model.recordId, session.sessionId);
assert.equal(model.articleAttributes["data-sec-adapter-id"], "m4-zeroing");
assert.equal(model.articleAttributes["data-scoring-presentation-family"], "zeroing-correction");
assert.equal(model.articleAttributes["data-target-profile-id"], "m4_25m_zero");
assert.equal(model.articleAttributes["data-publisher-id"], "baker-targets");
assert.equal(model.articleAttributes["data-product-id"], "ST-M16A2/M4");
assert.deepEqual(Array.from(model.regions, region => region.key), ["target", "session", "sightCorrection", "actions"]);
assert.equal(session.m4AuthorityPackage.evidenceHash, "m4-evidence-hash-unchanged");
assert.equal(session.targetEvidenceImage.sha256, "m4-photo-hash-unchanged");
assert.deepEqual(session.m4AuthorityPackage.renderCoordinates.impacts, impacts);

for (const inherited of [
  {
    profileId: "speedwell_dodm4_m16a2_25m_zero",
    profileVersion: "SPEEDWELL_DODM4_M16A2_AUTHORITY_v1",
    adapterId: "speedwell-m16a2-zeroing",
    publisherId: "speedwell",
    productId: "DODM4-M16A2"
  },
  {
    profileId: "army_nsn_6920_01_395_2949_m16a2_25m_zero",
    profileVersion: "ARMY_NSN_6920_01_395_2949_M16A2_AUTHORITY_v1",
    adapterId: "army-m16a2-zeroing",
    publisherId: "us-army",
    productId: "NSN-6920-01-395-2949-M16A2"
  }
]) {
  const inheritedPackage = {
    ...pkg,
    target_profile_id: inherited.profileId,
    targetProfileVersion: inherited.profileVersion,
    evidenceHash: `${inherited.profileId}-evidence-hash`
  };
  const inheritedSession = {
    ...session,
    sessionId: `${inherited.profileId}-session`,
    targetProfileId: inherited.profileId,
    targetProfileVersion: inherited.profileVersion,
    m4AuthorityPackage: inheritedPackage
  };
  const inheritedMapped = context.window.SCZN3M4SEC.secAdapterViewModel(inheritedSession);
  assert(inheritedMapped, `${inherited.profileId} consumes the existing zeroing SEC renderer`);
  assert.equal(inheritedMapped.adapterId, inherited.adapterId);
  assert.equal(inheritedMapped.publisherIdentity.publisherId, inherited.publisherId);
  assert.equal(inheritedMapped.productIdentity.productId, inherited.productId);
  context.window.SCZN3M4SEC.render(inheritedSession);
  const inheritedModel = renderedModels.at(-1);
  assert.equal(inheritedModel.articleAttributes["data-sec-adapter-id"], inherited.adapterId);
  assert.equal(inheritedModel.articleAttributes["data-target-profile-id"], inherited.profileId);
  assert.equal(inheritedModel.articleAttributes["data-publisher-id"], inherited.publisherId);
  assert.equal(inheritedModel.articleAttributes["data-product-id"], inherited.productId);
}

assert.match(secSource, /SCZN3M4SEC\.render\(session\)/);
assert.match(secSource, /<div id="secCardHost"><\/div>/);
assert.doesNotMatch(secSource, /<article id="secCard"/, "the standalone M4 shell is retired");
assert.doesNotMatch(rendererSource, /SCZN3SECComponents\s*=/, "the M4 adapter does not claim shared component ownership");

console.log("PASS Episode 54 Item 4D M4 SEC adapter mapping preserves authority, identity, evidence, and shared-shell ownership");
