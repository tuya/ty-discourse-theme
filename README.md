# TuyaOpen Custom Theme

A Discourse **theme component** for [forum-tuyaopen.discourse.group](https://forum-tuyaopen.discourse.group/), combining two references:

- **Navbar mirroring [tuyaopen.ai](https://tuyaopen.ai/)** — Products / Docs / Learn / Forums / Ecosystem / About Us with hover dropdowns (mega-menu for Products), the bundled TuyaOpen logo, a GitHub icon linking to the main repo, and the same navy accent (`#172D72`)
- **Forum body modeled after [forum.d-robotics.cc](https://forum.d-robotics.cc/)** — gradient welcome banner with built-in search, clean topic list, square category badges, pill navigation

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
| `label` | Visible link text |
| `url` | Absolute URL, or a path relative to tuyaopen.ai |
| `target` | Optional, `_blank` to open in a new tab |
| `description` | Optional subtitle inside dropdowns |
| `items` | Optional array of dropdown children |
| `active` / `active_paths` | Force/prefix-match the highlighted state |

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
    "url": "https://forum-tuyaopen.discourse.group/",
    "target": "_blank",
    "active": true,
    "active_paths": ["/", "/latest", "/top", "/categories"]
  }
]
```

## Match the reference layout (recommended site settings)

The D-Robotics forum combines the theme component with native Discourse settings. On **Admin → Settings**:

| Setting | Value | Why |
|---|---|---|
| `default_sidebar` | `enabled` | Permanent left sidebar (Topics / Categories / Tags) |
| `sidebar_sections` | `categories,tags` | Populate sidebar with categories and tags |
| `topic_list_previews_enabled` | `enabled` | Topic excerpts under titles |
| `header_dropdown_category_count` | `10` | Category menu coverage |
| `suggested_topics` | as desired | Related topics under each topic |
| `login_required` | off | The reference forum shows content to anonymous users |

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
| `welcome_banner_search_enabled` | `true` | Search box inside the banner |
| `custom_nav_links` | see above | Menu bar items |
| `hide_header_icons` | `true` | Hides stock search/hamburger icons (reference behavior) |

## Notes

- Solved/unsolved status pills on topics require the [discourse-solved](https://meta.discourse.org/t/solved/145293) plugin (available on Discourse hosting).
- If you want to **embed a topic list on an external site** (e.g. tuyaopen.com), see [Embed a list of Discourse topics onto an external site](https://meta.discourse.org/t/embed-a-list-of-discourse-topics-onto-an-external-site/293709) — that's a server-side feature (`embed topics`), independent of this theme.
- Reference screenshots of tuyaopen.ai's navbar and forum.d-robotics.cc are stored in `reference/` for comparison.

## Local development

Use [discourse_theme_cli](https://meta.discourse.org/t/275958) to watch & sync this folder to a local Discourse instance:

```bash
gem install discourse_theme
discourse watch .
```
