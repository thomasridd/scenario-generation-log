# Scenario Log — migration off GOV.UK / MoJ Frontend

Instructions for Claude Code. Work the phases in order; each one is independently shippable and reviewable. Do not skip Phase 0.

**Goal:** keep GOV.UK's accessibility and clarity, remove its identity. New identity is drawn from methods.co.uk: white canvas, purple blocks, grey panels, square edges.

**Reference:** `Scenario Log Design Guide.dc.html` in this project is the visual source of truth. Open it and match it.

---

## 0. Orientation (do this first, report back before changing anything)

1. Identify the stack and template engine. Expected: Node/Express + Nunjucks based on the GOV.UK Prototype Kit, deployed to Heroku. Confirm from `package.json` / `Procfile` / `app.js`.
2. Inventory what is actually used:
   - `grep -rn "govuk-\|moj-" --include=*.njk --include=*.html --include=*.scss --include=*.js` and list every distinct class.
   - Find the SCSS/CSS entry point (e.g. `app/assets/sass/application.scss`) and how it is compiled.
   - Find where `govuk-frontend` and `@ministryofjustice/frontend` are imported.
   - List every template file and every route.
3. Write the inventory into `docs/migration-inventory.md` as: class → where used → replacement decision (retheme / replace / delete).
4. Do not upgrade `govuk-frontend` as part of this work. One change at a time.

---

## 1. Tokens and fonts

Create `app/assets/css/tokens.css`, loaded **after** the compiled GOV.UK CSS and before everything else of ours.

```css
:root {
  /* Brand */
  --sl-purple: #6F58B9;        /* primary action, header rule, brand blocks */
  --sl-purple-dark: #4A2E8F;   /* links, hover, deep bands */

  /* Neutrals */
  --sl-ink: #262626;
  --sl-ink-muted: #5C5C5C;
  --sl-panel: #EEEEEE;
  --sl-tint: #F8F8F8;
  --sl-border: #D8D8D8;
  --sl-white: #FFFFFF;

  /* Status */
  --sl-red: #E52A3B;      --sl-red-text: #B3111F;
  --sl-yellow: #FFD026;
  --sl-teal: #339FA7;     --sl-teal-text: #1F6E74;
  --sl-blue: #3F78C7;     /* informational only — never links */

  /* Type */
  --sl-font: "Public Sans", Helvetica, Arial, sans-serif;
  --sl-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Space (4px scale) */
  --sl-1: 4px; --sl-2: 8px; --sl-3: 12px; --sl-4: 16px;
  --sl-5: 24px; --sl-6: 32px; --sl-7: 48px; --sl-8: 64px;

  --sl-max-width: 1100px;
  --sl-gutter: 56px;
  --sl-radius: 0;
  --sl-transition: 120ms ease;
}
```

Fonts: self-host **Public Sans** (400/600/700 + italic 400) and **IBM Plex Mono** (400/500) as woff2 in `app/assets/fonts/`, with `@font-face { font-display: swap; }`. Do not use a Google Fonts CDN link in production. Both are open licence (SIL OFL / public domain) — record that in `docs/licences.md`.

