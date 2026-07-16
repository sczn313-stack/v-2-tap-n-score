const assert = require("assert");
const fs = require("fs");
const path = require("path");

const docs = path.resolve(__dirname, "..");
const opsHtml = fs.readFileSync(path.join(docs, "ops.html"), "utf8");
const analyticsHtml = fs.readFileSync(path.join(docs, "analytics.html"), "utf8");
const opsJs = fs.readFileSync(path.join(docs, "ops.js"), "utf8");
const server = fs.readFileSync(path.join(docs, "backend", "server.py"), "utf8");
const store = fs.readFileSync(path.join(docs, "backend", "ops_store.py"), "utf8");

assert(opsHtml.includes("Founder authentication is required"), "Pulse Check states the access requirement");
assert(opsHtml.includes("No operational data has been requested or rendered"), "locked page makes its data behavior explicit");
assert(!opsHtml.includes("/api/ops/summary") && !opsHtml.includes("ops.js"), "locked page does not request telemetry");
assert(analyticsHtml.includes("Founder Dashboard") && analyticsHtml.includes("Founder authentication is required"), "Analytics is isolated inside the founder access boundary");
assert(!analyticsHtml.includes("analytics.js") && !analyticsHtml.includes("app_state.js"), "locked founder analytics requests no shooter history or analytics data");
assert(server.includes("self._send_json(403, founder_access_unavailable())"), "private endpoints refuse without server authentication");
assert(server.includes('"status": "founder_authentication_required"'), "refusal is explicit");
assert(!server.includes("envKeysContainingDatabase") && !server.includes("databaseUrlPrefix"), "environment diagnostics are not publicly disclosed");

assert(!opsJs.includes("localStorage"), "device-local telemetry totals are removed");
assert(!opsJs.includes("returnShooter"), "ungoverned return-shooter identity is removed");
assert(!opsJs.includes("normalizeTarget") && !opsJs.includes("targetSource"), "legacy target-name attribution is removed");
assert(opsJs.includes("publisher_route_id") && opsJs.includes("product_route_id") && opsJs.includes("catalog_entry_id"), "events carry governed product identity");
assert(store.includes("resolve_product_route"), "backend resolves product identity through the governed catalog");
assert(store.includes('target_source = "Unattributed"'), "missing product identity is not guessed");

console.log("PASS Pulse Check access governance");
