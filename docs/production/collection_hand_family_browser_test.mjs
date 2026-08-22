import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const origin = process.env.SCZN3_REVIEW_ORIGIN || "http://127.0.0.1:8096";
const authority = "http://127.0.0.1:8098";
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const svg = await readFile(new URL("../backend/test_fixtures/target_execution_scale.svg", import.meta.url));
const image = { sha256: "cb906e88e090b787369acb6d6ad2900b0f2c46d07507fd2175b90f5a387a5ee0", widthPx: 1000, heightPx: 1000, mediaType: "image/svg+xml", dataUrl: `data:image/svg+xml;base64,${svg.toString("base64")}` };
const points = { a: { xNorm: .15, yNorm: .5 }, b: { xNorm: .45, yNorm: .5 }, c: { xNorm: .75, yNorm: .5 } };
const products = [
  { target: "fixture_collection_solo", name: "Solo Publisher Collection", sku: "HAND-A01", players: 1, turns: ["a", "b", "c"], expected: "Publisher Triple Collection" },
  { target: "fixture_collection_multiplayer", name: "Alternating Publisher Hands", sku: "HAND-B02", players: 2, turns: ["a", "b", "a", "c"], expected: "Publisher Pair A" },
  { target: "fixture_collection_data_only", name: "Data-Only Independent Hand", sku: "HAND-C03", players: 1, turns: ["b", "c"], expected: "Publisher Data Pair" },
];

async function call(page, path, options = {}) {
  return page.evaluate(async ({ url, options }) => { const response = await fetch(url, options); return { status: response.status, body: await response.json() }; }, { url: `${authority}${path}`, options });
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [index, product] of products.entries()) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } }); await page.goto(`${origin}/target-experience.html`, { waitUntil: "domcontentloaded" });
    const prepared = await call(page, "/api/session/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: product.target, missionFamily: "collectionHandEvaluation" }) }); assert.equal(prepared.status, 200);
    const started = await call(page, "/api/session/start", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": `browser-collection-${runId}-${index}` }, body: JSON.stringify({ preparationToken: prepared.body.preparationToken, selectedEquipment: prepared.body.standardSetup }) }); assert.equal(started.status, 201);
    const sessionId = started.body.authoritativeSessionId; let sequence = 0;
    let action = await call(page, "/api/target-execution/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authoritativeSessionId: sessionId, actionId: `${runId}-${index}-start`, expectedSequence: sequence, action: { type: "start_run", imageEvidence: image, playerCount: product.players } }) }); assert.equal(action.status, 200); sequence = action.body.sequenceNumber;
    for (const [turn, key] of product.turns.entries()) {
      action = await call(page, "/api/target-execution/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authoritativeSessionId: sessionId, actionId: `${runId}-${index}-turn-${turn}`, expectedSequence: sequence, action: { type: "record_turn_observation", playerId: action.body.runState.activePlayerId, observations: [points[key]] } }) }); assert.equal(action.status, 200); sequence = action.body.sequenceNumber;
    }
    const result = action.body.result; assert.equal(result.status, "complete"); assert.ok(result.players.some(player => player.hand.publisherLabel === product.expected));
    const artifact = { sessionId, authoritativeSessionId: sessionId, sessionIdAuthority: "backend", matrixSnapshot: { targetProfileId: product.target, missionFamily: result.missionFamily, resultPackageType: result.resultPackageType }, authorityPackage: result, targetEvidenceImage: image, savedToSEC: false };
    const saved = await call(page, "/api/session/sec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session: artifact }) }); assert.equal(saved.status, 201);
    await page.goto(`${origin}/target-experience.html?session=${encodeURIComponent(sessionId)}&view=sec`, { waitUntil: "domcontentloaded" }); await page.locator("#contractSecView").waitFor({ state: "visible" });
    const text = await page.locator("#contractSecRoot").innerText(); assert.match(text, new RegExp(`${product.name} · SKU ${product.sku}`)); assert.match(text, new RegExp(product.expected)); assert.match(text, /Publisher-Defined Collection\/Hand Result — Not a General Game Judgment/); assert.match(text, /Conventional poker meaning:\s+Not established/); assert.match(text, /Path\/board\/deck\/casino behavior:\s+Unavailable/); assert.match(text, /Scoring:\s+Not applicable/);
    await page.reload({ waitUntil: "domcontentloaded" }); const reopened = await page.locator("#contractSecRoot").innerText(); assert.match(reopened, new RegExp(product.expected)); await page.close();
  }
  console.log("PASS: Collection/Hand three-fixture governed state, preservation, and exact reopen");
} finally { await browser.close(); }
