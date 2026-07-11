const fs = require("fs");
const path = require("path");
const assert = require("assert");

const records = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const renderStart = records.indexOf("function renderGssfSecCard(");
const renderEnd = records.indexOf("\nfunction gssfSavedEvidenceDataUrl", renderStart);
const bucketDefinitionsStart = records.indexOf("function gssfBucketDefinitions(");
const bucketDefinitionsEnd = records.indexOf("\nfunction gssfAuthoritativeBreakdown", bucketDefinitionsStart);
const bucketRendererStart = records.indexOf("function gssfBucketSummaryHtml(");
const bucketRendererEnd = records.indexOf("\nfunction gssfScoringSourceLine", bucketRendererStart);

assert(renderStart >= 0 && renderEnd > renderStart, "saved GSSF SEC renderer must be extractable");
const renderer = records.slice(renderStart, renderEnd);
const bucketDefinitions = records.slice(bucketDefinitionsStart, bucketDefinitionsEnd);
const bucketRenderer = records.slice(bucketRendererStart, bucketRendererEnd);

const requiredStory = [
  "Final Time",
  "How Your Final Time Was Calculated",
  "Timer",
  "Paper Penalties",
  "How Your Score Was Built",
  "Target",
  "Session",
  "Continue"
];

for (const label of requiredStory) {
  assert(renderer.includes(label), `SEC Standard v1.0 must display ${label}`);
}

const orderedSections = [
  "sec-gssf-story-result",
  "sec-gssf-story-explanation",
  "sec-gssf-story-buckets",
  "sec-gssf-story-target",
  "sec-gssf-story-session",
  "sec-gssf-story-continue"
];

for (let index = 1; index < orderedSections.length; index += 1) {
  assert(
    renderer.indexOf(orderedSections[index - 1]) < renderer.indexOf(orderedSections[index]),
    `${orderedSections[index - 1]} must precede ${orderedSections[index]}`
  );
}

assert(
  !/\b(?:Authority|Backend|Validation|Package)\b/.test(renderer),
  "saved GSSF SEC customer copy must not expose developer terminology"
);
assert(renderer.includes("gssfCompetitionRecord(session, pkg)"), "presentation must retain governed time values");
assert(renderer.includes("gssfBucketSummaryHtml(pkg)"), "presentation must retain governed bucket rendering");
assert(renderer.includes("gssfSavedEvidenceHtml(session, pkg)"), "presentation must retain governed evidence selection");

assert(
  /\.records-page \.sec-gssf-bucket-grid\s*\{[^}]*grid-template-columns:repeat\(4, minmax\(0, 1fr\)\)/s.test(styles),
  "desktop and tablet bucket presentation must be one four-column row"
);
assert(
  !/grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/.test(styles.slice(styles.indexOf(".records-page .sec-gssf-bucket-grid"))),
  "GSSF scoring must not fall back to a 2 by 2 presentation"
);
assert(
  /@media \(max-width:560px\)[\s\S]*?\.records-page \.sec-gssf-bucket-grid\s*\{[^}]*grid-template-columns:repeat\(4, minmax\(0, 1fr\)\)[^}]*grid-auto-flow:row[^}]*overflow-x:hidden[^}]*scroll-snap-type:none/s.test(styles),
  "mobile scoring must display all four columns without carousel behavior"
);
const expectedBucketOrder = ["Down Zero", "+1", "+3", "Miss / Other"];
for (let index = 1; index < expectedBucketOrder.length; index += 1) {
  assert(
    bucketDefinitions.indexOf(`label: "${expectedBucketOrder[index - 1]}"`) < bucketDefinitions.indexOf(`label: "${expectedBucketOrder[index]}"`),
    `${expectedBucketOrder[index - 1]} must precede ${expectedBucketOrder[index]}`
  );
}
for (const contentClass of ["sec-gssf-bucket-head", "sec-gssf-bucket-math", "sec-gssf-bucket-subtotal", "sec-gssf-bucket-rule"]) {
  assert(bucketRenderer.includes(contentClass), `every scoring column must retain ${contentClass}`);
}
assert(bucketRenderer.includes("Hits:") && bucketRenderer.includes("Shot IDs:"), "every scoring column must retain hits and authoritative shot IDs");
for (const railClass of ["sec-gssf-rail-shell", "sec-gssf-rail-arrow", "sec-gssf-rail-dots", "mobile-equals"]) {
  assert(bucketRenderer.includes(railClass), `mobile scoring rail must retain ${railClass}`);
}
assert(
  /@media \(max-width:560px\)[\s\S]*?\.records-page \.sec-gssf-rail-arrow\s*\{[^}]*display:none/s.test(styles)
    && /@media \(max-width:560px\)[\s\S]*?\.records-page \.sec-gssf-rail-dots\s*\{[^}]*display:none/s.test(styles),
  "mobile scoring must hide carousel arrows and position dots"
);
assert(
  styles.includes("--gssf-sec-space") && styles.includes("--gssf-sec-radius") && styles.includes("--gssf-sec-shadow"),
  "SEC Standard v1.0 must use a consistent spacing, radius, and shadow system"
);
assert(
  /\.records-page \.sec-gssf-continue-actions a\s*\{[^}]*min-height:50px/s.test(styles),
  "continue actions must provide comfortable touch targets"
);

console.log("PASS SCZN3 SEC Standard v1.0 presentation test");
