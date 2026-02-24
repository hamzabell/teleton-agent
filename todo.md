# Headless Teleton Agent: DeFAI SDK Implementation Plan

This document outlines the step-by-step refactoring of the `teleton-agent` codebase into a multi-tenant, headless SDK focused on TON DeFi trading (Ston.fi, DeDust, and Storm Trade).

## **Project Goal**
Transform a single-user Telegram bot into a **Headless SDK** that runs on a single VPS. It must support multiple users by injecting wallet mnemonics and strategies at runtime, bypassing local file dependencies (`config.yaml`, `wallet.json`), and notifying users via a centralized Telegram Bot.

---

## **Phase 1: Codebase Decoupling & Cleanup**
*Goal: Remove all non-essential features to reduce the footprint and security surface.*

- [x] **1.1 Remove CLI & WebUI Modules**
- [x] **1.2 Strip Non-DeFi Tools**
- [x] **1.3 Refactor Path Management**
- [x] **2.1 Stateless WalletService**
- [x] **2.2 Headless AgentRuntime**
- [x] **2.3 Context Injection in Tools**
- [x] **3.1 Implement Storm Trade Plugin (DRAFT)**
- [ ] **3.2 Shared Market Observer**
- [ ] **4.1 Bot Notification Service**
- [ ] **4.2 Decouple TelegramBridge**
- [x] **5.1 Headless SDK Wrapper**
- [x] **5.2 SaaS Worker Entry Point**


---

## **Technical Implementation Details for Agents**

### **Execution Context**
When an agent is triggered, the SaaS Manager must provide:
```typescript
interface ExecutionContext {
  userId: string;
  wallet: {
    mnemonic: string; // Decrypted from SaaS Vault
    version: "v4r2" | "v5r1";
  };
  strategy: {
    soul: string; // The system prompt (e.g. "You are a conservative farmer...")
    riskParameters: any;
  };
  notification: {
    tgChatId: string;
  };
}
```

### **Tool Refactoring Pattern**
Update all DEX tools to follow this pattern:
```typescript
// OLD
const wallet = loadWallet(); // Reads from file

// NEW
const wallet = context.injectedWallet; // Provided by Headless SDK
```

---

## **Definition of Done**
1.  **Zero File Dependency:** The agent can run and execute a Ston.fi swap without any `.yaml` or `.json` files in the filesystem.
2.  **Multi-tenant Safety:** Two agents can run in parallel with different mnemonics without cross-talk.
3.  **Storm Trade Support:** The agent can successfully open a 2x Long position on Storm Trade via code.
4.  **Bot Notifications:** Alerts are sent via the App Bot, not the User Client.
