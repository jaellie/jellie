// Builds the full unpacked extension into dist/:
//   1. esbuild bundles the background service worker (ESM) and content
//      script (IIFE — MV3 content scripts must be classic scripts).
//   2. vite builds the React side panel (invoked as a separate npm step,
//      see package.json "build" script order).
//   3. manifest.json and icons are copied in.
import { build } from "esbuild";
import { mkdirSync, copyFileSync, cpSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(root, "src/background/index.ts")],
  bundle: true,
  format: "esm",
  target: "chrome110",
  outfile: join(dist, "background.js"),
  minify: false,
  sourcemap: true,
});

await build({
  entryPoints: [join(root, "src/content/index.ts")],
  bundle: true,
  format: "iife",
  target: "chrome110",
  outfile: join(dist, "content.js"),
  minify: false,
  sourcemap: true,
});

console.log("esbuild: background.js + content.js done");

console.log("running vite build for side panel...");
execSync("npx vite build", { cwd: root, stdio: "inherit" });

copyFileSync(join(root, "manifest.json"), join(dist, "manifest.json"));
if (existsSync(join(root, "public/icons"))) {
  cpSync(join(root, "public/icons"), join(dist, "icons"), { recursive: true });
}

console.log("Extension build complete: dist/");
