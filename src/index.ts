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
    // це вмикає читання цін з env / конфіга
    useConfigPayments: true,
  }
);

// 👉 1) робимо м'який парсер, щоб приймав і {game:"..."}, і {input:"..."}, і {number:...}
function normalize(body: any) {
  const b = body || {};

  let game =
    b.game ||
    b.mode ||
    b.type ||
    (b.input &&
      String(b.input).toLowerCase().includes("lucky") &&
      "lucky_number") ||
    (b.input &&
      String(b.input).toLowerCase().includes("dice") &&
      "dice_roll") ||
    "coin_flip";

  const choice = b.choice || b.input || b.user_input || null;
  const guess = b.guess || b.number || b.dice || null;

  return { game, choice, guess };
}

/**
 * ВАЖЛИВО:
 * у x402 ціна фіксується на рівні ендпоінта (ще до оплати) — це прямо в протоколі. :contentReference[oaicite:2]{index=2}
 * Тому ми робимо КІЛЬКА ендпоінтів, а не одну "магічну" гру.
 */
const ENTRYPOINTS = [
  // мінімалка: завжди coin flip
  {
    key: "coin.micro",
    price: "$0.01",
    defaultGame: "coin_flip",
  },
  // трохи дорожче: lucky
  {
    key: "lucky.low",
    price: "$0.10",
    defaultGame: "lucky_number",
  },
  // середня: dice
  {
    key: "dice.mid",
    price: "$1",
    defaultGame: "dice_roll",
  },
  // хайролл: теж dice, але шанс можна збільшити у games.ts (потім)
  {
    key: "dice.high",
    price: "$10",
    defaultGame: "dice_roll",
  },
];

for (const ep of ENTRYPOINTS) {
  addEntrypoint({
    key: ep.key,
    // agent-kit сам зробить /entrypoints/<key>/invoke
    handler: async (ctx) => {
      const payload = normalize(ctx.body);
      // якщо юзер не прислав game → беремо дефолт з ендпоінта
      if (!payload.game) {
        payload.game = ep.defaultGame;
      }

      const result = playGame(payload);

      // ❗️тут ми формуємо ЛЮДИНО-дружню відповідь
      return {
        ok: result.ok,
        game: result.game,
        spent: ep.price, // 👈 ти витратив
        tier: ep.key,
        messageUk: result.ok
          ? `✅ Ви витратили ${ep.price} і зіграли в ${result.game}. ${result.text}`
          : `❌ Ви витратили ${ep.price}, але сталася помилка: ${result.text}`,
        messageEn: result.ok
          ? `✅ You spent ${ep.price} and played ${result.game}. ${result.text}`
          : `❌ You spent ${ep.price}, but there was an error: ${result.text}`,
        ...result,
      };
    },
  });
}

export default app;
