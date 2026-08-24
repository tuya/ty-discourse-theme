# TuyaOpen Custom Theme

A Discourse **theme component** for [forum-tuyaopen.discourse.group](https://forum-tuyaopen.discourse.group/), modeled after [forum.d-robotics.cc](https://forum.d-robotics.cc/):

- **Custom menu bar** in the header (logo → nav links → login/signup), configurable via JSON in theme settings
- **Gradient welcome banner** with a built-in search box above the topic list (like the reference site)
- **Clean white header**, square category badges, plain-gray tags, pill-style nav (Latest/Top)
- **Brand accent color** (`#00B2E3` Tuya cyan by default) applied to links, active states and buttons — changeable in settings

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
5. Set your logo in **Admin → Customize → Themes → (your theme) → logo** (SVG/PNG recommended, ~155×37px renders well).

## Configure the custom menu bar

In **Admin → Customize → Themes → TuyaOpen Custom Theme → Settings**, edit **`custom_nav_links`** (JSON array):

```json
[
  { "label": "Home", "url": "https://developer.tuya.com/", "target": "_blank" },
  { "label": "Docs", "url": "https://developer.tuya.com/en/docs/iot", "target": "_blank" },
  { "label": "GitHub", "url": "https://github.com/tuya/tuyaopen", "target": "_blank" },
  {
    "label": "Forum",
    "url": "/",
    "active_paths": ["/", "/latest", "/top", "/categories"],
    "active": true
  }
]
```

Per-item fields:

| Field | Meaning |
|---|---|
| `label` | Visible link text |
| `url` | Absolute URL or forum path (`/`) |
| `target` | Optional, `_blank` to open in a new tab |
| `active` | Optional, force the highlighted state |
| `active_paths` | Optional array of path prefixes that mark the link active |

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
| `accent_color` | `#00B2E3` | Brand color for links, active nav, buttons |
| `banner_gradient_start` / `banner_gradient_end` | `#7FD9F5` / `#00B2E3` | Welcome banner gradient |
| `active_pill_color` | `#00B2E3` | Latest/Top active pill background |
| `welcome_banner_enabled` | `true` | Toggle the banner |
| `welcome_banner_title` | `Welcome to the TuyaOpen Forum!` | Banner heading |
| `welcome_banner_search_enabled` | `true` | Search box inside the banner |
| `custom_nav_links` | see above | Menu bar items |
| `hide_header_icons` | `true` | Hides stock search/hamburger icons (reference behavior) |

## Notes

- Solved/unsolved status pills on topics require the [discourse-solved](https://meta.discourse.org/t/solved/145293) plugin (available on Discourse hosting).
- If you want to **embed a topic list on an external site** (e.g. tuyaopen.com), see [Embed a list of Discourse topics onto an external site](https://meta.discourse.org/t/embed-a-list-of-discourse-topics-onto-an-external-site/293709) — that's a server-side feature (`embed topics`), independent of this theme.

## Local development

Use [discourse_theme_cli](https://meta.discourse.org/t/275958) to watch & sync this folder to a local Discourse instance:

```bash
gem install discourse_theme
discourse watch .
```
