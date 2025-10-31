// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { playGame } from "./games"; // ми це вже робили

const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.0.2",
    description: "x402 mini-games (coin / lucky / dice) on Base, powered by daydreams",
  },
  {
    useConfigPayments: true,
  }
);

// 🔧 перетворювач того, що шле x402scan → на те, що чекає наш код
function normalizePayload(raw: any) {
  const body = raw ?? {};

  // 1) яку гру граємо
  // x402scan майже завжди нічого не шле → ставимо coin_flip
  const game =
    body.game ||
    body.mode ||
    body.type ||
    "coin_flip";

  // 2) що саме вибрав юзер
  // у твоєму скріні було "HEADS" — тобто швидше за все летить поле input
  const choiceRaw = body.choice || body.input || body.user_input || body.option;
  const choice = choiceRaw ? String(choiceRaw).toLowerCase() : "heads";

  // 3) для lucky/dice
  const guess =
    body.guess ||
    body.number ||
    body.dice ||
    null;

  return { game, choice, guess };
}

// ми ж робили 4 тира → залишаємо
const tiers = [
  { key: "micro", price: "$0.01" },
  { key: "low", price: "$0.10" },
  { key: "mid", price: "$1" },
  { key: "high", price: "$10" },
];

for (const tier of tiers) {
  addEntrypoint({
    key: `play.${tier.key}`,
    // agent-kit сам повісить /entrypoints/play.X/invoke
    handler: async (ctx) => {
      // ctx.body може бути undefined → ловимо
      const payload = normalizePayload(ctx.body);
      // віддаємо уніфікований формат
      const result = await playGame(payload);
      return {
        tier: tier.key,
        paid: true,
        ...result,
      };
    },
  });
}

export default app;
