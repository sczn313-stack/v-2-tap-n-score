(function (root, factory) {
  "use strict";
  const api = factory(root && root.document, root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SCZN3Navigation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (document, window) {
  "use strict";

  function platformMenus() {
    if (!document) return [];
    const menus = [];
    document.querySelectorAll("details.mobile-platform-menu").forEach(details => {
      menus.push({
        root: details,
        close() { details.open = false; },
        contains(target) { return details.contains(target); },
        isOpen() { return details.open; }
      });
    });
    document.querySelectorAll("button.package-menu[aria-controls]").forEach(button => {
      const drawer = document.getElementById(button.getAttribute("aria-controls"));
      if (!drawer) return;
      menus.push({
        root: drawer,
        button,
        close() {
          button.setAttribute("aria-expanded", "false");
          drawer.hidden = true;
          document.body.classList.remove("package-menu-open");
        },
        contains(target) { return drawer.contains(target) || button.contains(target); },
        isOpen() { return button.getAttribute("aria-expanded") === "true" && !drawer.hidden; }
      });
    });
    return menus;
  }

  function install() {
    if (!document || !window || document.documentElement.dataset.sczn3NavigationReady === "true") return;
    document.documentElement.dataset.sczn3NavigationReady = "true";
    const menus = platformMenus();

    function closeAll(except = null) {
      menus.forEach(menu => {
        if (menu !== except) menu.close();
      });
    }

    menus.forEach(menu => {
      if (menu.button) {
        menu.button.addEventListener("click", event => {
          event.stopPropagation();
          const willOpen = !menu.isOpen();
          closeAll(menu);
          menu.button.setAttribute("aria-expanded", String(willOpen));
          menu.root.hidden = !willOpen;
          document.body.classList.toggle("package-menu-open", willOpen);
        });
      } else {
        menu.root.addEventListener("toggle", () => {
          if (menu.isOpen()) closeAll(menu);
        });
      }
      menu.root.addEventListener("click", event => {
        if (event.target.closest("a,button")) menu.close();
      });
    });

    document.addEventListener("pointerdown", event => {
      if (menus.some(menu => menu.isOpen() && menu.contains(event.target))) return;
      closeAll();
    }, true);
    document.addEventListener("keydown", event => {
      if (["Escape", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End", " "].includes(event.key)) closeAll();
    });
    document.addEventListener("wheel", () => closeAll(), { passive: true });
    document.addEventListener("touchmove", () => closeAll(), { passive: true });
    window.addEventListener("pagehide", () => closeAll());
    window.addEventListener("pageshow", () => closeAll());
    closeAll();
  }

  if (document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
  }

  return { install, platformMenus };
});
