import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const expectedNavigation = ["Home", "Equipment", "Smart Targets", "History"];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    let sessionAuthorityRequests = 0;
    await context.route("**/api/session/**", async route => {
      sessionAuthorityRequests += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "unexpected_mission_setup_request" }) });
    });
    await context.addInitScript(() => {
      const staleMission = { target_profile_id: "m4_25m_zero", targetName: "M4 Carbine • 25 Meter Zeroing Target", mission_family: "zeroingCorrection" };
      localStorage.setItem("SCZN3_PENDING_TARGET_PROFILE", JSON.stringify(staleMission));
      sessionStorage.setItem("SCZN3_PENDING_TARGET_PROFILE", JSON.stringify(staleMission));
    });

    const page = await context.newPage();
    await page.goto(`${baseUrl}/matrix.html?view=library&equipment_test=${viewport.width}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.dataset.sczn3NavigationReady === "true");
    assert.equal(await page.title(), "Equipment Library", "the universal destination has one Equipment Library identity");
    assert.equal(await page.locator("body").evaluate(body => body.classList.contains("equipment-library-neutral")), true, "Equipment opens in neutral library mode");
    assert.equal(await page.locator("#weaponListPanel").evaluate(panel => !panel.classList.contains("is-collapsed")), true, "the existing universal equipment list opens immediately");
    assert.equal(await page.locator("#weaponListToggle").getAttribute("aria-expanded"), "true", "library expansion state matches its visible content");
    assert.equal(await page.locator('#matrixForm button[type="submit"]').evaluate(button => getComputedStyle(button).display), "none", "neutral Equipment does not expose mission launch controls");
    assert.equal(await page.locator("#activeSessionBar").evaluate(bar => getComputedStyle(bar).display), "none", "neutral Equipment does not present stale mission context");
    assert.equal(await page.locator("#targetModePill").evaluate(pill => pill.classList.contains("is-hidden") && !pill.textContent.trim()), true, "neutral Equipment has no target-specific mode");
    assert.equal(await page.locator("#standardSetupPanel").evaluate(panel => panel.classList.contains("is-hidden")), true, "neutral Equipment cannot inherit a target-specific setup prompt");
    assert.equal(sessionAuthorityRequests, 0, "opening Equipment never starts target preparation");
    assert.deepEqual((await page.locator(".platform-quick-nav a").allTextContents()).map(label => label.trim()), expectedNavigation, "Issue #2 navigation remains locked while Issue #1 is corrected");
    assert.equal(await page.getByRole("button", { name: /View My Equipment Library/i }).isVisible(), true, "the same equipment-library control is visible");
    assert.equal(await page.getByRole("button", { name: "New Equipment", exact: true }).isVisible(), true, "the same New Equipment action is visible");
    await context.close();
  }
  console.log("PASS universal Equipment routing ignores stale target context at desktop and 390px");
} finally {
  await browser.close();
}
