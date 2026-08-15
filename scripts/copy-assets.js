// Copies static assets (fonts, images, client-side JS) from the govuk-frontend
// and @ministryofjustice/frontend packages, plus our own self-hosted design
// system assets (assets/css, assets/fonts, assets/images, assets/manifest.json),
// into public/, so Express can serve them without depending on node_modules
// paths at runtime.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

function copy(src, dest, options) {
  fs.cpSync(src, dest, { recursive: true, ...options });
}

fs.mkdirSync(path.join(publicDir, "assets"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "js"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "css"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "fonts"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "images"), { recursive: true });

// GDS Transport's font files are deliberately excluded: GOV.UK Frontend's own
// @font-face declarations for it are already switched off (MoJ Frontend sets
// $govuk-include-default-font-face to false in scss/app.scss), and using GDS
// Transport off gov.uk isn't licensed — see design-system/MIGRATION.md,
// phase 1.
const govukAssetsSrc = path.join(
  root,
  "node_modules/govuk-frontend/dist/govuk/assets"
);
copy(govukAssetsSrc, path.join(publicDir, "assets"), {
  filter: (src) => {
    const rel = path.relative(govukAssetsSrc, src);
    return rel !== "fonts" && !rel.startsWith(`fonts${path.sep}`);
  },
});
copy(
  path.join(root, "node_modules/@ministryofjustice/frontend/moj/assets/images"),
  path.join(publicDir, "assets/images")
);

// Our own self-hosted design system CSS, fonts (Public Sans, IBM Plex Mono
// — see docs/licences.md), and favicon/manifest images (replacing GOV.UK's
// — see design-system/MIGRATION.md, phase 2). The old govuk-frontend /
// moj-frontend favicon and crown/crest images copied into public/assets
// above are no longer referenced anywhere once headIcons is overridden in
// layout.njk, but are left in place for now — deleting unreferenced GOV.UK
// assets is phase 5's job, not this one.
copy(path.join(root, "assets/css"), path.join(publicDir, "css"));
copy(path.join(root, "assets/fonts"), path.join(publicDir, "fonts"));
copy(path.join(root, "assets/images"), path.join(publicDir, "images"));
fs.copyFileSync(
  path.join(root, "assets/manifest.json"),
  path.join(publicDir, "manifest.json")
);

fs.copyFileSync(
  path.join(root, "node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.js"),
  path.join(publicDir, "js/govuk-frontend.min.js")
);
fs.copyFileSync(
  path.join(root, "node_modules/@ministryofjustice/frontend/moj/moj-frontend.min.js"),
  path.join(publicDir, "js/moj-frontend.min.js")
);

console.log("Copied govuk-frontend / moj-frontend assets into public/");
