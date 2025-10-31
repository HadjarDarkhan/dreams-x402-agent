// src/games.ts

type GameResult =
  | {
      ok: true;
      game: "coin_flip";
      userChoice: string;
      outcome: string;
      win: boolean;
      text: string;
    }
  | {
      ok: true;
      game: "lucky_number";
      userGuess: number;
      target: number;
      win: boolean;
      text: string;
    }
  | {
      ok: true;
      game: "dice_roll";
      userGuess: number;
      rolled: number;
      win: boolean;
      text: string;
    }
  | {
      ok: false;
      game: string;
      text: string;
    };

export function playGame(opts: {
  game?: string;
  choice?: string;
  guess?: number | string | null;
}): GameResult {
  const game = (opts.game || "coin_flip").toLowerCase();

  // 1) Coin flip
  if (game === "coin_flip") {
    const userChoice = (opts.choice || "heads").toLowerCase();
    const outcome = Math.random() < 0.5 ? "heads" : "tails";
    const win = outcome === userChoice;

    return {
      ok: true,
      game: "coin_flip",
      userChoice,
      outcome,
      win,
      text: win
        ? `🪙 Coin Flip: ${outcome.toUpperCase()} — YOU WIN!`
        : `🪙 Coin Flip: ${outcome.toUpperCase()} — you lost.`,
    };
  }

  // 2) Lucky number 1–10
  if (game === "lucky" || game === "lucky_number") {
    const target = Math.floor(Math.random() * 10) + 1;
    const userGuess = Number(opts.guess || opts.choice || 1);
    const win = target === userGuess;

    return {
      ok: true,
      game: "lucky_number",
      userGuess,
      target,
      win,
      text: win
        ? `🍀 Lucky Number: you picked ${userGuess}, rolled ${target} — WIN!`
        : `🍀 Lucky Number: you picked ${userGuess}, rolled ${target} — no luck.`,
    };
  }

  // 3) Dice 1–6
  if (game === "dice" || game === "dice_roll") {
    const rolled = Math.floor(Math.random() * 6) + 1;
    const userGuess = Number(opts.guess || opts.choice || 1);
    const win = rolled === userGuess;

    return {
      ok: true,
      game: "dice_roll",
      userGuess,
      rolled,
      win,
      text: win
        ? `🎲 Dice Roll: you said ${userGuess}, rolled ${rolled} — NICE!`
        : `🎲 Dice Roll: you said ${userGuess}, rolled ${rolled} — try again.`,
    };
  }

  return {
    ok: false,
    game,
    text: `Game "${game}" is not supported.`,
  };
}
