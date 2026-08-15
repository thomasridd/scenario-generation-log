# Migration inventory — Phase 0

Orientation for the GOV.UK / MoJ → own-design-system migration described in
`design-system/MIGRATION.md`. No code has been changed for this phase; this
is read-only reconnaissance.

## 1. Stack and template engine

MIGRATION.md's expectation was "Node/Express + Nunjucks based on the GOV.UK
Prototype Kit, deployed to Heroku." Three of those are confirmed, one is not:

- **Confirmed — Node/Express + Nunjucks.** `src/index.ts` boots a plain
  Express app and configures Nunjucks directly (`nunjucks.configure(...)`),
  view engine `njk`, views at `src/views/`.
- **Confirmed — Heroku.** `Procfile` (`release: npm run migrate`, `web: npm
  start`) and `app.json` (Heroku buildpack + `heroku-postgresql` addon,
  `heroku-postbuild` npm script) are Heroku-specific.
- **Not confirmed — not the GOV.UK Prototype Kit.** There is no
  `govuk-prototype-kit` dependency, no `app/` prototype-kit directory
  structure, no prototype-kit config. This is a **standalone TypeScript/Express
  service** that consumes `govuk-frontend` (^6.4.0) and
  `@ministryofjustice/frontend` (^10.0.1) directly as npm packages — it
  extends `moj/template.njk` (which itself extends `govuk/template.njk`) by
  hand in `src/views/layout.njk`, rather than inheriting prototype-kit
  scaffolding. This doesn't change the plan, but the phases should be read
  as "edit our own Express/Nunjucks app" rather than "edit a prototype-kit
  project" — there's no prototype-kit-specific config or plugin layer to
  strip out.

Views (`src/views/`, `.njk`, 4 files) and routes (2 files) are small — see
§4 below for the full list.

## 2. `govuk-` / `moj-` class usage

Grep source: `grep -rn "govuk-\|moj-" --include=*.njk --include=*.html
--include=*.scss --include=*.js` across `src/`, `scss/`, `scripts/`
(excluding `node_modules` and the read-only `design-system/` reference
folder). Every class below is styled today only via the compiled
`govuk-frontend` / `@ministryofjustice/frontend` CSS — there is no
`public/css/app.css` override layer yet.

| Class | Where used | Replacement decision |
|---|---|---|
| `govuk-heading-l`, `govuk-heading-m` | `index.njk`, `scenario.njk`, `404.njk` | **retheme** — §3 type scale (h1 48/1.1/700, h2 32/1.2/700 etc.) via `theme.css` override |
| `govuk-caption-l` | `scenario.njk` | **retheme** — becomes eyebrow style per §3 |
| `govuk-body` | `index.njk`, `scenario.njk`, `404.njk` | **retheme** — body 19/1.55/400, `--sl-ink` |
| `govuk-link` | `index.njk`, `scenario.njk`, `404.njk` | **retheme** — §3 link colour/hover/focus table |
| `govuk-grid-row`, `govuk-grid-column-two-thirds` | `scenario.njk`, `404.njk` | **retheme** — layout grid classes kept, width/gutter tokens from §3 (`--sl-max-width`, `--sl-gutter`) |
| `govuk-form-group` | `index.njk` (filter fields) | **retheme** — spacing only |
| `govuk-label` | `index.njk` (filter fields) | **retheme** |
| `govuk-select`, `govuk-input` | `index.njk` (filter fields) | **retheme** — §4.8 form input treatment (2px `--sl-ink` border, 44px height) |
| `govuk-visually-hidden` | `scenario.njk` (hidden textarea label) | **keep as-is** — a11y utility, not visual, no change needed |
| `govuk-table`, `govuk-table__head`, `govuk-table__body`, `govuk-table__row`, `govuk-table__header`, `govuk-table__cell` | `index.njk` (scenario list), `scenario.njk` (data table) | **retheme** — §4.3 table treatment (panel head, zebra rows, mono ID column) |
| `moj-filter-layout`, `moj-filter-layout__filter`, `moj-filter-layout__content` | `index.njk` | **retheme** — §4.4, layout structure kept |
| `moj-action-bar`, `moj-action-bar__filter` | `index.njk` (results count row) | **retheme** — minor, just spacing/colour |
| `govuk-!-margin-bottom-4` | `index.njk` | **retheme** — GOV.UK spacing override utility; replace with a `--sl-*` spacing token or an equivalent local utility once `theme.css` exists |

