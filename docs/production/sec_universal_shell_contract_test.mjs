import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, "..");
const read = relative => fs.readFileSync(path.join(docs, relative), "utf8");

const renderer = read("sec_v1.js");
const universalCss = read("sec-universal.css");
const bakerCss = read("baker-sl-st1-sec.css");
const bakerRenderer = read("baker_sl_st1_sec.js");

assert.match(renderer, /data-sec-shell="universal-v1"/, "shared renderer must identify the universal SEC shell");
assert.match(renderer, /class="sec-target-story sec-v1-flow"/, "shared renderer must emit the shared SEC flow grammar");
assert.match(renderer, /sec-universal-stage-\$\{universalRegionName\}/, "shared renderer must own universal region classes");

for (const selector of [
  ".sec-v1-flow",
  ".sec-v1-region",
  ".sec-v1-target",
  ".sec-v1-session",
  ".sec-v1-actions",
  ".sec-accordion-stage",
  ".sec-live-host"
]) {
  assert.equal(bakerCss.includes(selector), false, `Baker mission CSS must not control universal shell selector ${selector}`);
}

assert.match(universalCss, /sec-live-host/, "shared CSS must own the live SEC host");
assert.match(universalCss, /sec-v1-target\{order:1\}/, "shared CSS must own Target order");
assert.match(universalCss, /sec-v1-session\{order:2\}/, "shared CSS must own Session order");
assert.match(universalCss, /sec-v1-actions\{order:4\}/, "shared CSS must own action order");
assert.match(universalCss, /data-sec-open-region="target"/, "shared CSS must assign the Target-open flexible row");
assert.match(universalCss, /data-sec-open-region="session"/, "shared CSS must assign the Session-open flexible row");
assert.match(universalCss, /sec-live-host>:has\(>\.sec-v1\[data-sec-shell="universal-v1"\]\[data-sec-mode="live"\]\)/, "shared shell must constrain wrapped renderer mounts");
assert.match(universalCss, /sec-live-host \.sec-v1\[data-sec-shell="universal-v1"\]\[data-sec-mode="live"\]/, "shared shell must constrain the live SEC inside its renderer mount");
assert.match(universalCss, /details\.sec-accordion-stage\{position:relative;display:flex;flex-direction:column/, "shared shell must establish the containing row for open section bodies");
assert.match(universalCss, /sec-historical-target-body,[\s\S]*?flex:1 1 auto;min-height:0;overflow:auto/, "shared shell section bodies must shrink without overlapping actions");
assert.match(universalCss, /sec-v1-target\[open\]>\.sec-historical-target-body\{position:absolute;inset:46px 0 0/, "shared Target body must remain inside its assigned live row");
assert.match(universalCss, /sec-collapsible-stage\[open\]>\.sec-stage-body\{position:absolute;inset:calc\(var\(--sczn3-pill-height\) \+ 10px\) 0 0/, "shared expandable bodies must remain inside their assigned live rows");
assert.match(universalCss, /sec-universal-stage-heading>span:first-child,[\s\S]*?sec-stage-pill>h2\{font-family:Arial,Helvetica,sans-serif;font-size:14px!important;font-weight:950!important/, "equivalent SEC structural labels must share universal typography");
assert.match(universalCss, /sec-stage-pill>span:first-child\{display:inline-flex;[\s\S]*?border:0;border-radius:0/, "shared SEC section numbers must not retain the legacy circular treatment");
assert.match(universalCss, /sec-stage-pill>span:first-child::after\{content:"·"/, "shared SEC section numbers must use the same number-divider grammar as Target");
assert.match(universalCss, /--sczn3-sec-closed-bar-height:34px/, "shared SEC shell must own the compact closed-section height");
assert.match(universalCss, /details\.sec-accordion-stage:not\(\[open\]\)\{align-self:start;height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden\}/, "closed SEC containers must release all mission or historical height reservations");
assert.match(universalCss, /details\.sec-accordion-stage:not\(\[open\]\)>summary\.sec-universal-stage-heading\{box-sizing:border-box;min-height:var\(--sczn3-sec-closed-bar-height\)!important;padding-block:0!important\}/, "every closed SEC section must inherit the same compact bar density");
assert.match(universalCss, /sec-session-record-fields>div\{display:grid;grid-template-columns:max-content minmax\(0,1fr\);align-items:baseline;column-gap:10px/, "shared Session fields must visibly separate labels from values");

assert.match(bakerRenderer, /key: "target"/, "Baker adapter must provide Target content");
assert.match(bakerRenderer, /key: "session"/, "Baker adapter must provide Session content");
assert.match(bakerRenderer, /key: "actions"/, "Baker adapter must provide action contents");
assert.doesNotMatch(bakerRenderer, /grid-template|grid-row|grid-column|max-height|min-height/, "Baker adapter must not define SEC shell geometry");

console.log("Universal SEC shell contract passed: SCZN3 owns the outside; adapters supply the inside.");
