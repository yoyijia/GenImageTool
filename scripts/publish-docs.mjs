import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dist = "dist";
const docs = "docs";
const assets = join(docs, "assets");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ is missing. Run vite build first.");
}

cpSync(dist, docs, { recursive: true });
mkdirSync(assets, { recursive: true });

const appJs = join(assets, "app.js");
const appCss = join(assets, "app.css");

if (!existsSync(appJs) || !existsSync(appCss)) {
  throw new Error("Expected dist assets app.js and app.css");
}

// Keep previously published hashed filenames so cached HTML on the live URL
// does not 404 after a rebuild.
const aliases = [
  "index-ChANm-07.js",
  "index-DoiWqOw3.css",
  "index-BF9PSyLW.js",
  "index-C66riF88.css",
  "index-BaN2t9Ll.js",
  "index-VePEVyWK.css",
];

for (const name of aliases) {
  copyFileSync(name.endsWith(".css") ? appCss : appJs, join(assets, name));
}
