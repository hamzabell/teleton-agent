import { telegramSendMessageTool, telegramSendMessageExecutor } from "./send-message.js";
import type { ToolEntry } from "../../types.js";

export { telegramSendMessageTool, telegramSendMessageExecutor };

export const tools: ToolEntry[] = [
  { tool: telegramSendMessageTool, executor: telegramSendMessageExecutor },
];
