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

function resolveUrl(url) {
  if (!url) {
    return "#";
  }
  // Relative tuyaopen.ai paths stay on the main site
  if (url.indexOf("/") === 0 && url.indexOf("//") !== 0) {
    return `https://tuyaopen.ai${url}`;
  }
  return url;
}

function isActive(link, path) {
  if (link.active_paths && link.active_paths.length) {
    return link.active_paths.some((prefix) =>
      prefix === "/" ? path === "/" : path.indexOf(prefix) === 0
    );
  }
  if (link.url) {
    if (link.url === "/") {
      return path === "/";
    }
    try {
      const url = new URL(resolveUrl(link.url), window.location.origin);
      return (
        url.origin === window.location.origin &&
        path.indexOf(url.pathname) === 0
      );
    } catch {
      return false;
    }
  }
  return false;
}

function buildLink(link, extraClass) {
  const a = document.createElement("a");
  a.className = extraClass || "tuyaopen-nav-link";
  a.href = resolveUrl(link.url);
  if (link.target) {
    a.target = link.target;
    a.rel = "noopener noreferrer";
  }

  const text = document.createElement("span");
  text.className = "tuyaopen-nav-link-text";
  text.textContent = link.label;
  a.appendChild(text);

  if (link.items && link.items.length) {
    const caret = document.createElement("span");
    caret.className = "tuyaopen-nav-caret";
    caret.innerHTML =
      '<svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true"><path d="M5 6L0 0h10L5 6z"/></svg>';
    a.appendChild(caret);
  }
  return a;
}

function renderNav(container, path) {
  container.innerHTML = "";
  parseNavLinks().forEach((link) => {
    if (link.items && link.items.length) {
      // Dropdown parent: label links to overview url (if any) or just expands
      const wrapper = document.createElement("div");
      wrapper.className = "tuyaopen-nav-item tuyaopen-nav-dropdown";

      const parent = buildLink(link);
      parent.classList.add("tuyaopen-nav-link");
      wrapper.appendChild(parent);

      const panel = document.createElement("div");
      panel.className = "tuyaopen-dropdown-panel";
      if (link.items.length > 6) {
        // Products-style mega menu gets a 2-column grid
        panel.classList.add("tuyaopen-dropdown-wide");
      }
      link.items.forEach((item) => {
        const a = document.createElement("a");
        a.className = "tuyaopen-dropdown-item";
        a.href = resolveUrl(item.url);
        if (item.target) {
          a.target = item.target;
          a.rel = "noopener noreferrer";
        }

        const label = document.createElement("span");
        label.className = "tuyaopen-dropdown-label";
        label.textContent = item.label;
        a.appendChild(label);

        if (item.description) {
          const desc = document.createElement("span");
          desc.className = "tuyaopen-dropdown-desc";
          desc.textContent = item.description;
          a.appendChild(desc);
        }
        panel.appendChild(a);
      });
      wrapper.appendChild(panel);

      if (isActive(link, path)) {
        parent.classList.add("active");
      }
      container.appendChild(wrapper);
    } else {
      const a = buildLink(link);
      if (link.active || isActive(link, path)) {
        a.classList.add("active");
      }
      container.appendChild(a);
    }
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

  // Re-sync on client-side transitions (Ember re-renders the header)
  renderNav(container, window.location.pathname);
}

function applyHeaderLogo() {
  const logo = document.getElementById("site-logo");
  if (!logo || !settings.header_logo_url) {
    return;
  }
  if (logo.src !== settings.header_logo_url) {
    logo.src = settings.header_logo_url;
  }
}

function ensureWelcomeBanner() {
  const listContainer = document.querySelector(
    ".navigation-topics .container.list-container"
  );
  if (!listContainer || document.getElementById(BANNER_ID)) {
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
        applyHeaderLogo();
        if (settings.welcome_banner_enabled) {
          ensureWelcomeBanner();
        }
      };

      api.onPageChange(refresh);
      refresh();
    });
  },
};
