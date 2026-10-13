import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const { chromium } = await import(process.env.SCZN3_PLAYWRIGHT_MODULE || "playwright");

const root = path.resolve(import.meta.dirname, "../..");
const proofPath = process.env.SCZN3_CONNECT_PROOF || path.join(root, "docs/authority-evidence/platform/episode64-shooter-experience-connections-2026-10-12/CONNECT_33_MACHINE_PROOF.json");
const outputPath = process.env.SCZN3_CONNECT_BROWSER_OUTPUT || path.join(root, "docs/authority-evidence/platform/episode64-shooter-experience-connections-2026-10-12/CONNECT_33_BROWSER_PROOF.json");
const backendProof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
const origin = process.env.SCZN3_CONNECT_ORIGIN || process.env.SCZN3_CONNECT_33_ORIGIN || "http://127.0.0.1:8222";
const authorityPort = process.env.SCZN3_CONNECT_AUTHORITY_PORT || new URL(origin).port || "80";
const timeoutMs = Number(process.env.SCZN3_CONNECT_TIMEOUT_MS || "15000");
const startIndex = Number(process.env.SCZN3_CONNECT_START_INDEX || "0");
const retryBlocked = process.env.SCZN3_CONNECT_RETRY_BLOCKED === "1";
const partialPath = `${outputPath}.partial`;
let rows = startIndex > 0 ? JSON.parse(fs.readFileSync(partialPath, "utf8")).rows : [];
assert.equal(rows.length, startIndex, "partial_resume_count_mismatch");
const runtimeFilter = process.env.SCZN3_CONNECT_RUNTIME_ID;
const sources = backendProof.rows.filter(row => row.status === "PASS" && (!runtimeFilter || row.runtimeId === runtimeFilter));
let pendingSources = sources.slice(startIndex);
if (retryBlocked) {
  const passedRuntimeIds = new Set(rows.filter(row => row.status === "PASS").map(row => row.runtimeId));
  rows = rows.filter(row => row.status === "PASS");
  pendingSources = sources.filter(source => !passedRuntimeIds.has(source.runtimeId));
}
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

for (const source of pendingSources) {
  const page = await context.newPage();
  const row = { masterNumber: source.masterNumber, runtimeId: source.runtimeId, targetName: source.targetName, status: "BLOCKED", stages: {} };
  try {
    const url = `${origin}/target-experience.html?missionFamily=${encodeURIComponent(source.missionFamily)}&target=${encodeURIComponent(source.runtimeId)}&source=registered&authorityPort=${authorityPort}&v=episode64-connect-batch`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator("#contractStatus").filter({ hasText: "Target loaded. Tap your shot holes." }).waitFor({ timeout: timeoutMs });
    const image = page.locator("#contractTargetImage");
    assert.equal(await image.evaluate(node => node.complete && node.naturalWidth > 0 && node.naturalHeight > 0), true);
    assert.equal(await page.locator("#contractProductName").innerText(), source.targetName);
    assert.equal(await page.locator("#contractShooterExperience").isVisible(), true);
    assert.match(await page.locator("#contractShooterExperience").innerText(), /What this target does in SCZN3/);
    row.stages.LOAD = "PASS";

    const surface = page.locator("#contractTapSurface");
    await surface.click({ position: { x: 30, y: 30 } });
    await surface.click({ position: { x: 60, y: 60 } });
    await surface.click({ position: { x: 90, y: 90 } });
    assert.equal(await page.locator("#contractObservationCount").innerText(), "3");
    row.stages.TAP = "PASS";
    await page.getByRole("button", { name: "Show Result" }).click();
    await page.locator("#contractSecStatus").filter({ hasText: "Result ready." }).waitFor({ timeout: timeoutMs });
    assert.equal(await page.locator("article[data-target-profile-id]").getAttribute("data-target-profile-id"), source.runtimeId);
    assert.equal(await page.locator("#contractSecView .contract-shooter-experience").isVisible(), true);
    row.stages.RESULT = "PASS";
    row.stages.CONFIRM = "PASS";

    await page.getByRole("button", { name: "Save SEC" }).click();
    const exact = page.locator("a.contract-exact-reopen");
    await exact.waitFor({ timeout: timeoutMs });
    const exactUrl = await exact.getAttribute("href");
    assert.ok(exactUrl);
    assert.equal(await page.getByRole("link", { name: "Ballistic Vault" }).last().isVisible(), true);
    row.stages.SEC = "PASS";
    row.stages.VAULT = "PASS";
    await page.goto(exactUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.locator("#contractSecStatus").filter({ hasText: "Saved Session Opened" }).waitFor({ timeout: timeoutMs });
    assert.equal(await page.locator("article[data-target-profile-id]").getAttribute("data-target-profile-id"), source.runtimeId);
    assert.equal(await page.locator("#contractSecView .contract-shooter-experience").isVisible(), true);
    assert.equal(await page.locator("#contractSecView .contract-lifecycle-result").isVisible(), true);
    assert.equal(await page.locator("#contractSecView [data-shot-index]").count(), 3);
    row.stages.EXACT_REOPEN = "PASS";
    row.status = "PASS";
    row.launchUrl = url;
  } catch (error) {
    row.blocker = `${error.name || "Error"}:${String(error.message || error).split("\n")[0]}`;
  } finally {
    rows.push(row);
    await page.close();
    if (process.env.SCZN3_CONNECT_RESET_STORE === "1") {
      const reset = await context.request.post(`${origin}/__connect-test-reset`);
      assert.equal(reset.ok(), true);
    }
    if (rows.length % 25 === 0) {
      fs.writeFileSync(partialPath, `${JSON.stringify({ processed: rows.length, pass: rows.filter(item => item.status === "PASS").length, blocked: rows.filter(item => item.status === "BLOCKED").length, rows }, null, 2)}\n`);
      console.log(JSON.stringify({ processed: rows.length, pass: rows.filter(item => item.status === "PASS").length, blocked: rows.filter(item => item.status === "BLOCKED").length }));
    }
  }
}

await browser.close();
const report = {
  schemaVersion: "sczn3.episode64.shooter-experience-batch-browser-proof.v1",
  generatedAt: new Date().toISOString(),
  origin,
  summary: { targets: rows.length, pass: rows.filter(row => row.status === "PASS").length, blocked: rows.filter(row => row.status === "BLOCKED").length },
  rows
};
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (report.summary.blocked) process.exitCode = 1;
