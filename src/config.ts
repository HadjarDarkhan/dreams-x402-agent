// src/config.ts
export const GAMES = {
  "coin.micro": {
    price: 0.01,          // скільки прийшло через x402
    payout: 0.02,         // скільки віддамо гравцю при win
    winChance: 0.38,      // 38% шансу
  },
  "lucky.low": {
    price: 0.10,
    payout: 0.20,
    winChance: 0.45,
  },
  "dice.mid": {
    price: 1.0,
    payout: 1.7,
    winChance: 0.40,
  },
  "dice.high": {
    price: 10.0,
    payout: 14.0,
    winChance: 0.35,
  },
};
