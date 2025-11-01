// src/payout.ts
import { ethers } from "ethers";

// офіційний USDC на Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// 👇 функція, яка прибирає \n, \r, пробіли і додає 0x якщо його нема
function normalizePrivateKey(pk?: string | null): string | null {
  if (!pk) return null;
  // прибрати початок/кінець
  let cleaned = pk.trim();
  // прибрати всі переноси і пробіли всередині
  cleaned = cleaned.replace(/[\r\n\s]+/g, "");
  // додати 0x якщо нема
  if (!cleaned.startsWith("0x")) {
    cleaned = "0x" + cleaned;
  }
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
  } else {
    console.warn("⚠️ PAYOUT_PRIVATE_KEY is not set — payouts disabled");
  }
} catch (err) {
  console.error("❌ Invalid PAYOUT_PRIVATE_KEY, payouts disabled:", err);
  wallet = null;
  usdc = null;
}

// скільки залишати “в касі” (не видавати все)
const SAFETY_USDC =
  process.env.PAYOUT_SAFETY_USDC !== undefined
    ? Number(process.env.PAYOUT_SAFETY_USDC)
    : 1.0;

export async function payWinner(playerAddress: string, amount: number) {
  if (!wallet || !usdc) {
    return { paid: false, reason: "payout_disabled" };
  }

  if (!ethers.isAddress(playerAddress)) {
    return { paid: false, reason: "invalid_player_address" };
  }

  // баланс у USDC (6 знаків)
  const balanceRaw = await usdc.balanceOf(wallet.address);
  const balance = Number(ethers.formatUnits(balanceRaw, 6));

  if (balance - amount < SAFETY_USDC) {
    return { paid: false, reason: "not_enough_funds" };
  }

  const amountRaw = ethers.parseUnits(amount.toFixed(6), 6);
  const tx = await usdc.transfer(playerAddress, amountRaw);
  const receipt = await tx.wait();

  return { paid: true, txHash: receipt.hash };
}
