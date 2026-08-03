(() => {
  const menuButton = document.querySelector(".package-menu");
  const menu = document.getElementById("packageMenu");
  if (!menuButton || !menu) return;

  function setMenu(open) {
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuButton.addEventListener("click", () => {
    setMenu(menu.hidden);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !menu.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });
})();
