import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8111";
const screenshots = new URL("../test-results/", import.meta.url);
await mkdir(screenshots, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

async function stubRatings(page, records, delay = 0) {
  await page.route("**/api/feedback/rating", async route => {
    const payload = route.request().postDataJSON();
    records.push(payload);
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, status: "stored", ratingId: `rating-${records.length}`, submittedAt: "2026-08-23T23:00:00Z", duplicate: false }) });
  });
}

async function openRateUs(page) {
  await page.waitForFunction(() => document.documentElement.dataset.sczn3RateUsReady === "true");
  const desktopTrigger = page.locator(".platform-quick-nav [data-rate-us-open]");
  const useDrawer = await page.locator("body.records-page").count() > 0;
  if (!useDrawer && await desktopTrigger.isVisible()) {
    await desktopTrigger.click();
  } else {
    const buttonMenu = page.locator("button.package-menu[aria-controls]");
    if (await buttonMenu.count() && await buttonMenu.isVisible()) {
      const drawerId = await buttonMenu.getAttribute("aria-controls");
      await buttonMenu.click();
      await page.locator(`#${drawerId} [data-rate-us-open]`).click();
    } else {
      const details = page.locator("details.mobile-platform-menu");
      await details.locator(":scope > summary").click();
      await details.locator("[data-rate-us-open]").click();
    }
  }
  await assert.doesNotReject(() => page.locator("#sczn3RateUsDialog").waitFor({ state: "visible" }));
}

async function submitRating(page, rating, comment) {
  await page.locator(`.rate-us-stars label:has(input[value="${rating}"])`).click();
  if (comment !== undefined) await page.locator("#sczn3RateUsComment").fill(comment);
  await page.locator("#sczn3RateUsSubmit").click();
  await page.locator("#sczn3RateUsDialog").waitFor({ state: "hidden" });
}

