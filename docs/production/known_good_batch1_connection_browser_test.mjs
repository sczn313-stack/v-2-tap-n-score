import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.SCZN3_FOUNDER_REVIEW_ORIGIN || "http://192.168.1.90:8094";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

async function loadFile(page, selector, file, workspace = "#targetWorkspace:not([hidden])") {
  await page.locator(selector).setInputFiles(path.resolve(file));
  await page.locator(workspace).waitFor();
}

async function saveVaultAndReopen(page, expected, expectedVault = expected) {
  await page.getByRole("button", { name: "Save SEC" }).click();
  await page.getByText("SEC saved to Ballistic Vault.").or(page.getByText("SEC preserved. Exact reopen available.")).waitFor();
  const actionBar = page.getByLabel("Shooter Action Bar");
  const exact = actionBar.getByRole("link", { name: "Exact Reopen" });
  if (await exact.count()) {
    await exact.click();
    await page.locator("[data-sec-shell='universal-v1']").waitFor();
    assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), expected);
    await page.getByRole("link", { name: "Ballistic Vault" }).click();
  } else {
    await actionBar.getByRole("link", { name: "Ballistic Vault" }).click();
  }
  await page.getByRole("heading", { name: "BALLISTIC VAULT" }).waitFor();
  const record = page.locator(".vault-record-summary").first();
  assert.match(await record.innerText(), expectedVault);
  assert.doesNotMatch(await record.innerText(), /Confirmation not recorded/i);
  await record.getByRole("link").click();
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), expected);
}

async function runContractTarget(page, targetId, expected) {
  await page.goto(`${base}/target-experience.html?missionFamily=targetScoring&target=${targetId}&founderReview=scale-batch-1`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByText("Session admitted. Load target evidence.", { exact: true }).waitFor();
  const assets = {
    gunfun_22200_b27e_black: "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22200.jpg",
    gunfun_22040_idpa_white: "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22040.jpg"
  };
  await loadFile(page, "#contractFile", assets[targetId], "#contractWorkspace:not([hidden])");
  await page.getByRole("button", { name: "Record visible shot observation" }).click();
  await page.getByRole("button", { name: "Show Result" }).click();
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), expected);
  await saveVaultAndReopen(page, expected);
}

async function runSLST2(page) {
  await page.goto(`${base}/t/baker/sl-st2/?founderReview=scale-batch-1`, { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: /Reported Raw Time/ }).fill("8.50");
  await loadFile(page, "#libraryInput", "authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg");
  const surface = page.locator("#tapSurface");
  await surface.click(); await surface.click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Show Results" }).click();
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), /Final Time\s*8\.50s/i);
  await saveVaultAndReopen(page, /Final Time\s*8\.50s/i);
}

async function runVitalDude(page) {
  await page.goto(`${base}/t/gunfun/vital-dude/?founderReview=scale-batch-1`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByText("Capture or choose a photo of your Vital Dude target.", { exact: true }).waitFor();
  await loadFile(page, "#libraryInput", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22740.jpg");
  const surface = page.locator("#tapSurface");
  await surface.click(); await surface.click();
  await page.getByRole("button", { name: "Show Evidence Result" }).click();
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), /Evidence Recorded[\s\S]*2[\s\S]*Scoring\s*Not applicable/i);
  await saveVaultAndReopen(page, /EVIDENCE RECORDED|Evidence Recorded/i);
}

async function runBilliards(page) {
  await page.goto(`${base}/t/baker/fun/?target=gf-bb&founderReview=scale-batch-1`, { waitUntil: "domcontentloaded" });
  await loadFile(page, "#libraryInput", "authority-evidence/catalog-targets/BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg");
  const surface = page.locator("#tapSurface");
  const box = await surface.boundingBox();
  assert.ok(box);
  const centers = {1:[560,1220],2:[360,485],3:[660,1030],4:[660,665],5:[760,485],6:[360,845],7:[165,485],8:[560,845],9:[860,665],10:[560,485],11:[460,1030],12:[960,485],13:[265,665],14:[760,845],15:[460,665]};
  for (let number = 1; number <= 15; number += 1) {
    const [x, y] = centers[number];
    await surface.click({ position: { x: x / 1140 * box.width, y: y / 1499 * box.height } });
    await page.waitForFunction(expected => Number(document.getElementById("eventCount")?.textContent) === expected, number);
  }
  await page.getByRole("button", { name: "Show Results" }).click();
  await page.locator("[data-sec-shell='universal-v1']").waitFor();
  assert.match(await page.locator("[data-sec-shell='universal-v1']").innerText(), /Sequence Complete/i);
  await saveVaultAndReopen(page, /Sequence Complete/i, /1–15|15 credited balls/i);
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1180, height: 900 } });
  await runBilliards(await desktop.newPage());
  await runContractTarget(await desktop.newPage(), "gunfun_22200_b27e_black", /Target Score/i);
  await desktop.close();
  console.log("PASS desktop exact-route + shared-data connections: 2/2");

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await runSLST2(await phone.newPage());
  await runVitalDude(await phone.newPage());
  await runContractTarget(await phone.newPage(), "gunfun_22040_idpa_white", /Penalty Total/i);
  await phone.close();
  console.log("PASS 390px exact-route + shared-data connections: 3/3");
  console.log("PASS known-good / Batch #1 connection browser regression: 5/5");
} finally {
  await browser.close();
}
