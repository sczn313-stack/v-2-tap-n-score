const assert = require("assert");
const fs = require("fs");
const path = require("path");

const docs = path.resolve(__dirname, "..");
const opsHtml = fs.readFileSync(path.join(docs, "ops.html"), "utf8");
const analyticsHtml = fs.readFileSync(path.join(docs, "analytics.html"), "utf8");
const opsJs = fs.readFileSync(path.join(docs, "ops.js"), "utf8");
const server = fs.readFileSync(path.join(docs, "backend", "server.py"), "utf8");
const store = fs.readFileSync(path.join(docs, "backend", "ops_store.py"), "utf8");

assert(opsHtml.includes('data-founder-access-mode="temporary-direct"'), "Pulse Check identifies the emergency direct-access mode");
assert(opsHtml.includes("/api/ops/summary") && opsHtml.includes("ops.js"), "Pulse Check requests the existing governed telemetry summary");
assert(!opsHtml.includes("localFallbackSummary") && opsHtml.includes("renderOpsUnavailable"), "telemetry failure remains unavailable rather than becoming device-local totals");
assert(opsHtml.includes("summary.ok !== true"), "an unavailable backend summary cannot render believable zero totals");
assert(analyticsHtml.includes('data-founder-access-mode="temporary-direct"'), "Analytics identifies the emergency direct-access mode");
assert(analyticsHtml.includes("renderAnalyticsPage") && analyticsHtml.includes('src="analytics.js"'), "Analytics reads the existing same-origin history");
assert(server.includes("summary = summarize_events(") && server.includes('query.get("window"') && server.includes('query.get("product"'), "operational summary accepts governed time and product filters");
assert(server.includes("self._send_json(403, founder_access_unavailable())"), "environment diagnostics remain refused");
assert(!server.includes("envKeysContainingDatabase") && !server.includes("databaseUrlPrefix"), "environment diagnostics are not publicly disclosed");

for (const page of ["index.html", "matrix.html", "shoot.html", "records.html", "survey.html", "buy-targets.html"]) {
  const html = fs.readFileSync(path.join(docs, page), "utf8");
  assert(!html.includes('href="analytics.html"'), `${page} omits Analytics from public navigation`);
  assert(!html.includes('href="ops.html"'), `${page} omits Pulse Check from public navigation`);
}

assert(!opsJs.includes("localStorage"), "device-local telemetry totals are removed");
assert(!opsJs.includes("returnShooter"), "ungoverned return-shooter identity is removed");
assert(!opsJs.includes("normalizeTarget") && !opsJs.includes("targetSource"), "legacy target-name attribution is removed");
assert(opsJs.includes("publisher_route_id") && opsJs.includes("product_route_id") && opsJs.includes("catalog_entry_id"), "events carry governed product identity");
assert(store.includes("resolve_product_route"), "backend resolves product identity through the governed catalog");
assert(store.includes('target_source = "Unattributed"'), "missing product identity is not guessed");
assert(opsHtml.includes("SCZN3 Operations") && !opsHtml.includes("GSSF Operations"), "Operations remains the stable founder cockpit rather than a product dashboard");
assert(opsHtml.includes('id="opsProductFilter"') && opsHtml.includes('id="opsWindowFilter"'), "Operations exposes product and time controls");
assert(opsHtml.includes("Today") && opsHtml.includes("This Week") && opsHtml.includes("This Month") && opsHtml.includes("This Year") && opsHtml.includes("All Time"), "all governed time increments are available");
assert(opsHtml.includes("Raw telemetry diagnostics") && opsHtml.includes("<details"), "raw telemetry is secondary and collapsed by default");
assert(opsHtml.includes("Returning Visitors") && opsHtml.includes("Unavailable"), "ungoverned return identity remains unavailable");
assert(opsHtml.includes("summary.conversionPercentages"), "Operations displays backend-produced conversions");
assert(opsHtml.includes("summary.productActivity") && opsHtml.includes("summary.unavailableTelemetry"), "primary product intelligence separates governed activity from unavailable attribution");

console.log("PASS Pulse Check access governance");
