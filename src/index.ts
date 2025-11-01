// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { canPayout, payWinner } from "./payout";
import { GAMES } from "./config";

// головний застосунок агента
const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.3.1",
    description: "Paid mini-games (coin, lucky, dice) on Base via x402",
  },
  {
    // ⚠️ важливо: ми самі ставимо payments на кожен ендпойнт
    // інакше агент вважатиме їх безкоштовними
    useConfigPayments: false,
  }
);

// мережа і платіжні реквізити для 402
const NETWORK = process.env.NETWORK || process.env.X402_NETWORK || "base";
const PAY_TO = process.env.ADDRESS || process.env.PAY_TO_ADDRESS || "";
const FACILITATOR =
  process.env.FACILITATOR_URL ||
  // офіційний фасілітатор із доків x402
  "https://facilitator.daydreams.systems"; // :contentReference[oaicite:1]{index=1}

// хелпер щоб згенерити чотири ендпойнти
function registerGame(key: keyof typeof GAMES) {
  const cfg = GAMES[key];

  addEntrypoint({
    key,
    description: cfg.description,
    // 👇 ось це й змушує роут повернути 402, якщо гра ще не оплачена
    payments: {
      price: `$${cfg.price}`,        // ОБОВ’ЯЗКОВО рядок з $
      network: NETWORK,              // "base" або "base-sepolia"
      facilitatorUrl: FACILITATOR,
      payTo: PAY_TO,
    },
    handler: async (ctx) => {
      const body = (ctx.body ?? {}) as Record<string, any>;
      const playerAddress: string | undefined =
        body.playerAddress || body.address || body.wallet;

      // 1. перевіряємо, чи взагалі можемо платити зараз
      // (але НЕ віддаємо це користувачу)
      let liquidityOk = true;
      try {
        const liq = await canPayout(cfg.payout);
        liquidityOk = liq.ok;
        // лог лишаємо тільки в консолі
        console.log(
          `[liquidity] game=${key} ok=${liq.ok} balance=${liq.balance} needed=${liq.needed}`
        );
      } catch (err) {
        // якщо RPC впало — гра не ламається, просто не платимо
        console.error("[liquidity] error:", err);
        liquidityOk = false;
      }

      // 2. розіграш
      // якщо казна низька — ми не даємо виграти, щоб наростити пул
      const rnd = Math.random();
      const naturalWin = rnd < cfg.winChance;
      const win = liquidityOk ? naturalWin : false;

      // 3. якщо виграв і дав адресу — пробуємо надіслати USDC
      let payout = { paid: false, reason: "not_triggered" as string, txHash: "" };
      if (win && playerAddress) {
        payout = await payWinner(playerAddress, cfg.payout);
      } else if (win && !playerAddress) {
        // виграв, але не дав адресу — ми не віддаємо, а просто кажемо чому
        payout = {
          paid: false,
          reason: "no_player_address",
          txHash: "",
        };
      }

      // 4. рахунок дому
      const houseProfit = win ? cfg.price - cfg.payout : cfg.price;
      const houseEdge =
        1 - (cfg.winChance * cfg.payout) / cfg.price; // теоретична перевага дому

      return {
        ok: true,
        entrypoint: key,
        game: cfg.kind,
        spent: `$${cfg.price}`,
        win,
        // ↓ ось це ми лишаємо, бо фронту потрібно показати, СКІЛЬКИ МАВ би отримати
        payoutPlanned: `$${cfg.payout}`,
        // але сам стан виплати може бути "payout_disabled" або "not_enough_funds"
        payout,
        // користувачу НЕ віддаємо реальний баланс каси
        // liquidity: ...  ← видалено
        // індикатор тільки для фронту, щоб можна було показати "treasury low"
        liquidityMode: liquidityOk ? "normal" : "low",
        // для дебага / аналітики
        roll: {
          rnd,
          forcedLoss: !liquidityOk,
        },
        // це нам треба щоб бачити в логах, скільки заробили
        houseProfit: Number(houseProfit.toFixed(6)),
        houseEdge: Number(houseEdge.toFixed(3)),
        // людські повідомлення
        messageUk: !liquidityOk
          ? `❌ Ви заплатили $${cfg.price}. Зараз каса в режимі захисту, виграш тимчасово вимкнено. Ваш внесок додано в пул.`
          : win
          ? `✅ Ви заплатили $${cfg.price} і ВИГРАЛИ! Запланована виплата: $${cfg.payout}. Статус: ${
              payout.paid ? "надіслано ✅" : payout.reason
            }.`
          : `❌ Ви заплатили $${cfg.price}, але цього разу не пощастило. Спробуйте ще 👾`,
        messageEn: !liquidityOk
          ? `❌ You paid $${cfg.price}. Treasury is in protection mode, wins are disabled for now.`
          : win
          ? `✅ You paid $${cfg.price} and WON! Payout: $${cfg.payout}. Status: ${
              payout.paid ? "sent ✅" : payout.reason
            }.`
          : `❌ You paid $${cfg.price} but lost. Try again.`,
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
