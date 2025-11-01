// src/payout.ts
import { ethers } from "ethers";

// офіційний USDC на Base mainnet
// https://docs.base.org/token-list  (дивись USDC) :contentReference[oaicite:2]{index=2}
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// приберемо \r \n і додамо 0x якщо нема
function normalizePrivateKey(raw?: string | null): string | null {
  if (!raw) return null;
  let cleaned = raw.trim().replace(/[\r\n\s]+/g, "");
  if (!cleaned.startsWith("0x")) cleaned = "0x" + cleaned;
  return cleaned;
}

const RAW_PK = process.env.PAYOUT_PRIVATE_KEY;
const NORMALIZED_PK = normalizePrivateKey(RAW_PK);

let wallet: ethers.Wallet | null = null;
let usdc: ethers.Contract | null = null;

try {
  if (NORMALIZED_PK) {
    wallet = new ethers.Wallet(NORMALIZED_PK, provider);
    usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
    console.log("[payout] wallet loaded:", wallet.address);
  } else {
    console.warn("[payout] PAYOUT_PRIVATE_KEY not set — payouts disabled");
  }
} catch (err) {
  console.error("[payout] invalid PAYOUT_PRIVATE_KEY → payouts disabled", err);
  wallet = null;
  usdc = null;
}

// мінімум, який ми НЕ чіпаємо
const SAFETY_USDC =
  process.env.PAYOUT_SAFETY_USDC !== undefined
    ? Number(process.env.PAYOUT_SAFETY_USDC)
    : 1.0; // 1 USDC за замовчуванням

// ця функція тільки дивиться, чи ми МОЖЕМО заплатити
export async function canPayout(amount: number) {
  if (!wallet || !usdc) {
    return { ok: false, reason: "payout_disabled", balance: 0, needed: amount };
  }

  const balRaw = await usdc.balanceOf(wallet.address);
  const balance = Number(ethers.formatUnits(balRaw, 6));
  const needed = amount + SAFETY_USDC;

  if (balance >= needed) {
    return { ok: true, balance, needed };
  }
  return { ok: false, reason: "not_enough_funds", balance, needed };
}

// а ця вже реально шле USDC
export async function payWinner(playerAddress: string, amount: number) {
  if (!wallet || !usdc) {
    return { paid: false, reason: "payout_disabled" };
  }

  if (!ethers.isAddress(playerAddress)) {
    return { paid: false, reason: "invalid_player_address" };
  }

  // ще раз перевіримо баланс (про всяк)
  const check = await canPayout(amount);
  if (!check.ok) {
    return { paid: false, reason: check.reason ?? "not_enough_funds" };
  }

  const amountRaw = ethers.parseUnits(amount.toFixed(6), 6);
  const tx = await usdc.transfer(playerAddress, amountRaw);
  const receipt = await tx.wait();

  return {
    paid: true,
    txHash: receipt.hash,
  };
}
