import { defineConfig } from "tsup";
import { rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pkg from "./package.json" with { type: "json" };

// Bundle everything EXCEPT production dependencies and Node builtins.
// This ensures @ston-fi/* (devDeps with pnpm-only install blocker)
// and all their transitive deps are inlined into dist/.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
];

// Clean dist/
function cleanDist() {
  try {
    rmSync("dist", { recursive: true, force: true });
  } catch {
    // dist/ doesn't exist yet — nothing to clean
  }
}

cleanDist();

export default defineConfig({
  entry: {
    index: "src/headless/agent.ts",
    worker: "src/headless/worker.ts",
  },
  format: "esm",
  target: "node20",
  platform: "node",
  splitting: true,
  clean: false,
  dts: true,
  sourcemap: false,
  outDir: "dist",
  external,
});
