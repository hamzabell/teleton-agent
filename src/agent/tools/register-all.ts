/**
 * Central tool registration for the Teleton agent.
 *
 * Each category exports a `tools: ToolEntry[]` array with scope info co-located.
 * Deals tools are loaded separately via module-loader.ts.
 */

import type { ToolRegistry } from "./registry.js";
import type { ToolEntry } from "./types.js";

import { tools as telegramTools } from "./telegram/index.js";
import { tools as tonTools } from "./ton/index.js";
import { tools as stonfiTools } from "./stonfi/index.js";
import { tools as dedustTools } from "./dedust/index.js";
import { tools as stormTools } from "./storm/index.js";

const ALL_CATEGORIES: ToolEntry[][] = [
  telegramTools,
  tonTools,
  stonfiTools,
  dedustTools,
  stormTools,
];

export function registerAllTools(registry: ToolRegistry): void {
  for (const category of ALL_CATEGORIES) {
    for (const { tool, executor, scope } of category) {
      registry.register(tool, executor, scope);
    }
  }
}
