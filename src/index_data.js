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
        { round: 0, title: 'Elective Operations', thumb: '', author: 'David Garber', type: math, group: puzzle, orientation: portrait, cls:'', feeder: [] },
        { round: 0, title: 'Judging By Its Cover', thumb: '', author: 'Ken & Jen', type: audio, group: puzzle, orientation: scrapbook, cls:'', feeder: [] },
        { round: 0, title: 'Judging By Its Cover 2: Even Judgier', thumb: '', author: 'Ken & Jen', type: audio, group: puzzle, orientation: scrapbook, cls:'', feeder: [] },
        { round: 0, title: 'Yolo', thumb: '', author: 'Rorke Haining', type: trivia, group: puzzle, orientation: portrait, cls:'', feeder: [] },
    ];
}
