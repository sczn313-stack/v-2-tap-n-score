import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8151";
const targetPhoto = path.resolve("docs/authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp");
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

const resultFor = impacts => ({
  ok: true,
  status: "supported_analysis_ready",
  missionFamily: "smartEvidenceCapture",
  resultPackageType: "smartEvidenceResult",
  target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
  supportedAnalysis: { impactCount: impacts.length },
  impacts: impacts.map((impact, index) => ({ ...impact, impactId: `impact-${index + 1}`, zone: "A", zoneValue: 10 })),
  productRegionDistribution: {
    status: "complete",
    zoneCounts: { A: impacts.length, B: 0, C: 0, D: 0, outside: 0, indeterminate_boundary: 0 },
    classifiedImpactCount: impacts.length,
    capturedImpactCount: impacts.length,
    reconciliation: { classifiedImpactCount: impacts.length, unresolvedImpactCount: 0, capturedImpactCount: impacts.length, countsMatchCapturedImpactCount: true }
  },
  scoring: { status: "complete", objective: "highest_score_wins", zoneValues: { A: 10, B: 9, C: 8, D: 7 }, subtotals: { A: impacts.length * 10, B: 0, C: 0, D: 0 }, total: impacts.length * 10 },
  authorityTrace: { classificationAuthority: "backend" }
});

try {
  for (const viewport of [{ width: 1238, height: 887 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const page = await context.newPage();
    let analyzeShouldFail = false;
    let analyzeRequestCount = 0;
    await context.route("**/api/target/baker-sl-st1/analyze", async route => {
      analyzeRequestCount += 1;
      await new Promise(resolve => setTimeout(resolve, 300));
      if (analyzeShouldFail) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "deliberate_failure" }) });
        return;
      }
      const request = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(resultFor(request.impacts)) });
    });
    await context.route("**/api/session/prepare", async route => {
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "deliberate_continuation_failure" }) });
    });

    await page.goto(`${baseUrl}/t/baker/sl-st1/?processing=${viewport.width}`, { waitUntil: "networkidle" });
    await page.locator("#libraryInput").setInputFiles(targetPhoto);
    await page.locator("#targetWorkspace:not([hidden])").waitFor();
    const tap = page.locator("#tapSurface");
    await tap.click({ position: { x: 40, y: 40 } });

    await page.locator("#showResults").click();
    await page.locator("#showResults").evaluate(button => { button.click(); button.click(); });
    assert.match(await page.locator("#showResults").innerText(), /Analyzing your target and calculating your score/i);
    assert.equal(await page.locator("#showResults").isDisabled(), true);
    await page.locator("#showResults").getByText("Opening your Shooter Experience Card…").waitFor();
    await page.locator("#workspaceFeedback").getByText("Your score is ready. Try Show Results again.").waitFor();
    assert.match(await page.locator("#showResults").innerText(), /^Show Results$/i);
    assert.equal(await page.locator(".sl-impact-marker").count(), 1, "direct SEC transition failure preserves evidence");
    assert.equal(analyzeRequestCount, 1, "processing lock prevents duplicate Show Results submissions");

    const visible = await page.evaluate(() => {
      const frame = document.querySelector("#imageFrame").getBoundingClientRect();
      const action = document.querySelector("#workflowDock").getBoundingClientRect();
      const viewportBottom = (visualViewport?.offsetTop || 0) + (visualViewport?.height || innerHeight);
      return {
        targetBeforeAction: frame.bottom <= action.top,
        actionVisible: action.bottom <= viewportBottom,
        overflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    assert.deepEqual(visible, { targetBeforeAction: true, actionVisible: true, overflow: false });

    analyzeShouldFail = true;
    await page.locator("#tapSurface").click({ position: { x: 65, y: 65 }, force: true });
    await page.locator("#showResults").click();
    assert.match(await page.locator("#showResults").innerText(), /Analyzing your target/i);
    await page.locator("#workspaceFeedback").getByText("Your bullet-hole marks are still here. Try Show Results again.").waitFor();
    assert.equal(await page.locator(".sl-impact-marker").count(), 2, "analysis failure preserves every bullet hole");
    assert.equal(await page.locator("#showResults").isEnabled(), true, "analysis failure restores retry action");

    await context.close();
  }

  for (const shouldFail of [false, true]) {
    const m4Context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await m4Context.route("**/api/authority/m4", async route => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.fulfill({
        status: shouldFail ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify(shouldFail ? { ok: false } : { ok: true, status: "calculated" })
      });
    });
    const m4Page = await m4Context.newPage();
    await m4Page.goto(`${baseUrl}/production/m4_processing_indicator_fixture.html?failure=${shouldFail}`, { waitUntil: "networkidle" });
    await m4Page.locator("#calculate").click();
    await m4Page.getByText("Calculating your correction…").waitFor();
    await m4Page.getByText(shouldFail ? "Correction unavailable." : "Correction ready.").waitFor();
    assert.equal(await m4Page.locator(".sczn3-processing-indicator").count(), 0, "M4 processing state settles after authority response");
    await m4Context.close();
  }

  const vaultContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await vaultContext.route("**/api/session/sec*", async route => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, sessions: [] }) });
  });
  const vaultPage = await vaultContext.newPage();
  await vaultPage.goto(`${baseUrl}/records.html?processing=vault`, { waitUntil: "domcontentloaded" });
  await vaultPage.locator(".sczn3-processing-indicator").getByText("Opening your Ballistic Vault…").waitFor();
  await vaultPage.waitForLoadState("networkidle");
  assert.equal(await vaultPage.locator(".sczn3-processing-indicator").count(), 0);
  await vaultContext.close();

  console.log("PASS Universal Processing Indicator real Baker/Vault delayed success, failure, retry, evidence, and viewport workflow");
} finally {
  await browser.close();
}
