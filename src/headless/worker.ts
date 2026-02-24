/**
 * Headless Teleton Agent Worker
 * 
 * Standalone script to execute a single cycle of an agent strategy.
 * Usage: node dist/headless/worker.js '<json_payload>'
 */

import { HeadlessTeletonAgent } from "./agent.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("Worker");

async function main() {
  const payloadStr = process.argv[2];
  if (!payloadStr) {
    console.error("Error: Missing JSON payload argument");
    process.exit(1);
  }

  try {
    const payload = JSON.parse(payloadStr);
    const { config, agent: agentConfig, soul, workDir, chatId, message, walletMnemonic, senderId } = payload;

    if (!workDir || !chatId || !message) {
      console.error("Error: Payload missing required fields (workDir, chatId, message)");
      process.exit(1);
    }

    const agent = new HeadlessTeletonAgent({
      config,
      agent: agentConfig,
      soul,
      workDir
    });

    log.info(`Executing cycle for chat ${chatId}...`);
    
    const result = await agent.process(chatId, message, {
      walletMnemonic,
      senderId
    });

    // Output JSON result to stdout so the SaaS manager can capture it
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }));
    process.exit(1);
  }
}

main();
