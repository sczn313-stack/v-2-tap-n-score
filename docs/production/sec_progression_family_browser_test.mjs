import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const authority = "http://127.0.0.1:8098";
const programs = [
  { targetProfileId: "fixture_progression_precision", sourceSessionIds: ["precision-1", "precision-2"], name: "Precision Progression Ladder", sku: "PROG-A01" },
  { targetProfileId: "fixture_progression_qualification", sourceSessionIds: ["qualification-1", "qualification-2"], name: "Practice Course Progression", sku: "PROG-B02" },
  { targetProfileId: "fixture_progression_data_only", sourceSessionIds: ["data-1"], name: "Data-Only Independent Progression", sku: "PROG-C03" },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const [index, program] of programs.entries()) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    await page.goto(`${origin}/target-experience.html`, { waitUntil: "domcontentloaded" });
    const response = await page.evaluate(async ({ authority, program, index }) => {
      const reply = await fetch(`${authority}/api/sec-progression/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...program, missionFamily: "secProgressionEvaluation", subjectAuthorityToken: "synthetic-subject-token", idempotencyKey: `browser-${index}`, expectedPriorProgressionEvaluationId: null }) });
      return { status: reply.status, payload: await reply.json() };
    }, { authority, program, index });
    assert.equal(response.status, 201); assert.equal(response.payload.result.transition.outcome, "advanced");
    await page.goto(`${origin}/target-experience.html?progression=${encodeURIComponent(response.payload.progressionEvaluationId)}`, { waitUntil: "domcontentloaded" });
    const sec = page.locator("#contractSecRoot"); await page.locator("#contractSecView").waitFor({ state: "visible" });
    const text = await sec.innerText();
    if (text === "Result unavailable") {
      const diagnostic = await page.evaluate(result => ({ reconciles: window.SCZN3TargetExecutionRuntime.familyReconciles(result), dispatch: window.SCZN3SECDispatch.resolve({ authorityPackage: result, matrixSnapshot: { targetProfileId: result.target.id, missionFamily: result.missionFamily, resultPackageType: result.resultPackageType } }), adapter: window.SCZN3ExecutionFamilyAdapters.get(result.executionContract.secAdapterFamilyId) }), response.payload.result);
      assert.fail(`Progression record rendering unavailable: ${JSON.stringify(diagnostic)}`);
    }
    assert.match(text, /Governed Progression Result/); assert.match(text, new RegExp(`${program.name} · SKU ${program.sku}`)); assert.match(text, /Governed Progression Result — Derived from Preserved SECs/); assert.match(text, /ADVANCED/); assert.match(text, /Verified identity:\s+Not established/); assert.match(text, /Historical re-scoring:\s+Not performed/);
    for (const source of program.sourceSessionIds) assert.match(text, new RegExp(source));
    await page.reload({ waitUntil: "domcontentloaded" }); const reopened = await sec.innerText(); assert.match(reopened, /ADVANCED/); assert.match(reopened, /Derived from Preserved SECs/);
    await page.close();
  }
  console.log("PASS: SEC Progression three-program append-only preservation and exact reopen");
} finally { await browser.close(); }
