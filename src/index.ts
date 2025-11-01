// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { payWinner } from "./payout";
import { playGame } from "./games";

// константи по грошах / мережі
const NETWORK = process.env.NETWORK || process.env.X402_NETWORK || "base";
const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems";

// оцей адрес має отримувати гроші ВІД гравців
const PAY_TO = process.env.ADDRESS || process.env.PAY_TO_ADDRESS || "";

if (!PAY_TO) {
  console.warn(
    "⚠️ ADDRESS / PAY_TO_ADDRESS не заданий – x402 покаже free, бо нема кому платити."
  );
}

// карта ігор, тут усе в одному місці
const GAMES: Record<
  string,
  {
    price: string; // саме так, рядок, типу "$0.01" – так хоче x402 :contentReference[oaicite:1]{index=1}
    payout: number; // скільки USDC віддамо при win
    winChance: number;
    engine: string; // як гра називається всередині
    description: string;
  }
> = {
  "coin.micro": {
    price: "$0.01",
    payout: 0.02,
    winChance: 0.38,
    engine: "coin_flip",
    description: "Flip a coin for x2"
  },
  "lucky.low": {
    price: "$0.10",
    payout: 0.2,
    winChance: 0.45,
    engine: "lucky_number",
    description: "Guess 1-10"
  },
  "dice.mid": {
    price: "$1.00",
    payout: 1.7,
    winChance: 0.4,
    engine: "dice_roll",
    description: "Roll 1-6"
  },
  "dice.high": {
    price: "$10.00",
    payout: 14,
    winChance: 0.35,
    engine: "dice_roll",
    description: "High stakes dice"
  },
};

const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.3.0",
    description: "Paid mini-games (coin, lucky, dice) on Base via x402",
  },
  {
    // ми самі будемо казати для кожного ендпоінта скільки він коштує
    useConfigPayments: false,
  }
);

// утиліта: сформувати 402 як в доках
function make402(key: string) {
  const cfg = GAMES[key];

  return new Response(
    JSON.stringify({
      message: "Payment Required",
      // саме отакий масив приймає більшість реалізацій x402: список того, що ми приймаємо
      // :contentReference[oaicite:2]{index=2}
      accept: [
        {
          price: cfg.price,
          network: NETWORK,
          payTo: PAY_TO,
          facilitatorUrl: FACILITATOR_URL,
          description: cfg.description,
          meta: {
            entrypoint: key,
          },
        },
      ],
    }),
    {
      status: 402,
      headers: {
        "content-type": "application/json",
      },
    }
  );
}

// перевірка “чи заплачено”
function isPaid(ctx: any): boolean {
  // у різних інтеграцій назви трохи плавають, тому дивимось кілька варіантів
  const h = ctx?.req?.headers || ctx?.headers || {};

  const paidHeader =
    h["x-402-payment-status"] ||
    h["x402-payment-status"] ||
    h["x-402-status"] ||
    h["x402-status"];

  if (typeof paidHeader === "string" && paidHeader.toLowerCase() === "paid") {
    return true;
  }

  // інколи клієнти прокидають proof у тілі
  const body = ctx?.body || {};
  if (body?.x402?.status === "paid" || body?.__x402_paid === true) {
    return true;
  }

  return false;
}

function registerGame(key: keyof typeof GAMES) {
  const cfg = GAMES[key];

  addEntrypoint({
    key,
    // 👇 це метадані, щоб ui не писав FREE
    payments: {
      // формат як у fastapi-x402 → "$0.01" :contentReference[oaicite:3]{index=3}
      price: cfg.price,
      network: NETWORK,
      facilitatorUrl: FACILITATOR_URL,
      payTo: PAY_TO,
    },
    handler: async (ctx: any) => {
      // 1. якщо не заплачено → 402
      if (!isPaid(ctx)) {
        return make402(key);
      }

      // 2. граємо
      const body = ctx?.body || {};
      const gameResult = playGame({
        game: cfg.engine,
        choice: body.choice,
        guess: body.guess,
      });

      // 3. рандом по шансам (це саме казино 😉)
      const roll = Math.random();
      const win = roll < cfg.winChance;

      // 4. якщо виграв і він дав адресу → платимо
      const playerAddress =
        body.playerAddress || body.address || body.wallet || null;

      let payout: any = { paid: false, reason: "not_triggered" };
      if (win && playerAddress) {
        payout = await payWinner(playerAddress, cfg.payout);
      }

      // 5. віддати результат
      return {
        ok: true,
        entrypoint: key,
        paid: true,
        price: cfg.price,
        game: cfg.engine,
        gameResult,
        win,
        winChance: cfg.winChance,
        payoutPlanned: cfg.payout,
        payout,
        network: NETWORK,
        messageUk: win
          ? `✅ Ви заплатили ${cfg.price} і виграли! Виплата: ${
              payout.paid ? "надіслана ✅" : `не надіслана ❌ (${payout.reason})`
            }`
          : `❌ Ви заплатили ${cfg.price}, але цього разу не пощастило. Спробуйте ще.`,
      };
    },
  });
}

// реєструємо всі 4
registerGame("coin.micro");
registerGame("lucky.low");
registerGame("dice.mid");
registerGame("dice.high");

export default app;
