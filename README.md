# TuyaOpen Custom Theme

A Discourse **theme component** for [forum-tuyaopen.discourse.group](https://forum-tuyaopen.discourse.group/), combining two references:

- **Navbar mirroring [tuyaopen.ai](https://tuyaopen.ai/)** — Products / Docs / Learn / Forums / Ecosystem / About Us with hover dropdowns (mega-menu for Products), the bundled TuyaOpen logo, a GitHub icon linking to the main repo, and the same navy accent (`#172D72`)
- **Bilingual out of the box (EN / 简体中文)** — menu labels, dropdown descriptions and banner texts switch automatically with the visitor's forum locale; Chinese visitors' menu links point at `tuyaopen.ai/zh/`
- **Polished forum body** — gradient welcome banner with built-in search, clean topic list, square category badges, pill navigation
- **Feature-complete page** — hero tagline + Get Started / GitHub CTAs, TuyaOpen IDE marketing section ("Vibe Coding your next Agentic Hardware") below the topic list, custom dark footer with link columns, scroll-to-top button, header shadow on scroll, animated nav underlines, hover/pinned topic rows, styled category boxes, branded text selection & empty states

Everything is configurable from **Admin → Customize → Themes → Settings** — no code edits needed.

## Repository layout

```
about.json                                   # theme component metadata
settings.yml                                 # editable settings (colors, banner, menu links)
locales/en.yml                               # setting labels/descriptions
common/common.scss                           # main styles (all devices)
desktop/desktop.scss                         # desktop-only tweaks
mobile/mobile.scss                           # mobile-only tweaks
javascripts/discourse/api-initializers/
  tuyaopen-custom-theme.js                   # injects menu bar + welcome banner
```

## Install on your hosted Discourse site

1. Push this folder to a Git repository (GitHub/GitLab).
2. On your forum, go to **Admin → Customize → Themes**.
3. Click **Install** → **From a remote git repository**, paste the repo URL, and install.
4. The component appears under "components" — click it and either:
   - add it to your active theme (e.g. Default) via **Add to theme**, or
   - enable it site-wide in **Admin → Settings → `default theme`** combined view.
5. The **TuyaOpen logo is bundled** (`header_logo_url` setting) — no manual upload required. Swap it for any image URL if desired.

## Configure the custom menu bar

The default `custom_nav_links` already replicates the tuyaopen.ai menu tree (Products mega-menu, Docs, Learn, Forums, Ecosystem, About Us). Edit it in **Admin → Customize → Themes → TuyaOpen Custom Theme → Settings** if needed.

Relative paths (e.g. `/docs/hardware`) resolve to **https://tuyaopen.ai**; forum pages use absolute URLs.

Per-item fields:

| Field | Meaning |
|---|---|
| `label` | Visible link text — a string, or localized object `{"en":"Products","zh":"产品"}` |
| `url` | Absolute URL, a path relative to tuyaopen.ai, or `forum:/...` to link to a page on this forum (in-page navigation, no new tab) |
| `target` | Optional, `_blank` to open in a new tab |
| `description` | Optional subtitle inside dropdowns (also localizable) |
| `items` | Optional array of dropdown children |
| `active` / `active_paths` | Force/prefix-match the highlighted state |

## Internationalization (EN / 中文)

The navbar and banner are bilingual via the visitor's forum locale (`<html lang>`):

- **Menu labels & descriptions**: each `label` / `description` in `custom_nav_links` may be a plain string or a JSON object keyed by locale, e.g. `{"en":"Docs","zh":"文档"}`. Unknown locales fall back to `en`.
- **Banner texts**: `welcome_banner_title`, `welcome_banner_search_placeholder` and `welcome_banner_search_button` accept either plain text or a per-locale JSON object, e.g. `{"en":"Search the forum…","zh":"搜索论坛…"}`.
- **Localized links**: relative menu URLs resolve to `https://tuyaopen.ai/...` for English visitors and `https://tuyaopen.ai/zh/...` for Chinese visitors.
- **Admin panel**: setting labels/descriptions are translated in `locales/en.yml` and `locales/zh_CN.yml`.

Example (simplified):

```json
[
  {
    "label": "Products",
    "url": "",
    "items": [
      {
        "label": "TuyaOpen SDK",
        "description": "Open-source full-stack AIoT OS",
        "url": "https://github.com/tuya/TuyaOpen",
        "target": "_blank"
      }
    ]
  },
  { "label": "Learn", "url": "/learn" },
  {
    "label": "Forums",
    "url": "forum:/",
    "active": true,
    "active_paths": ["/", "/latest", "/top", "/categories"]
  }
]
```

## Recommended site settings

The theme pairs best with a few native Discourse settings. On **Admin → Settings**:

| Setting | Value | Why |
|---|---|---|
| `default_sidebar` | `enabled` | Permanent left sidebar (Topics / Categories / Tags) |
| `sidebar_sections` | `categories,tags` | Populate sidebar with categories and tags |
| `topic_list_previews_enabled` | `enabled` | Topic excerpts under titles |
| `header_dropdown_category_count` | `10` | Category menu coverage |
| `suggested_topics` | as desired | Related topics under each topic |
| `login_required` | off | Show content to anonymous users |

If you don't want the sidebar, leave `default_sidebar` disabled — the theme still works fine without it.

## Settings reference

| Setting | Default | Effect |
|---|---|---|
| `accent_color` | `#172D72` | Brand color for links, active nav, buttons (tuyaopen.ai navy) |
| `header_logo_url` | tuyaopen.ai logo | Header logo image (bundled by default) |
| `header_logo_link` | `https://tuyaopen.ai/` | Logo click destination (use `/` to keep the forum home) |
| `github_repo_url` | `github.com/tuya/TuyaOpen` | GitHub icon in the header (opens in new tab; leave empty to hide) |
| `banner_gradient_start` / `banner_gradient_end` | `#10A6FA` / `#172D72` | Welcome banner gradient |
| `active_pill_color` | `#172D72` | Latest/Top active pill background |
| `welcome_banner_enabled` | `true` | Toggle the banner |
| `welcome_banner_title` | `Welcome to the TuyaOpen Forum!` | Banner heading |
| `welcome_banner_search_enabled` | `false` | Search box inside the banner (off — avoids redundancy with Discourse's greeting/search) |
| `hero_tagline` | localized JSON | Tagline under the banner title (empty to hide) |
| `hero_cta_text` / `hero_cta_url` | Get Started → docs | Primary CTA button in the banner |
| `hero_cta_secondary_text` | View on GitHub | Secondary CTA (links to `github_repo_url`) |
| `footer_enabled` | `true` | Show the custom dark footer above the Discourse footer |
| `footer_tagline` | localized JSON | Footer brand tagline |
| `footer_copyright` | localized JSON (`{year}` token) | Footer copyright line |
| `ide_promo_enabled` | `true` | TuyaOpen IDE marketing section under the topic list (Latest page) |
| `ide_promo_badge` / `ide_promo_title` / `ide_promo_slogan` | localized JSON | Promo badge, title and "Vibe Coding…" slogan |
| `ide_promo_description` | localized JSON | Promo description paragraph |
| `ide_promo_image` | tuyaopen.ai IDE asset | Promo image (empty to hide) |
| `ide_promo_cta_text` / `ide_promo_cta_url` | Install Extension → `/tuyaopen-ide` | Primary promo CTA |
| `ide_promo_secondary_text` | View on GitHub | Secondary promo CTA (links to `github_repo_url`) |
| `custom_nav_links` | see above | Menu bar items |
| `hide_header_icons` | `true` | Hides stock search/hamburger icons (like tuyaopen.ai) |

## Notes

- Solved/unsolved status pills on topics require the [discourse-solved](https://meta.discourse.org/t/solved/145293) plugin (available on Discourse hosting).
- If you want to **embed a topic list on an external site** (e.g. tuyaopen.com), see [Embed a list of Discourse topics onto an external site](https://meta.discourse.org/t/embed-a-list-of-discourse-topics-onto-an-external-site/293709) — that's a server-side feature (`embed topics`), independent of this theme.

## Local development

Use [discourse_theme_cli](https://meta.discourse.org/t/275958) to watch & sync this folder to a local Discourse instance:

```bash
gem install discourse_theme
discourse watch .
```
