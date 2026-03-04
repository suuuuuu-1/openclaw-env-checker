import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["check-env.js"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: "dist/check-env.cjs",
  external: [],
  minify: false,
  sourcemap: false,
});

console.log("Build complete: dist/check-env.cjs");
console.log("Run 'npm run package' to create executables");
