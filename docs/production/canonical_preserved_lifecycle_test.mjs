import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [dispatch, runtime, records, targetPage, targetCss, vaultCss, usmRegistry] = await Promise.all([
  readFile("sec_dispatch.js", "utf8"),
  readFile("target_execution_runtime.js", "utf8"),
  readFile("records.html", "utf8"),
  readFile("target-experience.html", "utf8"),
  readFile("target-experience.css", "utf8"),
  readFile("ballistic-vault.css", "utf8"),
  readFile("usm_proof_registry.js", "utf8"),
]);

assert.match(dispatch, /const CONTRACT_ADAPTERS = Object\.freeze/);
assert.match(dispatch, /function isContractAdapter\(adapter\)/);
assert.match(dispatch, /if \(isContractAdapter\(dispatch\.adapter\)\) \{[\s\S]*?new URLSearchParams\(\{ session: sessionId, view: "sec" \}\)[\s\S]*?return `target-experience\.html\?\$\{params\.toString\(\)\}\$\{localAuthoritySuffix\(\)\}`;/, "contract exact reopen carries governed identity through the parameterized target-experience route");

assert.match(runtime, /class="contract-lifecycle-pair" aria-label="Preserved target evidence and approved result"/);
assert.match(runtime, /<figcaption>\$\{tst12Target \? "YOUR TARGET" : "BEFORE"\}<\/figcaption>/, "the preserved evidence caption identifies TST-12 as the shooter's target while retaining BEFORE elsewhere");
assert.match(runtime, /<figcaption>RESULT<\/figcaption>/);
assert.match(runtime, /approvedResultComponent\(result, session\)/);
assert.match(runtime, /<details class="\$\{escapeHtml\(classes\)\}" data-result-distribution-drawer="true"/, "scoring distribution uses the governed result-drawer contract and is collapsed by default");
assert.doesNotMatch(runtime, /data-result-distribution-drawer="true"[^>]* open/, "scoring distribution is not forced open");
assert.match(runtime, /contract-disclosure-instruction--closed">Tap to view <b aria-hidden="true">›<\/b>/, "collapsed scoring distribution names the tap action");
assert.match(runtime, /contract-disclosure-instruction--open">Tap to close <b aria-hidden="true">›<\/b>/, "expanded scoring distribution names the close action");
const renderSECSource = runtime.match(/function renderSEC[\s\S]*?\n  function vaultResultSummary/)?.[0] || "";
assert.match(renderSECSource, /return global\.SCZN3SEC\.render\(\{/, "generic contract SEC inherits the universal family chassis");
assert.match(renderSECSource, /articleClassName: "contract-family-sec-card contract-universal-sec"/, "generic contract SEC identifies its family-chassis consumer without owning another shell");
assert.match(renderSECSource, /key: "target"[\s\S]*?key: "session"[\s\S]*?key: "actions"/, "generic contract SEC uses the universal target, session, and actions regions");
assert.match(runtime, /function secActions[\s\S]*?label: "Share"[\s\S]*?label: "Export \/ Print PDF"[\s\S]*?label: "Ballistic Vault"/, "generic contract SEC inherits the approved preservation and Vault action armament");
assert.doesNotMatch(runtime.match(/function secActions[\s\S]*?\n  function renderSEC/)?.[0] || "", /label: "Add Note"/, "the retired generic note action is not reintroduced");
assert.match(runtime, /SCZN3SECComponents\.SessionFoundation\(session\)/, "generic contract SEC inherits the universal authoritative session foundation component");
assert.match(runtime, /\.\.\.\(preserved && !historical \? \[\{ label: "Exact Reopen"/);

assert.match(records, /const RECORDS_AUTHORITY_PORT = String\(RECORD_QUERY\.get\("authorityPort"\)/);
assert.match(records, /function resolvePreservedApprovedResult[\s\S]*?SCZN3SECDispatch\.isContractAdapter\(dispatch\.adapter\)/);
assert.match(records, /if \(requestedDispatch && SCZN3SECDispatch\.isContractAdapter\(requestedDispatch\.adapter\)\) \{\s*window\.location\.replace\(historicalSecUrl\(requestedSession, requestedPackage\)\)/);
assert.doesNotMatch(records, /SCZN3TargetExecutionRuntime\.renderSEC\(\{ session, package: pkg, mode: "historical"/);
assert.match(records, /class="vault-evidence-pair"/);
assert.match(records, /OPEN SEC →/);
assert.doesNotMatch(records, /<a class="vault-record-link"[^>]*>[\s\S]*?<div class="vault-evidence-pair">/, "the interactive distribution is not nested inside the OPEN SEC link");

assert.match(targetPage, /target_execution_runtime\.js\?v=sczn3-three-path-release-20261109-1/, "the target surface loads the approved current presentation identity");
assert.match(targetCss, /@media\(hover:hover\) and \(pointer:fine\)\{\.contract-numeric-region-results>summary:hover/, "desktop disclosure row has a hover affordance");
assert.match(targetCss, /background:#ffd84d;color:#080808/, "the complete disclosure header is SCZN3 gold with black text");
assert.match(targetCss, /grid-template-columns:1fr;justify-items:center/, "the disclosure title and instruction stack as two centered lines");
assert.match(targetCss, /min-height:54px/, "two-line scoring disclosure preserves a comfortable touch target");
assert.match(targetCss, /contract-distribution-title[^}]*font-size:\.86rem;font-weight:1000/, "scoring distribution title owns the stronger type hierarchy");
assert.match(targetCss, /contract-disclosure-instruction[^}]*font-size:\.61rem;font-weight:800/, "tap instruction remains subordinate beneath the title");
assert.match(runtime, /data-contract-progression-host/, "progression renders outside the approved RESULT component in Drawer 3");
assert.match(runtime, /3 · HISTORY/, "History is the universal shooter-facing Drawer 3 name");
assert.match(runtime, /TOTAL POINTS <i>\|<\/i> TOTAL TAPS <i>\|<\/i> POINTS PER TAP/, "History uses the Founder-approved universal PPT performance language");
assert.doesNotMatch(runtime, /SCORE <i>\|<\/i> HIT RATE/, "retired general Hit Rate is absent from active History presentation");
assert.doesNotMatch(runtime, /YOUR RECENT/, "History does not imply shooter continuity that is not established");
assert.doesNotMatch(runtime, /Chronological preserved target sessions · shooter continuity identity not established/i, "internal continuity state is not exposed to the shooter");
assert.match(runtime, /usmMetricButton\("total-taps", "TOTAL TAPS", point\.totalTaps/, "selected-session accounting exposes authoritative total taps instead of retired general Hit Rate");
assert.match(runtime, /point\.score\)\} points ÷ \$\{escapeHtml\(point\.totalTaps\)\} taps/, "selected-session Points per Tap uses shooter-facing arithmetic language");
assert.doesNotMatch(runtime, /suffix: "Actual governed target score"|suffix: "Governed score ÷ total taps"/, "chart captions contain no machine-language governance terminology");
assert.match(runtime, /function targetHistorySeries[\s\S]*?point\.targetId === clean\(targetId\)\)/, "Hit Rate history accepts valid same-target sessions across differing tap counts");
assert.match(usmRegistry, /governed-additive-numeric-region-scoring/, "USM enrollment is owned by the governed additive-scoring capability");
assert.doesNotMatch(usmRegistry, /gunfun_22200_b27e_black|qt_printer13_product_/, "USM enrollment contains no target-ID or printer-prefix gate");
assert.match(runtime, /SCZN3USMProofRegistry\?\.isEligible/, "shared USM machinery consumes proof eligibility without target-specific runtime wiring");
assert.doesNotMatch(runtime, /gunfun_22200_b27e_black/, "the shared execution road remains target-data-driven");
assert.match(runtime, /const backendPointsPerTap = canonicalPointsPerTap\(result\)/, "History consumes Backend-authoritative Points Per Tap");
assert.match(runtime, /point\.pointsPerTap\.toFixed\(2\)/, "Points Per Tap presents with the approved two-decimal precision");
assert.doesNotMatch(runtime, /data-history-score-tap-count/, "the current session tap count cannot govern History availability or score-cohort selection");
assert.match(runtime, /function usmHistorySeries[\s\S]*?targetHistorySeries\(sessions, targetId\)\.filter\(point => point\.historyKind === "objectCoverage" \|\| isUsmEligible\(point\)\)/, "History admits only capability-eligible PPT or governed object-coverage records");
assert.match(runtime, /data-history-chart-scroll/, "History exposes a swipeable complete chart viewport");
assert.match(targetCss, /\.contract-progression-chart\{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*width:100%/, "History charts give the complete row width to the timeline");
assert.doesNotMatch(targetCss, /\.contract-usm-drawer \.contract-progression-chart\{[^}]*grid-template-columns:(?:112px|72px)/, "B27E History has no fixed left metric gutter");
assert.match(targetCss, /\.contract-usm-history-surface \.contract-progression-chart h3\{[^}]*right:0;left:0[^}]*text-align:center/, "metric titles are compact and centered inside each History chart");
assert.match(targetCss, /\.contract-usm-drawer>summary\{[^}]*grid-template-columns:minmax\(0,1fr\) auto 22px;grid-template-rows:1fr/, "desktop History identity, details label, and arrow remain one compact horizontal row");
assert.match(targetCss, /@media\(max-width:760px\)[\s\S]*?\.contract-usm-drawer>summary\{grid-template-columns:minmax\(0,1fr\) auto 22px;grid-template-rows:1fr/, "mobile History identity, details label, and arrow remain one compact horizontal row");
assert.doesNotMatch(runtime, /contract-usm-distribution-control/, "History contains no duplicate scoring-distribution control");
assert.match(runtime, /target\.scrollLeft = source\.scrollLeft/, "all three USM charts synchronize their chronological scroll position");
assert.match(runtime, /data-usm-session-id/, "all three charts expose the same selectable preserved-session identity");
assert.match(runtime, /node\.classList\.toggle\("is-selected", selected\)/, "one selected session is painted across every chart");
assert.match(runtime, /<strong>\$\{escapeHtml\(point\.sessionLabel\.toUpperCase\(\)\)\}<\/strong>/, "selected-session detail names the chosen preserved session");
assert.match(runtime, /SCZN3SECReopenAuthority\?\.provePossession[\s\S]*?provePossession\(endpoint, sourceSession\)/, "selected History sessions recover existing exact-reopen custody from their preserved artifacts");
assert.match(runtime, /OPEN \$\{escapeHtml\(point\.sessionLabel\.toUpperCase\(\)\)\} SEC →/, "selected-session detail offers exact SEC access");
assert.match(runtime, /target: clean\(point && point\.targetId\)[\s\S]*?missionFamily: clean\(point && point\.missionFamily\)[\s\S]*?source: "registered"[\s\S]*?session: clean\(point && point\.sessionId\)[\s\S]*?view: "sec"/, "History exact-SEC links retain registered target identity and mission context");
assert.match(runtime, /data-usm-exact-reopen/, "History exact-SEC actions use the canonical navigation adapter");
assert.match(runtime, /destination === global\.location\.href[\s\S]*?global\.location\.reload\(\)[\s\S]*?global\.location\.assign\(destination\)/, "History exact-SEC action performs a real reopen even when the selected session is already represented by the current URL");
const progressionDrawerSource = runtime.match(/function usmDrawerMarkup[\s\S]*?\n  async function hydrateProgression/)?.[0] || "";
assert.doesNotMatch(progressionDrawerSource, /improving|grade|coaching/i, "Drawer 3 makes no invented trend, grade, or coaching claim");
assert.match(targetCss, /cursor:pointer/, "the entire native summary row advertises pointer interaction");
assert.match(targetCss, /contract-disclosure-instruction[^}]*white-space:nowrap/, "the mobile disclosure instruction cannot wrap or clip");
assert.match(targetCss, /grid-template-columns:minmax\(0,\.88fr\) minmax\(0,1\.12fr\)/, "mobile SEC keeps target and essential result side by side");
assert.match(targetCss, /\.contract-lifecycle-actions \.sec-preservation-actions\{flex-wrap:wrap;overflow-x:visible\}/, "mobile SEC actions wrap instead of clipping or scrolling");
assert.match(vaultCss, /figure:first-child \.vault-target-panel\{height:auto;aspect-ratio:3\/4\}/, "mobile Vault gives the BEFORE target portrait-scale visual weight");
assert.match(vaultCss, /\.vault-approved-result-panel \.contract-numeric-region-results>summary/, "mobile Vault retains the scoring-distribution disclosure");
assert.match(records, /const sessions = savedSessions;/, "Vault renders every preserved session in newest-first order");
assert.doesNotMatch(records, /savedSessions\.slice\(0,\s*10\)/, "Vault does not discard older sessions outside an initial presentation window");

console.log("PASS canonical RESULT → SEC → Vault → exact-reopen ownership");
