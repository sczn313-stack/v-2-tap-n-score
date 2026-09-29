import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.SCZN3_QT_REVIEW_ORIGIN || "http://127.0.0.1:8119";
const items = [
  { sku:"IN-QT", id:"qt_printer13_product_1955968221257", points:[[.826,.166],[.507,.410],[.50,.12],[.40,.40],[.30,.60],[.50,.92],[.05,.05]], result:/6 HIT TAPS[\s\S]*1 MISSED[\s\S]*7 TOTAL TAPS/i, detail:/6 of 6 target objects hit/i },
  { sku:"NM-DOT", id:"qt_printer13_product_4717153681492", points:[[.4891,.2214],[.10,.20],[.4891,.4498],[.10,.45],[.4888,.6857],[.10,.70]], result:/3 HIT TAPS[\s\S]*3 MISSED[\s\S]*6 TOTAL TAPS/i, detail:/3 of 3 target objects hit/i, drawer:/Bull 1[\s\S]*1[\s\S]*1[\s\S]*Bull 2[\s\S]*1[\s\S]*1[\s\S]*Bull 3[\s\S]*1[\s\S]*1/i },
  { sku:"NM-DPS-Q", id:"qt_printer13_product_1962631430217", points:[[.50,.175],[.40,.20],[.50,.05],[.10,.10],[.50,.55],[.25,.60],[.10,.60],[.95,.60]], result:/6 HIT TAPS[\s\S]*2 MISSED[\s\S]*8 TOTAL TAPS/i, detail:/2 of 2 target objects hit/i, cumulative:true },
  { sku:"NM-DPS-Q1", id:"qt_printer13_product_1967276982345", points:[[.50,.175],[.40,.20],[.50,.05],[.10,.10],[.50,.55],[.25,.60],[.10,.60],[.95,.60]], result:/6 HIT TAPS[\s\S]*2 MISSED[\s\S]*8 TOTAL TAPS/i, detail:/2 of 2 target objects hit/i, cumulative:true },
  { sku:"NM-DPS-Q3", id:"qt_printer13_product_1967280455753", points:[[.50,.175],[.40,.20],[.50,.05],[.10,.10],[.50,.55],[.25,.60],[.10,.60],[.95,.60]], result:/6 HIT TAPS[\s\S]*2 MISSED[\s\S]*8 TOTAL TAPS/i, detail:/2 of 2 target objects hit/i, cumulative:true },
  { sku:"TQ-20", id:"qt_printer13_product_1960132477001", points:[[.485,.245],[.482,.462],[.50,.65],[.12,.65],[.98,.02]], result:/4 HIT TAPS[\s\S]*1 MISSED[\s\S]*5 TOTAL TAPS/i, detail:/4 of 4 target objects hit/i },
];

async function clickNormalized(page, box, x, y) {
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
}

const browser = await chromium.launch({ headless:true });
try {
  for (const item of items) {
    const page = await browser.newPage({ viewport:{ width:1180, height:1000 } });
    const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${item.id}&source=registered&authorityPort=8119&v=qt-round2-nm-correction`;
    await page.goto(url, { waitUntil:"domcontentloaded" });
    await page.locator("#contractStatus").getByText("Target loaded. Tap your shot holes.", { exact:true }).waitFor();
    const image = page.locator("#contractTargetImage");
    const box = await image.boundingBox();
    assert.ok(box, `${item.sku} registered image`);
    for (const point of item.points) await clickNormalized(page, box, ...point);
    await page.getByRole("button", { name:"Show Result", exact:true }).click();
    await page.locator("#contractSecView").waitFor({ state:"visible" });
    const result = page.locator('#contractSecRoot [data-sec-component="result"]');
    const resultText = await result.innerText();
    const resultHtml = await result.innerHTML();
    assert.match(resultText, item.result, `${item.sku} hit/miss/total`);
    assert.match(resultText, item.detail, `${item.sku} object coverage`);
    assert.doesNotMatch(await page.locator("#contractStatus").innerText(), /Backend-authoritative/i);
    if (item.cumulative) {
      const details = result.locator("[data-cumulative-color-details]");
      await details.locator("summary").click();
      const text = await details.innerText();
      assert.match(text, /Upper[\s\S]*Red total[\s\S]*1[\s\S]*White total[\s\S]*2[\s\S]*Blue total[\s\S]*3[\s\S]*Missed[\s\S]*1/i);
      assert.match(text, /Lower[\s\S]*Red total[\s\S]*1[\s\S]*White total[\s\S]*2[\s\S]*Blue total[\s\S]*3[\s\S]*Missed[\s\S]*1/i);
      assert.match(text, /Whole target[\s\S]*Red total[\s\S]*2[\s\S]*White total[\s\S]*4[\s\S]*Blue total[\s\S]*6[\s\S]*Missed[\s\S]*2/i);
      await details.locator("summary").click();
    } else if (item.drawer) {
      const details = result.locator("[data-counting-details]");
      await details.locator("summary").click();
      assert.match(await details.innerText(), item.drawer);
      await details.locator("summary").click();
    }
    await page.getByRole("button", { name:"Save SEC", exact:true }).click();
    const reopen = page.getByRole("link", { name:"Exact Reopen", exact:true });
    await reopen.waitFor({ state:"visible" });
    const reopenHref = await reopen.getAttribute("href");
    const sessionId = new URL(reopenHref, `${origin}/`).searchParams.get("session");
    assert.ok(sessionId);
    await page.goto(`${origin}/records.html?selected=${sessionId}&authorityPort=8119&v=qt-round2-nm-correction`, { waitUntil:"domcontentloaded" });
    const vault = page.locator('article.vault-record-summary.is-selected .vault-approved-result-panel [data-sec-component="result"]');
    await vault.waitFor({ state:"visible" });
    assert.equal(await vault.innerHTML(), resultHtml, `${item.sku} Vault preserves exact RESULT`);
    await page.goto(new URL(reopenHref, `${origin}/`).href, { waitUntil:"domcontentloaded" });
    await page.locator("#contractSecView").waitFor({ state:"visible" });
    assert.match(await page.locator('#contractSecRoot [data-sec-component="result"]').innerText(), item.result, `${item.sku} exact reopen`);
    console.log(`PASS ${item.sku} ${sessionId}`);
    await page.close();
  }
  console.log("PASS Round Two + NM 6/6 RESULT -> SEC -> Vault -> exact reopen");
} finally {
  await browser.close();
}
