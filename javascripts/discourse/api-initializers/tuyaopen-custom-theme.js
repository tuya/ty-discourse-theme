import { withPluginApi } from "discourse/lib/plugin-api";

const NAV_CONTAINER_ID = "tuyaopen-header-nav";
const BANNER_ID = "tuyaopen-welcome-banner";
const GITHUB_LINK_ID = "tuyaopen-github-link";
const FOOTER_ID = "tuyaopen-footer";
const SCROLL_TOP_ID = "tuyaopen-scroll-top";
const IDE_PROMO_ID = "tuyaopen-ide-promo";

let scrollListenerRegistered = false;
let idePromoTimer = null;

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
  // Forum-relative paths ("forum:/latest") stay on this site — Discourse
  // intercepts same-origin clicks and navigates in place, no new tab
  if (url.indexOf("forum:") === 0) {
    const path = url.slice("forum:".length) || "/";
    return window.location.origin + (path.indexOf("/") === 0 ? path : `/${path}`);
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

  if (settings.hero_tagline) {
    const tagline = document.createElement("p");
    tagline.className = "tuyaopen-banner-tagline";
    tagline.textContent = localizedSetting(settings.hero_tagline);
    banner.appendChild(tagline);
  }

  const ctas = document.createElement("div");
  ctas.className = "tuyaopen-banner-ctas";

  const primaryCta = document.createElement("a");
  primaryCta.className = "tuyaopen-cta tuyaopen-cta-primary";
  primaryCta.href = resolveUrl(settings.hero_cta_url);
  primaryCta.textContent = localizedSetting(settings.hero_cta_text);
  ctas.appendChild(primaryCta);

  if (settings.github_repo_url) {
    const secondaryCta = document.createElement("a");
    secondaryCta.className = "tuyaopen-cta tuyaopen-cta-secondary";
    secondaryCta.href = settings.github_repo_url;
    secondaryCta.target = "_blank";
    secondaryCta.rel = "noopener noreferrer";
    secondaryCta.textContent = localizedSetting(settings.hero_cta_secondary_text);
    ctas.appendChild(secondaryCta);
  }
  banner.appendChild(ctas);

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

function injectIdePromo() {
  if (!settings.ide_promo_enabled) {
    return;
  }
  const listContainer = document.querySelector(
    ".navigation-topics .container.list-container"
  );
  if (!listContainer || document.getElementById(IDE_PROMO_ID)) {
    return;
  }

  const features = [
    {
      title: { en: "IDE Native", zh: "原生集成" },
      desc: {
        en: "First-class extensions for VS Code and Cursor — no separate apps, no extra windows.",
        zh: "VS Code 与 Cursor 一等公民扩展 — 无需独立应用，无需额外窗口。",
      },
    },
    {
      title: { en: "Pair With Any Coding Agent", zh: "对接任意编程智能体" },
      desc: {
        en: "Pair with Claude Code, Codex, or your own agent — hardware context flows straight in. Vibe-code your next device.",
        zh: "对接 Claude Code、Codex 或你自己的智能体 — 硬件上下文直接流入，Vibe 出你的下一台设备。",
      },
    },
    {
      title: { en: "Firmware, Cloud & App in One", zh: "固件、云与应用一体化" },
      desc: {
        en: "Unify device firmware, cloud AI agents, and app panels in a single workflow — from bring-up to production, fully automated.",
        zh: "在同一工作流中完成设备固件、云端 AI 智能体与应用面板开发 — 从点亮到量产，全程自动化。",
      },
    },
  ];

  const section = document.createElement("section");
  section.id = IDE_PROMO_ID;
  section.className = "tuyaopen-ide-promo";

  const inner = document.createElement("div");
  inner.className = "tuyaopen-ide-promo-inner";

  // Text column
  const text = document.createElement("div");
  text.className = "tuyaopen-ide-promo-text";

  const badge = document.createElement("span");
  badge.className = "tuyaopen-ide-badge";
  badge.textContent = localizedSetting(settings.ide_promo_badge);
  text.appendChild(badge);

  const title = document.createElement("h2");
  title.textContent = localizedSetting(settings.ide_promo_title);
  text.appendChild(title);

  const slogan = document.createElement("p");
  slogan.className = "tuyaopen-ide-slogan";
  slogan.textContent = localizedSetting(settings.ide_promo_slogan);
  text.appendChild(slogan);

  const desc = document.createElement("p");
  desc.className = "tuyaopen-ide-desc";
  desc.textContent = localizedSetting(settings.ide_promo_description);
  text.appendChild(desc);

  const featureList = document.createElement("ul");
  featureList.className = "tuyaopen-ide-features";
  features.forEach((feature) => {
    const li = document.createElement("li");
    const mark = document.createElement("span");
    mark.className = "tuyaopen-ide-check";
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML =
      '<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><path d="M4.7 9.3L1.4 6l1.1-1.1 2.2 2.2 4.9-4.9L10.7 3.3 4.7 9.3z"/></svg>';
    li.appendChild(mark);

    const content = document.createElement("div");
    const featureTitle = document.createElement("strong");
    featureTitle.textContent = pickLocalized(feature.title);
    const featureDesc = document.createElement("span");
    featureDesc.textContent = pickLocalized(feature.desc);
    content.append(featureTitle, featureDesc);
    li.appendChild(content);
    featureList.appendChild(li);
  });
  text.appendChild(featureList);

  const ctas = document.createElement("div");
  ctas.className = "tuyaopen-ide-ctas";

  const primary = document.createElement("a");
  primary.className = "tuyaopen-cta tuyaopen-cta-primary";
  primary.href = resolveUrl(settings.ide_promo_cta_url);
  primary.textContent = localizedSetting(settings.ide_promo_cta_text);
  ctas.appendChild(primary);

  if (settings.github_repo_url) {
    const secondary = document.createElement("a");
    secondary.className = "tuyaopen-cta tuyaopen-cta-secondary";
    secondary.href = settings.github_repo_url;
    secondary.target = "_blank";
    secondary.rel = "noopener noreferrer";
    secondary.textContent = localizedSetting(
      settings.ide_promo_secondary_text
    );
    ctas.appendChild(secondary);
  }
  text.appendChild(ctas);
  inner.appendChild(text);

  // Media column — rotating carousel when multiple images are configured
  const images = parsePromoImages();
  if (images.length) {
    const media = document.createElement("div");
    media.className = "tuyaopen-ide-promo-media";

    const stage = document.createElement("div");
    stage.className = "tuyaopen-ide-carousel";

    const alt = localizedSetting(settings.ide_promo_title);
    images.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      img.loading = index === 0 ? "eager" : "lazy";
      if (index === 0) {
        img.classList.add("is-active");
      }
      stage.appendChild(img);
    });
    media.appendChild(stage);

    if (images.length > 1) {
      const dots = document.createElement("div");
      dots.className = "tuyaopen-ide-carousel-dots";
      images.forEach((src, index) => {
        const dot = document.createElement("span");
        if (index === 0) {
          dot.classList.add("is-active");
        }
        dots.appendChild(dot);
      });
      media.appendChild(dots);
      startIdeCarousel(stage, dots, images.length);
    }

    inner.appendChild(media);
  }

  section.appendChild(inner);
  listContainer.insertAdjacentElement("afterend", section);
}

