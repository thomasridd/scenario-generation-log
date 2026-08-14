// Copies static assets (fonts, images, client-side JS) from the govuk-frontend
// and @ministryofjustice/frontend packages into public/, so Express can serve
// them without depending on node_modules paths at runtime.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

function copy(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

fs.mkdirSync(path.join(publicDir, "assets"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "js"), { recursive: true });

copy(
  path.join(root, "node_modules/govuk-frontend/dist/govuk/assets"),
  path.join(publicDir, "assets")
);
copy(
  path.join(root, "node_modules/@ministryofjustice/frontend/moj/assets/images"),
  path.join(publicDir, "assets/images")
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
