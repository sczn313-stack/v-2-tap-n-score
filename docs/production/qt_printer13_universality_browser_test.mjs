import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.SCZN3_QT_UNIVERSALITY_ORIGIN || "http://127.0.0.1:8119";
const targetId = "qt_printer13_product_1873683447881";
const url = `${origin}/target-experience.html?missionFamily=targetScoring&target=${targetId}&source=registered&authorityPort=8119&v=qt-universality`;

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });
try {
  for (const viewport of [{ width: 1280, height: 900, label: "desktop" }, { width: 390, height: 844, label: "390px" }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("#contractWorkspace").waitFor({ state: "visible" });
    const ownership = await page.evaluate(() => ({
      workspace: document.querySelector("#contractWorkspace")?.dataset.sczn3WorkspaceOwner,
      action: document.querySelector("#contractWorkspace [data-sczn3-action-region]")?.dataset.sczn3ActionOwner,
      navigation: document.documentElement.dataset.sczn3NavigationReady,
      processing: typeof window.SCZN3Processing?.run,
      precisionTap: document.querySelector("#contractPrecisionTapViewport")?.dataset.precisionTapOwner,
      precisionPlane: document.querySelector("#contractPrecisionTapPlane")?.dataset.precisionTapPlane,
      profile: document.querySelector("#contractProductName")?.textContent,
      imageReady: Boolean(document.querySelector("#contractTargetImage")?.naturalWidth)
    }));
    assert.deepEqual(ownership, {
      workspace: "SCZN3SmartTargetWorkspace",
      action: "SCZN3Actions",
      navigation: "true",
      processing: "function",
      precisionTap: "SCZN3SmartTargetWorkspace",
      precisionPlane: "true",
      profile: "5-Spot Paper Target",
      imageReady: true
    }, `${viewport.label}: existing DD owners govern the QT road`);

    const presentation = await page.evaluate(() => {
      const primary = document.querySelector("#contractShowResult");
      const header = document.querySelector(".app-header");
      const primaryStyle = getComputedStyle(primary);
      const headerStyle = getComputedStyle(header);
      return {
        primaryClass: primary?.className,
        primaryDisabled: primary?.disabled,
        primaryBackground: primaryStyle.backgroundColor,
        primaryColor: primaryStyle.color,
        headerBackground: headerStyle.backgroundColor,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    assert.match(presentation.primaryClass, /\bprimary\b/, `${viewport.label}: current result action consumes the established primary-control treatment`);
    assert.equal(presentation.primaryDisabled, true, `${viewport.label}: unavailable action is disabled before observations exist`);
    assert.notEqual(presentation.primaryBackground, "rgba(0, 0, 0, 0)", `${viewport.label}: primary action has a visible palette treatment`);
    assert.notEqual(presentation.primaryColor, presentation.primaryBackground, `${viewport.label}: primary action text remains distinguishable`);
    assert.notEqual(presentation.headerBackground, "rgba(0, 0, 0, 0)", `${viewport.label}: shared application header has an explicit surface`);
    assert.ok(presentation.overflow <= 1, `${viewport.label}: shared road does not overflow the viewport`);

    const surface = page.locator("#contractTapSurface");
    const box = await surface.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 100);
    await surface.click({ position: { x: box.width * .24, y: box.height * .24 } });
    assert.equal(await page.locator("#contractShowResult").isEnabled(), true, `${viewport.label}: current action becomes available after a valid observation`);
    assert.equal(await page.locator("#contractUndoObservation").isEnabled(), true, `${viewport.label}: available non-current Undo remains neutral and enabled`);
    assert.equal(await page.locator("#contractClearObservations").isEnabled(), true, `${viewport.label}: available non-current Clear remains neutral and enabled`);
    const markerTreatment = await page.locator(".contract-observation-marker").first().evaluate(marker => {
      const style = getComputedStyle(marker);
      return { background: style.backgroundColor, shot: marker.dataset.shotIndex, className: marker.className };
    });
    assert.equal(markerTreatment.background, "rgba(255, 255, 255, 0.08)", `${viewport.label}: bullet hole remains see-through`);
    assert.equal(markerTreatment.shot, "1", `${viewport.label}: shared marker owns the detached shot identity`);
    assert.match(markerTreatment.className, /precision-tap-marker/);
    const precisionViewport = page.locator("#contractPrecisionTapViewport");
    const initialScale = Number(await precisionViewport.getAttribute("data-precision-tap-scale"));
    await precisionViewport.hover();
    await page.mouse.wheel(0, -180);
    const zoomedScale = Number(await precisionViewport.getAttribute("data-precision-tap-scale"));
    assert.ok(zoomedScale > initialScale, `${viewport.label}: existing DD Precision Tap zoom is active`);
    await surface.click({ position: { x: box.width * .76, y: box.height * .24 } });
    await surface.click({ position: { x: box.width * .5, y: box.height * .5 } });
    await page.getByRole("button", { name: "Show Result" }).click();
    await page.locator("#contractSecView").waitFor({ state: "visible" });
    assert.equal(await page.locator("#contractSecRoot [data-sec-shell]").getAttribute("data-sec-shell"), "universal-v1", `${viewport.label}: generic QT consumes the existing universal SEC chassis`);
    assert.deepEqual(await page.locator("#contractSecRoot [data-sec-region]").evaluateAll(nodes => nodes.map(node => node.dataset.secRegion)), ["target", "session", "actions"], `${viewport.label}: universal SEC region order is preserved`);
    assert.match(await page.locator("#contractSecRoot").innerText(), /5-Spot Paper Target/);
    assert.deepEqual(await page.locator('#contractSecRoot [data-sec-region="actions"] .sec-preservation-actions > [data-sczn3-action]').evaluateAll(nodes => nodes.map(node => node.textContent.trim())), ["Save SEC", "Share", "Export / Print PDF", "Add Note"], `${viewport.label}: generic QT inherits the existing family SEC actions before preservation`);
    await page.locator('#contractSecRoot [data-sec-region="session"] > summary').click();
    assert.match(await page.locator("#contractSecRoot .sec-session-record-fields").innerText(), /Target[\s\S]*5-Spot Paper Target[\s\S]*SKU[\s\S]*5-Spot[\s\S]*Taps[\s\S]*3/, `${viewport.label}: session drawer presents only preserved target/session facts`);
    await page.locator('#contractSecRoot [data-sec-region="target"] > summary').click();
    const disclosure = page.locator("#contractSecRoot details.contract-numeric-region-results").first();
    if (await disclosure.count()) {
      assert.equal(await disclosure.getAttribute("open"), null, `${viewport.label}: result details default collapsed`);
      await disclosure.locator("summary").click();
      assert.equal(await disclosure.getAttribute("open"), "", `${viewport.label}: complete disclosure row opens the details`);
      await disclosure.locator("summary").press("Enter");
      assert.equal(await disclosure.getAttribute("open"), null, `${viewport.label}: disclosure remains keyboard-operable`);
    }
    assert.equal(await page.locator("#contractShowResult").getAttribute("data-sczn3-processing"), null, `${viewport.label}: processing owner settles`);
    await page.getByRole("button", { name: "Save SEC" }).click();
    const reopen = page.getByRole("link", { name: "Exact Reopen" });
    await reopen.waitFor();
    const href = await reopen.getAttribute("href");
    assert.ok(href && href.includes("session=") && href.includes("secReopenCapability="));
    await page.goto(new URL(href, origin).href, { waitUntil: "networkidle" });
    assert.equal(await page.locator("#contractStatus").textContent(), "Saved Session Opened");
    assert.equal(await page.locator("#contractSecRoot [data-sec-shell]").getAttribute("data-sec-shell"), "universal-v1", `${viewport.label}: exact reopen retains the universal SEC chassis`);
    assert.deepEqual(await page.locator('#contractSecRoot [data-sec-region="actions"] .sec-preservation-actions > [data-sczn3-action]').evaluateAll(nodes => nodes.map(node => node.textContent.trim())), ["Share", "Export / Print PDF", "Ballistic Vault"], `${viewport.label}: historical SEC keeps the existing family actions without mutating the session`);
    assert.equal(await page.locator(".contract-observation-marker").count(), 3);
    assert.equal(errors.length, 0, `${viewport.label}: no browser errors: ${errors.join(" | ")}`);
    await context.close();
    console.log(`PASS QT Printer #13 DD Universality browser road at ${viewport.label}`);
  }
} finally {
  await browser.close();
}