function parsePromoImages() {
  try {
    const parsed = JSON.parse(settings.ide_promo_images);
    if (Array.isArray(parsed)) {
      return parsed.filter((src) => typeof src === "string" && src.trim());
    }
  } catch {
    // fall through — tolerate a single URL pasted into the setting
  }
  const raw = (settings.ide_promo_images || "").trim();
  return raw ? [raw] : [];
}

function startIdeCarousel(stage, dots, count) {
  if (idePromoTimer) {
    clearInterval(idePromoTimer);
  }
  const interval = Math.max(1, Number(settings.ide_promo_interval) || 2) * 1000;
  let current = 0;

  // Pause while hovered so visitors can look at a slide
  let paused = false;
  stage.addEventListener("mouseenter", () => (paused = true));
  stage.addEventListener("mouseleave", () => (paused = false));

  idePromoTimer = setInterval(() => {
    if (paused || !stage.isConnected) {
      if (!stage.isConnected) {
        clearInterval(idePromoTimer);
        idePromoTimer = null;
      }
      return;
    }
    const slides = stage.children;
    const markers = dots.children;
    slides[current].classList.remove("is-active");
    if (markers[current]) {
      markers[current].classList.remove("is-active");
    }
    current = (current + 1) % count;
    slides[current].classList.add("is-active");
    if (markers[current]) {
      markers[current].classList.add("is-active");
    }
  }, interval);
}

