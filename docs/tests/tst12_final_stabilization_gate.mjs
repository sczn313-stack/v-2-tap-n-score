import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDir = path.resolve(process.env.SCZN3_TST12_EVIDENCE_DIR || path.join(docs, "test-evidence", "tst12-final-stabilization"));
fs.mkdirSync(evidenceDir, { recursive: true });
const read = relative => fs.readFileSync(path.join(docs, relative), "utf8");
const sharedSource = read("tst12_station_results.js");
const sharedCss = read("tst12-station-results.css");
const adapter = read("tst12_universal_experience.js");
const records = read("records.html");
const targetHtml = read("target-experience.html");
const identity = "sczn3-tst12-station-pip-cq-20261107-2";
const disclosureIdentity = "sczn3-tst12-session-accordion-20261104-4";

const context = { window: {} };
vm.runInNewContext(sharedSource, context, { filename: "tst12_station_results.js" });
const renderer = context.window.SCZN3Tst12StationResults;
assert.equal(renderer.PRESENTATION_ID, identity, "shared renderer publishes the approved identity");
assert.equal(renderer.DISCLOSURE_CONTROLLER_ID, disclosureIdentity, "shared renderer publishes the disclosure controller identity");

function resultFixture(targetId) {
  const classifications = [];
  const stationBestFive = [];
  const regionResults = [];
  let total = 0;
  const large = /23x35/.test(targetId);
  const columns = large ? [0.1956521739130435, 0.5, 0.8043478260869565] : [0.18571428571428572, 0.5, 0.8142857142857143];
  const rows = large ? [0.1357142857142857, 0.35714285714285715, 0.5785714285714285, 0.8] : [0.15760869565217392, 0.3858695652173913, 0.6141304347826086, 0.842391304347826];
  for (let station = 1; station <= 12; station += 1) {
    const prefix = `station_${String(station).padStart(2, "0")}`;
    const square = `${prefix}_square`;
    const stationMisses = station === 7 ? 1 : 0;
    for (let shot = 1; shot <= 5; shot += 1) {
      const miss = station === 7 && shot === 5;
      const observationId = `stable-${station}-${shot}`;
      const xNorm = columns[(station - 1) % 3] + (shot - 3) * 0.006;
      const yNorm = rows[Math.floor((station - 1) / 3)];
      classifications.push({
        observationId,
        assignedStationRegionId: square,
        regionId: miss ? "outside" : `${prefix}_crosshair`,
        countsAsHit: !miss,
        creditedForScore: true,
        value: miss ? 0 : 5,
        xNorm,
        yNorm,
        canonicalTargetCoordinate: { xNorm, yNorm }
      });
    }
    const score = (5 - stationMisses) * 5;
    total += score;
    stationBestFive.push({ stationRegionId: square, totalObservations: 5, creditedObservations: 5, creditedObservationIds: Array.from({ length: 5 }, (_, index) => `stable-${station}-${index + 1}`), additionalObservations: 0, actualHits: 5 - stationMisses, actualMisses: stationMisses, bestFiveScore: score });
    for (const suffix of ["square", "black_ring_1", "black_ring_2", "black_ring_3", "black_ring_4", "red_center", "crosshair"]) {
      regionResults.push({ regionId: `${prefix}_${suffix}`, value: suffix === "crosshair" ? 5 : suffix === "red_center" ? 4 : suffix.startsWith("black_ring") ? 3 : 2, countedHitCount: suffix === "crosshair" ? 5 - stationMisses : 0, points: suffix === "crosshair" ? score : 0 });
    }
  }
  return {
    target: { id: targetId },
    ballisticGeometry: { authorityScoringGauge: { authorizedRange: { min: 0.223, max: 0.223 }, lineTouchRule: "higher_value" } },
    sczn3Metrics: { pointsPerTap: total / 60 },
    classifications,
    scoring: {
      status: "complete", total, totalScore: total, observationCount: 60,
      creditedObservationCount: 60, additionalObservationCount: 0,
      actualHitCount: 59, actualMissCount: 1,
      stationCreditPolicy: { mode: "best_scoring_observations_per_station", selectionPresentation: "interactive_number_boxes" },
      stationBestFive, regionResults
    }
  };
}

