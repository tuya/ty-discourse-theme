import { withPluginApi } from "discourse/lib/plugin-api";

const NAV_CONTAINER_ID = "tuyaopen-header-nav";
const BANNER_ID = "tuyaopen-welcome-banner";
const GITHUB_LINK_ID = "tuyaopen-github-link";

const GITHUB_MARK_SVG =
  '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';

function parseNavLinks() {
  try {
    const links = JSON.parse(settings.custom_nav_links);
    return Array.isArray(links) ? links : [];
  } catch {
    return [];
  }
}

function currentLocale() {
  return (document.documentElement.getAttribute("lang") || "en")
    .toLowerCase()
    .replace("-", "_");
}

// Picks the best text for the current locale from a plain string or a
// localized object like {"en": "Products", "zh": "产品"}
function pickLocalized(value) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const locale = currentLocale();
    const base = locale.split("_")[0];
    const keys = Object.keys(value);
    const match =
      value[locale] ||
      value[base] ||
      keys.find((k) => k.split("_")[0] === base) ||
      "en";
    return value[match] !== undefined ? value[match] : value[keys[0]];
  }
  return "";
}

// Settings holding localized text: plain string, or JSON object per locale
function localizedSetting(raw) {
  if (typeof raw !== "string") {
    return pickLocalized(raw);
  }
  const trimmed = raw.trim();
  if (trimmed.indexOf("{") === 0) {
    try {
      return pickLocalized(JSON.parse(trimmed));
    } catch {
      return raw;
    }
  }
  return raw;
}

function resolveUrl(url) {
  if (!url) {
    return "#";
  }
  // Relative paths go to the tuyaopen.ai site matching the visitor locale
  if (url.indexOf("/") === 0 && url.indexOf("//") !== 0) {
    const base = currentLocale().indexOf("zh") === 0
      ? "https://tuyaopen.ai/zh"
      : "https://tuyaopen.ai";
    return `${base}${url}`;
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
  text.textContent = pickLocalized(link.label);
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
        label.textContent = pickLocalized(item.label);
        a.appendChild(label);

        if (item.description) {
          const desc = document.createElement("span");
          desc.className = "tuyaopen-dropdown-desc";
          desc.textContent = pickLocalized(item.description);
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
        if (!document.getElementById(GITHUB_LINK_ID)) {
          injectGitHubLink();
        }
        // Re-apply logo/link if Ember re-rendered the title area
        applyHeaderLogo();
      });
      observer.observe(header, { childList: true, subtree: true });
    }
  }

  // Re-sync on client-side transitions (Ember re-renders the header)
  renderNav(container, window.location.pathname);
}

function applyHeaderLogo() {
  const logo = document.getElementById("site-logo");
  if (logo && settings.header_logo_url && logo.src !== settings.header_logo_url) {
    logo.src = settings.header_logo_url;
  }

  // Logo click jumps to the main site (tuyaopen.ai) instead of forum home
  const titleLink = document.querySelector(".d-header .title a");
  if (
    titleLink &&
    settings.header_logo_link &&
    titleLink.getAttribute("href") !== settings.header_logo_link
  ) {
    titleLink.setAttribute("href", settings.header_logo_link);
  }
}

function injectGitHubLink() {
  if (!settings.github_repo_url) {
    return;
  }
  const header = document.querySelector(".d-header");
  if (!header || document.getElementById(GITHUB_LINK_ID)) {
    return;
  }

  const link = document.createElement("a");
  link.id = GITHUB_LINK_ID;
  link.className = "tuyaopen-github-link";
  link.href = settings.github_repo_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "GitHub");
  link.setAttribute("title", "GitHub");
  link.innerHTML = GITHUB_MARK_SVG;

  // Right side of the navbar, just before the login/signup buttons
  const anchor =
    header.querySelector(".header-buttons") ||
    header.querySelector(".panel") ||
    null;
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(link, anchor);
  } else {
    header.appendChild(link);
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
  title.textContent = localizedSetting(settings.welcome_banner_title);
  banner.appendChild(title);

  if (settings.welcome_banner_search_enabled) {
    const form = document.createElement("form");
    form.className = "tuyaopen-banner-search";
    form.setAttribute("role", "search");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = localizedSetting(
      settings.welcome_banner_search_placeholder
    );
    input.autocomplete = "off";

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "btn btn-primary";
    button.textContent = localizedSetting(settings.welcome_banner_search_button);

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
        injectGitHubLink();
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
