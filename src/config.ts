// src/config.ts
export const GAMES = {
  "coin.micro": {
    price: 0.01, // гравець платить
    payout: 0.02, // ми даємо, якщо виграв
    winChance: 0.38,
    kind: "coin_flip",
    description: "Pay $0.01 to flip a coin. 38% chance to win $0.02.",
  },
  "lucky.low": {
    price: 0.1,
    payout: 0.2,
    winChance: 0.45,
    kind: "lucky_number",
    description: "Pay $0.10 to guess a number 1–10. 45% chance to win $0.20.",
  },
  "dice.mid": {
    price: 1.0,
    payout: 1.7,
    winChance: 0.4,
    kind: "dice_roll",
    description: "Pay $1 to roll the dice. 40% chance to win $1.7.",
  },
  "dice.high": {
    price: 10.0,
    payout: 14.0,
    winChance: 0.35,
    kind: "dice_roll",
    description: "Pay $10 to roll the dice. 35% chance to win $14.",
  },
} as const;
