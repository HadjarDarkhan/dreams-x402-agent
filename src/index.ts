import { createAgentApp } from "@lucid-dreams/agent-kit";
import { z } from "zod";
import { runGame } from "./games";

const payTo = process.env.PAY_TO_ADDRESS as `0x${string}` | undefined;
const facilitatorUrl =
  process.env.FACILITATOR_URL ??
  "https://x402.cdp.coinbase.com/facilitator";
const network = (process.env.X402_NETWORK as any) ?? "base";

// create app that already has 402 + 8004 hooks (as in X posts) citeturn1search4turn1search8
const { app, addEntrypoint } = createAgentApp(
  {
    name: "Ponzi MiniGames x402 Agent (Lucid)",
    version: "1.0.0",
    description: "x402 mini-games (coin flip, lucky number, dice) built on @lucid-dreams/agent-kit"
  },
  {
    useConfigPayments: true,
    config: {
      payments: {
        payTo: (payTo ??
          "0x0000000000000000000000000000000000000000") as `0x${string}`,
        facilitatorUrl,
        network,
        defaultPrice: "$0.01"
      }
    }
  }
);

// спільна схема
const InputSchema = z.object({
  game: z.enum(["coin_flip", "lucky_number", "dice_roll"]),
  choice: z.string().optional(),
  guess: z.number().int().optional()
});

const tiers: Record<
  string,
  {
    price: string;
    win_profile: Record<"coin_flip" | "lucky_number" | "dice_roll", number>;
  }
> = {
  micro: {
    price: "$0.01",
    win_profile: {
      coin_flip: 0.35,
      lucky_number: 0.14,
      dice_roll: 0.22
    }
  },
  low: {
    price: "$0.10",
    win_profile: {
      coin_flip: 0.42,
      lucky_number: 0.18,
      dice_roll: 0.28
    }
  },
  mid: {
    price: "$1.00",
    win_profile: {
      coin_flip: 0.48,
      lucky_number: 0.22,
      dice_roll: 0.33
    }
  },
  high: {
    price: "$10.00",
    win_profile: {
      coin_flip: 0.55,
      lucky_number: 0.3,
      dice_roll: 0.4
    }
  }
};

// реєструємо entrypoints під lucid-dreams/agent-kit
for (const [tierName, cfg] of Object.entries(tiers)) {
  addEntrypoint({
    key: `play.${tierName}`,
    description: `Play minigame at ${cfg.price}`,
    input: InputSchema,
    price: cfg.price,
    network: network,
    async handler(ctx) {
      const body = await ctx.input;
      const res = runGame(
        body.game,
        tierName,
        cfg.win_profile[body.game],
        body
      );
      return {
        output: {
          ...res,
          proof: {
            tier: tierName,
            price: cfg.price
          }
        }
      };
    }
  });
}

// простий health
app.get("/", (c) =>
  c.json({
    name: "Ponzi MiniGames x402 Agent (Lucid)",
    status: "ok",
    endpoints: Object.keys(tiers).map((t) => `/play.${t}`),
    network
  })
);

// Bun-style export
const port = Number(process.env.PORT ?? 8000);
export default {
  port,
  fetch: app.fetch
};
