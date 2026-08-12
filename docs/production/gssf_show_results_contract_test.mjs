import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const shoot = await readFile(new URL("../shoot.html", import.meta.url), "utf8");
const matrix = await readFile(new URL("../matrix.html", import.meta.url), "utf8");
const redirects = await readFile(new URL("../_redirects", import.meta.url), "utf8");
const netlify = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
const labels = await readFile(new URL("../presentation_labels.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(
  shoot,
  /<meta name="sczn3-authority-endpoint" content="\/api\/authority\/ugeo" \/>/,
  "public generic authority traffic must stay same-origin in the browser",
);
assert.match(labels, /gssf_ac_1: "GSSF AC-1"/, "GSSF must preserve its governed target identity");
assert.match(
  matrix,
  /queryTargetProfileId\.toLowerCase\(\) === "gssf_ac_1"[\s\S]*?canonicalGssfAttribution\(\)[\s\S]*?if \(\s*scannedIdentity/,
  "an explicit GSSF launch must resolve before any stale M4 scan identity",
);
assert.doesNotMatch(labels, /Competition Paper Target \(Demo\)/, "legacy demo identity must not reach the universal SEC");
assert.match(
  redirects,
  /^\/api\/authority\/ugeo https:\/\/sczn3-authority\.onrender\.com\/api\/authority\/ugeo 200!$/m,
  "Netlify redirects must proxy the governed generic authority route",
);
assert.match(
  netlify,
  /from = "\/api\/authority\/ugeo"[\s\S]*?to = "https:\/\/sczn3-authority\.onrender\.com\/api\/authority\/ugeo"[\s\S]*?status = 200[\s\S]*?force = true/,
  "Netlify configuration must preserve the GSSF authority proxy",
);
assert.match(shoot, /let authorityRequestInFlight = false;/, "submission must have an explicit in-flight state");
assert.match(
  shoot,
  /const TRANSIENT_AUTHORITY_HTTP_STATUSES = new Set\(\[502, 503, 504\]\);[\s\S]*?for \(let attempt = 0; attempt < 2; attempt \+= 1\)[\s\S]*?TRANSIENT_AUTHORITY_HTTP_STATUSES\.has\(response\.status\)/,
  "one automatic retry must absorb a transient Netlify-to-Render gateway failure",
);
assert.match(
  shoot,
  /if \(error && error\.isAuthorityResponse\) throw error;/,
  "non-transient HTTP authority failures must fail safely without retry",
);

const retrySource = shoot.match(/const TRANSIENT_AUTHORITY_HTTP_STATUSES[\s\S]*?(?=async function requestBackendAuthority\(\))/)?.[0];
assert.ok(retrySource, "the transient authority retry helper must remain testable");

async function exerciseRetry(responses) {
  let requestCount = 0;
  const context = {
    fetch: async () => {
      const response = responses[requestCount++];
      if (response instanceof Error) throw response;
      return {
        ...response,
        clone() {
          return { json: async () => response.packageData || {} };
        },
      };
    },
    window: { setTimeout: callback => callback() },
  };
  vm.runInNewContext(`${retrySource}\nglobalThis.fetchAuthorityResponse = fetchAuthorityResponse;`, context);
  return {
    requestCount: () => requestCount,
    response: () => context.fetchAuthorityResponse("/api/authority/m4", { method: "POST" }),
  };
}

const transientGateway = await exerciseRetry([{ ok: false, status: 502 }, { ok: true, status: 200 }]);
assert.equal((await transientGateway.response()).status, 200, "a transient 502 must recover on the single retry");
assert.equal(transientGateway.requestCount(), 2, "a transient gateway failure must be attempted exactly twice");

const invalidAuthority = await exerciseRetry([{ ok: false, status: 400 }, { ok: true, status: 200 }]);
await assert.rejects(invalidAuthority.response(), /authority_http_400/);
assert.equal(invalidAuthority.requestCount(), 1, "a governed 400 response must not be retried");

const interruptedRequest = await exerciseRetry([new TypeError("network interrupted"), { ok: true, status: 200 }]);
assert.equal((await interruptedRequest.response()).status, 200, "one interrupted request must recover on retry");
assert.equal(interruptedRequest.requestCount(), 2, "a network interruption must be attempted exactly twice");
assert.match(
  shoot,
  /SCZN3SmartTargetIdentity\.isM4\(SCZN3SmartTargetIdentity\.resolve\(TARGET_QUERY\)\)/,
  "target identity resolution must be tested as M4 instead of treating every resolved target as M4",
);
assert.match(
  shoot,
  /const targetProfileId = activeTargetProfileId\(\);\s*if \(targetProfileId\) return targetProfileId === "m4_25m_zero";/,
  "an explicit non-M4 target profile must override the firearm profile and stale active matrix",
);
assert.match(
  shoot,
  /if \(queryMissionFamily\) return String\(queryMissionFamily\)\.toLowerCase\(\);/,
  "an explicit mission family must override stale session and matrix attribution",
);
assert.match(
  shoot,
  /if \(targetProfileId === "baker_st_100yd_smart_zero"\) \{[\s\S]*?targetName: "Baker 100 Yard Smart Target"[\s\S]*?targetDistanceValue: "100"/,
  "the 100 Yard launch must create its own governed target attribution",
);
assert.doesNotMatch(
  shoot,
  /\|\| SCZN3SmartTargetIdentity\.resolve\(TARGET_QUERY\)\s*\n/,
  "a non-M4 resolved target must not enter the M4 authority route",
);
assert.match(shoot, /completeButton\.textContent = "Scoring…";/, "the active control must acknowledge scoring");
assert.match(
  shoot,
  /if \(isGssfAuthoritySession\(\) && !isGssfAuthorityPackage\(backendAuthorityPackage\)\) \{[\s\S]*?grid\.innerHTML = targetIntelStackHtml\(\);[\s\S]*?return;/,
  "GSSF pending and failure states must render even before a valid result package exists",
);
assert.match(
  shoot,
  /document\.getElementById\("showResults"\)\.disabled = authorityRequestInFlight \|\|/,
  "repeat submissions must be locked while backend scoring is in flight",
);
assert.match(
  shoot,
  /authorityStatusMessage = authorityFailureShooterMessage\(error\);[\s\S]*?renderResults\(\);[\s\S]*?finally \{[\s\S]*?authorityRequestInFlight = false;[\s\S]*?renderResults\(\);/,
  "authority failure must be visible and must release the submission lock",
);
assert.match(shoot, /status >= 500[\s\S]*?analysis service is temporarily unavailable/, "backend failures must not be mislabeled as connection failures");
assert.match(shoot, /data-authority-retry>Try Again</, "authority failure must expose an intentional retry action");
assert.doesNotMatch(
  shoot,
  /if \(isGssfAuthorityPackage\(authorityPackage\)\) \{[\s\S]*?document\.getElementById\("saveMarks"\)\.click\(\);[\s\S]*?\}/,
  "Show Results must not automatically save or leave the GSSF Target Page",
);
assert.match(
  shoot,
  /function gssfTimerTimeReadyForSave\(authorityPackage = backendAuthorityPackage\) \{[\s\S]*?officialMatchTimeSeconds !== null[\s\S]*?finalScoreStatus === "calculated";/,
  "GSSF saving must wait for backend-verified Timer Time and Final Time",
);
assert.match(
  shoot,
  /const gssfTimerTimePending = isGssf && resultsShown && !gssfTimerTimeReadyForSave\(\);[\s\S]*?document\.getElementById\("saveMarks"\)\.disabled =[\s\S]*?\|\| gssfTimerTimePending[\s\S]*?\|\| \(isTraining && !trainingDrillFinished\);/,
  "Save Session must stay disabled while GSSF Timer Time is pending",
);
assert.match(
  shoot,
  /if \(isGssfAuthorityPackage\(backendAuthorityPackage\) && !gssfTimerTimeReadyForSave\(\)\) \{[\s\S]*?Select Seconds and Tenths before saving\.[\s\S]*?return;/,
  "the explicit save handler must refuse an incomplete GSSF Timer Time",
);
assert.match(shoot, /id="gssfTimerSeconds" aria-label="Timer seconds"/, "mobile Timer Time must expose an accessible seconds dial");
assert.match(shoot, /id="gssfTimerTenths" aria-label="Timer tenths"/, "mobile Timer Time must expose an accessible tenths dial");
assert.match(
  shoot,
  /return safeSeconds \+ \(safeTenths \/ 10\);/,
  "the mobile selector must convert tenths without changing timer authority",
);
const selectorValueSource = shoot.match(/function gssfTimerSelectorValue\(seconds, tenths\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(selectorValueSource, "the governed Timer Time conversion must remain testable");
const selectorContext = {};
vm.runInNewContext(`${selectorValueSource}\nglobalThis.gssfTimerSelectorValue = gssfTimerSelectorValue;`, selectorContext);
assert.equal(selectorContext.gssfTimerSelectorValue(0, 0), 0, "0 seconds + 0 tenths must equal 0.00 seconds");
assert.equal(selectorContext.gssfTimerSelectorValue(7, 3), 7.3, "7 seconds + 3 tenths must equal 7.30 seconds");
assert.equal(selectorContext.gssfTimerSelectorValue(59, 9), 59.9, "59 seconds + 9 tenths must equal 59.90 seconds");
assert.match(
  shoot,
  /secondsDial\.addEventListener\("change", handleDialChange\);[\s\S]*?tenthsDial\.addEventListener\("change", handleDialChange\);/,
  "either mobile dial must immediately submit the selected Timer Time",
);
assert.match(
  styles,
  /@media \(max-width:560px\)[\s\S]*?\.gssf-official-time-entry\{[\s\S]*?display:none;[\s\S]*?\.gssf-mobile-time-selector\{[\s\S]*?display:grid;/,
  "the dial selector must replace the numeric input on mobile only",
);
assert.match(
  styles,
  /\.gssf-mobile-time-selector\{[\s\S]*?display:grid;[\s\S]*?order:-2;[\s\S]*?\.gssf-final-score-panel\{[\s\S]*?order:-1;/,
  "the mobile Timer selector must be the first actionable result before detailed scoring",
);

console.log("GSSF Show Results contract: PASS");
