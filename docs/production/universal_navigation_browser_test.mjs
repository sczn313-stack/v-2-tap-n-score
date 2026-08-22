import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const expectedLabels = ["Equipment Library", "Smart Targets", "Ballistic Vault"];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const catalogPage = await context.newPage();
    await catalogPage.goto(`${baseUrl}/index.html?universal_navigation=${viewport.width}`, { waitUntil: "networkidle" });
    await catalogPage.waitForFunction(() => document.documentElement.dataset.sczn3NavigationReady === "true");
    assert.deepEqual((await catalogPage.locator("#packageMenuDrawer a").allTextContents()).map(label => label.trim()), expectedLabels, "homepage burger inherits universal application navigation");
    const homepageEquipmentUrl = new URL(await catalogPage.locator('#packageMenuDrawer a', { hasText: "Equipment" }).getAttribute("href"));
    assert.equal(homepageEquipmentUrl.pathname.endsWith("/matrix.html"), true, "Home Equipment uses the universal library owner");
    assert.equal(homepageEquipmentUrl.searchParams.get("view"), "library", "Home Equipment requests the neutral library state");
    const experiences = [
      { id: "m4-25-meter-zero", href: "matrix.html?target_profile_id=m4_25m_zero" },
      { id: "baker-100-yard-bullseye", href: "matrix.html?target_profile_id=baker_st_100yd_smart_zero" },
      { id: "gssf-practice-target", href: "matrix.html?target_profile_id=gssf_ac_1" },
      { id: "uspsa-practice-target", href: "t/baker/sl-st1/" }
    ];

    for (const experience of experiences) {
      const page = await context.newPage();
      await page.goto(new URL(experience.href, `${baseUrl}/index.html`).href, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.dataset.sczn3NavigationReady === "true");
      const desktopLabels = (await page.locator(".platform-quick-nav a").allTextContents()).map(label => label.trim());
      assert.deepEqual(desktopLabels, expectedLabels, `${experience.id} inherits the universal desktop navigation`);
      const equipmentUrl = new URL(await page.locator('.platform-quick-nav a', { hasText: "Equipment" }).getAttribute("href"));
      assert.equal(equipmentUrl.pathname.endsWith("/matrix.html"), true, `${experience.id} Equipment uses the universal library owner`);
      assert.equal(equipmentUrl.searchParams.get("view"), "library", `${experience.id} Equipment requests the neutral library state`);
      const burgerLabels = (await page.locator("details.mobile-platform-menu > a").allTextContents()).map(label => label.trim());
      assert.deepEqual(burgerLabels, expectedLabels, `${experience.id} inherits the universal burger navigation`);
      const smartTargetsHref = await page.locator('.platform-quick-nav a', { hasText: "Smart Targets" }).getAttribute("href");
      const smartTargetsUrl = new URL(smartTargetsHref);
      assert.equal(smartTargetsUrl.pathname.endsWith("/index.html"), true, `${experience.id} Smart Targets returns to the homepage`);
      assert.equal(smartTargetsUrl.hash, "#targetExperiences", `${experience.id} Smart Targets targets the catalog`);
      assert.equal(desktopLabels.includes("Target"), false, `${experience.id} does not expose the old generic Target destination`);
      await page.close();
    }
    for (const shellPath of ["shoot.html", "sec.html", "records.html"]) {
      const page = await context.newPage();
      await page.goto(`${baseUrl}/${shellPath}?universal_navigation=${viewport.width}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.dataset.sczn3NavigationReady === "true");
      assert.deepEqual((await page.locator(".platform-quick-nav a").allTextContents()).map(label => label.trim()), expectedLabels, `${shellPath} inherits universal desktop navigation`);
      const equipmentUrl = new URL(await page.locator('.platform-quick-nav a', { hasText: "Equipment" }).getAttribute("href"));
      assert.equal(equipmentUrl.pathname.endsWith("/matrix.html"), true, `${shellPath} Equipment uses the universal library owner`);
      assert.equal(equipmentUrl.searchParams.get("view"), "library", `${shellPath} Equipment requests the neutral library state`);
      const menuSelector = shellPath === "shoot.html" ? "details.mobile-platform-menu > a" : "button.package-menu[aria-controls]";
      let burgerLabels;
      if (menuSelector.startsWith("details")) {
        burgerLabels = await page.locator(menuSelector).allTextContents();
      } else {
        const drawerId = await page.locator(menuSelector).getAttribute("aria-controls");
        burgerLabels = await page.locator(`#${drawerId} a`).allTextContents();
      }
      assert.deepEqual(burgerLabels.map(label => label.trim()), expectedLabels, `${shellPath} inherits universal burger navigation`);
      await page.close();
    }
    await catalogPage.close();
    await context.close();
  }
  console.log("PASS universal EQUIPMENT LIBRARY · SMART TARGETS · BALLISTIC VAULT navigation across representative experiences");
} finally {
  await browser.close();
}
