import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const mustNotExist = async path => {
  try {
    await access(path);
    assert.fail(`${path} must be retired`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};

const [platformUi, secFrameworkCss, platformActionsCss, workspaceCss, bakerCss, records, secV1, appState, siteBuild, netlifyBuild] = await Promise.all([
  read("platform-ui.css"),
  read("sec-framework.css"),
  read("platform_actions.css"),
  read("smart_target_workspace.css"),
  read("t/baker/sl-st1/target-page.css"),
  read("records.html"),
  read("sec_v1.js"),
  read("app_state.js"),
  read("production/build-site.mjs"),
  read("production/build-netlify.mjs")
]);

await mustNotExist("universal-ui.css");
await mustNotExist("sec-universal.css");

for (const build of [siteBuild, netlifyBuild]) {
  assert.match(build, /"platform-ui\.css"/);
  assert.match(build, /"sec-framework\.css"/);
  assert.doesNotMatch(build, /"universal-ui\.css"|"sec-universal\.css"/);
}

assert.match(platformUi, /\.app-header/);
assert.doesNotMatch(platformUi, /\.universal-app-header|\.universal-header-menu/);
assert.match(secFrameworkCss, /\.sec-framework-stage/);
assert.doesNotMatch(secFrameworkCss, /\.sec-universal-stage|\.sec-universal-flow/);
assert.match(records, /const SEC_FRAMEWORK_STAGES/);
assert.match(records, /function secFrameworkStageHtml/);
assert.match(records, /function secFrameworkActionBarHtml/);
assert.doesNotMatch(records, /UNIVERSAL_SEC_STAGES|universalSecStageHtml|universalShooterActionBarHtml/);
assert.match(secV1, /sec-framework-stage/);
assert.doesNotMatch(secV1, /sec-universal-stage/);

assert.match(workspaceCss, /grid-template-rows:minmax\(0,1fr\) auto/);
assert.match(workspaceCss, /object-fit:contain/);
assert.match(workspaceCss, /\[data-sczn3-workspace="platform-v1"\]\[hidden\]/);
assert.doesNotMatch(bakerCss, /\.sl-workspace\[hidden\]/);
assert.doesNotMatch(bakerCss, /\.sl-workspace\s*\{[^}]*grid-template-rows/s);
assert.doesNotMatch(bakerCss, /\.sl-image-frame\s*\{[^}]*display:grid/s);
assert.doesNotMatch(bakerCss, /\.sl-image-frame img\s*\{[^}]*object-fit/s);

assert.match(platformActionsCss, /\.sec-preservation-actions\[data-sczn3-action-region="platform-v1"\]/);
assert.match(platformActionsCss, /@media print/);
assert.doesNotMatch(secFrameworkCss, />\.sec-v1-actions \.sec-preservation-actions\{flex-wrap/);

// Item 1 compatibility remains readable while canonical writes stay platform-owned.
assert.match(appState, /SCZN3_BAKER_SESSION_RECORD_/);
assert.match(appState, /SCZN3_SESSION_RECORD_/);
assert.match(appState, /function migrateLegacyPlatformState/);
assert.match(appState, /copy-once-preserve-legacy-canonical-writes-only/);
assert.match(records, /data-sec-shell="universal-v1"/);

// Legitimate target/partner ownership remains explicit rather than being erased.
assert.match(records, /SCZN3BakerSLST1SEC/);

console.log("PASS Episode 54 Item 8 duplicate retirement and functional naming contract");