function injectFooter() {
  if (!settings.footer_enabled) {
    return;
  }
  const anchor = document.querySelector("#d-footer");
  if (!anchor || document.getElementById(FOOTER_ID)) {
    return;
  }

  const exploreTitle = pickLocalized({ en: "Explore", zh: "探索" });
  const resourcesTitle = pickLocalized({ en: "Resources", zh: "资源" });
  const resources = [
    { label: { en: "Documentation", zh: "开发文档" }, url: "/docs" },
    { label: { en: "GitHub", zh: "GitHub" }, url: settings.github_repo_url, target: "_blank" },
    { label: { en: "Community", zh: "社区论坛" }, url: "/" },
  ].filter((item) => item.url);

  const footer = document.createElement("div");
  footer.id = FOOTER_ID;
  footer.className = "tuyaopen-footer";

  const inner = document.createElement("div");
  inner.className = "tuyaopen-footer-inner";

  // Brand column
  const brand = document.createElement("div");
  brand.className = "tuyaopen-footer-brand";

  const wordmark = document.createElement("div");
  wordmark.className = "tuyaopen-footer-wordmark";
  wordmark.textContent = "TuyaOpen";
  brand.appendChild(wordmark);

  if (settings.footer_tagline) {
    const tagline = document.createElement("p");
    tagline.className = "tuyaopen-footer-tagline";
    tagline.textContent = localizedSetting(settings.footer_tagline);
    brand.appendChild(tagline);
  }

  if (settings.github_repo_url) {
    const gh = document.createElement("a");
    gh.className = "tuyaopen-footer-github";
    gh.href = settings.github_repo_url;
    gh.target = "_blank";
    gh.rel = "noopener noreferrer";
    gh.setAttribute("aria-label", "GitHub");
    gh.innerHTML = GITHUB_MARK_SVG;
    brand.appendChild(gh);
  }
  inner.appendChild(brand);

  // Explore column — built from the top-level navbar items
  const explore = document.createElement("div");
  explore.className = "tuyaopen-footer-col";
  const exploreHeading = document.createElement("h3");
  exploreHeading.textContent = exploreTitle;
  explore.appendChild(exploreHeading);
  parseNavLinks()
    .filter((link) => link.url || (link.items && link.items.length))
    .forEach((link) => {
      const a = document.createElement("a");
      a.href = link.url ? resolveUrl(link.url) : resolveUrl(link.items[0].url);
      a.textContent = pickLocalized(link.label);
      if (link.target) {
        a.target = link.target;
        a.rel = "noopener noreferrer";
      }
      explore.appendChild(a);
    });
  inner.appendChild(explore);

  // Resources column
  const res = document.createElement("div");
  res.className = "tuyaopen-footer-col";
  const resHeading = document.createElement("h3");
  resHeading.textContent = resourcesTitle;
  res.appendChild(resHeading);
  resources.forEach((item) => {
    const a = document.createElement("a");
    a.href = resolveUrl(item.url);
    a.textContent = pickLocalized(item.label);
    if (item.target) {
      a.target = item.target;
      a.rel = "noopener noreferrer";
    }
    res.appendChild(a);
  });
  inner.appendChild(res);

  footer.appendChild(inner);

  const bottom = document.createElement("div");
  bottom.className = "tuyaopen-footer-bottom";
  bottom.textContent = localizedSetting(settings.footer_copyright).replace(
    "{year}",
    String(new Date().getFullYear())
  );
  footer.appendChild(bottom);

  anchor.parentNode.insertBefore(footer, anchor);
}

function injectScrollTopButton() {
  if (document.getElementById(SCROLL_TOP_ID)) {
    return;
  }
  const button = document.createElement("button");
  button.id = SCROLL_TOP_ID;
  button.className = "tuyaopen-scroll-top";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 2.5l5.5 5.5-1.06 1.06L8.5 5.12V13.5h-1V5.12L3.56 9.06 2.5 8 8 2.5z"/></svg>';
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(button);
}

function registerScrollBehaviors() {
  if (scrollListenerRegistered) {
    return;
  }
  scrollListenerRegistered = true;
  const onScroll = () => {
    const header = document.querySelector(".d-header");
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 8);
    }
    const scrollTop = document.getElementById(SCROLL_TOP_ID);
    if (scrollTop) {
      scrollTop.classList.toggle("visible", window.scrollY > 600);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
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
        injectIdePromo();
        injectFooter();
        injectScrollTopButton();
        registerScrollBehaviors();
      };

      api.onPageChange(refresh);
      refresh();
    });
  },
};
