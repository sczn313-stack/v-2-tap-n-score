const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const docs = path.join(__dirname, "..");
const labelsSource = fs.readFileSync(path.join(docs, "presentation_labels.js"), "utf8");
const index = fs.readFileSync(path.join(docs, "index.html"), "utf8");
const matrix = fs.readFileSync(path.join(docs, "matrix.html"), "utf8");
const shoot = fs.readFileSync(path.join(docs, "shoot.html"), "utf8");
const records = fs.readFileSync(path.join(docs, "records.html"), "utf8");
const route = fs.readFileSync(path.join(docs, "t", "gssf", "ac1", "index.html"), "utf8");
const catalog = fs.readFileSync(path.join(docs, "backend", "product_catalog.py"), "utf8");

const context = {
  window: {},
  document: {
    readyState: "complete",
    querySelectorAll() { return []; }
  }
};
vm.runInNewContext(labelsSource, context);
assert.strictEqual(
  context.window.SCZN3Presentation.targetLabel("gssf_ac_1", "GSSF AC-1"),
  "Competition Paper Target (Demo)",
  "GSSF AC-1 has one reversible public presentation label"
);
assert.strictEqual(
  context.window.SCZN3Presentation.targetLabel("baker_st_100yd_smart_zero", "Baker Target"),
  "Baker Target",
  "unmapped governed targets preserve their existing display labels"
);

for (const [fileName, source] of [
  ["index.html", index],
  ["matrix.html", matrix],
  ["shoot.html", shoot],
  ["records.html", records],
  ["t/gssf/ac1/index.html", route]
]) {
  assert(source.includes("presentation_labels.js"), `${fileName} loads the shared presentation-label mapping`);
}

assert(index.includes('data-target-name="GSSF AC-1"'), "homepage keeps governed target metadata unchanged");
assert(index.includes('data-sczn3-target-label="gssf_ac_1"'), "homepage delegates public target naming to the shared mask");
assert(matrix.includes('targetName: "GSSF AC-1"') && matrix.includes('targetFamily: "GSSF AC-1"'), "matrix keeps governed attribution unchanged");
assert(matrix.includes('SCZN3Presentation.targetLabel("gssf_ac_1", "GSSF AC-1")'), "matrix masks only the displayed target-mode label");
assert(shoot.includes('targetProfileId: "gssf_ac_1"'), "live request identity remains gssf_ac_1");
assert(shoot.includes('targetExecutionContractId: "gssf-ac-1-live-canonical-v1"'), "live execution contract remains unchanged");
assert(shoot.includes('SCZN3Presentation.targetLabel("gssf_ac_1", "GSSF AC-1")'), "live customer display uses the shared mask");
assert(records.includes('const missionLine = gssfResultLine(pkg, "Mission")'), "saved SEC retains governed mission metadata");
assert(records.includes('SCZN3Presentation.targetLabel("gssf_ac_1"'), "saved SEC masks only presentation output");
assert(route.includes('const PUBLISHER_ROUTE_ID = "gssf"'), "public route keeps publisher identity gssf");
assert(route.includes('const PRODUCT_ROUTE_ID = "ac1"'), "public route keeps product identity ac1");
assert(route.includes('const EXPECTED_CONTRACT_ID = "gssf-ac-1-live-canonical-v1"'), "public route keeps its execution contract");
assert(route.includes('SCZN3Presentation.targetLabel("gssf_ac_1", "Target")'), "public route resolves its display name through the temporary mask");
assert(catalog.includes('"publisherRouteId": "gssf"'), "catalog publisher identity remains unchanged");
assert(catalog.includes('"productRouteId": "ac1"'), "catalog product identity remains unchanged");
assert(catalog.includes('"targetProfileId": GSSF_AC_1_ATP["targetProfileId"]'), "catalog ATP binding remains unchanged");

console.log("PASS reversible GSSF public branding mask test");
