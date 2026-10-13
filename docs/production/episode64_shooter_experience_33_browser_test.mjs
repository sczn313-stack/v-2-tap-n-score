import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const { chromium } = await import(process.env.SCZN3_PLAYWRIGHT_MODULE || "playwright");

const root = path.resolve(import.meta.dirname, "../..");
const proofPath = path.join(root, "docs/authority-evidence/platform/episode64-shooter-experience-connections-2026-10-12/CONNECT_33_MACHINE_PROOF.json");
const outputPath = path.join(root, "docs/authority-evidence/platform/episode64-shooter-experience-connections-2026-10-12/CONNECT_33_BROWSER_PROOF.json");
const backendProof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
const origin = process.env.SCZN3_CONNECT_33_ORIGIN || "http://127.0.0.1:8222";
const rows = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

for (const source of backendProof.rows) {
  const page = await context.newPage();
  const row = { masterNumber: source.masterNumber, runtimeId: source.runtimeId, targetName: source.targetName, status: "BLOCKED", stages: {} };
  try {
    const url = `${origin}/target-experience.html?missionFamily=${encodeURIComponent(source.missionFamily)}&target=${encodeURIComponent(source.runtimeId)}&source=registered&authorityPort=8222&v=episode64-connect-33`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.locator("#contractStatus").filter({ hasText: "Target loaded. Tap your shot holes." }).waitFor({ timeout: 15000 });
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
    await page.locator("#contractSecStatus").filter({ hasText: "Result ready." }).waitFor({ timeout: 15000 });
    assert.equal(await page.locator("article[data-target-profile-id]").getAttribute("data-target-profile-id"), source.runtimeId);
    assert.equal(await page.locator("#contractSecView .contract-shooter-experience").isVisible(), true);
    row.stages.RESULT = "PASS";
    row.stages.CONFIRM = "PASS";

    await page.getByRole("button", { name: "Save SEC" }).click();
    const exact = page.locator("a.contract-exact-reopen");
    await exact.waitFor({ timeout: 10000 });
    const exactUrl = await exact.getAttribute("href");
    assert.ok(exactUrl);
    assert.equal(await page.getByRole("link", { name: "Ballistic Vault" }).last().isVisible(), true);
    row.stages.SEC = "PASS";
    row.stages.VAULT = "PASS";
    await page.goto(exactUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.locator("#contractSecStatus").filter({ hasText: "Saved Session Opened" }).waitFor({ timeout: 15000 });
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