Component **macros** imported (not raw classes, but equally in scope —
each renders GOV.UK/MoJ markup+CSS that Phase 4 must retheme in place):

| Macro | File | Renders | Replacement decision |
|---|---|---|---|
| `mojHeader` (`moj/components/header/macro.njk`) | `layout.njk` | `<header class="moj-header">...` | **replace** — Phase 2 replaces this call entirely with `partials/_header.njk` per spec §2. Note: current call passes no `logotype` param, so the crown SVG in this component is **not currently rendered** — confirmed by reading the MoJ header template, the crown block is gated on `params.logotype == "crown"`. |
| `govukBackLink` (`govuk/components/back-link/macro.njk`) | `layout.njk` (via `scenario.njk`'s `backLink` block) | `<a class="govuk-back-link">` | **retheme** — small, not called out by name in §4 but falls under the general link/button override rules in §3 |
| `govukPagination` | `index.njk` | `<nav class="govuk-pagination">` | **retheme** — not named in §4's component list; flagging as a gap, see §6 below |
| `mojFilter` | `index.njk` | `<div class="moj-filter">` | **retheme** — §4.4 |
| `govukSummaryList` | `scenario.njk` | `<dl class="govuk-summary-list">` | **retheme** — §4.7 |
| `govukTextarea` | `scenario.njk` (note field) | `<div class="govuk-form-group">...<textarea class="govuk-textarea">` | **retheme** — falls under §4.8 form input rules |
| `govukButton` | `scenario.njk` ("Update note") | `<button class="govuk-button">` | **retheme** — §4.1 |

The template chain also pulls in, **unreferenced by any explicit class in
our own files but present in rendered HTML** via the inherited
`govuk/template.njk` / `moj/template.njk`:

| Element | Source | Replacement decision |
|---|---|---|
| `govuk-template`, `govuk-template__body`, `govuk-width-container`, `govuk-main-wrapper` | `govuk/template.njk` wrapper markup | **retheme** — width container maps to §3's `--sl-max-width` override |
| `govukSkipLink` → `<a class="govuk-skip-link">` | `govuk/template.njk` `skipLink` block | **retheme, keep behaviour** — §2 explicitly keeps the skip link, restyled ink-on-yellow when focused |
| `govukFooter()` default call → `<footer class="govuk-footer">`, incl. `govuk-footer__crown`, the OGL licence link, and "© Crown copyright" | `govuk/template.njk` `footer` block, called with no args since **`layout.njk` does not override the `footer` block** | **replace** — Phase 2 must add a `footer` block override in `layout.njk` (spec says replace with `_footer.njk`; today nothing overrides the inherited default, so without this the OGL/Crown content ships unchanged) |
| `govukHeader()` | `govuk/template.njk` `govukHeader` block, called with no args | **effectively replaced already** — `layout.njk` overrides the whole `header` block with `mojHeader(...)`, so this default call never renders. No action needed beyond the Phase 2 header work. |

## 3. SCSS/CSS entry point and compilation

- Entry point: **`scss/app.scss`** (2 lines):
  ```scss
  @use "@ministryofjustice/frontend/moj/all";
  @use "govuk-frontend/dist/govuk/index";
  ```
  Order matters — MoJ Frontend sets GOV.UK Frontend's `with (...)`
  configuration (asset paths, fonts), so it's `@use`d first per the comment
  in the file.
- Compiled by **Dart Sass** (`sass` npm package) via the `build:css` /
  `build:css:watch` npm scripts:
  `sass --load-path=. --load-path=node_modules scss/app.scss:public/css/app.css --no-source-map --style=compressed`
- Output: `public/css/app.css`, loaded in `layout.njk`'s `head` block via
  `<link rel="stylesheet" href="/css/app.css">`.
- `public/` is gitignored and rebuilt by `predev`/`prebuild` scripts — no
  compiled CSS is committed.
- **Phase 1/3 note:** `tokens.css` and `theme.css` are new files loaded via
  additional `<link>` tags (or `@import`) in `layout.njk`'s `head` block,
  *after* `app.css`, per the spec. They are not part of the Sass build —
  no changes to `app.scss` needed for these phases, only for Phase 5's
  "prune unused GOV.UK CSS" step (switching from `govuk-frontend/dist/govuk/index`
  to individual component partials).

## 4. Where `govuk-frontend` and `@ministryofjustice/frontend` are imported

| File | What it does |
|---|---|
| `package.json` | Direct dependencies: `govuk-frontend": "^6.4.0"`, `"@ministryofjustice/frontend": "^10.0.1"` |
| `scss/app.scss` | `@use`s both packages' Sass entry points (see §3) |
| `src/index.ts` (lines 13–24) | Adds `node_modules/govuk-frontend/dist` and `node_modules/@ministryofjustice/frontend` to the Nunjucks template search path, so `{% from "govuk/components/..." %}` and `{% from "moj/components/..." %}` resolve |
| `src/views/layout.njk` | `{% extends "moj/template.njk" %}` (which itself `{% extends "govuk/template.njk" %}`); imports `mojHeader`, `govukBackLink`; loads `govuk-frontend.min.js` and `moj-frontend.min.js` as ES modules and calls `initAll()` / `mojInitAll()` / `createAll(FilterToggleButton, ...)` |
| `src/views/index.njk` | Imports `govukPagination`, `mojFilter` |
| `src/views/scenario.njk` | Imports `govukSummaryList`, `govukTextarea`, `govukButton`, `govukBackLink` |
| `scripts/copy-assets.js` | Copies `node_modules/govuk-frontend/dist/govuk/assets` → `public/assets`, `node_modules/@ministryofjustice/frontend/moj/assets/images` → `public/assets/images` (merges into the same folder — see §6 favicon note), and both packages' `*.min.js` → `public/js/` |

## 5. Every template file and every route

**Templates** (`src/views/`, all 4 files use GOV.UK/MoJ markup):

- `layout.njk` — base template, extends `moj/template.njk`
- `index.njk` — scenario log / list page, extends `layout.njk`
- `scenario.njk` — scenario detail page, extends `layout.njk`
- `404.njk` — not-found page, extends `layout.njk`

**Routes:**

| Method | Path | Handler | Renders |
|---|---|---|---|
| GET | `/` | `web.ts` | `index.njk` |
| GET | `/scenario/:id` | `web.ts` | `scenario.njk` or `404.njk` |
| POST | `/scenario/:id/note` | `web.ts` | redirect to `/scenario/:id`, or `404.njk` |
| POST | `/api/scenario` | `api.ts` | JSON only, no view |
| * (catch-all) | `app.use` in `index.ts` | `404.njk` |

The `/api/scenario` route returns JSON error bodies (`res.status(400).json(...)`),
not a rendered GOV.UK error summary — see the gap noted in §6.

## 6. Gaps and assumptions to flag before Phase 1

The spec makes a few assumptions about what's in use that this app doesn't
actually have. None of these block Phase 1, but they affect later phases:

1. **No `character-count`, no `accessible-autocomplete`, no
   `govuk-error-summary` anywhere in the codebase.** §5 of MIGRATION.md
   says to keep "govuk-frontend's JavaScript behaviours in use (error
   summary focus, skip link, character count, accessible autocomplete,
   table responsive)". Grepping the repo for `character-count`,
   `accessible-autocomplete`, `error-summary`/`errorSummary` returns no
   matches. Concretely, in this app today: only the **skip link** and
   **`FilterToggleButton`**/`mojInitAll()` JS behaviours are actually
   exercised. There is no error summary component (the note form has no
   validation UI at all — the API returns a plain 400 JSON body, not
   rendered HTML), no character count on the note `govukTextarea` despite
   it having a `maxlength: 5000` attribute, and no autocomplete anywhere.
   Table responsive stacking isn't enabled either (plain `govuk-table`, no
   `data-module="moj-scrollable-table"` or similar). **Nothing to migrate
   here because there's nothing there** — but Phase 4/6 should not expect
   to find or test these behaviours, and the acceptance-check line "error
   summary announces on submit" in §6 has no current implementation to
   verify against.
