const assert = require("assert");
const fs = require("fs");
const path = require("path");

const docs = path.resolve(__dirname, "..");
const navigation = fs.readFileSync(path.join(docs, "navigation.js"), "utf8");
const pages = ["index.html", "matrix.html", "shoot.html", "records.html", "analytics.html", "survey.html", "buy-targets.html"];

pages.forEach(page => {
  const html = fs.readFileSync(path.join(docs, page), "utf8");
  assert(html.includes('<script src="navigation.js" defer></script>'), `${page} loads shared navigation behavior`);
  assert(!html.includes('querySelectorAll(".mobile-platform-menu").forEach'), `${page} has no page-specific details-menu controller`);
});

assert(navigation.includes('event.target.closest("a,button")'), "selecting any menu item closes its menu");
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

console.log("PASS shared hamburger navigation governance");
