import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../presentation_labels.js", import.meta.url), "utf8");
const document = {
  readyState: "complete",
  querySelectorAll() { return []; },
  addEventListener() {}
};
const context = { document };
context.window = context;
vm.runInNewContext(source, context, { filename: "presentation_labels.js" });
const presentation = context.SCZN3Presentation;

function available(status = "available") {
  return { status };
}

function assertGuidance(message, expected) {
  for (const fragment of expected) assert.match(message, new RegExp(fragment, "i"));
  assert.doesNotMatch(message, /official mission|authority unavailable|target authority|governed|restriction id|capability status/i);
}

const m4Ready = presentation.equipmentGuidance({
  targetProfileId: "m4_25m_zero",
  setupName: "Ruger 10/22",
  assessment: {
    officialMission: { status: "authority_unavailable" },
    capabilities: {
      evidence: available(),
      measurement: available(),
      correction: available(),
      officialScore: available("not_applicable")
    }
  }
});
assertGuidance(m4Ready, ["You can use", "save your target evidence", "measure your group", "provide Sight Correction", "Ready to shoot", "Tap Go To Target"]);

const zeroingNeedsClicks = presentation.equipmentGuidance({
  targetProfileId: "baker_st_100yd_smart_zero",
  setupName: "Scope setup",
  sightClickDataMissing: true,
  assessment: {
    capabilities: {
      evidence: available(),
      measurement: available(),
      correction: available("unavailable")
    }
  }
});
assertGuidance(zeroingNeedsClicks, ["You can use", "SCZN3 will", "Enter your sight click data", "Sight Correction"]);

const gssfReduced = presentation.equipmentGuidance({
  targetProfileId: "gssf_ac_1",
  setupName: "Rifle setup",
  assessment: {
    capabilities: {
      evidence: available(),
      measurement: available(),
      officialScore: available("unavailable")
    }
  }
});
assertGuidance(gssfReduced, ["You can use", "save your target evidence", "measure your confirmed impacts", "Select pistol equipment", "Official GSSF Score"]);

assertGuidance(
  presentation.capabilityGuidance({ targetProfileId: "gssf_ac_1" }),
  ["keep this target evidence", "measure the confirmed impacts", "Select pistol equipment", "Official GSSF Score"]
);
assertGuidance(
  presentation.capabilityGuidance({ targetProfileId: "m4_25m_zero", sightClickDataMissing: true }),
  ["target evidence and group measurement are ready", "Enter your sight click data", "Sight Correction"]
);
assertGuidance(
  presentation.sightCorrectionGuidance({ integrityStatus: "mismatch" }),
  ["target and group measurement are saved", "could not verify the correction", "Return to Target", "Show Results"]
);
assertGuidance(
  presentation.blockedTargetGuidance("GSSF AC-1"),
  ["choose another available Smart Target", "cannot analyze GSSF AC-1", "Return Home"]
);
assertGuidance(
  presentation.targetEntryGuidance("GSSF AC-1"),
  ["GSSF AC-1 is available", "could not open it from this link", "Return Home", "tap GSSF AC-1 to try again"]
);
assertGuidance(
  presentation.confirmationUnavailableGuidance(),
  ["confirmation group is saved", "cannot confirm this zero", "No additional action"]
);

const matrix = await readFile(new URL("../matrix.html", import.meta.url), "utf8");
const shoot = await readFile(new URL("../shoot.html", import.meta.url), "utf8");
const sec = await readFile(new URL("../sec.html", import.meta.url), "utf8");
const records = await readFile(new URL("../records.html", import.meta.url), "utf8");
const secStyles = await readFile(new URL("../m4-sec.css", import.meta.url), "utf8");
const gssfEntry = await readFile(new URL("../t/gssf/ac1/index.html", import.meta.url), "utf8");
const m4Adapter = await readFile(new URL("../m4_smart_target_sec.js", import.meta.url), "utf8");
const practiceAdapter = await readFile(new URL("../universal_practice_sec.js", import.meta.url), "utf8");

assert.match(matrix, /SCZN3Presentation\.equipmentGuidance/);
assert.match(shoot, /SCZN3Presentation\.capabilityGuidance/);
assert.match(sec, /presentation_labels\.js\?v=universal-guidance-2/);
assert.match(records, /Your confirmation group is saved\.[\s\S]*?SCZN3 cannot confirm this zero yet\./);
assert.match(gssfEntry, /SCZN3Presentation\.targetEntryGuidance\("GSSF AC-1"\)/);
assert.match(gssfEntry, /presentation_labels\.js\?v=universal-guidance-3/);
assert.doesNotMatch(gssfEntry, /GSSF AC-1 is not available/);
assert.match(records, /universalSecStageHtml\("session", "Session", sessionDetails, scoreDisplay\)/);
assert.match(secStyles, /\.sec-universal-stage-heading:not\(\.sec-stage-pill\) h2/);
assert.match(secStyles, /\.sec-stage-pill h2\{[^}]*font-size:12px[^}]*font-weight:950[^}]*white-space:nowrap/);
assert.match(secStyles, /\.sec-session-score\{[^}]*font-size:15px/);
assert.match(matrix, /equipmentLibraryExplicitlyOpened/);
for (const [label, adapter] of [["M4", m4Adapter], ["Practice", practiceAdapter]]) {
  const renderedPresentation = adapter.slice(adapter.indexOf("return global.SCZN3SEC.render({"));
  assert.doesNotMatch(renderedPresentation, /Authority must precede measurement|Intentionally Blocked|Research Authority|blockedItemsHtml\(|noticeHtml\(|researchNoticeHtml\(|escapeHtml\(reason\)/, `${label} adapter must expose one concise action without diagnostics`);
}

const adapterContext = {
  document,
  SCZN3Presentation: presentation,
  SCZN3SEC: {
    render(value) { return value; },
    renderUnavailable(message) { return { unavailable: message }; }
  }
};
adapterContext.window = adapterContext;
vm.runInNewContext(m4Adapter, adapterContext, { filename: "m4_smart_target_sec.js" });
vm.runInNewContext(practiceAdapter, adapterContext, { filename: "universal_practice_sec.js" });

const m4Rendered = adapterContext.SCZN3M4SmartTargetSEC.render({
  session: { sessionId: "m4-guidance-test" },
  package: {
    ok: false,
    status: "authority_unavailable",
    authorityClassification: "research",
    targetId: "M4_25M_ZERO",
    reasonCode: "missing_geometry_authority"
  }
});
const practiceRendered = adapterContext.SCZN3UniversalPracticeSEC.render({
  session: { sessionId: "practice-guidance-test" },
  package: {
    ok: false,
    status: "authority_unavailable",
    authorityClassification: "practice_analysis",
    resultPackageType: "universalPracticeAnalysisResult",
    missionFamily: "universalPractice",
    reasonCode: "missing_geometry_authority"
  }
});
for (const [label, rendered] of [["M4", m4Rendered], ["Practice", practiceRendered]]) {
  const visible = rendered.regions.map(region => region.contentHtml).join(" ");
  assert.match(visible, /You can choose another available Smart Target/);
  assert.match(visible, /Return Home to continue/);
  assert.doesNotMatch(visible, /authority|governed|canonical asset|registration package|execution contract|intentionally blocked/i, `${label} rendered SEC must not expose diagnostics`);
}

console.log("PASS universal shooter presentation guidance contract");
