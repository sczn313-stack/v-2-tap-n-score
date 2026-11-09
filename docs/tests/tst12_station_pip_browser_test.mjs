import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(docs, "assets/tst12-demo/sczn3-tst12-17-5x23-demo-v1.json"), "utf8")).authorityResult;
const evidence = path.join(docs, "test-evidence", "tst12-station-pip");
fs.mkdirSync(evidence, { recursive: true });

const mime = file => file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "text/html";
const server = http.createServer((request, response) => {
  if (request.url === "/") {
    response.writeHead(200, { "content-type": "text/html", "cache-control": "no-store" });
    response.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tst12-station-results.css"><main id="root"></main><script src="/tst12_station_results.js"></script><script>root.innerHTML=SCZN3Tst12StationResults.render(${JSON.stringify(fixture)},{experienceMode:"simulation"});root.querySelector(".tst12-station-performance").open=true;</script>`);
    return;
  }
  const relative = decodeURIComponent(request.url.split("?")[0]).replace(/^\//, "");
  const candidate = path.resolve(docs, relative);
  if (!candidate.startsWith(docs + path.sep) || !fs.existsSync(candidate)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": mime(candidate), "cache-control": "no-store" });
  fs.createReadStream(candidate).pipe(response);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
try {
  for (const viewport of [{ name: "desktop", width: 1180, height: 900 }, { name: "mobile-390", width: 390, height: 844 }, { name: "mobile-320", width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await page.locator("[data-tst12-station-card]").count(), 12, `${viewport.name}: all stations render`);
    assert.equal(await page.locator('[data-tst12-station-pip="available"]').count(), 12, `${viewport.name}: all station PiPs available`);
    const first = page.locator('[data-tst12-station="1"]');
    assert.equal(await first.locator(".tst12-pip-zoom-control .when-closed").isVisible(), true, `${viewport.name}: unified ZOOM control is visible`);
    assert.equal((await first.locator(".tst12-pip-zoom-control .when-closed").innerText()).trim(), "ZOOM", `${viewport.name}: closed label is ZOOM`);
    assert.equal(await first.locator(".tst12-station-pip-preview .tst12-pip-impact-label").count(), 5, `${viewport.name}: preview capsules accompany all selected Station 1 impacts`);
    await first.locator(".tst12-station-pip > summary").click();
    assert.equal(await first.locator(".tst12-station-pip").evaluate(element => element.open), true, `${viewport.name}: inspection expands`);
    assert.equal(await first.locator(".tst12-pip-zoom-control .when-open").isVisible(), true, `${viewport.name}: unified CLOSE control is visible after zoom`);
    assert.equal((await first.locator(".tst12-pip-zoom-control .when-open").innerText()).trim(), "CLOSE", `${viewport.name}: open label is CLOSE`);
    assert.equal(await first.locator(".tst12-station-pip-inspection [data-observation-id]").count(), 5, `${viewport.name}: five selected impacts in expanded Station 1`);
    const geometry = await page.evaluate(() => [...document.querySelectorAll(".tst12-pip-impact")].map(group => {
      const svg = group.ownerSVGElement;
      const footprint = group.querySelector(".tst12-pip-impact-footprint");
      const capsule = group.querySelector(".tst12-pip-impact-label");
      const view = svg.viewBox.baseVal;
      const box = capsule.getBBox();
      const physical = String(svg.dataset.ugoPhysicalSize).split("x").map(Number);
      return {
        xExact: Math.abs(Number(footprint.getAttribute("cx")) - Number(group.dataset.authoritativeX) * physical[0]) < 1e-9,
        yExact: Math.abs(Number(footprint.getAttribute("cy")) - Number(group.dataset.authoritativeY) * physical[1]) < 1e-9,
        capsuleInside: box.x >= view.x - 1e-9 && box.y >= view.y - 1e-9 && box.x + box.width <= view.x + view.width + 1e-9 && box.y + box.height <= view.y + view.height + 1e-9,
        horizontal: Math.abs(Number(group.dataset.labelCenterX) - Number(group.dataset.impactCenterX)) > Math.abs(Number(group.dataset.labelCenterY) - Number(group.dataset.impactCenterY))
      };
    }));
    assert.equal(geometry.every(item => item.xExact && item.yExact), true, `${viewport.name}: authoritative impact centers are unchanged`);
    assert.equal(geometry.every(item => item.capsuleInside), true, `${viewport.name}: no numbered capsule clips outside its physical crop`);
    assert.equal(geometry.every(item => item.horizontal), true, `${viewport.name}: every capsule is positioned horizontally beside its impact`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${viewport.name}: no horizontal clipping (${overflow}px)`);
    await page.screenshot({ path: path.join(evidence, `${viewport.name}.png`), fullPage: true });
    await first.locator(".tst12-station-pip > summary").click();
    assert.equal(await first.locator(".tst12-station-pip").evaluate(element => element.open), false, `${viewport.name}: CLOSE collapses the inspection`);
    await page.close();
  }
  console.log(`PASS TST-12 Simulator PiP browser desktop/390/320; evidence ${evidence}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
