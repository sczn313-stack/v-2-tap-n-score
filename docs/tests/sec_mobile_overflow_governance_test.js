const fs = require("fs");
const path = require("path");
const assert = require("assert");

const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const recordsResponsiveAnchor = styles.indexOf(".records-page .training-sec-stage-breakdown strong");
const mobileStart = styles.indexOf("@media (max-width:560px)", recordsResponsiveAnchor);
const mobileEnd = styles.indexOf("\n@media ", mobileStart + 1);

assert(mobileStart >= 0, "SEC narrow-mobile breakpoint must exist");
assert(mobileEnd > mobileStart, "SEC narrow-mobile breakpoint must be extractable");

const mobileStyles = styles.slice(mobileStart, mobileEnd);

assert(
  /\.records-page \.history-list\s*\{[^}]*grid-template-columns:minmax\(0, 1fr\)/s.test(mobileStyles),
  "SEC history list must not retain the global 520px minimum track on narrow mobile"
);
assert(
  /\.records-page \.gssf-sec-card\s*\{[^}]*grid-template-columns:1fr/s.test(mobileStyles),
  "GSSF SEC content must use a single governed column on narrow mobile"
);
assert(
  /\.records-page \.sec-gssf-bucket-grid\s*\{[^}]*grid-template-columns:none[^}]*grid-auto-flow:column[^}]*width:100%[^}]*min-width:0[^}]*max-width:100%[^}]*overflow-x:auto[^}]*overflow-y:hidden/s.test(mobileStyles),
  "Authoritative bucket rail must scroll internally without widening its narrow-mobile parent"
);
assert(
  /\.records-page \.sec-gssf-bucket small\s*\{[^}]*overflow-wrap:anywhere[^}]*word-break:break-word/s.test(mobileStyles),
  "Long authoritative shot-ID content must wrap instead of widening the viewport"
);

console.log("PASS SEC narrow-mobile overflow governance test");
