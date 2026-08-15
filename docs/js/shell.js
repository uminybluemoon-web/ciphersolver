(() => {
  const nav = document.getElementById("site-tabs");
  const frame = document.getElementById("tool-frame");
  const tabs = window.SITE_TABS || [];

  function currentId() {
    const hash = (location.hash || "").replace(/^#/, "").split("/")[0];
    if (tabs.some((t) => t.id === hash)) return hash;
    return tabs[0] ? tabs[0].id : "";
  }

  function renderNav(active) {
    nav.innerHTML = "";
    tabs.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "site-tab" + (t.id === active ? " is-active" : "");
      b.textContent = t.title;
      b.addEventListener("click", () => {
        location.hash = t.id;
      });
      nav.appendChild(b);
    });
  }

  function show(id) {
    const tab = tabs.find((t) => t.id === id) || tabs[0];
    if (!tab) return;
    renderNav(tab.id);
    if (frame.getAttribute("data-id") !== tab.id) {
      frame.setAttribute("data-id", tab.id);
      frame.src = tab.file;
    }
    document.title = tab.title + " · ツール箱";
  }

  window.addEventListener("hashchange", () => show(currentId()));
  show(currentId());
})();
