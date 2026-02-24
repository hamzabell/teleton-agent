# Headless Teleton Agent SDK

**Headless Teleton Agent** is a multi-tenant, headless AI agent SDK specifically engineered for the TON blockchain. It is a specialized refactor of the [TeleTON Agent](https://github.com/TONresistor/teleton-agent) project, stripped of its CLI and WebUI to serve as a lean, high-performance "DeFAI" engine for SaaS platforms.

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-blue" alt="TypeScript"></a>
  <a href="https://ton.org"><img src="https://img.shields.io/badge/Built_on-TON-0098EA?logo=ton&logoColor=white" alt="Built on TON"></a>
</p>

---

## 🚀 Overview

Headless Teleton Agent transforms the autonomous agentic loop
 of TeleTON into a stateless worker. It is designed to be integrated directly into your application's backend to manage hundreds of independent trading strategies on a single VPS.

### **Key Features**
- **Headless & Stateless**: No local `config.yaml` or `wallet.json`. Everything is injected at runtime.
- **DeFi Focused**: Native support for **Ston.fi**, **DeDust**, and **Storm Trade** (Perpetuals).
- **Multi-Tenant**: Run multiple user agents with different mnemonics in the same process or worker threads.
- **Wallet V5 Ready**: Designed for non-custodial delegation via TON Wallet V5 allowances.
- **Lightweight Notifications**: Replaced the heavy GramJS user client with a lightweight Bot API for proactive alerts.

---

## 🏗️ Architecture

The SDK follows an **Event-Driven Worker** pattern:
1. **SaaS Manager**: Your app logic that stores user strategies and mnemonics.
2. **Headless Teleton Agent SDK**: The "Brain"
 that processes market signals and executes trades.
3. **Execution Context**: Injected per-run data (Strategy Soul, Mnemonic, Risk Params).

---

## 📦 Usage

```typescript
import { HeadlessTeletonAgent } from '@teleton-agent/sdk';

const agent = new HeadlessTeletonAgent({
  agent: {
    provider: 'anthropic',
    api_key: process.env.ANTHROPIC_KEY,
  },
  workDir: './agent-data',
  soul: "Your Yield Strategy Instructions..."
});

// Process a market signal
const result = await agent.process("chat-123", "TON price dropped 5%, rebalance liquidity");
console.log(result.content);
```

---

## 🧹 Refactor Status (Breaking Changes)

This is a **non-backward compatible revamp** of the TeleTON Agent.
- ❌ **Removed**: CLI, WebUI, `gramjs` User Client, Filesystem Tools, Web Search (Tavily).
- ✅ **Added**: `HeadlessTeletonAgent` wrapper, `WalletManager` (Injection), Storm Trade Tools.

---

## 📜 Credits & License

This project is a derivative of the original **TeleTON Agent** created by [Digital Resistance](https://github.com/TONresistor). We are deeply grateful for their foundational work in building the "connective tissue" between AI and the TON blockchain.

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 🛠️ Implementation Plan

Follow the progress or contribute via the [todo.md](todo.md) file.
