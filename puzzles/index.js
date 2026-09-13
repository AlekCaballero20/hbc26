import * as jigsaw from "./jigsaw.js";
import * as flow from "./flow.js";
import * as nonogram from "./nonogram.js";
import * as sokoban from "./sokoban.js";
import * as wordsearch from "./wordsearch.js";
import * as earworm from "./earworm.js";
import * as slide from "./slide.js";
import * as constellation from "./constellation.js";

export const puzzles = {
  jigsaw,
  flow,
  nonogram,
  sokoban,
  wordsearch,
  earworm,
  slide,
  constellation
};

export const puzzleOrder = Object.keys(puzzles);