try {
  const intendedMenus = [
    "index.html", "matrix.html", "shoot.html", "sec.html", "records.html", "analytics.html", "buy-targets.html",
    "t/baker/sl-st1/", "t/baker/sl-st2/", "t/baker/fun/?target=gf-db", "t/gunfun/vital-dude/"
  ];
  for (const pathname of intendedMenus) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(new URL(pathname, `${baseUrl}/`).href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.documentElement.dataset.sczn3NavigationReady === "true" && document.documentElement.dataset.sczn3RateUsReady === "true");
    assert.equal(await page.locator(".platform-quick-nav [data-rate-us-open]").count(), 1, `${pathname} desktop menu exposes Rate Us`);
    assert.equal(await page.locator(".navigation-rate-us").count() >= 2, true, `${pathname} mobile menu exposes Rate Us`);
    await context.close();
  }

  for (const viewport of [{ width: 1280, height: 900, name: "desktop" }, { width: 390, height: 844, name: "iphone-390" }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const records = [];
    await stubRatings(page, records);
    await page.goto(`${baseUrl}/index.html?rate_us=${viewport.name}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.dataset.sczn3RateUsReady === "true");
    await page.evaluate(() => SCZN3RateUs.open());
    await page.locator("#sczn3RateUsDialog").waitFor({ state: "visible" });
    await page.screenshot({ path: new URL(`rate-us-${viewport.name}.png`, screenshots).pathname, fullPage: true });
    const cardBox = await page.locator(".rate-us-card").boundingBox();
    assert(cardBox && cardBox.x >= 0 && cardBox.x + cardBox.width <= viewport.width, `${viewport.name} dialog has no horizontal overflow`);
    await submitRating(page, 5, "Clear and useful.");
    assert.equal(records.length, 1, `${viewport.name} submits once`);
    assert.equal(records[0].rating, 5, `${viewport.name} preserves rating`);
    assert.equal(records[0].comment, "Clear and useful.", `${viewport.name} preserves comment`);
    assert.equal(records[0].context.origin.view, "home", `${viewport.name} captures Home origin`);
    assert.equal(records[0].context.shooterRelationship.status, "new_to_this_browser", `${viewport.name} captures new browser context truthfully`);
    assert.equal(records[0].context.publisher, null, `${viewport.name} does not infer an unknown printer`);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const records = [];
    await stubRatings(page, records, 100);
    await page.goto(`${baseUrl}/shoot.html?rate_us=active-target`, { waitUntil: "domcontentloaded" });
    const expectedScroll = await page.evaluate(() => {
      SCZN3M4.write(SCZN3M4.KEYS.activeSession, {
        sessionId: "rate-us-active-session",
        sessionIdAuthority: "backend",
        workflowStage: "execution",
        savedToSEC: false,
        matrixSnapshot: { targetProfileId: "gunfun_22740_vital_dude", missionFamily: "smartEvidenceCapture" }
      });
      const spacer = document.createElement("div");
      spacer.style.height = "1200px";
      document.body.append(spacer);
      window.scrollTo(0, 420);
      return Math.round(window.scrollY);
    });
    await page.waitForFunction(() => document.documentElement.dataset.sczn3RateUsReady === "true");
    await page.evaluate(() => SCZN3RateUs.open());
    await page.locator("#sczn3RateUsDialog").waitFor({ state: "visible" });
    await page.locator('.rate-us-stars label:has(input[value="4"])').click();
    await page.evaluate(() => { const button = document.getElementById("sczn3RateUsSubmit"); button.click(); button.click(); });
    await page.locator("#sczn3RateUsDialog").waitFor({ state: "hidden" });
    assert.equal(records.length, 1, "duplicate Submit activation creates one request");
    assert.equal(records[0].context.origin.view, "active_target", "active target origin captured");
    assert.equal(records[0].context.target.targetProfileId, "gunfun_22740_vital_dude", "known target captured");
    assert.equal(records[0].context.publisher.publisherId, "gunfun", "known printer captured without inference");
    assert.equal(records[0].context.activity, "smartEvidenceCapture", "activity captured");
    assert.equal(records[0].context.completionStatus, "incomplete", "incomplete stage captured");
    assert.equal(records[0].context.sec.state, "none", "SEC absence captured");
    assert.equal(await page.evaluate(() => Math.round(window.scrollY)), expectedScroll, "incomplete work returns to exact scroll location");
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const records = [];
    await stubRatings(page, records);
    await page.goto(`${baseUrl}/sec.html?rate_us=completed`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      document.body.dataset.rateUsCompletionStatus = "complete";
      document.body.dataset.rateUsNext = "records.html?from=rate-us";
      SCZN3M4.write(SCZN3M4.KEYS.activeSession, {
        sessionId: "rate-us-complete-session",
        sessionIdAuthority: "backend",
        workflowStage: "preservation",
        savedToSEC: true,
        matrixSnapshot: { targetProfileId: "baker_sl_st1_practice", missionFamily: "precisionPractice" }
      });
    });
    await openRateUs(page);
    await submitRating(page, 3);
    await page.waitForURL(/records\.html\?from=rate-us/);
    assert.equal(records[0].comment, null, "optional comment may be omitted");
    assert.equal(records[0].context.origin.view, "sec", "SEC origin captured");
    assert.equal(records[0].context.sec.state, "preserved", "preserved SEC state captured");
    assert.equal(records[0].context.completionStatus, "complete", "completed state captured");
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const records = [];
    await stubRatings(page, records);
    await page.goto(`${baseUrl}/records.html?rate_us=vault`, { waitUntil: "domcontentloaded" });
    await openRateUs(page);
    await submitRating(page, 2, "Vault note");
    assert.equal(records[0].context.origin.view, "ballistic_vault", "Ballistic Vault origin captured");
    assert.equal(records[0].context.completionStatus, "ambiguous", "ambiguous state remains ambiguous");
    assert.equal(new URL(page.url()).pathname.endsWith("/records.html"), true, "ambiguous state returns to original route");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.documentElement.dataset.sczn3RateUsReady === "true");
    assert.equal(await page.locator("#sczn3RateUsDialog").isHidden(), true, "refresh never auto-prompts or reopens Rate Us");
    await openRateUs(page);
    await submitRating(page, 1);
    assert.equal(records.at(-1).context.shooterRelationship.status, "returning_to_this_browser", "prior voluntary submission produces returning-browser context");
    await context.close();
  }

  console.log("PASS Rate Us menus, 1–5 data path, voluntary UX, context capture, deterministic return, duplicate handling, desktop, and 390px iPhone");
} finally {
  await browser.close();
}