2. **`govukPagination` and `govuk-back-link` aren't named in §4's
   component list.** They're real GOV.UK components in active use
   (`index.njk`, `scenario.njk`/`layout.njk`) but Phase 4 doesn't give
   them an explicit treatment. Suggest theming them under the general §3
   link/button rules (pagination links as `govuk-link`-style, back-link
   as a plain ink link) unless told otherwise — flagging so this isn't a
   silent gap.
3. **The footer isn't currently overridden at all.** `layout.njk` overrides
   `header`, `beforeContent`/`backLink`, and `bodyEnd`, but not `footer` —
   so the OGL/Crown copyright footer renders via the untouched default
   `govukFooter()` call inherited from `govuk/template.njk`. Phase 2 needs
   to add a `{% block footer %}` override, not just create `_footer.njk`.
4. **Favicon/manifest assets are merged from two packages into one
   folder.** `copy-assets.js` copies GOV.UK's `assets/images` (favicon.ico,
   favicon.svg, govuk-icon-*.png, govuk-icon-mask.svg, manifest.json) into
   `public/assets`, then separately copies MoJ's `assets/images` (which
   includes `govuk-logotype-crown.png`, `moj-logotype-crest-2024.png`/`.svg`,
   and the `moj-apple-touch-icon-*` set, but **no favicon.ico/svg of its
   own**) into `public/assets/images`, merging rather than replacing. Net
   effect: the site currently serves GOV.UK's favicon.ico/svg (via
   `govuk/template.njk`'s `headIcons` block, not overridden since
   `moj/template.njk`'s `headIcons` override only sets `apple-touch-icon`
   and a `shortcut icon` pointing at the same `favicon.ico` path) alongside
   unused MoJ/GOV.UK crown/crest PNGs that just sit in the output. Phase 2
   replaces all of these; Phase 5's asset-deletion pass should also drop
   `govuk-logotype-crown.png` and `moj-logotype-crest-2024.*` from the
   MoJ package's copied images since nothing in our templates references
   them today either.
