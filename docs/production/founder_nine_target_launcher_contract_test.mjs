import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cohort = JSON.parse(await readFile(
  "authority-evidence/platform/target-data-one-road-scale-proof-2026-09-08/TARGET_DATA_ONE_ROAD_COHORT.json",
  "utf8",
));
const launcher = await readFile("founder-nine-target-review.html", "utf8");
const reviewServer = await readFile("production/m16a2_tstt_review_server.mjs", "utf8");

assert.equal(cohort.targets.length, 9, "locked proof cohort must contain exactly nine targets");
assert.equal((launcher.match(/class="review-card"/g) || []).length, 9, "launcher must contain exactly nine cards");

const links = [...launcher.matchAll(/<a href="([^"]+)">OPEN TARGET #(\d+)<\/a>/g)];
assert.equal(links.length, 9, "launcher must contain exactly nine target actions");

for (const [index, target] of cohort.targets.entries()) {
  const ordinal = index + 1;
  assert.equal(target.ordinal, ordinal, `cohort ordinal ${ordinal}`);
  assert.match(launcher, new RegExp(`TARGET #${ordinal}`), `visible TARGET #${ordinal} label`);
  assert.match(launcher, new RegExp(`review-assets/target-0${ordinal}\\.(?:jpe?g|webp)`), `target ${ordinal} representation`);

  const href = links[index][1].replaceAll("&amp;", "&");
  const url = new URL(href, "http://review.local/");
  assert.equal(Number(links[index][2]), ordinal, `action ordinal ${ordinal}`);
  assert.equal(url.pathname, "/target-experience.html", `shared road for target ${ordinal}`);
  assert.equal(url.searchParams.get("missionFamily"), "targetScoring", `mission family for target ${ordinal}`);
  assert.equal(url.searchParams.get("target"), target.targetProfileId, `exact runtime profile for target ${ordinal}`);
}

assert.match(reviewServer, /\["\/founder-nine-target-review\.html", "founder-nine-target-review\.html"\]/);
assert.match(reviewServer, /\["\/founder-nine-target-review\.css", "founder-nine-target-review\.css"\]/);
assert.equal((reviewServer.match(/\["\/review-assets\/target-0[1-9]\./g) || []).length, 9, "review server must expose exactly nine curated representations");

console.log("PASS Founder launcher: exact locked 9/9 cohort, exact runtime IDs, one shared road, nine curated representations");
