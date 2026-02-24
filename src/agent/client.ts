import type { Context, Message } from "@mariozechner/pi-ai";
import { 
  createChat, 
  getProvider, 
  type ChatRequest, 
  type ChatResponse 
} from "@mariozechner/pi-ai";
import type { Config } from "../config/schema.js";
import { getProviderMetadata, type SupportedProvider } from "../config/providers.js";

/**
 * Chat with context using the pi-ai library.
 * This is the core LLM interaction function.
 */
export async function chatWithContext(
  agentConfig: Config["agent"],
  options: {
    systemPrompt: string;
    context: Context;
    tools?: any[];
  }
): Promise<ChatResponse> {
  const providerName = (agentConfig.provider || "anthropic") as SupportedProvider;
  const apiKey = agentConfig.api_key;
  
  const provider = getProvider(providerName, { apiKey });
  const model = agentConfig.model || getProviderMetadata(providerName).defaultModel;

  const chat = createChat(provider, {
    model,
    systemPrompt: options.systemPrompt,
  });

  return await chat.sendMessage(options.context.messages, {
    tools: options.tools,
  });
}

/**
 * Get effective API key from config or env
 */
export function getEffectiveApiKey(provider: string, configKey?: string): string {
  const envKey = `TELETON_${provider.toUpperCase()}_API_KEY`;
  return process.env[envKey] || configKey || "";
}

/**
 * Get the model identifier for a given provider
 */
export function getProviderModel(provider: string, modelConfig?: string): any {
  const meta = getProviderMetadata(provider as SupportedProvider);
  return meta.models.find(m => m.id === (modelConfig || meta.defaultModel)) || meta.models[0];
}
