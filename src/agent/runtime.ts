import { type Config } from "../config/schema.js";
import { chatWithContext } from "./client.js";
import { type ToolRegistry } from "./tools/registry.js";
import { type ToolContext } from "./tools/types.js";
import { createLogger } from "../utils/logger.js";
import { buildSystemPrompt } from "../soul/loader.js";

const log = createLogger("Agent");

export interface AgentResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
  }>;
}

export class AgentRuntime {
  private config: Config;
  private soul: string;
  private toolRegistry: ToolRegistry | null = null;

  constructor(config: Config, soul?: string, toolRegistry?: ToolRegistry) {
    this.config = config;
    this.soul = soul ?? "";
    this.toolRegistry = toolRegistry ?? null;
  }

  async processMessage(
    chatId: string,
    userMessage: string,
    userName?: string,
    timestamp?: number,
    isGroup?: boolean,
    pendingContext?: string | null,
    toolContext?: ToolContext,
  ): Promise<AgentResponse> {
    try {
      const now = timestamp ?? Date.now();
      const systemPrompt = buildSystemPrompt({
        soul: this.soul,
        userName,
        ownerName: this.config.telegram.owner_name,
        context: pendingContext || undefined,
      });

      const context = {
        messages: [
          { role: "user", content: userMessage, timestamp: now }
        ]
      };

      const iterationLimit = this.config.agent.max_agentic_iterations || 5;
      let iteration = 0;
      let accumulatedTexts: string[] = [];
      const totalToolCalls: any[] = [];

      while (iteration < iterationLimit) {
        iteration++;
        log.info(`🔄 Iteration ${iteration}/${iterationLimit}`);

        const response = await chatWithContext(this.config.agent, {
          systemPrompt,
          context: context as any,
          tools: this.toolRegistry?.getForContext(isGroup ?? false, null, chatId, true) as any[],
        });

        const assistantMsg = response.message;
        context.messages.push(assistantMsg as any);

        if (response.text) {
          accumulatedTexts.push(response.text);
        }

        const toolCalls = assistantMsg.content.filter((b: any) => b.type === "toolCall");

        if (toolCalls.length === 0) {
          break;
        }

        for (const block of toolCalls) {
          if (block.type !== "toolCall") continue;

          log.info(`🔧 Tool: ${block.name}`);
          const result = await this.toolRegistry!.execute(block, {
            ...toolContext!,
            chatId,
            isGroup: isGroup ?? false,
          });

          totalToolCalls.push({ name: block.name, input: block.arguments });
          context.messages.push({
            role: "toolResult",
            toolCallId: block.id,
            toolName: block.name,
            content: [{ type: "text", text: JSON.stringify(result) }],
            isError: !result.success,
            timestamp: Date.now(),
          } as any);
        }
      }

      return {
        content: accumulatedTexts.join("\n").trim(),
        toolCalls: totalToolCalls,
      };
    } catch (error) {
      log.error({ err: error }, "❌ Error in AgentRuntime");
      throw error;
    }
  }

  getConfig(): Config {
    return this.config;
  }
}
