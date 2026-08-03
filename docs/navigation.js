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

    function activeZeroingSession() {
      if (!document.body.classList.contains("target-page")) return null;
      const state = window.SCZN3M4;
      if (!state || !state.read || !state.KEYS) return null;
      return state.read(state.KEYS.activeSession, null);
    }

    function protectActiveWorkspace(event) {
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("data-allow-mission-exit")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname.endsWith("/shoot.html")) return;
      const session = activeZeroingSession();
      if (!session) return;
      const completed = window.SCZN3ZeroingPlatform
        ? window.SCZN3ZeroingPlatform.isCompletedSession(session)
        : session.savedToSEC === true && session.workflowStage === "preservation";
      if (completed) return;
      event.preventDefault();
      event.stopPropagation();
      const status = document.getElementById("saveSessionStatus") || document.getElementById("missionWorkspaceStatus");
      if (status) status.textContent = "Complete the zeroing mission before leaving the Workspace.";
    }

    document.addEventListener("click", protectActiveWorkspace, true);

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
