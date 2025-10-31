import { randomInt } from "crypto";

export type GameName = "coin_flip" | "lucky_number" | "dice_roll";

export function runGame(
  game: GameName,
  tier: string,
  winProb: number,
  payload: any
) {
  if (game === "coin_flip") {
    const userChoice = (payload?.choice ?? "heads").toLowerCase();
    const flip = Math.random() < 0.5 ? "heads" : "tails";

    let win = false;
    if (userChoice === flip && Math.random() < winProb) {
      win = true;
    }

    return {
      game: "coin_flip",
      userChoice,
      serverFlip: flip,
      win,
      tier,
      xpReward: win ? 15 : 3,
      message: win ? "🎉 Ти виграв!" : "😔 Цього разу не пощастило."
    };
  }

  if (game === "lucky_number") {
    const guess = Number(payload?.guess ?? 7);
    const winningNumber = randomInt(1, 11); // 1-10
    const win = guess === winningNumber && Math.random() < winProb;
    return {
      game: "lucky_number",
      userGuess: guess,
      winningNumber,
      win,
      tier,
      xpReward: win ? 30 : 5,
      message: win ? "🔮 Вгадав число!" : "Не вгадав. Спробуй ще."
    };
  }

  if (game === "dice_roll") {
    const guess = Number(payload?.guess ?? 3);
    const dice = randomInt(1, 7); // 1-6
    const win = guess === dice && Math.random() < winProb;
    return {
      game: "dice_roll",
      userGuess: guess,
      dice,
      win,
      tier,
      xpReward: win ? 20 : 4,
      message: win ? "🎲 Красиво!" : "Мимо. Ще одна спроба?"
    };
  }

  throw new Error("Unknown game");
}
