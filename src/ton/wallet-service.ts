import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from "@ton/crypto";
import { WalletContractV5R1, TonClient, fromNano } from "@ton/ton";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { getCachedHttpEndpoint } from "./endpoint.js";
import { fetchWithTimeout } from "../utils/fetch.js";
import { TELETON_ROOT } from "../workspace/paths.js";
import { tonapiFetch, COINGECKO_API_URL } from "../constants/api-endpoints.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("TON");

const WALLET_FILE = join(TELETON_ROOT, "wallet.json");

// ─── Singleton Caches ────────────────────────────────────────────────
/** Cached wallet data (invalidated on saveWallet) */
let _walletCache: WalletData | null | undefined; // undefined = not yet loaded

export interface WalletData {
  version: "w5r1";
  address: string;
  publicKey: string;
  mnemonic: string[];
  createdAt: string;
}

/**
 * Generate a new TON wallet (W5R1)
 */
export async function generateWallet(): Promise<WalletData> {
  const mnemonic = await mnemonicNew(24);
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const address = wallet.address.toString({ bounceable: true, testOnly: false });

  return {
    version: "w5r1",
    address,
    publicKey: keyPair.publicKey.toString("hex"),
    mnemonic,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Save wallet to file
 */
export function saveWallet(wallet: WalletData): void {
  const dir = dirname(WALLET_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2), { encoding: "utf-8", mode: 0o600 });
  _walletCache = wallet;
}

/**
 * Load wallet. Priority:
 * 1. Provided mnemonic (in-memory, multi-tenant)
 * 2. Cached wallet
 * 3. Local wallet.json file
 */
export async function loadWallet(mnemonic?: string[]): Promise<WalletData | null> {
  if (mnemonic) {
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    return {
      version: "w5r1",
      address: wallet.address.toString({ bounceable: true, testOnly: false }),
      publicKey: keyPair.publicKey.toString("hex"),
      mnemonic,
      createdAt: new Date().toISOString(),
    };
  }

  if (_walletCache !== undefined) return _walletCache;

  if (!existsSync(WALLET_FILE)) {
    _walletCache = null;
    return null;
  }

  try {
    const content = readFileSync(WALLET_FILE, "utf-8");
    const parsed = JSON.parse(content);
    _walletCache = parsed as WalletData;
    return _walletCache;
  } catch (error) {
    log.error({ err: error }, "Failed to load wallet from file");
    _walletCache = null;
    return null;
  }
}

/**
 * Get KeyPair. Priority:
 * 1. Provided mnemonic
 * 2. Mnemonic from loaded wallet
 */
export async function getKeyPair(mnemonic?: string[]): Promise<{ publicKey: Buffer; secretKey: Buffer } | null> {
  if (mnemonic) {
    return await mnemonicToPrivateKey(mnemonic);
  }

  const wallet = await loadWallet();
  if (!wallet) return null;

  return await mnemonicToPrivateKey(wallet.mnemonic);
}

/**
 * Get wallet address
 */
export async function getWalletAddress(mnemonic?: string[]): Promise<string | null> {
  const wallet = await loadWallet(mnemonic);
  return wallet?.address || null;
}

/**
 * Import a wallet from an existing 24-word mnemonic
 */
export async function importWallet(mnemonic: string[]): Promise<WalletData> {
  const valid = await mnemonicValidate(mnemonic);
  if (!valid) {
    throw new Error("Invalid mnemonic");
  }

  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  return {
    version: "w5r1",
    address: wallet.address.toString({ bounceable: true, testOnly: false }),
    publicKey: keyPair.publicKey.toString("hex"),
    mnemonic,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get wallet balance from TON Center API
 */
export async function getWalletBalance(address: string): Promise<{
  balance: string;
  balanceNano: string;
} | null> {
  try {
    const endpoint = await getCachedHttpEndpoint();
    const client = new TonClient({ endpoint });
    const { Address } = await import("@ton/core");
    const addressObj = Address.parse(address);

    const balance = await client.getBalance(addressObj);
    return {
      balance: fromNano(balance),
      balanceNano: balance.toString(),
    };
  } catch (error) {
    log.error({ err: error }, "Failed to get balance");
    return null;
  }
}

/** Cached TON price (30s TTL) */
const TON_PRICE_CACHE_TTL_MS = 30_000;
let _tonPriceCache: { usd: number; source: string; timestamp: number } | null = null;

/**
 * Get TON/USD price
 */
export async function getTonPrice(): Promise<{
  usd: number;
  source: string;
  timestamp: number;
} | null> {
  if (_tonPriceCache && Date.now() - _tonPriceCache.timestamp < TON_PRICE_CACHE_TTL_MS) {
    return { ..._tonPriceCache };
  }

  try {
    const response = await tonapiFetch(`/rates?tokens=ton&currencies=usd`);
    if (response.ok) {
      const data = await response.json();
      const price = data?.rates?.TON?.prices?.USD;
      if (typeof price === "number" && price > 0) {
        _tonPriceCache = { usd: price, source: "TonAPI", timestamp: Date.now() };
        return _tonPriceCache;
      }
    }
  } catch {}

  try {
    const response = await fetchWithTimeout(
      `${COINGECKO_API_URL}/simple/price?ids=the-open-network&vs_currencies=usd`
    );
    if (response.ok) {
      const data = await response.json();
      const price = data["the-open-network"]?.usd;
      if (typeof price === "number" && price > 0) {
        _tonPriceCache = { usd: price, source: "CoinGecko", timestamp: Date.now() };
        return _tonPriceCache;
      }
    }
  } catch (error) {
    log.error({ err: error }, "Failed to get TON price");
  }

  return null;
}