function assertApprovedMarkup(markup, label) {
  assert.match(markup, new RegExp(`data-tst12-station-results-renderer="${identity}"`), `${label}: approved renderer identity`);
  assert.match(markup, /TOTAL STATION RESULTS/, `${label}: aggregate heading`);
  assert.equal((markup.match(/data-tst12-station-card=/g) || []).length, 12, `${label}: twelve station cards`);
  assert.equal((markup.match(/class="tst12-condition-part"/g) || []).length, 24, `${label}: eye and hand conditions remain independently separated`);
  assert.equal((markup.match(/class="tst12-session-accounting"/g) || []).length, 1, `${label}: one aggregate ledger`);
  for (const metric of ["TOTAL TAPS", "HITS", "MISSES", "SELECTED FOR SCORING", "ADDITIONAL OBSERVATIONS"]) assert.match(markup, new RegExp(metric), `${label}: ${metric}`);
  assert.match(markup, /STATION 7[\s\S]*0 – Miss<\/th><td>1<\/td><td>0<\/td>/, `${label}: miss-only accounting cannot remove Station 7`);
  assert.doesNotMatch(markup, /data-tst12-retired-renderer|Recorded:\s*60\s+Selected:/, `${label}: retired regional presentation absent`);
}

for (const targetId of ["baker_tst12_17_5x23", "baker_tst12_23x35"]) assertApprovedMarkup(renderer.render(resultFixture(targetId)), targetId);

const session021Style = '<details><summary>Station Results</summary><div>SESSION PPT 4.55 Recorded: 11 Selected: 10 Additional: 1 Hits: 10 Misses: 1</div></details>';
assert.throws(() => assertApprovedMarkup(session021Style, "Session #021-style legacy"), /approved renderer identity|aggregate heading/, "the preserved Session #021-style defect fails the gate");
assert.throws(() => assertApprovedMarkup('<section data-tst12-retired-renderer="vault">Rejected retired TST-12 renderer.</section>', "retired renderer"), /approved renderer identity/, "deliberately selecting a retired renderer fails the gate");

