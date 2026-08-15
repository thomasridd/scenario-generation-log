// Copies static assets (icons, client-side JS) from the @ministryofjustice/
// frontend package, plus our own self-hosted design system assets
// (assets/css, assets/fonts, assets/images, assets/manifest.json), into
// public/, so Express can serve them without depending on node_modules
// paths at runtime.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

function copy(src, dest, options) {
  fs.cpSync(src, dest, { recursive: true, ...options });
}

fs.mkdirSync(path.join(publicDir, "assets/images"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "js"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "css"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "fonts"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "images"), { recursive: true });

// GOV.UK Frontend's own assets/ (favicons, GDS Transport fonts, manifest.json)
// aren't copied at all any more: none of it is referenced anywhere, since
// phase 1 dropped GDS Transport and phase 2 replaced every favicon/manifest
// link with our own (assets/images/, assets/manifest.json below) — see
// design-system/MIGRATION.md, phase 5.

// Only the four MoJ Frontend icons actually referenced by the trimmed
// components in scss/app.scss (filter's remove-tag and header-collapse
// icons) — confirmed by grepping the compiled CSS for url(...), not
// guessed. Everything else MoJ Frontend ships (the crown/crest logos,
// alert/arrow/document/search/wysiwyg icons for components we don't use)
// is left out.
const mojImagesSrc = path.join(
  root,
  "node_modules/@ministryofjustice/frontend/moj/assets/images"
);
const mojImagesUsed = [
  "icon-close-cross-black.svg",
  "icon-tag-remove-cross.svg",
  "icon-tag-remove-cross-white.svg",
  "icon-toggle-plus-minus.svg",
];
for (const name of mojImagesUsed) {
  fs.copyFileSync(
    path.join(mojImagesSrc, name),
    path.join(publicDir, "assets/images", name)
  );
}

// Our own self-hosted design system CSS, fonts (Public Sans, IBM Plex Mono
// — see docs/licences.md), and favicon/manifest images (see
// design-system/MIGRATION.md, phase 2).
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
