const fs = require("fs");
const path = require("path");
const assert = require("assert");

const records = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

const buildStart = records.indexOf("function buildGssfSecExportPages(");
const buildEnd = records.indexOf("\nasync function prepareGssfExportPage", buildStart);
assert(buildStart >= 0 && buildEnd > buildStart, "two-page GSSF export builder must exist");
const builder = records.slice(buildStart, buildEnd);
const captureStart = records.indexOf("async function captureSecNode(");
const captureEnd = records.indexOf("\nasync function saveGssfSecTwoPageImages", captureStart);
assert(captureStart >= 0 && captureEnd > captureStart, "GSSF SEC capture function must be extractable");
const capture = records.slice(captureStart, captureEnd);

for (const selector of [
  ".sec-gssf-story-result",
  ".sec-gssf-story-explanation",
  ".sec-gssf-story-buckets"
]) {
  assert(builder.includes(selector), `results export must retain ${selector}`);
}
for (const selector of [
  ".sec-gssf-story-target",
  ".sec-gssf-story-session",
  ".sec-gssf-export-evidence-meta",
  ".sec-gssf-export-footer"
]) {
  assert(builder.includes(selector), `evidence export must retain ${selector}`);
}

assert(builder.includes("return [pageOne, pageTwo]"), "GSSF save must produce exactly two ordered pages");
assert(builder.includes('pageOne.dataset.exportPage = "1"'), "results must be Page 1");
assert(builder.includes('pageTwo.dataset.exportPage = "2"'), "evidence must be Page 2");
assert(!builder.includes("sec-gssf-story-continue"), "export pages must exclude Continue controls");
assert(!builder.includes("package-menu"), "export pages must exclude navigation");

assert(records.includes("const GSSF_SEC_EXPORT_WIDTH = 390"), "export width must be governed at iPhone width");
assert(records.includes("cloneGssfExportSection(card, selector)"), "both pages must clone the rendered authoritative SEC");
assert(records.includes('section.querySelector(".sec-gssf-session-summary")?.remove()'), "Page 2 replaces the compact live summary without changing the live SEC");
assert(records.includes('section.querySelector(".sec-attribution-line")?.remove()'), "Page 2 avoids duplicating attribution already included in the complete session record");
assert(records.includes('section.querySelector(".sec-gssf-session-complete")?.removeAttribute("hidden")'), "Page 2 restores the complete governed session record");
for (const field of ["Session Record ID", "Course", "Firearm", "Optic", "Ammunition", "Distance", "Date", "Shooter", "Unit", "Agency", "Instructor", "Notes"]) {
  assert(records.includes(`["${field}"`), `complete session export supports ${field}`);
}
assert(records.includes('clone.querySelectorAll("button, .sec-gssf-rail-dots")'), "export clones must remove rail controls and indicators");
assert(records.includes("prepareGssfExportPage(page)"), "governed evidence must be prepared from the rendered page before capture");
assert(records.includes("SEC-${stamp}-01-results.png") && records.includes("SEC-${stamp}-02-evidence.png"), "save produces two clearly named images");
assert(records.includes("if (pages.length !== 2)"), "export must refuse anything other than exactly two pages");
assert(records.includes('document.body.dataset.gssfExportStatus = "capturing"'), "export must expose a reviewable capture state");
assert(records.includes('document.body.dataset.gssfExportImageCount = String(files.length)'), "export must expose the exact completed image count");
assert(records.includes('if (files.length !== 2) throw new Error("GSSF SEC export requires exactly two images.")'), "export must refuse unless exactly two images were captured");
assert(records.includes('if (gssfCard) document.body.dataset.gssfExportStatus = "complete"'), "export only completes after governed delivery succeeds");
assert(records.includes('<script src="vendor/html2canvas-1.4.1.min.js"></script>'), "the pinned local capture renderer must load before export");
assert(capture.includes('typeof window.html2canvas !== "function"'), "export must refuse when the local capture renderer is unavailable");
assert(capture.includes("window.html2canvas(target"), "export must capture the rendered authoritative SEC DOM");
assert(capture.includes("useCORS: true") && capture.includes("allowTaint: false"), "export capture must remain origin-clean");
assert(!capture.includes("foreignObject"), "GSSF export must not use the canvas-tainting foreignObject path");
assert(capture.includes("return { fileName, blob }"), "capture must return the exact PNG evidence for governed delivery");
assert(records.includes("async function deliverSecCaptures("), "SEC save must have one delivery path for mobile and desktop");
assert(records.includes('new File([capture.blob], capture.fileName, { type: "image/png" })'), "mobile delivery must preserve exact PNG filenames");
assert(records.includes('typeof navigator.share === "function"'), "mobile SEC save must support the native share sheet");
assert(records.includes("navigator.canShare(shareData)"), "file sharing capability must be verified before use");
assert(records.includes("captures.forEach(downloadSecCapture)"), "desktop and unsupported browsers must retain download fallback");
assert(!records.includes("<foreignObject"), "no SEC save path may depend on Safari-fragile foreignObject rendering");

assert(/\.target-marker\s*\{[^}]*white-space:nowrap/s.test(styles), "live two-digit shot IDs must not wrap");
assert(/\.history-thumb-impact\s*\{[^}]*white-space:nowrap/s.test(styles), "saved two-digit shot IDs must not wrap");
assert(/\.gssf-sec-export-page \.history-thumb-impact\s*\{[^}]*white-space:nowrap/s.test(styles), "exported two-digit shot IDs must not wrap");
assert(/\.gssf-sec-export-page\s*\{[^}]*width:390px[^}]*overflow:hidden/s.test(styles), "each export page must have a fixed safe width without overflow");
assert(/\.gssf-sec-export-page \.sec-gssf-bucket-grid\s*\{[^}]*grid-template-columns:repeat\(4, minmax\(0, 1fr\)\)/s.test(styles), "Page 1 preserves all four scoring columns");
assert(/\.sec-gssf-session-complete\s*\{[^}]*grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/s.test(styles), "Page 2 complete session record remains readable at export width");

console.log("PASS GSSF two-page authoritative SEC export test");
