import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.SCZN3_QT_REVIEW_ORIGIN || "http://127.0.0.1:8128";
const selectorPath = "/authority-evidence/platform/qt-printer13-corrected-implementation-2026-09-27/QT_PRINTER13_FOUNDER_REPRESENTATIVE_5_SELECTOR.html";
const artifactPath = "authority-evidence/platform/qt-printer13-corrected-implementation-2026-09-27/QT_PRINTER13_FOUNDER_REPRESENTATIVE_5_BROWSER_VERIFICATION.json";
const expected = [
  { index: 0, name: "FBI-IP1 Paper Target", status: "Target loaded. Tap your shot holes." },
  { index: 1, name: "FAC-USAF-BAT Paper Target", status: "Target loaded. Tap your shot holes." },
  { index: 2, name: "TX-PT Paper Target", status: "Target loaded. Tap your shot holes." },
  { index: 3, name: "M16A2 Paper Target", zeroing: true },
  { index: 4, name: "USMC-THREAT Paper Target", status: "Target loaded. Tap your shot holes." }
];

assert.match(await readFile(`.${selectorPath}`, "utf8"), /Founder 1\/5/);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const results = [];
try {
  await page.goto(`${origin}${selectorPath}`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("#selector option").count(), 5);
  for (const item of expected) {
    await page.locator("#selector").selectOption(String(item.index));
    await page.waitForFunction(index => document.querySelector("#progress")?.textContent === `Founder ${index + 1}/5`, item.index);
    if (item.zeroing) {
      await page.waitForFunction(() => document.querySelector("#experience")?.src.includes("matrix.html"));
      await page.waitForFunction(() => /READY TO BEGIN[\s\S]*M16A2 Rifle[\s\S]*CONTINUE WITH STANDARD SETUP/.test(document.querySelector("#experience")?.contentDocument?.body?.innerText || ""));
    } else {
      await page.waitForFunction(() => document.querySelector("#experience")?.src.includes("target-experience.html"));
      await page.waitForFunction(status => document.querySelector("#experience")?.contentDocument?.querySelector("#contractStatus")?.textContent?.trim() === status, item.status);
      assert.ok(await page.locator("#experience").evaluate(frame => { const image=frame.contentDocument?.querySelector("#contractTargetImage"); return !!image && image.complete && image.naturalWidth > 0; }));
    }
    assert.match(await page.locator("#name").innerText(), new RegExp(item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    results.push({ position: item.index + 1, target: item.name, status: "PASS" });
  }
} finally {
  await browser.close();
}

const artifact = {
  schemaVersion: "sczn3.qt-printer13.founder-representative-5-browser-verification.v1",
  status: "PASS", selectorUrl: `${origin}${selectorPath}`, count: 5,
  zeroingEntryProof: "M16A2 governed standard setup is visible; Founder continues into the inherited Zeroing road.",
  founderAcceptance: "PENDING", results
};
await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log("PASS QT Printer #13 representative Founder selector 5/5");
