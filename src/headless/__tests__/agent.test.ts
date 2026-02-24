import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeadlessTeletonAgent } from '../agent.js';
import { AgentRuntime } from '../../agent/runtime.js';
import * as client from '../../agent/client.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { rmSync, mkdirSync } from 'fs';

// Mock the AI client to avoid actual API calls
vi.mock('../../agent/client.js', () => ({
  chatWithContext: vi.fn(),
  getProviderModel: vi.fn(),
  getEffectiveApiKey: vi.fn(),
}));

describe('HeadlessTeletonAgent', () => {
  let agent: HeadlessTeletonAgent;
  const workDir = join(tmpdir(), 'teleton-agent-test-' + Date.now());

  const mockAgentConfig: any = {
    provider: 'anthropic',
    api_key: 'test-key',
    model: 'test-model',
    max_agentic_iterations: 3,
  };

  beforeEach(() => {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {}
    mkdirSync(workDir, { recursive: true });

    agent = new HeadlessTeletonAgent({
      agent: mockAgentConfig,
      soul: 'Test Soul',
      workDir,
    });
  });

  it('should initialize correctly', () => {
    expect(agent).toBeDefined();
    expect(agent.getRuntime()).toBeInstanceOf(AgentRuntime);
  });

  it('should process a message and handle tool calls', async () => {
    const mnemonic = ['word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word', 'word'];
    
    // Mock 1st call: AI wants to call a tool
    (client.chatWithContext as any).mockResolvedValueOnce({
      text: 'I will check your balance.',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'toolCall',
            id: 'call_1',
            name: 'ton_get_balance',
            arguments: { address: 'EQ...' },
          }
        ],
      }
    });

    // Mock 2nd call: AI responds after tool execution
    (client.chatWithContext as any).mockResolvedValueOnce({
      text: 'Your balance is 100 TON.',
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Your balance is 100 TON.' }],
      }
    });

    const response = await agent.process('test-chat-id', 'Check my balance', {
      walletMnemonic: mnemonic,
      senderId: 123,
    });

    expect(response.content).toContain('Your balance is 100 TON.');
    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolCalls?.[0].name).toBe('ton_get_balance');
    
    // Verify chatWithContext was called twice
    expect(client.chatWithContext).toHaveBeenCalledTimes(2);
  });

  it('should allow specifying partial config', () => {
    const customAgent = new HeadlessTeletonAgent({
      agent: { provider: 'openai', model: 'gpt-4o' },
      workDir: join(workDir, 'custom'),
    });

    const config = customAgent.getRuntime().getConfig();
    expect(config.agent.provider).toBe('openai');
    expect(config.agent.model).toBe('gpt-4o');
  });

  it('should pass the mnemonic to the tool context', async () => {
     // We need to verify that the tool executor actually receives the mnemonic.
     // Let's create a spy for the tool registry execution.
     const registry = agent.getToolRegistry();
     const executeSpy = vi.spyOn(registry, 'execute');

     (client.chatWithContext as any).mockResolvedValueOnce({
      text: 'Executing...',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'toolCall',
            id: 'call_2',
            name: 'ton_get_balance',
            arguments: { address: 'EQ...' },
          }
        ],
      }
    });

    (client.chatWithContext as any).mockResolvedValueOnce({
      text: 'Done.',
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Done.' }],
      }
    });

    const mnemonic = ['test', 'mnemonic']; // Short for test
    await agent.process('test-chat-id', 'test', { walletMnemonic: mnemonic });

    // Verify the tool was called with the correct context
    expect(executeSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        walletMnemonic: mnemonic,
        chatId: 'test-chat-id'
      })
    );
  });
});
