/**
 * Called by index_utils and converted to meta-puzzle and meta-set data
 * Returns an array tuple<IMetaInfo, IPuzzleInfo>
 */
function buildIndexOfMetas() {
  const portrait = 'portrait';
  const scrapbook = 'scrapbook';
  const landscape = 'landscape';

  return [
    [ { short: 'banned',      store: 'BannedMeta',      count: 4, icon: 'images/icons/banned.png'       },  { round: 0, title: 'Banned',                          thumb: 'bnn', author: 'Rorke Haining', orientation: portrait,   cls:'' } ],
    [ { short: 'unfortunate', store: 'UnfortunateMeta', count: 3, icon: 'images/icons/unfortunate.png', },  { round: 0, title: 'A Series of Unfortunate Events',  thumb: 'ser', author: 'Jess McGatha',  orientation: portrait,   cls:'' } ],
    [ { short: 'dance' ,      store: 'DanceMeta',       count: 4, icon: 'images/icons/dance.png',       },  { round: 0, title: 'Square Dance',                    thumb: 'squ', author: 'Martyn Lovell', orientation: portrait,   cls:'' } ],
    // [ { short: 'hoarding',    store: 'HoardingMeta',    count: 4, icon: 'images/icons/hoarding.png',    },  { round: 0, title: 'Animal Hoarding',                 thumb: '', author: 'David Garber',  orientation: portrait,   cls:'' } ],
  ];
}

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
  const combo = 'combo';

  return [
    { round: 0, title: 'Animal Hoarding',                       thumb: 'ani', author: 'David Garber',        type: search,   group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Argument Checker',                      thumb: 'arg', author: 'Martyn Lovell',       type: rebus,    group: puzzle, orientation: portrait,   cls:'', feeder: [{meta:'dance', number:0}] },
    { round: 0, title: 'Big Ideas',                             thumb: 'big', author: 'Martyn Lovell',       type: jigsaw,   group: puzzle, orientation: landscape,  cls:'', feeder: [{meta:'dance', number:1}] },
    { round: 0, title: 'Four Crosses',                          thumb: 'fou', author: 'Martyn Lovell',       type: logic,    group: puzzle, orientation: portrait,   cls:'', feeder: [{meta:'dance', number:2}] },
    { round: 0, title: 'Elective Operations',                   thumb: 'ele', author: 'David Garber',        type: math,     group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Back Alley Deal',                       thumb: 'bac', author: 'Rorke Haining',       type: word,     group: puzzle, orientation: landscape,  cls:'', feeder: [{meta:'banned', number:1}] },
    { round: 0, title: 'Bank of New England',                   thumb: 'ban', author: 'Rorke Haining',       type: word,     group: puzzle, orientation: landscape,  cls:'', feeder: [{meta:'banned', number:0}] },
    { round: 0, title: 'Hold My Beer',                          thumb: 'hol', author: 'Andrew Giese',        type: word,     group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'HR Guidelines',                         thumb: 'hrg', author: 'Joey Marianer',       type: word,     group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Judging By Its Cover',                  thumb: 'jc1', author: 'Ken & Jen',           type: audio,    group: puzzle, orientation: scrapbook,  cls:'', feeder: [] },
    { round: 0, title: 'Judging By Its Cover 2: Even Judgier',  thumb: 'jc2', author: 'Ken & Jen',           type: audio,    group: puzzle, orientation: scrapbook,  cls:'', feeder: [], file:'JudgingByItsCover2' },
    { round: 0, title: 'Mad Scientist Store',                   thumb: 'mad', author: 'Martyn Lovell',       type: word,     group: puzzle, orientation: portrait,   cls:'', feeder: [{meta:'dance', number:3}] },
    { round: 0, title: 'Oops! All Baerries',                    thumb: 'oop', author: 'Andrew Giese',        type: search,   group: puzzle, orientation: landscape,  cls:'', feeder: [] },
    { round: 0, title: 'Red Flags',                             thumb: 'red', author: 'Rorke Haining',       type: trivia,   group: puzzle, orientation: landscape,  cls:'', feeder: [] },
    { round: 0, title: 'Round Pegs, Triangle Holes',            thumb: 'rou', author: 'David Garber',        type: logic,    group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Snakes In A Sudoku',                    thumb: 'sna', author: 'David Garber',        type: logic,    group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'The Hawaiian Express',                  thumb: 'haw', author: 'Rorke Haining',       type: word,     group: puzzle, orientation: landscape,  cls:'', feeder: [{meta:'banned', number:2}] },
    { round: 0, title: 'Trite Optimism',                        thumb: 'tri', author: 'Rorke Haining',       type: word,     group: puzzle, orientation: landscape,  cls:'', feeder: [{meta:'banned', number:3}] },
    { round: 0, title: 'Unfortunate Events Part I',             thumb: 'ue1', author: 'Jess McGatha',        type: combo,    group: puzzle, orientation: portrait,   cls:'', feeder: [{meta:'unfortunate', number:0}], file:'UnfortunateEvents1' },
    { round: 0, title: 'Unfortunate Events Part II',            thumb: 'ue2', author: 'Jess McGatha',        type: combo,    group: puzzle, orientation: portrait,   cls:'', feeder: [{meta:'unfortunate', number:1}], file:'UnfortunateEvents2' },
    { round: 0, title: 'Unfortunate Events Part III',           thumb: 'ue3', author: 'Jess McGatha',        type: combo,    group: puzzle, orientation: portrait,   cls:'', feeder: [{meta:'unfortunate', number:2}], file:'UnfortunateEvents3' },
    { round: 0, title: 'Yolo',                                  thumb: 'yol', author: 'Rorke Haining',       type: trivia,   group: puzzle, orientation: portrait,   cls:'', feeder: [] },
    { round: 0, title: 'Zero, One Two Many!',                   thumb: 'zer', author: 'Glenn Hollingsworth', type: logic,    group: puzzle, orientation: portrait,   cls:'', feeder: [] },
  ];
}
