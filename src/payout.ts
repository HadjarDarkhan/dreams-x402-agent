// src/payout.ts
import { ethers } from "ethers";

// офіційний USDC від Circle на Base
// https://developers.circle.com/... і https://basescan.org/... дають однакову адресу :contentReference[oaicite:5]{index=5}
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const provider = new ethers.JsonRpcProvider(RPC_URL); // ethers v6 :contentReference[oaicite:6]{index=6}

const PRIVATE_KEY = process.env.PAYOUT_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.warn("⚠️ No PAYOUT_PRIVATE_KEY set — payouts will be disabled");
}

const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
const usdc = wallet
  ? new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet)
  : null;

const SAFETY_USDC =
  process.env.PAYOUT_SAFETY_USDC !== undefined
    ? Number(process.env.PAYOUT_SAFETY_USDC)
    : 1.0; // не опускаємось нижче 1 USDC

// amount — у ДОЛАРАХ (0.02, 0.2, 1.7 ...)
export async function payWinner(
  playerAddress: string,
  amount: number
): Promise<{
  paid: boolean;
  txHash?: string;
  reason?: string;
}> {
  if (!wallet || !usdc) {
    return { paid: false, reason: "payout_disabled" };
  }

  if (!ethers.isAddress(playerAddress)) {
    return { paid: false, reason: "invalid_player_address" };
  }

  const balanceRaw = await usdc.balanceOf(wallet.address);
  const balance = Number(ethers.formatUnits(balanceRaw, 6)); // USDC 6 decimals

  // чи вистачає після SAFETY
  if (balance - amount < SAFETY_USDC) {
    return { paid: false, reason: "not_enough_funds" };
  }

  const amountRaw = ethers.parseUnits(amount.toFixed(6), 6);

  const tx = await usdc.transfer(playerAddress, amountRaw); // звичайний ERC20 transfer — як у прикладах ethers.js :contentReference[oaicite:7]{index=7}
  const receipt = await tx.wait();

  return { paid: true, txHash: receipt.hash };
}
