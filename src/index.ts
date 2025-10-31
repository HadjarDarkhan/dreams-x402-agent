// src/index.ts
import { createAgentApp } from "@lucid-dreams/agent-kit";
import { playGame } from "./games";

const NETWORK =
  process.env.NETWORK || process.env.X402_NETWORK || "base-sepolia";
const ADDRESS =
  process.env.ADDRESS || process.env.PAY_TO_ADDRESS || "";
const FACILITATOR =
  process.env.FACILITATOR_URL || "https://facilitator.daydreams.systems";

const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent",
    version: "1.1.1",
    description: "Paid mini-games (coin, lucky, dice) on Base via x402",
  },
  {
    useConfigPayments: false, // ми самі зараз явно пропишемо
  }
);

// далі 4 ендпоінти
function makePaidEP(key: string, price: string, game: string) {
  addEntrypoint({
    key,
    payments: {
      price,
      network: NETWORK,
      facilitatorUrl: FACILITATOR,
      payTo: ADDRESS,
    },
    handler: async (ctx) => {
      const body = ctx.body || {};
      const result = playGame({
        game,
        choice: body.choice || body.input || null,
        guess: body.guess || body.number || null,
      });

      return {
        spent: price,
        network: NETWORK,
        payTo: ADDRESS,
        game: result.game,
        win: (result as any).win,
        messageUk: result.ok
          ? `✅ Ви заплатили ${price}, грали в ${result.game}. ${result.text}`
          : `❌ Ви заплатили ${price}, але сталася помилка: ${result.text}`,
      };
    },
  });
}

makePaidEP("coin.micro", "$0.01", "coin_flip");
makePaidEP("lucky.low", "$0.10", "lucky_number");
makePaidEP("dice.mid", "$1.00", "dice_roll");
makePaidEP("dice.high", "$10.00", "dice_roll");

export default app;
