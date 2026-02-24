import { AgentRuntime, type AgentResponse } from "../agent/runtime.js";
import { ToolRegistry } from "../agent/tools/registry.js";
import { registerAllTools } from "../agent/tools/register-all.js";
import { ConfigSchema, type Config, type AgentConfig } from "../config/schema.js";
import { initializeMemory } from "../memory/index.js";
import { join } from "path";
import { createLogger } from "../utils/logger.js";

const log = createLogger("HeadlessAgent");

/**
 * Configuration for the Headless Teleton Agent.
 * Allows overriding default agent settings and specifying the work directory.
 */
export interface HeadlessTeletonAgentOptions {
  /** 
   * Complete or partial agent configuration.
   * If omitted, defaults to Anthropic with Claude 4.5.
   */
  agent?: Partial<AgentConfig>;
  /** Complete application config. If provided, 'agent' option overrides config.agent. */
  config?: Partial<Config>;
  /** Optional soul/personality prompt for the agent. */
  soul?: string;
  /** Directory for memory and storage (e.g., './data'). */
  workDir: string;
}

/**
 * HeadlessTeletonAgent provides a programmatic interface to the Teleton Agent
 * without requiring a Telegram connection. It's suitable for embedding
 * in other applications, testing, or building custom interfaces.
 */
export class HeadlessTeletonAgent {
  private runtime: AgentRuntime;
  private registry: ToolRegistry;
  private memory: any;
  private config: Config;

  constructor(options: HeadlessTeletonAgentOptions) {
    // 1. Initialize Registry & Tools
    this.registry = new ToolRegistry();
    registerAllTools(this.registry);

    // 2. Build full config from partials or defaults
    // We provide minimal valid defaults for required fields that don't have them in the schema
    const minimalDefaults = {
      agent: { 
        provider: "anthropic", 
        model: "claude-3-5-sonnet-latest",
        api_key: "",
      },
      telegram: { 
        api_id: 0, 
        api_hash: "", 
        phone: "",
        owner_name: "Admin" 
      },
      embedding: { provider: "local" },
    };

    const baseConfig = options.config || (ConfigSchema.parse(minimalDefaults) as any);
    this.config = {
      ...baseConfig,
      agent: {
        ...baseConfig.agent,
        ...options.agent,
      },
    };

    // 3. Initialize Runtime
    this.runtime = new AgentRuntime(this.config, options.soul, this.registry);
    
    // 4. Initialize Memory
    const embeddingProvider = this.config.embedding?.provider || "local";
    this.memory = initializeMemory({
      database: {
        path: join(options.workDir, "memory.db"),
        enableVectorSearch: embeddingProvider !== "none",
        vectorDimensions: 384,
      },
      embeddings: {
        provider: embeddingProvider as any,
        model: this.config.embedding?.model,
        apiKey: embeddingProvider === "anthropic" ? this.config.agent.api_key : undefined,
      },
      workspaceDir: options.workDir,
    });

    log.info("Headless Teleton Agent initialized successfully");
  }

  /**
   * Process a message through the agent.
   * 
   * @param chatId - A unique identifier for the conversation
   * @param message - The user's input text
   * @param context - Optional context like wallet mnemonics or sender ID
   * @returns The agent's response including text and tool calls
   */
  async process(
    chatId: string, 
    message: string, 
    context: { walletMnemonic?: string[], senderId?: number } = {}
  ): Promise<AgentResponse> {
    const toolContext = {
      db: this.memory.db,
      chatId,
      senderId: context.senderId ?? 0,
      isGroup: false,
      walletMnemonic: context.walletMnemonic,
      config: this.runtime.getConfig(),
    };

    return await this.runtime.processMessage(
      chatId,
      message,
      "User",
      Date.now(),
      false,
      null,
      toolContext as any
    );
  }

  getRuntime(): AgentRuntime {
    return this.runtime;
  }

  getToolRegistry(): ToolRegistry {
    return this.registry;
  }

  getMemory(): any {
    return this.memory;
  }
}
