import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = async file => readFile(new URL(file, root), "utf8");
const frameworkSource = await source("sec_framework.js");
const secV1Source = await source("sec_v1.js");
const bakerSource = await source("baker_sl_st1_sec.js");
const secHtml = await source("sec.html");
const recordsHtml = await source("records.html");
const bakerCss = await source("baker-sl-st1-sec.css");

const frameworkContext = { window: {} };
vm.createContext(frameworkContext);
vm.runInContext(frameworkSource, frameworkContext);
const impacts = [
  { xPercent: 41.25, yPercent: 52.5 },
  { xPercent: 43.75, yPercent: 54.5 },
  { xPercent: 45.25, yPercent: 56.5 }
];
const overlay = frameworkContext.window.SCZN3SEC.EvidenceCard({
  status: { impactCount: impacts.length },
  renderCoordinates: { impacts }
}).overlay();
impacts.forEach((point, index) => {
  assert.match(overlay, new RegExp(`left:${point.xPercent}%;top:${point.yPercent}%[^>]*>${index + 1}<`), `M4 count marker ${index + 1} keeps its captured coordinate`);
});
assert.equal((overlay.match(/class="target-marker impact-marker"/g) || []).length, impacts.length, "M4 SEC impact count equals visible numbered marker count");

const bakerContext = { window: {} };
vm.createContext(bakerContext);
vm.runInContext(secV1Source, bakerContext);
vm.runInContext(bakerSource, bakerContext);
const bakerPackage = {
  ok: true,
  status: "supported_analysis_ready",
  missionFamily: "smartEvidenceCapture",
  resultPackageType: "smartEvidenceResult",
  target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
  supportedAnalysis: { impactCount: 2 },
  impacts: [{ xNorm: .2, yNorm: .3 }, { xNorm: .6, yNorm: .7 }]
};
const bakerSession = { sessionId: "count", sessionLabel: "Session #1", targetEvidenceImage: { dataUrl: "data:image/png;base64,AA==" } };
for (const mode of ["live", "historical"]) {
  const html = bakerContext.window.SCZN3BakerSLST1SEC.render({ session: bakerSession, package: bakerPackage, mode });
  assert.match(html, /left:20%;top:30%[^>]*>1<\/span>/, `${mode} SL-ST1 marker 1 retains its coordinate`);
  assert.match(html, /left:60%;top:70%[^>]*>2<\/span>/, `${mode} SL-ST1 marker 2 retains its coordinate`);
  assert.equal((html.match(/class="sec-baker-impact-marker"/g) || []).length, bakerPackage.supportedAnalysis.impactCount, `${mode} SL-ST1 impact count equals visible numbered marker count`);
}

assert.match(secHtml, /confirmationImpacts\.map\(\(point, index\) => marker\(point, "impact-marker", index \+ 1\)\)/, "M4 confirmation exposes count identifiers");
assert.match(recordsHtml, /markerHtml\("history-thumb-impact", point, String\(index \+ 1\)\)/, "generic historical SEC exposes count identifiers");
assert.match(bakerCss, /\.sec-baker-impact-marker\{[^}]*display:grid;place-items:center[^}]*transform:translate\(-50%,-50%\)/, "SL-ST1 count identifiers are centered without changing marker geometry");

console.log("PASS universal SEC impact-count parity and coordinate preservation");