assert.match(adapter, /return renderer\.render\(result, \{ experienceMode: mode \}\)/, "live Result delegates to the shared renderer with its governed experience mode");
assert.match(adapter, /disclosureController\.bindDisclosure\(group, sessionStage\)/, "live Session delegates Station Results state to the shared controller");
assert.match(adapter, /<details class="sec-session-section tst12-session-details"><summary>Session Details<\/summary>/, "Session Details is a real collapsed disclosure rather than permanently visible content");
assert.doesNotMatch(adapter, /tst12-session-details"[^>]*><h3>Session Details|panel\.hidden = false/, "the previous always-visible Session Details path is retired");
assert.match(sharedSource, /blocked-non-user-open/, "shared controller rejects non-user expansion");
assert.match(sharedSource, /header-open-request/, "shared controller recognizes deliberate header activation");
assert.match(sharedSource, /\.tst12-session-details, \.tst12-station-performance/, "one shared controller governs both independent Session disclosures");
assert.match(sharedSource, /sibling-user-open-reset/, "the shared controller collapses an expanded sibling before a legitimate user expansion");
assert.match(adapter, /details\[data-sec-region="session"\]/, "TST-12 Session mounting is anchored to the universal Session stage");
assert.match(adapter, /sessionBody\.insertBefore\(group, close \|\| null\)/, "TST-12 Session content mounts before Close Drawer inside the Session body");
assert.match(adapter, /Saved session information is unavailable for this result\./, "missing Session data renders an explicit unavailable state");
assert.doesNotMatch(adapter, /originalSessionDetails\.outerHTML|root\.insertAdjacentHTML\("beforeend", sessionGroup\)/, "destructive legacy Session replacement is retired");
assert.match(records, /return renderer\.render\(result, \{ experienceMode \}\)/, "Vault delegates to the shared renderer with the preserved experience mode");
assert.doesNotMatch(adapter, /data-tst12-retired-renderer="live-result"/, "retired live renderer is no longer executable");
assert.doesNotMatch(records, /data-tst12-retired-renderer="vault"/, "retired Vault renderer is no longer executable");
assert.match(targetHtml, /tst12_station_results\.js\?v=sczn3-tst12-station-pip-cq-20261107-2/, "live Result loads the current shared renderer before its adapter");
assert.match(targetHtml, /tst12_universal_experience\.js\?v=sczn3-three-path-release-20261109-1/, "live Result loads the controller-aware adapter through the governed three-path asset identity");
assert.match(records, /tst12_station_results\.js\?v=sczn3-tst12-station-pip-cq-20261107-2/, "Vault loads the same current shared renderer");
assert.match(sharedCss, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/, "five accounting metrics have independent desktop columns");
assert.match(sharedCss, /@media\(max-width:640px\)/, "shared contract owns mobile stacking");

for (const [asset, top, side, footer] of [
  ["assets/TST12_PRINT_17.5X23_V1.svg", ["BOTH", "RE", "LE"], ["RHS", "LHO", "RHO", "LHS"], ["BOTH = Both Eyes", "RHS = Right-Hand Supported", "RHO = Right-Hand Only"]],
  ["assets/TST12_PRINT_23X35_V1.svg", ["BOTH", "RE", "LE"], ["RHS", "LHO", "RHO", "LHS"], ["BOTH = Both Eyes", "RHS = Right-Hand Supported", "RHO = Right-Hand Only"]]
]) {
  const svg = read(asset);
  for (const label of [...top, ...side, ...footer]) assert.match(svg, new RegExp(label), `${asset}: preserves ${label}`);
  assert.equal((svg.match(/<use href="#station"/g) || []).length, 12, `${asset}: preserves all twelve station placements`);
}

execFileSync("python3", ["test_baker_tst12_universal_lifecycle.py"], { cwd: path.join(docs, "backend"), stdio: "inherit" });

const fixtureByTarget = Object.fromEntries(["baker_tst12_17_5x23", "baker_tst12_23x35"].map(id => [id, resultFixture(id)]));
const legacyBody = '<details open><summary>Station Results</summary><div class="legacy-line">SESSION PPT 4.55 &nbsp; Recorded: 11 &nbsp; Selected: 10 &nbsp; Additional: 1 &nbsp; Hits: 10 &nbsp; Misses: 1</div><div class="legacy-cards">STATION 1 STATION 2</div></details>';
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/fixture.html") {
    const target = fixtureByTarget[url.searchParams.get("target")] || fixtureByTarget.baker_tst12_17_5x23;
    const legacy = url.searchParams.get("legacy") === "1";
    response.setHeader("content-type", "text/html; charset=utf-8");
    const experienceMode = url.searchParams.get("mode") === "simulation" ? "simulation" : "actual";
    response.end(`<!doctype html><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/tst12-station-results.css"><style>body{margin:0;padding:12px;background:#050505;font-family:Arial,sans-serif}.surface{max-width:1120px;margin:auto}.legacy-line{padding:10px;color:#fff;background:#191919}.legacy-cards{height:28px;overflow:hidden;color:#ffd84d}</style><main class="surface" data-surface="${url.searchParams.get("surface") || "result"}"><div id="root">${legacy ? legacyBody : ""}</div></main>${legacy ? "" : `<script src="/tst12_station_results.js"></script><script>const result=${JSON.stringify(target)};document.getElementById("root").innerHTML=SCZN3Tst12StationResults.render(result,{experienceMode:${JSON.stringify(experienceMode)}});document.querySelector("details").open=true;document.documentElement.dataset.executedPresentation=SCZN3Tst12StationResults.PRESENTATION_ID;</script>`}`);
    return;
  }
  if (url.pathname === "/session-fixture.html") {
    const mode = url.searchParams.get("mode") === "simulation" ? "Simulator" : "Actual Round";
    const target = url.searchParams.get("target") || "baker_tst12_17_5x23";
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/tst12-universal-experience.css"><style>body{margin:0;padding:12px;background:#050505;color:#fff;font-family:Arial,sans-serif}.sec-v1-flow{max-width:900px;margin:auto}.sec-stage-body{padding:10px;background:#191919}.sec-close-drawer{margin-top:10px}.sec-session-record-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.sec-session-record-fields>div{display:grid;gap:2px;padding:7px;background:#fff;color:#111}.sec-session-record-fields span{font-size:10px}.sec-session-record-fields strong{font-size:14px}</style></head><body><main id="contractSecRoot"><article class="contract-universal-sec"><div class="sec-v1-flow"><details data-sec-region="target"><summary>1 · TARGET</summary><div>Target</div></details><details class="sec-accordion-stage" data-sec-region="session"><summary>2 · SESSION</summary><div class="sec-stage-body"><section class="sec-session-section"><h3>Session Details</h3><div class="sec-session-record-fields"><div><span>Session</span><strong>${mode}</strong></div><div><span>Target</span><strong>${target}</strong></div><div><span>Caliber</span><strong>.22 LR</strong></div><div><span>Distance</span><strong>25 yards</strong></div><div><span>Shooter</span><strong>Isolated Test Shooter</strong></div></div></section><a href="#">Baker Targets</a><button class="sec-close-drawer" type="button" data-sec-close-drawer>Close Drawer</button></div></details></div></article></main><script src="/tst12_station_results.js"></script><script src="/tst12_universal_experience.js"></script><script>const root=document.getElementById("contractSecRoot");const sessionMarkup='<details class="sec-session-section tst12-session-details"><summary>Session Details</summary><div class="sec-session-record-fields"><div><span>Session</span><strong>${mode}</strong></div><div><span>Firearm</span><strong>Pistol</strong></div><div><span>Equipment</span><strong>Iron sights</strong></div><div><span>Ammunition</span><strong>Test ammunition</strong></div><div><span>Caliber</span><strong>.22 LR</strong></div><div><span>Distance</span><strong>25 yards</strong></div><div><span>Angular unit</span><strong>MOA</strong></div><div><span>Shooter</span><strong>Isolated Test Shooter</strong></div></div></details>';const stationMarkup='<details class="tst12-station-performance"><summary>Station Results</summary><div><strong>TOTAL STATION RESULTS</strong><p>12 stations attempted</p></div></details>';window.mountCorrected=()=>SCZN3Tst12SessionDrawer.mount(root,sessionMarkup,stationMarkup);window.mountCorrected();window.programmaticOpen=()=>{document.querySelector(".tst12-station-performance").open=true;};root.addEventListener("click",event=>{if(event.target.closest("[data-sec-close-drawer]")){event.preventDefault();event.target.closest("details[data-sec-region=session]").open=false;}});window.simulateExactReopen=()=>{const body=root.querySelector('details[data-sec-region="session"]>.sec-stage-body');body.innerHTML='<section class="sec-session-section"><h3>Session Details</h3><div class="sec-session-record-fields"><div><span>Session</span><strong>${mode}</strong></div><div><span>Target</span><strong>${target}</strong></div><div><span>Caliber</span><strong>.22 LR</strong></div><div><span>Distance</span><strong>25 yards</strong></div><div><span>Shooter</span><strong>Isolated Test Shooter</strong></div></div></section><a href="#">Baker Targets</a><button class="sec-close-drawer" type="button" data-sec-close-drawer>Close Drawer</button>';window.mountCorrected();};</script></body></html>`);
    return;
  }
  if (url.pathname === "/session-auto-open-defect.html") {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end('<!doctype html><details class="tst12-session-details" open><summary>Session Details</summary><p>Incorrect automatic expansion</p></details><details class="tst12-station-performance" open><summary>Station Results</summary><p>Incorrect automatic expansion</p></details>');
    return;
  }
  if (url.pathname === "/session-legacy-failure.html") {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(`<!doctype html><main id="root"><details data-sec-region="session" open><summary>2 · SESSION</summary><div class="sec-stage-body"><section class="sec-session-section"><div class="sec-session-record-fields"><div><span>Caliber</span><strong>.22 LR</strong></div></div></section><a>Baker Targets</a><button data-sec-close-drawer>Close Drawer</button></div></details></main><script>const root=document.getElementById('root');const markup='<section class="tst12-result-session-group"><section class="tst12-session-details"><div class="sec-session-record-fields"><div><span>Caliber</span><strong>.22 LR</strong></div></div></section></section>';function legacyPolish(){root.querySelectorAll('.tst12-result-session-group,.tst12-session-details').forEach(panel=>panel.remove());const original=root.querySelector('.sec-session-section');if(original)original.outerHTML=markup;else root.insertAdjacentHTML('beforeend',markup);}legacyPolish();legacyPolish();</script>`);
    return;
  }
  const relative = url.pathname.replace(/^\//, "");
  if (["tst12_station_results.js", "tst12-station-results.css", "tst12_universal_experience.js", "tst12-universal-experience.css"].includes(relative)) {
    response.setHeader("content-type", relative.endsWith(".js") ? "text/javascript" : "text/css");
    response.end(read(relative));
    return;
  }
  if (["assets/TST12_PRINT_17.5X23_TAP_N_SCORE_V1.svg", "assets/TST12_PRINT_23X35_TAP_N_SCORE_V1.svg"].includes(relative)) {
    response.setHeader("content-type", "image/svg+xml");
    response.end(read(relative));
    return;
  }
  response.statusCode = 404;
  response.end("not found");
});
const authorizedPort = Number(process.env.SCZN3_TST12_TEST_PORT);
assert.equal(authorizedPort, 8272, "the stabilization gate requires the Founder-authorized port 8272 and has no fallback listener");
await new Promise(resolve => server.listen(authorizedPort, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const systemChromium = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(systemChromium) ? { executablePath: systemChromium } : {}) });
try {
  const autoOpenDefect = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  await autoOpenDefect.goto(`${origin}/session-auto-open-defect.html`, { waitUntil: "networkidle" });
  assert.equal(await autoOpenDefect.locator(".tst12-session-details").getAttribute("open"), "", "deliberately reintroduced Session Details automatic expansion is observable and fails the collapsed-state contract");
  assert.equal(await autoOpenDefect.locator(".tst12-station-performance").getAttribute("open"), "", "deliberately reintroduced automatic expansion is observable and fails the collapsed-state contract");
  assert.equal(await autoOpenDefect.evaluate(() => {
    const sessionDetails = document.querySelector(".tst12-session-details");
    const stationResults = document.querySelector(".tst12-station-performance");
    return sessionDetails.open && stationResults.open;
  }), true, "deliberately reintroduced simultaneous expansion violates and therefore fails the accordion invariant");
  await autoOpenDefect.screenshot({ path: path.join(evidenceDir, "before-station-results-auto-open-defect.png"), fullPage: true });
  await autoOpenDefect.close();

  const emptyDrawer = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  await emptyDrawer.goto(`${origin}/session-legacy-failure.html`, { waitUntil: "networkidle" });
  const emptyState = await emptyDrawer.evaluate(() => {
    const body = document.querySelector('details[data-sec-region="session"]>.sec-stage-body');
    return { fields: body.querySelectorAll(".sec-session-record-fields>div").length, text: body.innerText.replace(/\s+/g, " ").trim(), misplaced: document.querySelectorAll("#root > .tst12-result-session-group").length };
  });
  assert.equal(emptyState.fields, 0, "deliberately repeated legacy mount leaves the Session drawer empty");
  assert.match(emptyState.text, /Baker Targets.*Close Drawer/, "the reproduced failure contains only the publisher control and Close Drawer");
  assert.equal(emptyState.misplaced, 1, "legacy content is rendered into the wrong container");
  await emptyDrawer.screenshot({ path: path.join(evidenceDir, "before-empty-session-drawer.png"), fullPage: true });
  await emptyDrawer.close();

  for (const target of Object.keys(fixtureByTarget)) {
    for (const mode of ["simulation", "actual"]) {
      for (const viewport of [{ name: "desktop", width: 1180, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${origin}/session-fixture.html?target=${target}&mode=${mode}`, { waitUntil: "networkidle" });
        const summary = page.locator('details[data-sec-region="session"]>summary');
        const assertPopulated = async phase => {
          const state = await page.evaluate(() => {
            const stage = document.querySelector('details[data-sec-region="session"]');
            const body = stage.querySelector(":scope>.sec-stage-body");
            const fields = [...body.querySelectorAll(".tst12-session-details .sec-session-record-fields>div")];
            return { open: stage.open, fields: fields.length, populated: fields.filter(field => field.querySelector("strong")?.textContent.trim()).length, groupsInBody: body.querySelectorAll(":scope>.tst12-result-session-group").length, misplaced: document.querySelectorAll("#contractSecRoot>.tst12-result-session-group").length, text: body.textContent };
          });
          assert.equal(state.open, true, `${target} ${mode} ${viewport.name} ${phase}: Session is open`);
          assert.equal(state.fields, 8, `${target} ${mode} ${viewport.name} ${phase}: all eight Session fields remain mounted`);
          assert.equal(state.populated, 8, `${target} ${mode} ${viewport.name} ${phase}: all eight Session fields remain populated`);
          assert.equal(state.groupsInBody, 1, `${target} ${mode} ${viewport.name} ${phase}: exactly one Session group is mounted in the drawer body`);
          assert.equal(state.misplaced, 0, `${target} ${mode} ${viewport.name} ${phase}: no Session content is mounted outside its drawer`);
          assert.match(state.text, /Session Details[\s\S]*\.22 LR[\s\S]*25 yards/, `${target} ${mode} ${viewport.name} ${phase}: complete Session information remains mounted`);
        };
        await summary.click();
        await page.waitForTimeout(100);
        await assertPopulated("first open");
        const detailsDisclosure = page.locator(".tst12-session-details");
        const stationDisclosure = page.locator(".tst12-station-performance");
        const assertExclusive = async phase => assert.equal(await page.evaluate(() => {
          const sessionDetails = document.querySelector(".tst12-session-details");
          const stationResults = document.querySelector(".tst12-station-performance");
          return Boolean(sessionDetails?.open && stationResults?.open);
        }), false, `${target} ${mode} ${viewport.name} ${phase}: child disclosures are never simultaneously expanded`);
        assert.equal(await detailsDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: Session Details starts collapsed`);
        assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: Station Results starts collapsed`);
        await assertExclusive("initial Session open");
        assert.equal(await detailsDisclosure.getAttribute("data-tst12-disclosure-controller"), disclosureIdentity, `${target} ${mode} ${viewport.name}: Session Details uses the shared controller`);
        assert.equal(await page.locator(".tst12-station-performance").getAttribute("data-tst12-disclosure-controller"), disclosureIdentity, `${target} ${mode} ${viewport.name}: shared disclosure controller is active`);
        await page.evaluate(() => window.programmaticOpen());
        await page.waitForTimeout(100);
        assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: non-user programmatic expansion is rejected`);
        assert.equal(await page.evaluate(() => window.SCZN3Tst12DisclosureDiagnostics.some(entry => entry.cause === "blocked-non-user-open")), true, `${target} ${mode} ${viewport.name}: rejected expansion is diagnosed`);
        await page.locator(".tst12-session-details>summary").click();
        assert.equal(await detailsDisclosure.getAttribute("open"), "", `${target} ${mode} ${viewport.name}: Session Details expands from its own header`);
        assert.equal(await stationDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: opening Session Details does not open Station Results`);
        await assertExclusive("Session Details open");
        assert.match(await detailsDisclosure.innerText(), /Session Details[\s\S]*\.22 LR[\s\S]*25 yards/, `${target} ${mode} ${viewport.name}: expanded Session Details content is visible and readable`);
        if (target === "baker_tst12_17_5x23" && mode === "simulation" && viewport.name === "desktop") await page.screenshot({ path: path.join(evidenceDir, "after-session-details-expanded-station-results-collapsed.png"), fullPage: true });
        await assertPopulated("expanded Session Details");
        await page.locator(".tst12-station-performance>summary").click();
        assert.equal(await stationDisclosure.getAttribute("open"), "", `${target} ${mode} ${viewport.name}: Station Results expands from its own header`);
        assert.equal(await detailsDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: opening Station Results automatically collapses Session Details`);
        await assertExclusive("Station Results open");
        assert.match(await stationDisclosure.innerText(), /TOTAL STATION RESULTS/, `${target} ${mode} ${viewport.name}: approved Station Results are displayed`);
        if (target === "baker_tst12_17_5x23" && mode === "simulation" && viewport.name === "desktop") await page.screenshot({ path: path.join(evidenceDir, "after-station-results-expanded-session-details-auto-collapsed.png"), fullPage: true });
        await page.locator(".tst12-session-details>summary").click();
        assert.equal(await detailsDisclosure.getAttribute("open"), "", `${target} ${mode} ${viewport.name}: Session Details reopens from its own header`);
        assert.equal(await stationDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: reopening Session Details automatically collapses Station Results`);
        await assertExclusive("Session Details reopened");
        if (target === "baker_tst12_17_5x23" && mode === "simulation" && viewport.name === "desktop") await page.screenshot({ path: path.join(evidenceDir, "after-session-details-expanded-station-results-auto-collapsed.png"), fullPage: true });
        await page.locator(".tst12-session-details>summary").click();
        assert.equal(await detailsDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: clicking expanded Session Details collapses it`);
        assert.equal(await stationDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: both child disclosures may remain collapsed`);
        await assertExclusive("both manually collapsed");
        await page.locator(".tst12-station-performance>summary").click();
        assert.equal(await stationDisclosure.getAttribute("open"), "", `${target} ${mode} ${viewport.name}: Station Results opens before parent Session close`);
        await assertExclusive("before parent close");
        await page.locator("[data-sec-close-drawer]").click();
        assert.equal(await page.locator('details[data-sec-region="session"]').getAttribute("open"), null, `${target} ${mode} ${viewport.name}: Close Drawer closes Session`);
        await summary.click();
        await assertPopulated("reopen");
        assert.equal(await detailsDisclosure.getAttribute("open"), null, `${target} ${mode} ${viewport.name}: reopening Session resets Session Details to collapsed`);
        assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: reopening Session resets Station Results to collapsed`);
        await assertExclusive("parent Session reopen");
        await page.evaluate(() => window.mountCorrected());
        await assertPopulated("after repeated presentation refresh");
        assert.equal(await page.locator(".tst12-session-details").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: presentation refresh leaves Session Details collapsed`);
        assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: presentation refresh leaves Station Results collapsed`);
        await assertExclusive("presentation refresh");
        await page.evaluate(() => window.simulateExactReopen());
        await assertPopulated("after SEC save and exact reopen remount");
        assert.equal(await page.locator(".tst12-session-details").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: exact reopen leaves Session Details collapsed`);
        assert.equal(await page.locator(".tst12-station-performance").getAttribute("open"), null, `${target} ${mode} ${viewport.name}: exact reopen leaves Station Results collapsed`);
        await assertExclusive("SEC Vault exact reopen");
        await page.screenshot({ path: path.join(evidenceDir, `after-session-drawer-${target}-${mode}-${viewport.name}.png`), fullPage: true });
        await page.close();
      }
    }
  }

  const before = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  await before.goto(`${origin}/fixture.html?legacy=1`, { waitUntil: "networkidle" });
  await before.screenshot({ path: path.join(evidenceDir, "before-session-021-style-failure.png"), fullPage: true });
  assert.equal(await before.locator("[data-tst12-station-results-renderer]").count(), 0, "browser gate rejects Session #021-style legacy markup");
  await before.close();

  const lifecycleHashes = new Map();
  for (const target of Object.keys(fixtureByTarget)) {
    for (const mode of ["simulation", "actual"]) {
      for (const viewport of [{ name: "desktop", width: 1180, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
        for (const surface of ["result", "sec", "vault", "exact-reopen"]) {
          const page = await browser.newPage({ viewport });
          await page.goto(`${origin}/fixture.html?target=${target}&mode=${mode}&surface=${surface}`, { waitUntil: "networkidle" });
          const state = await page.evaluate(expectedIdentity => {
            const rendererRoot = document.querySelector("[data-tst12-station-results-renderer]");
            const cards = [...document.querySelectorAll("[data-tst12-station-card]")];
            const accounting = [...document.querySelectorAll(".tst12-session-accounting>div")];
            const overflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
            const clipped = [...document.querySelectorAll(".tst12-total-station-results,.tst12-station-card-title,.tst12-session-accounting span,.tst12-condition-description")].filter(element => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1).length;
            return {
              executed: document.documentElement.dataset.executedPresentation,
              renderer: rendererRoot && rendererRoot.dataset.tst12StationResultsRenderer,
              heading: document.querySelector(".tst12-total-station-results")?.textContent.trim(),
              cards: cards.map(card => Number(card.dataset.tst12StationCard)),
              accounting: accounting.map(item => item.querySelector("span")?.textContent.trim()),
              conditionParts: document.querySelectorAll(".tst12-condition-part").length,
              retired: document.querySelectorAll("[data-tst12-retired-renderer]").length,
              unavailable: document.querySelectorAll(".tst12-station-results-unavailable").length,
              overflow,
              clipped,
              htmlHashInput: rendererRoot?.outerHTML || "",
              identityMatches: document.documentElement.dataset.executedPresentation === expectedIdentity
            };
          }, identity);
          assert.equal(state.identityMatches, true, `${target} ${mode} ${viewport.name} ${surface}: browser executed approved identity`);
          assert.equal(state.renderer, identity);
          assert.equal(state.heading, "TOTAL STATION RESULTS");
          assert.deepEqual(state.cards, Array.from({ length: 12 }, (_, index) => index + 1));
          assert.deepEqual(state.accounting, ["TOTAL TAPS", "HITS", "MISSES", "SELECTED FOR SCORING", "ADDITIONAL OBSERVATIONS"]);
          assert.equal(state.conditionParts, 24);
          assert.equal(state.retired, 0);
          assert.equal(state.unavailable, 0);
          assert.equal(state.overflow, 0);
          assert.equal(state.clipped, 0);
          const hash = crypto.createHash("sha256").update(state.htmlHashInput).digest("hex");
          const lifecycleKey = `${target}:${mode}:${viewport.name}`;
          if (!lifecycleHashes.has(lifecycleKey)) lifecycleHashes.set(lifecycleKey, hash);
          else assert.equal(hash, lifecycleHashes.get(lifecycleKey), `${lifecycleKey}: Result, SEC, Vault, and exact reopen use identical markup`);
          if (surface === "result") await page.screenshot({ path: path.join(evidenceDir, `after-${target}-${mode}-${viewport.name}.png`), fullPage: true });
          await page.close();
        }
      }
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log(`PASS TST-12 final stabilization gate; evidence: ${evidenceDir}`);
