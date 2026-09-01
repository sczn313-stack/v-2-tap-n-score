const assert = require("assert");
const fs = require("fs");
const path = require("path");

const docs = path.resolve(__dirname, "..");
const opsJs = fs.readFileSync(path.join(docs, "ops.js"), "utf8");
const shoot = fs.readFileSync(path.join(docs, "shoot.html"), "utf8");
const opsHtml = fs.readFileSync(path.join(docs, "ops.html"), "utf8");
const store = fs.readFileSync(path.join(docs, "backend", "ops_store.py"), "utf8");
const server = fs.readFileSync(path.join(docs, "backend", "server.py"), "utf8");
const netlifyBuild = fs.readFileSync(path.join(docs, "production", "build-netlify.mjs"), "utf8");
const netlifyConfig = fs.readFileSync(path.join(docs, "netlify.toml"), "utf8");
const migration = fs.readFileSync(path.join(docs, "backend", "migrations", "007_extend_ops_shared_link_funnel.sql"), "utf8");

for (const eventType of ["tstStart", "tstComplete", "sessionStart", "showResults", "sessionSaved", "returnShooter"]) {
  assert(opsJs.includes(eventType), `client records ${eventType}`);
  assert(store.includes(`"${eventType}"`), `backend admits ${eventType}`);
  assert(migration.includes(`'${eventType}'`), `database admits ${eventType}`);
}

assert(opsJs.includes('params.get("ref")'), "shared-link ref is captured from the public URL");
assert(opsJs.includes("CAMPAIGN_PATTERN"), "campaign identifiers are bounded before storage");
assert(opsJs.includes("sessionStorage.setItem(CAMPAIGN_SESSION_KEY"), "campaign survives same-origin journey transitions");
assert(!opsJs.includes("email") && !opsJs.includes("shooterName"), "telemetry does not collect personal fields");
assert(opsJs.indexOf("window.fetch(EVENT_ENDPOINT") < opsJs.indexOf("beaconFallback();\n    } catch"), "telemetry uses reliable fetch before beacon fallback");

assert(shoot.includes("window.SCZN3Ops.recordTstStarted()"), "LET THE TARGET TALK records TST start");
assert(shoot.includes('status === "completed"') && shoot.includes("window.SCZN3Ops.recordTstCompleted()"), "completed PLAYER records TST completion");

for (const label of ["Arrivals", "TST Starts", "TST Completed", "Real Tap-n-Score", "Results Produced", "Sessions Saved", "Returned"]) {
  assert(opsHtml.includes(label), `dashboard includes ${label}`);
}
assert(opsHtml.includes('id="opsCampaignFilter"') && opsHtml.includes("campaign: opsState.campaign"), "dashboard filters by shared link");
assert(server.includes('campaign_filter=query.get("campaign"'), "summary endpoint accepts campaign filter");
assert(store.includes("count(distinct arrival_id)"), "funnel counts distinct anonymous arrivals, not raw clicks");
assert(netlifyBuild.includes('"ops.html"'), "Founder dashboard is included in the production bundle");
assert(netlifyConfig.includes('from = "/api/ops/event"') && netlifyConfig.includes('from = "/api/ops/summary"'), "Netlify uses the established same-origin OPS proxy pattern");

console.log("PASS Founder shared-link activity contract");
