// src/games.ts
export async function playGame(opts: {
  game: string;
  choice?: string;
  guess?: number | string | null;
}) {
  const game = (opts.game || "coin_flip").toLowerCase();

  if (game === "coin_flip") {
    const userChoice = (opts.choice || "heads").toLowerCase();
    const outcome = Math.random() < 0.5 ? "heads" : "tails";
    const win = outcome === userChoice;
    return {
      game: "coin_flip",
      userChoice,
      outcome,
      win,
      message: win ? "You won the flip 🎉" : "You lost the flip 😅",
    };
  }

  if (game === "lucky" || game === "lucky_number") {
    const target = Math.floor(Math.random() * 10) + 1;
    const userGuess = Number(opts.guess || opts.choice || 1);
    const win = target === userGuess;
    return {
      game: "lucky_number",
      userGuess,
      target,
      win,
      message: win ? "You guessed the number! 🔥" : "Not this time, try again.",
    };
  }

  if (game === "dice" || game === "dice_roll") {
    const rolled = Math.floor(Math.random() * 6) + 1;
    const userGuess = Number(opts.guess || opts.choice || 1);
    const win = rolled === userGuess;
    return {
      game: "dice_roll",
      userGuess,
      rolled,
      win,
      message: win ? "Nice, correct dice roll! 🎲" : "Dice said nope 😅",
    };
  }

  // fallback — якщо агент надіслав взагалі щось своє
  return {
    game: game,
    message: "Game type not recognized, but payment was processed.",
  };
}
