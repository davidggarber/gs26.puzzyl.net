/**
 * Called by index_utils, and converted to strongly-typed IPuzzleInfo records.
 */
function buildIndexOfPuzzles() {
  // Orientations
  const portrait = 'portrait';
  const scrapbook = 'scrapbook';
  const landscape = 'landscape';

  // Puzzle groups
  const puzzle = 'puzzle';
  const challenge = 'challenge';
  const feeder = 'feeder';
  const meta = 'meta';
  const pending = '';
  const cut = undefined;

  // Puzzle types
  const audio = 'audio';
  //const challenge = 'challenge';
  const code = 'code';
  const construction = 'construction';
  const jigsaw = 'jigsaw';
  const logic = 'logic';
  const math = 'math';
  const maze = 'maze';
  //const meta = 'meta';
  const poster = 'poster';
  const rebus = 'rebus';
  const search = 'search';
  const trivia = 'trivia';
  const word = 'word';

  return [
    { round: 0, title: 'Elective Operations',                   thumb: '', author: 'David Garber',        type: math,     group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Judging By Its Cover',                  thumb: '', author: 'Ken & Jen',           type: audio,    group: puzzle, orientation: scrapbook,  cls:'', feeder: [] },
    { round: 0, title: 'Judging By Its Cover 2: Even Judgier',  thumb: '', author: 'Ken & Jen',           type: audio,    group: puzzle, orientation: scrapbook,  cls:'', feeder: [], file:'JudgingByItsCover2' },
    { round: 0, title: 'Yolo',                                  thumb: '', author: 'Rorke Haining',       type: trivia,   group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Red Flags',                             thumb: '', author: 'Rorke Haining',       type: trivia,   group: puzzle, orientation: landscape,  cls:'', feeder: [] },
    { round: 0, title: 'Oops! All Baerries',                    thumb: '', author: 'Andrew Giese',        type: trivia,   group: puzzle, orientation: landscape,  cls:'', feeder: [] },
    { round: 0, title: 'Hold My Beer',                          thumb: '', author: 'Andrew Giese',        type: word,     group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Four Crosses',                          thumb: '', author: 'Martyn Lovell',       type: logic,    group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Zero, One Two Many!',                   thumb: '', author: 'Glenn Hollingsworth', type: logic,    group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Big Ideas',                             thumb: '', author: 'Martyn Lovell',       type: word,     group: puzzle, orientation: landscape,  cls:'', feeder: [] },
    { round: 0, title: 'Mad Scientist Store',                   thumb: '', author: 'Martyn Lovell',       type: word,     group: puzzle, orientation: landscape,  cls:'', feeder: [] },
  ];
}
