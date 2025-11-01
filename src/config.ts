// src/config.ts
export const NETWORK = process.env.NETWORK || process.env.X402_NETWORK || "base";
export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems";
export const PAY_TO = process.env.ADDRESS || process.env.PAY_TO_ADDRESS || "";
