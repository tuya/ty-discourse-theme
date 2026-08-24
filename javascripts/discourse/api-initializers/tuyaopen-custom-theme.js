import { withPluginApi } from "discourse/lib/plugin-api";

const NAV_CONTAINER_ID = "tuyaopen-header-nav";
const BANNER_ID = "tuyaopen-welcome-banner";

function parseNavLinks() {
  try {
    const links = JSON.parse(settings.custom_nav_links);
    return Array.isArray(links) ? links : [];
  } catch {
    return [];
  }
}

function isActive(link, path) {
  if (link.active_paths && link.active_paths.length) {
    return link.active_paths.some(
      (prefix) =>
        prefix === "/" ? path === "/" : path.indexOf(prefix) === 0
    );
  }
  if (link.url) {
    if (link.url === "/") {
      return path === "/";
    }
    try {
      const url = new URL(link.url, window.location.origin);
      return (
        url.origin === window.location.origin && path.indexOf(url.pathname) === 0
      );
    } catch {
      return false;
    }
  }
  return false;
}

function renderNav(container, path) {
  container.innerHTML = "";
  parseNavLinks().forEach((link) => {
    const a = document.createElement("a");
    a.className = "tuyaopen-nav-link";
    a.href = link.url;
    a.textContent = link.label;
    if (link.target) {
      a.target = link.target;
      a.rel = "noopener noreferrer";
    }
    if (link.active || isActive(link, path)) {
      a.classList.add("active");
    }
    container.appendChild(a);
  });
}

function injectHeaderNav() {
  const header = document.querySelector(".d-header");
  if (!header) {
    return;
  }

  let container = document.getElementById(NAV_CONTAINER_ID);
  if (!container) {
    container = document.createElement("nav");
    container.id = NAV_CONTAINER_ID;
    // Sit between the logo/title and the header buttons (login/search)
    const anchor =
      header.querySelector(".panel, .header-buttons") ||
      header.querySelector(".title") ||
      header.firstElementChild;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(container, anchor);
    } else {
      header.appendChild(container);
    }
    renderNav(container, window.location.pathname);
  }

  // Re-sync the active link on client-side transitions (Ember re-renders
  // may also drop our node; the observer below re-injects in that case).
  renderNav(container, window.location.pathname);

  if (!header.dataset.tuyaopenNavObserved) {
    header.dataset.tuyaopenNavObserved = "true";
    const observer = new MutationObserver(() => {
      if (!document.getElementById(NAV_CONTAINER_ID)) {
        injectHeaderNav();
      }
    });
    observer.observe(header, { childList: true, subtree: true });
  }
}

function ensureWelcomeBanner() {
  const listContainer = document.querySelector(".navigation-topics .container.list-container");
  if (!listContainer) {
    return;
  }
  if (document.getElementById(BANNER_ID)) {
    return;
  }

  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.className = "tuyaopen-welcome-banner";

  const title = document.createElement("h1");
  title.textContent = settings.welcome_banner_title;
  banner.appendChild(title);

  if (settings.welcome_banner_search_enabled) {
    const form = document.createElement("form");
    form.className = "tuyaopen-banner-search";
    form.setAttribute("role", "search");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search the forum…";
    input.autocomplete = "off";

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "btn btn-primary";
    button.textContent = "Search";

    form.append(input, button);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const term = input.value.trim();
      window.location.href = `/search?q=${encodeURIComponent(term)}`;
    });
    banner.appendChild(form);
  }

  listContainer.parentNode.insertBefore(banner, listContainer);
}

export default {
  name: "tuyaopen-custom-theme",
  initialize() {
    withPluginApi("1.18.0", (api) => {
      document.body.classList.toggle(
        "hide-stock-header-icons",
        settings.hide_header_icons
      );

      const refresh = () => {
        injectHeaderNav();
        if (settings.welcome_banner_enabled) {
          ensureWelcomeBanner();
        }
      };

      api.onPageChange(refresh);
      refresh();
    });
  },
};
