// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { playGame } from "./games";

const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.1.0",
    description: "Paid mini-games (coin, lucky, dice) on Base via x402",
  },
  {
    // берeмо з env: X402_NETWORK, FACILITATOR_URL, PAY_TO_ADDRESS
    useConfigPayments: true,
  }
);

// 🟩 допоміжний парсер
function normalize(body: any) {
  const b = body || {};
  const choice = b.choice || b.input || b.user_input || null;
  const guess = b.guess || b.number || b.dice || null;
  return { choice, guess, body: b };
}

// 🟩 1. $0.01 — coin flip
addEntrypoint({
  key: "coin.micro",
  // ← ВАЖЛИВО: вказуємо оплату прямо тут
  payments: {
    price: "$0.01",
    network: process.env.X402_NETWORK,
    facilitatorUrl: process.env.FACILITATOR_URL,
    payTo: process.env.PAY_TO_ADDRESS,
  },
  handler: async (ctx) => {
    const parsed = normalize(ctx.body);
    const result = playGame({ game: "coin_flip", ...parsed });
    return {
      spent: "$0.01",
      ...result,
      message:
        result.ok
          ? `✅ You spent $0.01 and played coin_flip. ${result.text}`
          : `❌ You spent $0.01 but failed: ${result.text}`,
    };
  },
});

// 🟩 2. $0.10 — lucky number
addEntrypoint({
  key: "lucky.low",
  payments: {
    price: "$0.10",
    network: process.env.X402_NETWORK,
    facilitatorUrl: process.env.FACILITATOR_URL,
    payTo: process.env.PAY_TO_ADDRESS,
  },
  handler: async (ctx) => {
    const parsed = normalize(ctx.body);
    const result = playGame({ game: "lucky_number", ...parsed });
    return {
      spent: "$0.10",
      ...result,
      message:
        result.ok
          ? `✅ You spent $0.10 and played lucky_number. ${result.text}`
          : `❌ You spent $0.10 but failed: ${result.text}`,
    };
  },
});

// 🟩 3. $1 — dice
addEntrypoint({
  key: "dice.mid",
  payments: {
    price: "$1.00",
    network: process.env.X402_NETWORK,
    facilitatorUrl: process.env.FACILITATOR_URL,
    payTo: process.env.PAY_TO_ADDRESS,
  },
  handler: async (ctx) => {
    const parsed = normalize(ctx.body);
    const result = playGame({ game: "dice_roll", ...parsed });
    return {
      spent: "$1.00",
      ...result,
      message:
        result.ok
          ? `✅ You spent $1.00 and played dice_roll. ${result.text}`
          : `❌ You spent $1.00 but failed: ${result.text}`,
    };
  },
});

// 🟩 4. $10 — dice highroll
addEntrypoint({
  key: "dice.high",
  payments: {
    price: "$10.00",
    network: process.env.X402_NETWORK,
    facilitatorUrl: process.env.FACILITATOR_URL,
    payTo: process.env.PAY_TO_ADDRESS,
  },
  handler: async (ctx) => {
    const parsed = normalize(ctx.body);
    const result = playGame({ game: "dice_roll", ...parsed });
    return {
      spent: "$10.00",
      ...result,
      message:
        result.ok
          ? `✅ You spent $10.00 and played dice_roll (high). ${result.text}`
          : `❌ You spent $10.00 but failed: ${result.text}`,
    };
  },
});

export default app;
