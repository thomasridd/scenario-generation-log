# Font licences

Design-system migration Phase 1 (`design-system/MIGRATION.md`) self-hosts
two typefaces instead of GOV.UK Frontend's GDS Transport, which isn't
licensed for use off gov.uk, and instead of a Google Fonts CDN link.

## Public Sans

- Source: `fonts.googleapis.com/css2?family=Public+Sans`, downloaded and
  vendored as woff2 into `assets/fonts/`.
- Licence: SIL Open Font License, Version 1.1.
- Public Sans is a modified version of Libre Franklin. The General Services
  Administration's (GSA) own modifications to it are additionally released
  under CC0 1.0 (public domain), but because the font combines that
  OFL-licensed base (Libre Franklin) with the GSA's modifications, the
  project's own guidance is to use the combined work under OFL 1.1 terms:
  https://github.com/uswds/public-sans/blob/master/LICENSE.md
- Files: `public-sans-normal.woff2` (variable weight, covers 400–700,
  upright), `public-sans-italic-400.woff2` (400, italic).

## IBM Plex Mono

- Source: `fonts.googleapis.com/css2?family=IBM+Plex+Mono`, downloaded and
  vendored as woff2 into `assets/fonts/`.
- Licence: SIL Open Font License, Version 1.1.
  https://github.com/IBM/plex/blob/master/LICENSE.txt
- Files: `ibm-plex-mono-400.woff2`, `ibm-plex-mono-500.woff2`.

Both licences permit bundling, self-hosting and redistributing the font
files as part of this application. The OFL's main restriction — the font
software can't be sold on its own, separately from a larger work — doesn't
apply here.
