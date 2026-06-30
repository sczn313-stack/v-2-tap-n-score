const fs = require("fs");
const path = require("path");
const assert = require("assert");

const shootHtml = fs.readFileSync(path.join(__dirname, "..", "shoot.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

const handlerStart = shootHtml.indexOf("function handleMarkPointer(event)");
const handlerEnd = shootHtml.indexOf("\n}\n\nif (", handlerStart);

assert(handlerStart >= 0, "handleMarkPointer must exist");
assert(handlerEnd > handlerStart, "handleMarkPointer body must be extractable");

const handlerSource = shootHtml.slice(handlerStart, handlerEnd);

assert(
  handlerSource.indexOf("if (resultsShown) return;") >= 0,
  "results state must disable target tap capture before preventDefault"
);
assert(
  handlerSource.indexOf("if (resultsShown) return;") < handlerSource.indexOf("event.preventDefault()"),
  "resultsShown guard must run before preventDefault"
);
assert(
  handlerSource.indexOf("if (!hasMarkableEvidence()) return;") < handlerSource.indexOf("event.preventDefault()"),
  "missing-evidence guard must run before preventDefault"
);
assert(
  /\.target-page\[data-has-results="true"\]\s+\.mark-surface\s*\{[^}]*pointer-events\s*:\s*none/i.test(styles),
  "mark surface must be non-interactive after results"
);
assert(
  /\.target-page\[data-has-results="true"\]\s+\.mark-surface\s*\{[^}]*touch-action\s*:\s*pan-y/i.test(styles),
  "mark surface must allow vertical panning after results"
);

console.log("PASS target touch layer governance test");
