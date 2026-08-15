const assert = require("assert");
const fs = require("fs");
const path = require("path");

const docs = path.resolve(__dirname, "..");
const navigation = fs.readFileSync(path.join(docs, "navigation.js"), "utf8");
const pages = ["index.html", "matrix.html", "shoot.html", "sec.html", "records.html", "analytics.html", "buy-targets.html"];

pages.forEach(page => {
  const html = fs.readFileSync(path.join(docs, page), "utf8");
  assert(/<script src="navigation\.js(?:\?[^\"]+)?" defer><\/script>/.test(html), `${page} loads shared navigation behavior`);
  assert(!html.includes('querySelectorAll(".mobile-platform-menu").forEach'), `${page} has no page-specific details-menu controller`);
});

const primaryApplicationPages = ["index.html", "matrix.html", "shoot.html", "sec.html", "records.html"];
primaryApplicationPages.forEach(page => {
  const html = fs.readFileSync(path.join(docs, page), "utf8");
  assert(html.includes("universal-app-header"), `${page} uses the governed application header placement`);
});

const universalUi = fs.readFileSync(path.join(docs, "universal-ui.css"), "utf8");
assert(universalUi.includes(".universal-app-header > .package-menu"), "button hamburgers use the universal top-header position");
assert(universalUi.includes(".universal-header-menu"), "details hamburgers use the same universal top-header position");
assert(universalUi.includes("right:12px"), "the hamburger has one governed right-edge placement");

const survey = fs.readFileSync(path.join(docs, "survey.html"), "utf8");
assert(!survey.includes("mobile-platform-menu") && !survey.includes("package-menu"), "survey has no hamburger state to govern");

assert(navigation.includes('event.target.closest("a,button")'), "selecting any menu item closes its menu");
assert(navigation.includes("sessionHasRecordedProgress"), "the shared guard recognizes recorded unsaved work on every page");
assert(navigation.includes("session.targetEvidenceImage"), "unsaved target evidence is protected before any marks are entered");
assert(navigation.includes("session.savedToSEC === true"), "saved sessions navigate without an alert");
assert(navigation.includes("openLeaveDialog(destination.href)"), "unsaved navigation always opens the Stay/Leave alert");
assert(navigation.includes("Stay Here") && navigation.includes("Leave Session"), "the alert provides both governed choices");
assert(navigation.includes("data-preserve-active-session"), "read-only historical navigation preserves the active session without warning");
assert(navigation.includes("data-replaces-active-session"), "non-workspace warnings require an explicit active-session replacement contract");
assert(navigation.includes('document.addEventListener("pointerdown"'), "outside pointer interaction closes menus");
assert(navigation.includes('document.addEventListener("wheel"'), "desktop scrolling cannot leave an orphaned menu");
assert(navigation.includes('document.addEventListener("touchmove"'), "touch scrolling cannot leave an orphaned menu");
assert(navigation.includes('"PageDown"') && navigation.includes('"ArrowDown"'), "keyboard scrolling cannot leave an orphaned menu");
assert(navigation.includes('window.addEventListener("pagehide"'), "navigation closes menu state");
assert(navigation.includes('window.addEventListener("pageshow"'), "Back/forward restoration closes menu state");
assert(navigation.includes('"Escape"'), "desktop Escape closes menus");
assert(navigation.includes('document.body.classList.remove("package-menu-open")'), "drawer body state is cleared");
assert(navigation.includes("closeAll();"), "menus initialize closed");
assert(!navigation.includes("localStorage") && !navigation.includes("sessionStorage"), "menu state is never persisted");
assert(navigation.includes('document.querySelector("details.mobile-platform-menu")'), "details-based headers inherit the same desktop quick navigation");
assert(navigation.includes("function applicationRoot()"), "nested target routes resolve universal destinations from the application root");

console.log("PASS shared hamburger navigation governance");