Remove GDS Transport entirely: delete the font files, the `@font-face` blocks, and set `$govuk-font-family: var(--sl-font)` (or override `.govuk-font` families in our CSS if the SCSS variables aren't reachable). Using GDS Transport off gov.uk is not licensed — this is a compliance fix, not a preference.

Nothing should look different at the end of Phase 1 except the typeface. Ship it, check nothing broke.

---

## 2. Page chrome (highest visibility, lowest risk)

**Header** — replace `govuk-header` markup entirely with `app/views/partials/_header.njk`:

- White background, `border-bottom: 4px solid var(--sl-purple)`.
- Left: service name "Test Scenario Tracker" at 19px/700, followed by the three 4×18px accent bars (`--sl-red`, `--sl-yellow`, `--sl-teal`) with 3px gaps. This is our mark; do not use the Methods logo file without sign-off from Methods brand.
- Right: nav links at 17px, ink, no underline; current page gets `box-shadow: inset 0 -3px 0 0 var(--sl-purple)` and 600 weight, plus `aria-current="page"`.
- Delete: the crown SVG, `govuk-header__logotype`, the black bar, the blue `govuk-header__container` bottom border.
- Keep the skip link (`href="#main-content"`), restyled: ink text on `--sl-yellow` when focused.

**Footer** — replace `govuk-footer` with `_footer.njk`:

- `--sl-ink` background, white text.
- Delete the OGL licence paragraph, the OGL logo, and the Crown copyright link. This is an internal tool; those statements are wrong here.
- Content: "Scenario Log" eyebrow, a line stating the data is test data only, and links to Accessibility statement, Support, Release notes.

**Meta** — `<meta name="theme-color">` from `#1d70b8` to `#6F58B9`. Replace all GOV.UK favicons, `apple-touch-icon`, `mask-icon` and `manifest.json` icons with a purple mark. Check `<title>` suffixes for "GOV.UK".

---

## 3. Type and colour overrides

New file `app/assets/css/theme.css`, loaded after `tokens.css`. Override GOV.UK classes rather than editing `node_modules`.

| GOV.UK | Now |
|---|---|
| `--govuk-link` `#1d70b8` / visited `#4c2c92` | `var(--sl-purple-dark)`, no separate visited colour |
| link hover `#003078` | `var(--sl-ink)`, underline thickness 3px |
| focus `#ffdd00` + `#0b0c0c` | `var(--sl-yellow)` 3px outline + `box-shadow: 0 3px 0 0 var(--sl-ink)` |
| body text `#0b0c0c` | `var(--sl-ink)` |
| secondary text `#505a5f` | `var(--sl-ink-muted)` |
| `govuk-width-container` 960px | `var(--sl-max-width)` 1100px, gutter `var(--sl-gutter)` (32px under 640px) |

Type scale (unchanged floors, new sizes): h1 48/1.1/700, h2 32/1.2/700, h3 21/1.4/700, body 19/1.55/400, UI 17, hint 15. Headings get `letter-spacing: -0.01em` (−0.02em at 48px). Prose measure `max-width: 70ch`. Section eyebrows: 15px/700/uppercase/`0.14em`.

Add a `.sl-mono` utility (`font-family: var(--sl-mono)`) for identifiers, IDs and timestamps, and `font-variant-numeric: tabular-nums` on all `.govuk-table`.

Do **not** touch: heading hierarchy, focus visibility, `:focus-visible` support, reduced-motion handling, or the 1.5 line-height minimum.

---

## 4. Components

Retheme in this order. For each: change CSS only, keep markup, then re-run the accessibility checks in §6.

1. **Buttons** (`.govuk-button`): purple fill, white text, 0 radius, no bottom "shadow", no 2px press travel, `min-height: 44px`, `padding: 13px 20px`, hover `--sl-purple-dark`, 120ms transition. Secondary = white with `inset 0 0 0 2px var(--sl-purple-dark)`. Warning = `--sl-red-text` fill.
2. **Tags** (`.govuk-tag`): white fill, 2px coloured outline, uppercase 15px/700/`0.06em`, square. Passed → teal, Failed → red, In progress → solid `--sl-yellow` with ink text, Environment → purple, Draft → border grey. Every tag keeps its text label; colour is never the only signal.
3. **Tables** (`.govuk-table`): grey `--sl-panel` head, uppercase 15px head cells, `border-bottom: 2px solid var(--sl-ink)` under the head, 1px `--sl-border` row rules, `--sl-tint` zebra on even rows, 14px/16px cell padding, tabular figures, mono ID and Identifier columns. Keep `<caption>`, `scope`, and the responsive stacking behaviour if present.
4. **Filter panel** (MoJ `moj-filter`): flat `--sl-panel` block, 24px padding, 21px/700 heading, 3-up grid of fields at ≥768px, single column below. Drop the blue borders and the MoJ blue tags. Keep the "Selected filters"/clear behaviour and its ARIA.
5. **Notification banner** (`.govuk-notification-banner`): purple block, white text, uppercase eyebrow + 21px/700 heading. Success variant is the same purple — no green.
6. **Error summary / error states**: `--sl-red-text` for text and 2px border. Keep the on-load focus, the `role="alert"`, and the anchor-to-field links exactly as they are.
7. **Summary list** (`.govuk-summary-list`): 240px key column, 1px row rules, no key-column background, mono values for identifiers and timestamps.
8. **Form inputs**: keep the 2px `--sl-ink` border and 44px height. Error state = 2px `--sl-red-text`. Hint text 15px `--sl-ink-muted`.

Surfaces are separated by 2px gaps, 2px rules and grey fills — never by shadows, gradients or rounded cards.

---

## 5. Cut the dependency

- Remove `@ministryofjustice/frontend` if only the filter panel was used; otherwise import only the components still needed.
- Keep `govuk-frontend`'s **JavaScript** behaviours in use (error summary focus, skip link, character count, accessible autocomplete, table responsive) — they are the accessibility work we are deliberately not rewriting.
- Prune unused GOV.UK CSS: import individual component partials instead of the whole `govuk-frontend/all`. Measure the CSS bundle before and after and record both numbers.
- Delete GOV.UK image assets no longer referenced (crown, OGL logo, favicons).
- Grep the repo for `govuk`, `crown`, `Open Government`, `#1d70b8`, `#ffdd00`, `GDS Transport`, `nationalarchives.gov.uk` and confirm every hit is either intentional (a kept component class) or removed.

---

## 6. Acceptance checks — run after every phase

- **Contrast:** all body text ≥4.5:1, large text ≥3:1, UI boundaries and focus ≥3:1. Verified combinations: ink on white 14.9:1, muted ink on white 6.4:1, white on purple 5.5:1, purple-dark on white 9.4:1, ink on panel grey 12.4:1, red-text on white 5.9:1, teal-text on white 4.9:1.
- **Keyboard:** tab the scenario log and the scenario detail page end to end. Focus visible at every stop, order matches visual order, skip link works, no traps.
- **Targets:** every interactive element ≥44×44px.
- **Zoom / reflow:** 400% browser zoom and 320px width with no horizontal scrolling and no clipped content.
- **Screen reader:** table announces headers per cell; filter panel announces selected filters; error summary announces on submit.
- **Colour independence:** grayscale the pages — status is still readable.
- **Automated:** axe-core clean on every route; Lighthouse accessibility 100.
- **Regression:** every route renders; no console errors; CSS bundle no larger than before.

---

## 7. Commit and PR shape

One PR per phase, titled `Design migration Phase N — <name>`. Each PR body: screenshots before/after, the checks from §6 with results, and anything deliberately left for a later phase. Do not mix phases.

---

## Open decisions for the product owner

1. **Logo.** The guide uses a wordmark + three accent bars, not the Methods logo. If the Methods logotype should appear, we need the SVG and brand sign-off.
2. **Service name.** "Test Scenario Tracker" vs "Scenario Log" are currently both in the header. Pick one for the wordmark and use the other as the page title.
3. **Dark mode.** Out of scope here. Tokens are structured so it can be added later as a `prefers-color-scheme` block.
4. **Status vocabulary.** The accents assume Passed / Failed / In progress / Draft. Confirm the real set before Phase 4.
