// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { payWinner, canPayout } from "./payout";

const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.3.0",
    description: "Paid mini-games (coin, lucky, dice) on Base via x402",
  },
  {
    // самі ставимо payments
    useConfigPayments: false,
  }
);

// таблиця ігор (price = що платить гравець, payout = що ми даємо при win)
const GAMES: Record<
  string,
  { price: number; payout: number; winChance: number; kind: string }
> = {
  "coin.micro": {
    price: 0.01,
    payout: 0.02,
    winChance: 0.38,
    kind: "coin_flip",
  },
  "lucky.low": {
    price: 0.1,
    payout: 0.2,
    winChance: 0.45,
    kind: "lucky_number",
  },
  "dice.mid": {
    price: 1,
    payout: 1.7,
    winChance: 0.4,
    kind: "dice_roll",
  },
  "dice.high": {
    price: 10,
    payout: 14,
    winChance: 0.35,
    kind: "dice_roll",
  },
};

const NETWORK =
  process.env.NETWORK || process.env.X402_NETWORK || "base";
const PAY_TO = process.env.ADDRESS || process.env.PAY_TO_ADDRESS || "";
const FACILITATOR =
  process.env.FACILITATOR_URL ||
  "https://facilitator.daydreams.systems";

function addGameEntrypoint(key: keyof typeof GAMES) {
  const cfg = GAMES[key];

  addEntrypoint({
    key,
    // 402 тут ✅
    payments: {
      price: `$${cfg.price}`,
      network: NETWORK,
      facilitatorUrl: FACILITATOR,
      payTo: PAY_TO,
    },
    handler: async (ctx) => {
      const body = ctx.body || {};
      const playerAddress: string | undefined =
        body.playerAddress || body.address || body.wallet;

      // 1. перевіряємо, чи можемо реально заплатити
      const liq = await canPayout(cfg.payout);
      const lowLiquidity = !liq.ok;

      // 2. Розіграш
      let win = false;
      let rollInfo: any = {};

      if (lowLiquidity) {
        // 💡 режим “касі треба підрости”
        win = false;
        rollInfo = {
          forcedLoss: true,
          msg: "treasury too low, payout skipped",
        };
      } else {
        // нормальний режим
        const rnd = Math.random();
        win = rnd < cfg.winChance;
        rollInfo = { rnd, forcedLoss: false };
      }

      // 3. якщо виграв — платимо
      let payoutResult: any = { paid: false, reason: "not_triggered" };
      if (win && playerAddress) {
        payoutResult = await payWinner(playerAddress, cfg.payout);
      }

      // 4. скільки заробила хата на цій грі
      const houseProfit = win ? cfg.price - cfg.payout : cfg.price;
      const houseEdge =
        1 - (cfg.winChance * cfg.payout) / cfg.price; // теорія, як у казино :contentReference[oaicite:2]{index=2}

      return {
        ok: true,
        entrypoint: key,
        game: cfg.kind,
        spent: `$${cfg.price}`,
        win,
        payoutPlanned: `$${cfg.payout}`,
        payout: payoutResult,
        liquidityMode: lowLiquidity ? "low" : "normal",
        liquidity: liq,
        roll: rollInfo,
        houseProfit,
        houseEdge: Number(houseEdge.toFixed(3)),
        messageUk: lowLiquidity
          ? `❌ Ви заплатили $${cfg.price}. Зараз каса в режимі захисту, тому виграш не можливий. Ваш внесок додано. Спробуйте ще раз — шанси повернуться.`
          : win
          ? `✅ Ви заплатили $${cfg.price} і ВИГРАЛИ! Запланована виплата: $${cfg.payout}. Статус переказу: ${
              payoutResult.paid ? "надіслано ✅" : payoutResult.reason
            }.`
          : `❌ Ви заплатили $${cfg.price}, але цього разу не пощастило. Пробуйте ще 💚`,
        messageEn: lowLiquidity
          ? `❌ You paid $${cfg.price}. Treasury is in protection mode, so winning is disabled for now. Your payment increased the pool. Try again in a moment.`
          : win
          ? `✅ You paid $${cfg.price} and WON! Payout: $${cfg.payout}. Tx: ${
              payoutResult.txHash || payoutResult.reason
            }`
          : `❌ You paid $${cfg.price} but lost. Try again.`,
      };
    },
  });
}

addGameEntrypoint("coin.micro");
addGameEntrypoint("lucky.low");
addGameEntrypoint("dice.mid");
addGameEntrypoint("dice.high");

export default app;
