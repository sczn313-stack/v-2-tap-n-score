(function (root, factory) {
  "use strict";
  const api = factory(root && root.document, root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SCZN3Navigation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (document, window) {
  "use strict";

  const DESKTOP_DESTINATIONS = [
    { page: "index.html", label: "Home" },
    { page: "matrix.html?view=library", label: "Equipment" },
    { page: "index.html#targetExperiences", label: "Smart Targets" },
    { page: "records.html", label: "History", preserve: true }
  ];

  function applicationRoot() {
    const homeLink = document && document.querySelector('a[href$="index.html"]');
    const homeHref = homeLink && homeLink.getAttribute("href");
    return new URL(homeHref || "index.html", window.location.href);
  }

  function appendUniversalDestinations(container, rootUrl) {
    DESKTOP_DESTINATIONS.forEach(item => {
      const link = document.createElement("a");
      link.href = new URL(item.page, rootUrl).href;
      link.textContent = item.label;
      if (item.preserve) link.setAttribute("data-preserve-active-session", "");
      container.append(link);
    });
  }

  function installUniversalMenuDestinations(rootUrl) {
    document.querySelectorAll("details.mobile-platform-menu").forEach(details => {
      details.querySelectorAll(":scope > a").forEach(link => link.remove());
      appendUniversalDestinations(details, rootUrl);
    });
    document.querySelectorAll("button.package-menu[aria-controls]").forEach(button => {
      const drawer = document.getElementById(button.getAttribute("aria-controls"));
      if (!drawer) return;
      drawer.replaceChildren();
      appendUniversalDestinations(drawer, rootUrl);
    });
  }

  function installDesktopNavigation() {
    if (!document || document.querySelector(".platform-quick-nav")) return;
    const existing = document.querySelector(".locked-nav");
    const menuControl = document.querySelector("button.package-menu") || document.querySelector("details.mobile-platform-menu");
    if (!existing && (!menuControl || !menuControl.parentNode)) return;
    const rootUrl = applicationRoot();
    const nav = existing || document.createElement("nav");
    nav.classList.add("platform-quick-nav");
    nav.setAttribute("aria-label", "Quick navigation");
    nav.replaceChildren();
    appendUniversalDestinations(nav, rootUrl);
    if (!existing) menuControl.parentNode.insertBefore(nav, menuControl);
  }

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
    const rootUrl = applicationRoot();
    installUniversalMenuDestinations(rootUrl);
    installDesktopNavigation();
    const menus = platformMenus();

    function activeSession() {
      const state = window.SCZN3M4;
      if (!state || !state.read || !state.KEYS) return null;
      return state.read(state.KEYS.activeSession, null);
    }

    function sessionHasRecordedProgress(session) {
      if (!session || session.savedToSEC === true) return false;
      return !!(
        session.targetEvidenceImage
        || session.aimPoint
        || Array.isArray(session.impactPoints) && session.impactPoints.length
        || Array.isArray(session.confirmationImpactPoints) && session.confirmationImpactPoints.length
        || session.backendAuthorityPackage
        || session.authorityPackage
        || session.m4AuthorityPackage
        || session.trainingManualResult
      );
    }

    function workspaceHasUnsavedProgress() {
      const resolver = window.SCZN3WorkspaceNavigationState
        && window.SCZN3WorkspaceNavigationState.hasUnsavedProgress;
      if (typeof resolver === "function") {
        try {
          return resolver() === true;
        } catch (error) {}
      }
      const session = activeSession();
      if (!session || !sessionHasRecordedProgress(session)) return false;
      const completed = window.SCZN3ZeroingPlatform
        ? window.SCZN3ZeroingPlatform.isCompletedSession(session)
        : session.savedToSEC === true && session.workflowStage === "preservation";
      return !completed;
    }

    let pendingDestination = "";
    let previouslyFocusedElement = null;
    const leaveDialog = document.createElement("div");
    leaveDialog.className = "navigation-leave-dialog";
    leaveDialog.hidden = true;
    leaveDialog.setAttribute("role", "dialog");
    leaveDialog.setAttribute("aria-modal", "true");
    leaveDialog.setAttribute("aria-labelledby", "navigationLeaveDialogTitle");
    leaveDialog.setAttribute("aria-describedby", "navigationLeaveDialogMessage");
    leaveDialog.innerHTML = `
      <section class="navigation-leave-dialog-card">
        <h2 id="navigationLeaveDialogTitle">Leave Current Session?</h2>
        <p id="navigationLeaveDialogMessage">You have an unsaved shooting session.</p>
        <p>Leaving this page will discard any unsaved shots and results.</p>
        <div class="navigation-leave-dialog-actions">
          <button class="button secondary" type="button" data-navigation-stay>Stay Here</button>
          <button class="button" type="button" data-navigation-leave>Leave Session</button>
        </div>
      </section>
    `;
    document.body.append(leaveDialog);
    const stayButton = leaveDialog.querySelector("[data-navigation-stay]");
    const leaveButton = leaveDialog.querySelector("[data-navigation-leave]");

    function closeLeaveDialog() {
      leaveDialog.hidden = true;
      document.body.classList.remove("navigation-leave-dialog-open");
      pendingDestination = "";
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === "function") {
        previouslyFocusedElement.focus();
      }
      previouslyFocusedElement = null;
    }

    function openLeaveDialog(destination) {
      pendingDestination = destination;
      previouslyFocusedElement = document.activeElement;
      leaveDialog.hidden = false;
      document.body.classList.add("navigation-leave-dialog-open");
      stayButton.focus();
    }

    stayButton.addEventListener("click", closeLeaveDialog);
    leaveButton.addEventListener("click", () => {
      const destination = pendingDestination;
      leaveDialog.hidden = true;
      document.body.classList.remove("navigation-leave-dialog-open");
      pendingDestination = "";
      if (destination) window.location.assign(destination);
    });
    leaveDialog.addEventListener("click", event => {
      if (event.target === leaveDialog) closeLeaveDialog();
    });

    function protectActiveWorkspace(event) {
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("data-allow-mission-exit")) return;
      if (link.hasAttribute("data-preserve-active-session")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname.endsWith("/shoot.html")) return;
      const replacesOrDiscardsSession = document.body.classList.contains("target-page")
        || link.hasAttribute("data-replaces-active-session");
      if (!replacesOrDiscardsSession) return;
      if (!workspaceHasUnsavedProgress()) return;
      event.preventDefault();
      event.stopPropagation();
      closeAll();
      openLeaveDialog(destination.href);
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
      if (event.key === "Escape" && !leaveDialog.hidden) {
        event.preventDefault();
        closeLeaveDialog();
        return;
      }
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
