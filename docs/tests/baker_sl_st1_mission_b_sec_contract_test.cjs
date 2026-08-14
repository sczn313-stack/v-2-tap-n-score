const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const renderer = fs.readFileSync(require("path").join(__dirname, "..", "baker_sl_st1_sec.js"), "utf8");
const context = {
  window: {
    SCZN3SEC: {
      render: value => value.regions.map(region => region.contentHtml).join(""),
      renderUnavailable: reason => `UNAVAILABLE:${reason}`
    }
  }
};
vm.runInNewContext(renderer, context);

const impacts = [
  { impactId: "impact-001", xNorm: 0.8, yNorm: 0.7, sourceEvidencePoint: { xNorm: 0.2, yNorm: 0.3 }, zone: "A", zoneValue: 10 },
  { impactId: "impact-002", xNorm: 0.7, yNorm: 0.6, sourceEvidencePoint: { xNorm: 0.4, yNorm: 0.5 }, zone: "C", zoneValue: 8 }
];
const pkg = {
  ok: true,
  status: "supported_analysis_ready",
  missionFamily: "smartEvidenceCapture",
  resultPackageType: "smartEvidenceResult",
  target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
  supportedAnalysis: { impactCount: 2 },
  impacts,
  productRegionDistribution: {
    status: "complete",
    zoneCounts: { A: 1, B: 0, C: 1, D: 0, outside: 0, indeterminate_boundary: 0 },
    classifiedImpactCount: 2,
    reconciliation: { countsMatchCapturedImpactCount: true }
  },
  scoring: {
    status: "complete",
    objective: "highest_score_wins",
    zoneValues: { A: 10, B: 9, C: 8, D: 7 },
    subtotals: { A: 10, B: 0, C: 8, D: 0 },
    total: 18
  },
  authorityTrace: {
    classificationAuthority: "backend",
    geometryAuthorityId: "UGO_BAKER_SL_ST1_23X35_V1",
    coordinateSystemId: "UGO_IMAGE_PLANE_TOP_LEFT_V1",
    scoringAuthorityId: "BAKER_SL_ST1_SCORING_V1",
    registrationAuthority: "backend",
    registrationAuthorityId: "BAKER_SL_ST1_MISSION_B_RUNTIME_GATE_V1"
  }
};
const html = context.window.SCZN3BakerSLST1SEC.render({
  session: { sessionId: "session-002", targetEvidenceImage: { dataUrl: "data:image/jpeg;base64,fixture" } },
  package: pkg,
  mode: "live"
});

assert(html.includes("Total Score"));
assert(html.includes(">18<"));
assert(html.includes("left:20%;top:30%"), "SEC must place marker 1 on source photo evidence coordinates");
assert(html.includes("left:40%;top:50%"), "SEC must place marker 2 on source photo evidence coordinates");
assert(!html.includes("left:80%;top:70%"), "SEC must not render canonical scoring coordinates over the source photograph");
assert((html.match(/sec-baker-impact-marker/g) || []).length === 2, "SEC impact count must equal visible numbered marker count");

console.log("PASS Baker SL-ST1 Mission B SEC evidence/scoring contract");