5. **`<meta name="theme-color">` is currently `#1d70b8`** (GOV.UK's
   default, un-overridden by either template) — confirmed by reading
   `govuk/template.njk`, matching the spec's Phase 2 instruction to change
   it to `#6F58B9`.
6. **`migration` / `origin/migration` branches checked — not an issue.**
   They sit at the same commit as this branch's base (`3f77dc6`, "add
   design system"), with no diff against it. That's just the branch this
   work was cut from, not leftover prior work to reconcile.
7. **The four open decisions at the end of MIGRATION.md are still
   unresolved** (logo, service name, dark mode — out of scope, status
   vocabulary). Decision 2 (service name: "Test Scenario Tracker" vs
   "Scenario Log") is live in the code today — `mojHeader` call in
   `layout.njk` sets `organisationLabel.text: "Test Scenario Tracker"` and
   `serviceLabel.text: "Scenario log"` as two different strings
   simultaneously, and `package.json`'s `description`/`app.json`'s `name`
   also disagree ("Test Scenario Tracker" vs "scenario-generation-log").
   Phase 2 (header wordmark) and decision 4 (status vocabulary) directly
   depend on product-owner answers to open decisions 1, 2, and 4 — will
   ask before starting Phase 2 and before the Tags styling in Phase 4.

## 7. Explicitly not done in this phase

Per §0.4 of MIGRATION.md: `govuk-frontend` and `@ministryofjustice/frontend`
were **not** upgraded. `npm install` was run read-only to inspect the
installed package contents (component templates, default footer/header
markup, bundled assets) for this inventory; `package.json` /
`package-lock.json` are unchanged.
