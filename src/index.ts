// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { payWinner } from "./payout";
import { ethers } from "ethers";

const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.2.0",
    description: "Paid mini-games (coin, lucky, dice) on Base via x402",
  },
  {
    // ми самі задаємо payments в кожному entrypoint
    useConfigPayments: false,
  }
);

// наша таблиця ігор
const GAMES: Record<
  string,
  { price: number; payout: number; winChance: number; game: string }
> = {
  "coin.micro": { price: 0.01, payout: 0.02, winChance: 0.38, game: "coin_flip" },
  "lucky.low": { price: 0.1, payout: 0.2, winChance: 0.45, game: "lucky_number" },
  "dice.mid": { price: 1, payout: 1.7, winChance: 0.4, game: "dice_roll" },
  "dice.high": { price: 10, payout: 14, winChance: 0.35, game: "dice_roll" },
};

const NETWORK =
  process.env.NETWORK || process.env.X402_NETWORK || "base";
const PAY_TO =
  process.env.ADDRESS || process.env.PAY_TO_ADDRESS || "";
const FACILITATOR =
  process.env.FACILITATOR_URL ||
  "https://facilitator.daydreams.systems"; // як у тебе вже стоїть

function addGameEntrypoint(key: keyof typeof GAMES) {
  const cfg = GAMES[key];

  addEntrypoint({
    key,
    // 👇 це головне: тут ми робимо його платним → x402scan не буде казати “No 402 Response”
    payments: {
      price: `$${cfg.price}`,
      network: NETWORK,
      facilitatorUrl: FACILITATOR,
      payTo: PAY_TO,
    },
    handler: async (ctx) => {
      // 1. беремо адресу гравця (фронт має її надіслати)
      const body = ctx.body || {};
      const playerAddress: string | undefined =
        body.playerAddress || body.address || body.wallet;

      // 2. рахуємо win / lose
      const rnd = Math.random();
      const win = rnd < cfg.winChance;

      // 3. якщо виграв і є адреса → пробуємо заплатити
      let payoutResult: any = { paid: false, reason: "not_triggered" };
      if (win && playerAddress) {
        payoutResult = await payWinner(playerAddress, cfg.payout);
      }

      // 4. відповідь гравцю / агента
      return {
        ok: true,
        entrypoint: key,
        spent: `$${cfg.price}`,
        game: cfg.game,
        win,
        chance: cfg.winChance,
        payoutPlanned: `$${cfg.payout}`,
        payout: payoutResult,
        messageUk: win
          ? `✅ Ви заплатили $${cfg.price} і ВИГРАЛИ в ${cfg.game}. Виплата: ${
              payoutResult.paid
                ? "надіслана ✅"
                : `не надіслана ❌ (${payoutResult.reason})`
            }`
          : `❌ Ви заплатили $${cfg.price}, але цього разу ${cfg.game} програна. Спробуйте ще.`,
      };
    },
  });
}

addGameEntrypoint("coin.micro");
addGameEntrypoint("lucky.low");
addGameEntrypoint("dice.mid");
addGameEntrypoint("dice.high");

export default app;
