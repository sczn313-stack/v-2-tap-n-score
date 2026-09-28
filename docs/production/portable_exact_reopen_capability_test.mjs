import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile("sec_reopen_capability.js", "utf8");
const runtime = await readFile("target_execution_runtime.js", "utf8");
const records = await readFile("records.html", "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
}

function tokenFor(sessionId) {
  const claims = Buffer.from(JSON.stringify({
    artifactSha256: "a".repeat(64),
    purpose: "sczn3-preserved-sec-reopen",
    sessionId,
    version: 1
  })).toString("base64url");
  return `${claims}.${"b".repeat(43)}`;
}

function authorityFor({ href, localStorage }) {
  const location = new URL(href);
  const window = { atob, fetch: async () => { throw new Error("unexpected fetch"); }, localStorage, location };
  vm.runInNewContext(source, { URL, URLSearchParams, console, window });
  return window.SCZN3SECReopenAuthority;
}

const sessionId = "sczn3-session-portable-test";
const capability = tokenFor(sessionId);

// Browser A receives and remembers the backend-issued capability after SAVE SEC.
const browserAStorage = storage();
const browserA = authorityFor({ href: "http://127.0.0.1:8119/target-experience.html", localStorage: browserAStorage });
assert.equal(browserA.remember({ session: { sessionId }, reopenCapability: capability }), true);
const portable = browserA.portableUrl(`target-experience.html?session=${sessionId}&view=sec&authorityPort=8118`, sessionId);
const portableUrl = new URL(portable);
assert.equal(portableUrl.searchParams.has("secReopenCapability"), false, "capability must never enter the query string");
assert.equal(new URLSearchParams(portableUrl.hash.slice(1)).get("secReopenCapability"), capability, "portable URL carries possession authority only in the fragment");

// Browser B has genuinely empty storage. The copied URL alone must authorize
// the exact session request by promoting the fragment to the guarded header.
const browserBStorage = storage();
const browserB = authorityFor({ href: portable, localStorage: browserBStorage });
assert.equal(browserB.capability(sessionId), "", "independent browser has no same-origin stored capability");
assert.equal(browserB.authorizedHeaders(sessionId)[browserB.HEADER], capability, "independent browser recovers the exact capability from the URL fragment");
assert.equal(browserB.authorizedHeaders("different-session")[browserB.HEADER], undefined, "a fragment capability is not reused for another session identity");

assert.match(runtime, /SCZN3SECReopenAuthority\?\.portableUrl\(reopenBaseHref, session\.sessionId\)/, "Exact Reopen emits the portable capability URL");
assert.match(records, /SCZN3SECReopenAuthority\?\.portableUrl\(destination, session\.sessionId\)/, "Vault OPEN SEC emits the same portable capability URL");
assert.match(records, /window\.location\.replace\(historicalSecUrl\(requestedSession, requestedPackage\)\)/, "Vault dispatch preserves possession authority during canonical exact-reopen routing");

console.log("PASS independent-browser exact-reopen capability portability");
