import { Type } from "@sinclair/typebox";
import type { Tool, ToolExecutor, ToolResult, ToolEntry } from "../types.js";
import { getKeyPair, loadWallet } from "../../../ton/wallet-service.js";
import { getErrorMessage } from "../../../utils/errors.js";
import { createLogger } from "../../../utils/logger.js";

const log = createLogger("StormTrade");

export const stormOpenTool: Tool = {
  name: "storm_open_position",
  description: "Open a perpetual position on Storm Trade. Supports leverage and long/short directions.",
  parameters: Type.Object({
    pair: Type.String({ description: "Trading pair (e.g., 'TON/USDT')" }),
    direction: Type.Union([Type.Literal("long"), Type.Literal("short")], { description: "Position direction" }),
    size: Type.Number({ description: "Size in human-readable units" }),
    leverage: Type.Number({ description: "Leverage (e.g., 2, 5, 10)", minimum: 1, maximum: 50 }),
  }),
};

export const stormOpenExecutor: ToolExecutor<any> = async (params, context): Promise<ToolResult> => {
  try {
    const { pair, direction, size, leverage } = params;
    const walletData = await loadWallet(context.walletMnemonic);
    if (!walletData) {
      return { success: false, error: "Wallet not initialized. Provide a mnemonic in the context." };
    }

    log.info(`Opening ${direction} on ${pair} with ${leverage}x leverage...`);
    
    // In a real implementation, we would use the Storm SDK here
    return {
      success: true,
      data: {
        pair,
        direction,
        size,
        leverage,
        message: `Successfully opened ${direction} position on ${pair} with ${leverage}x leverage (SIMULATED)`,
      }
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

export const tools: ToolEntry[] = [
  { tool: stormOpenTool, executor: stormOpenExecutor, scope: "dm-only" },
];
