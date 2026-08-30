// @ts-nocheck -- Legacy classic-script globals are supplied by puzzyl-kit and page templates.

type IMetaMaterial = {
  src: string;
  [key: string]: unknown;
};

type Kit_PlayerPresence = {
  /** The name of the teammate. */
  Player: string;
  /** Their emoji avatar */
  Avatar: string;
  /** The puzzle on which the teammate was most recently present. */
  Presence?: string;
};

type Kit_PlayerNameAvatar = {
  Player: string,
  Avatar: string;
}
// REVIEW: this doesn't line up with SolveSummary in eventSync.ts
type Kit_SolveSummary = Record<string, Kit_PlayerNameAvatar[]>

type Kit_UnlockedPiece = {
  Piece: string;
  Url: string;
}

/**
 * Thunking layer for puzzyl-kit functions, which we can't explicitly import without turning this into a module.
 */
const kit = {
  hasClass: (el: Node|string|null, cls: string|undefined): boolean 
    => hasClass(el, cls),
  toggleClass: (el: Node|string|null|undefined, cls: string|null, val?: boolean): void 
    => toggleClass(el, cls, val),
  getPuzzleStatus: (puzzle:string|null, defaultStatus?:string, puzzleList?:string): string|undefined
    => getPuzzleStatus(puzzle, defaultStatus, puzzleList),
  loadMetaMaterials: (puzzle:string, up:number, page:number): IMetaMaterial|undefined 
    => loadMetaMaterials(puzzle, up, page),
  refreshTeamHomePage: (callback?:() => void): void
    => refreshTeamHomePage(callback),
  refillFromTemplate: (parent:Element, tempId:string, args?:object): Node|undefined
    => refillFromTemplate(parent, tempId, args),
  splitEmoji: (str:string):string[]
    => splitEmoji(str),
  syncTeamName: (): string
    => _teamName,
  syncTeamMates: (): Kit_PlayerPresence[]
    => _teammates || [],
  syncTeamSolves: (): Kit_SolveSummary
    => _teamSolves || {},
  syncRemoteUnlocked: (): Kit_UnlockedPiece[]
    => _remoteUnlocked || [],
};

/**
 * Thunking layer for container document's window.boiler.lookup
 * These are mirrors of the data from the _eventSync functions, 
 * available in the window.boiler.lookup so that templates can access them directly.
 */
const boilerLookup = {
  get showTeams(): boolean {
    return window.boiler.lookup.showTeams;
  },

  /** Team name, chosen by user at log-in */
  get teamname(): string {
    return window.boiler.lookup.teamname;
  },
  set teamname(value: string) {
    window.boiler.lookup.teamname = value.trim();
  },

  /** List of teammate names, received from the server. Other players who claimed the same teamname */
  get teammates(): Kit_PlayerPresence[] {
    return window.boiler.lookup.teammates;
  },
  set teammates(value: Kit_PlayerPresence[]) {
    window.boiler.lookup.teammates = value;
  },

  /** Map of puzzle names (not file) to the list of teammates who have solved them. */
  get solves(): Kit_SolveSummary {
    return window.boiler.lookup.solves;
  },
  set solves(value: Kit_SolveSummary) {
    window.boiler.lookup.solves = value;
  },

  /** URL query arguments specific to the event. */
  get urlEventArgs(): string {
    return window.boiler.lookup.urlEventArgs;
  },
  set urlEventArgs(value: string) {
    window.boiler.lookup.urlEventArgs = value;
  },
}


/**
 * A way to group puzzles into broad skill categories.
 */
type IPuzzleType = {
  /** The name of the image that will indicate this in the UI. */
  icon: string;
  /** The alt text for the image, describing the puzzle type. */
  alt: string;
};

/**
 * A list of types of puzzles that users are likely to differentiate.
 */
const types: Record<string, IPuzzleType> = {
    audio: { icon: 'audio', alt: 'Audio puzzle' },
    challenge: { icon: 'experiment', alt: 'Challenge' },
    code: { icon: 'code', alt: 'Encoded puzzle' },
    construction: { icon: 'construction', alt: 'Construction puzzle' },
    jigsaw: { icon: 'jigsaw', alt: 'Jigsaw puzzle' },
    logic: { icon: 'logic', alt: 'Logic puzzle' },
    math: { icon: 'math', alt: 'Math puzzle' },
    maze: { icon: 'maze', alt: 'Maze puzzle' },
    meta: { icon: 'meta', alt: 'Meta-puzzle' },
    poster: { icon: 'unknown', alt: 'Pre-event puzzle' },
    rebus: { icon: 'rebus', alt: 'Rebus puzzle' },
    search: { icon: 'search', alt: 'Word search puzzle' },
    trivia: { icon: 'trivia', alt: 'Trivia puzzle' },
    word: { icon: 'word', alt: 'Word puzzle' },
};
/**
 * Group entries in the overall puzzle index based on their role in the event - especially scoring
 */
const group: Record<string, string|undefined> = {
    /** Standard, stand-alone puzzle. */
    puzzle: 'puzzle',
    /** Instructions (or just a ticket) for participating in an interactive activity, led by event staff. */
    challenge: 'challenge',
    /** A document with inputs for a meta - usually received as a reward for solving another puzzle. */
    feeder: 'feeder',
    /** A puzzle that requires inputs from other puzzles to solve. */
    meta: 'meta',
    /** A puzzle that is not yet released. */
    pending: '',
    /** A puzzle that has been removed from the event. */
    cut: undefined
};
/**
 * Flag a puzzle's orientation, which should also be the thumbnail image's proportions.
 */
const orient: Record<string, string> = {
    portrait: 'portrait',
    landscape: 'landscape',
    scrapbook: 'scrapbook',
};

type IMetaFeeder = {
  /** The title of the meta puzzle. */
  title: string;
  /** Which index, among the feeders for that meta puzzles. */
  number: number;
};

/**
 * Details of a meta puzzle system
 */
type IMetaInfo = {
  /**
   * The name of the meta-puzzle (which will itself be an entry in the list of puzzles)
   */
  title: string;
  /** The cache key used by feeders puzzles, when players solve them and get materials for the meta */
  store: string;
  /** How many feeders are there? */
  count: number;
  /** An icon to indicate a feeder, and to show feeder progress. */
  icon: string;
}

/**
 * Define one puzzle, to appear in an index
 */
type IPuzzleInfo = {
  /** The actual page file for the puzzle - often derivable from the title. */
  file?: string;
  /** The full URL to the puzzle page. */
  href?: string;
  /** Maps to a release schedule. 0 is always released. Others are scheduled. */
  round: number;
  /** The title of the puzzle. */
  title: string;
  /** The thumbnail image for the puzzle. */
  thumb: string;
  /** The author of the puzzle. */
  author: string;
  /** The type of the puzzle. */
  type: IPuzzleType;
  /** Is this a puzzle, meta, challenge, etc */
  group: typeof group[keyof typeof group];
  /** Is the puzzle - and more relevantly, the thumbnail - portrait or landscape oriented */
  orientation: typeof orient[keyof typeof orient];
  /** The CSS class to apply to the puzzle element. */
  cls: string;
  /** Any feeder puzzles associated with this puzzle. */
  feeder: IMetaFeeder[];
};

const meta: Record<string, IMetaInfo> = {
};
// var challenge = {
// }

const puzzles: IPuzzleInfo[] = [
    { round: 0, title: 'Elective Operations', thumb: '', author: 'David Garber', type: types.math, group: group.puzzle, orientation: orient.portrait, cls:'', feeder: [] },
    { round: 0, title: 'Judging By Its Cover', thumb: '', author: 'Ken & Jen', type: types.audio, group: group.puzzle, orientation: orient.scrapbook, cls:'', feeder: [] },
    { round: 0, title: 'Judging By Its Cover 2: Even Judgier', thumb: '', author: 'Ken & Jen', type: types.audio, group: group.puzzle, orientation: orient.scrapbook, cls:'', feeder: [] },
];

/**
 * A round is a subset of an event's puzzles.
 * They can be released by date, or by mini-game.
 * Date-based releases extend prior rounds, growing the overall set of puzzles with each round.
 * Mini-games are each standalone. Either you're in one or another, but not both.
 */
type IRoundInfo = {
  /** A keyword to view this round on demand. */
  name: string;
  /** The release date of the round. */
  release: string;
  /** The PDF file of that rounds' printable puzzles. */
  pdf: string;
};

type IMiniGameInfo = {
  /** The filename of the round's index. */
  name: string;
  /** The index of the */
  round: number;
  /** The PDF file of that mini-games' printable puzzles. */
  pdf: string;
};

const rounds: IRoundInfo[] = [
    { name: 'tbd1', release: '9/31/2026', pdf: '' },
    { name: 'tbd2', release: '10/7/2026', pdf: 'trails' },
    { name: 'tbd3', release: '10/14/2026', pdf: 'creeks' },
    { name: 'tbd4', release: '10/21/2026', pdf: 'ranges' },
    { name: 'tbd5', release: '10/28/2026', pdf: 'bridges' },
];
var minis: IMiniGameInfo[] = [
    { name: 'mg1', round: 1, pdf: 'hikes' },
    { name: 'mg2', round: 2, pdf: 'swims' },
    { name: 'mg3', round: 3, pdf: 'rides' },
    { name: 'mg4', round: 4, pdf: 'sails' },
    { name: 'mg5', round: 5, pdf: 'sails' },
];
/** On a given release date, at what hour (UTC) the round is considered released. */
const releaseHourUTC = 13; // 9am EDT, 6am PDT

const metas: Record<string, IMetaInfo> = {
    // anthem: {
    //     title: 'Annual Anthem',
    //     store: 'AnnualAnthemMeta',
    //     count: 4,
    //     icon: 'Icons/anthem.png',
    // },
    // coastal: {
    //     title: 'Coastal Erosion',
    //     store: 'CoastalErosionMeta',
    //     count: 4,
    //     icon: 'Icons/coastal.png',
    // },
    // everest: {
    //     title: 'Up and Down Mount Everest',
    //     store: 'UpAndDownMountEverestMeta',
    //     count: 4,
    //     icon: 'Icons/everest.png',
    // },
}

/**
 * Must be called by index pages in the preBuild callback.
 * Complete the initialization of the IPuzzleInfo records, because some fields are allowed to start blank.
 */
function initializeIndexUtils() {
  // Pass any url arguments on to the puzzles, plus the event identifier
  //  - ps23 event is for single-player puzzling.
  //  - gs26 event is an event, with teams and a leaderboard.
  // Note that in all cases, the result is at least '?'.
  boilerLookup.urlEventArgs = (window.location.search.indexOf('gs26') > 0 || window.location.search.indexOf('ps22') > 0)
      ? window.location.search  // no change
      : window.location.search === '' ? '?gs26'
      : (window.location.search + '&gs26');

  // Most puzzles are defined without .href or .file, so compute those values here.
  // Set them explicitly in the array when the name is not derivable from the title.
  for (let puz of puzzles) {
      if (!puz.file) {
          // The assumed name is a CamelCase version of the original
          let words = puz.title.split(' ');
          puz['file'] = '';
          for (let w = 0; w < words.length; w++) {
              if (words[w].length > 0) {
                  let word = words[w][0].toUpperCase() + words[w].substring(1);
                  puz.file += word;
              }
          }
      }
      puz.href = puz.file + '.xhtml' + boilerLookup.urlEventArgs;
  }
}

// 1, 2, ... means that column index is sorted ascending
// -1, -2, ... means that (abs) column index is sorted descenind
let sortOrder = 2;  // Puzzle name

/**
 * Sort a puzzle table based on one column, leaving equal values in the same order they are now
 * @param th The TH header cell that we're sorting on
 */
function sortTable(th:HTMLTableCellElement) {
  let tr:HTMLTableRowElement = th.parentNode as HTMLTableRowElement;
  let allThs = tr.getElementsByTagName('th');

  // Determine the index of the column we're sorting on
  let col = 0;
  for (let c of allThs) {
    col++;
    if (c == th) {
      break;
    }
  }
  // Repeated sorts on the same column will reverse that column's sort order
  sortOrder = (sortOrder == col) ? -col : col;

  let sortNumeric = kit.hasClass(th, 'sort-numeric');
  let tbody = document.getElementById('puzzle_list') as HTMLTableSectionElement;
  let rows = document.getElementsByClassName('sortable');
  // Every value will be tweaked so it's unique - by appending the previous order as a suffix
  let order = [];
  // Map the unique values back to the rows that gave them
  let lookup:Record<string|number, HTMLTableRowElement> = {};

  for (let i = rows.length - 1; i >= 0; i--) {
      let row = rows[i] as HTMLTableRowElement;
      if (row.parentNode != tbody) {
          continue;
      }
      let cols = row.getElementsByTagName('td');
      let cell = cols[col - 1] as HTMLTableCellElement;
      let prevOrder = String(i).padStart(2, '0');
      let val:string|number = cell.innerHTML + ' ' + prevOrder;
      if (kit.hasClass(th, 'completed') && kit.hasClass(cell.parentNode, 'solved')) {
        val = '✔️' + val;
      }
      if (sortNumeric) {
        // A column that is tagged as numerically sortable promises to only have
        // numeric cell contents.
        val = parseFloat(cell.innerText);
        // There can still be ties, so the previous order is an additional fraction
        val += (val >= 0) ? (i / (100 * rows.length)) : ((i - rows.length) / (100 * rows.length));
      }
      order.push(val);
      lookup[val] = row;
      tbody.removeChild(row);
  }
  if (sortNumeric) {
    (order as number[]).sort();
  }
  else {
    order.sort();
  }
  if (sortOrder < 0) {
      order.reverse();
  }
  for (let i = 0; i < order.length; i++) {
      let row = lookup[order[i]];
      tbody.appendChild(row);
  }
  // update header with arrow indicating sort order
  for (let t of allThs) {  // Clear previous sort state from all columns
    kit.toggleClass(t, 'sortedAsc', false);
    kit.toggleClass(t, 'sortedDesc', false);
  }
  kit.toggleClass(th, 'sortedAsc', sortOrder > 0);
  kit.toggleClass(th, 'sortedDesc', sortOrder < 0);
}

/**
 * Called postSetup by the index page.
 * Ensures boilerLookup
 has some necessary default structures.
 * Creates global event listeners.
 */
function setupSolvables() {
  boilerLookup.teammates = boilerLookup.teammates || [];
  boilerLookup.solves = boilerLookup.solves || {};
  document.addEventListener('visibilitychange', function (event) { syncProgress(); });
  let body = document.getElementsByTagName('body')[0];
  body.addEventListener('focus', function (event) { syncProgress(); } );
  // Then run it now.
  syncProgress();
}

// Puzzle index pages show 2 kinds of dynamic event information:
// 1. Solves and unlocks achieved locally.
//    These invariably happen while the index page doesn't have focus,
//    so they only need to be refreshed when we regain focus
// 2. Solves and unlocks achieved by teammates, as well as those teammates' traveling presence.
//    These can happen at any time. We will refresh every ~15 seconds,
//    as well as when we regain focus.

/**
 * Map feeder IDs to whether or not they've been unlocked. This only controls how their icons render.
 * Feeder IDs are "{meta-store}-{index}", so "MetaABC-0" .. "MetaABC-3" .. "MetaGHI-3"
 */
let _unlocked_feeders:Record<string, boolean> = {};
let _refresh_interval = 0;  // invalid timer ID
let _stopRefreshing = new Date().getTime();
let _refreshEvery = 15 * 1000;  // 15 seconds


/**
 * Called when our page regains focus.
 * Immediately update solve and meta-unlock states from local changes.
 * Then queue a refresh of teammate progress, to continue until we lose focus, or for 3 hours. 
 */
function syncProgress() {
  if (document.hidden) {
    return;
  }
  for (let i = 0; i < puzzles.length; i++) {
    let puz = puzzles[i];
    updateSolves(puz.file!);
  }
  
  syncUnlockedMetas();

  if (boilerLookup.showTeams) {
    // Once we start syncing, check every 15 seconds for 3 hours
    _stopRefreshing = new Date().getTime() + 3 * 60 * 60 * 1000;
    _refresh_interval = setInterval(timeToRefreshTeam, _refreshEvery);
    timeToRefreshTeam();  // With an initial call immediately
  }
}

/**
 * Scan through all known meta materials and update their unlocked status in the UI.
 */
function syncUnlockedMetas() {
  let metaKeys = Object.keys(metas);
  for (let m = 0; m < metaKeys.length; m++) {
    let metaInfo = metas[metaKeys[m]];
    for (let i = 0; i <= metaInfo.count; i++) {
      updateUnlocked(metaInfo.store, i);
    }
  }
}

/**
 * Called every 15 seconds to refresh teammate event info
 */
function timeToRefreshTeam() {
  if (boilerLookup.showTeams) {
    if (new Date().getTime() >= _stopRefreshing) {
      clearInterval(_refresh_interval);
    }
    if (document.visibilityState == 'visible') {
      kit.refreshTeamHomePage(refreshTeamProgress);
    }
  }
}

/**
 * Called for every puzzle, so we can mirror cached solve state back to a puzzle's UI row.
 * @param puzFile The puzzle filename, which is also the key for caching status
 */
function updateSolves(puzFile:string) {
  let pStatus = kit.getPuzzleStatus(puzFile);
  let tr = document.getElementById(puzFile);
  if (tr) {
    kit.toggleClass(tr, 'solved', pStatus == 'solved');
  }
}

/**
 * Check to see if a meta material we know by title, has new local data.
 * That would mean it has been unlocked - either locally or by team sync.
 * For each, change their UI to unlocked, and hook up their link to that URL.
 * @param meta The meta-material store name.
 * @param i The material index.
 */
function updateUnlocked(meta:string, i:number) {
  let puzFile = `${meta}-${i}`;
  if (!(puzFile in _unlocked_feeders)) {
    let pStatus = kit.getPuzzleStatus(puzFile);
    if (pStatus) {
      let mat = kit.loadMetaMaterials(meta, 0, i);
      if (mat) {
        _unlocked_feeders[puzFile] = true;
        let links = document.getElementsByClassName(puzFile);
        for (let a = 0; a < links.length; a++) {
          const link = links[a] as HTMLLinkElement;
          kit.toggleClass(link, 'unlocked', true);
          link.href = mat.src + boilerLookup.urlEventArgs;
          if (link.title.endsWith(' (locked)')) {
            link.title = link.title.substring(0, link.title.length - 9);
          }
        }
      }
    }
  }
}

/**
 * Callback after kit has consulted server for team progress updates.
 */
function refreshTeamProgress() {
  let overwrite = false;  // Prefer to merge where possible
  if (JSON.stringify(kit.syncTeamMates()) != JSON.stringify(boilerLookup.teammates)) {
    overwrite = boilerLookup.teammates.length > kit.syncTeamMates().length;  // when we drop a team member
    boilerLookup.teammates = kit.syncTeamMates();
    boilerLookup.teamname = kit.syncTeamName();
    kit.refillFromTemplate(document.getElementById('team-roster')!, 'teammate-list');
    updatePresence()
  }

  if (mergeSolves(overwrite)) {
    for (let puz of puzzles) {
      let tr = document.getElementById(puz.file!);
      if (tr) {
        let span = tr.getElementsByClassName('teammate-solves')[0];
        if (span && tr.getAttribute('name')) {
          let solvers = boilerLookup.solves[tr.getAttribute('name')!] || [];
          let args = {solvers: solvers};
          kit.refillFromTemplate(span, 'teammate-solves', args);
        }
      }
    }
  }

  if (kit.syncRemoteUnlocked().length > 0) {
    let foundNew = false;
    let newlyUnlocked = [];
    for (let ru of kit.syncRemoteUnlocked()) {
      if (!ru.Piece) {
        continue;  // bad data. Don't load, since we'll never be able to acknowledge the load
      }
      if (!(ru.Piece in _unlocked_feeders)) {
        newlyUnlocked.push(ru.Url);
        // Don't add to _unlocked_feeders. That happens once it's confirmed.
        foundNew = true;
      }
    }
    if (foundNew) {
      loadViaIframe(newlyUnlocked);
    }
  }
}

/**
 * Indicate on which puzzle each teammate was most recently present.
 */
function updatePresence() {
  // Clear the previous presence indicators (REVIEW: even if they are unchanged)
  let presences = document.getElementsByClassName('presence-avatar');
  for (let i = presences.length - 1; i >= 0; i--) {
    let pres = presences[i] as HTMLSpanElement;
    pres.parentNode!.removeChild(pres);
  }

  // Create new presence indicators for each teammate based on their current presence.
  for (let pp of boilerLookup.teammates) {
    if (pp.Presence) {
      let tr = document.getElementsByName(pp.Presence)[0];
      if (tr) {
        let td = tr.getElementsByClassName('presence')[0];
        let span = document.createElement('span');
        kit.toggleClass(span, 'presence-avatar', true);
        span.appendChild(document.createTextNode(pp.Avatar));
        span.setAttribute('title', pp.Player);
        td.appendChild(span);
      }
    }
  }
}

/**
 * Merge the server's solve info with the local state.
 * The local state may know about local solves that the server is still round-tripping.
 * @param overwrite If true, reset the local state to zero solves and ignore the server.
 * @returns True if the local state was changed as a result of the merge.
 */
function mergeSolves(overwrite:boolean)
{
  if (overwrite || Object.keys(kit.syncTeamSolves()).length == 0) {
    boilerLookup.solves = {};
    return true;  // Special case: clear all
  }

  // _teamSolves is a list of tuples: PuzzleName and a list of players (PlayerName + Avatar)
  // boilerLookup.solves is a dictionary of puzzle names to the list of players
  let changes = false;
  const solvedPuzzles = Object.keys(kit.syncTeamSolves());
  for (let i = 0; i < solvedPuzzles.length; i++) {
    let puz = solvedPuzzles[i];
    // The value is a concatenated string of avatars
    let update = kit.syncTeamSolves()[puz];
    let keep = boilerLookup.solves[puz] || [];
    // Make sure that new solvers are appended to existing ones
    for (let u = 0; u < update.length; u++) {
      let plyr = update[u];
      if (!keep.find(p => p.Player==plyr.Player && p.Avatar == plyr.Avatar)) {
        keep.push(update[u]);
        changes = true;
      }
    }
    boilerLookup.solves[puz] = keep;
  }
  return changes;
}

/**
 * The index page has a hidden div (id='iframe-loader') for holding iframes that load materials in the background.
 * Those page loads in turn can set local state.
 * @param urls 
 */
function loadViaIframe(urls:string[]) {
  let div = document.getElementById('iframe-loader') as HTMLDivElement;
  for (let url of urls) {
    // Create a bunch of single-use iframes
    const iframe = document.createElement('iframe') as HTMLIFrameElement;
    iframe.src = url;
    // Once we have confirmation of the iframe's load, scan for new data
    iframe.onload = function(){setTimeout(() => syncUnlockedMetas(), 500)};
    div.appendChild(iframe);
  }
}

/**
 * What round has been requested by the URL?
 * @returns Two round indeces [first, last], both inclusive
 */
function roundsFromUrl(): number[] {
  let search = window.location.search.toLowerCase();
  // See if URL contains a minigame code
  for (let m = 0; m < minis.length; m++) {
    let code = 'mini=' + minis[m].name.toLowerCase();
    if (code && search.includes(code)) {
      return [minis[m].round, minis[m].round];
    }
  }
  // See if URL contains a round code
  for (let r = rounds.length - 1; r >= 0; r--) {
    let code = 'round=' + rounds[r].name.toLowerCase();
    if (code && search.includes(code)) {
      return [0, r];
    }
  }
  return [-1, -1];  // none
}

/**
 * What round are we in currently, based on the current date and time?
 * @returns Two round indeces [first, last], both inclusive
 */
function roundsFromDate(): number[] {
  let now = new Date();
  for (let r = rounds.length - 1; r >= 0; r--) {
    let rd = localReleaseTime(r);
    if (now >= rd) {
      return [0, r];
    }
  }
  return [0, 0];
}

/**
 * Name of the current round.
 * Used during sync, but not part of UI.
 * @returns round name, as titleSync.
 */
function roundName() {
  let range = roundsFromUrl();
  if (range[1] >= 0) {
    return rounds[range[1]].name;
  }
  range = roundsFromDate();
  if (range[1] >= 0) {
    return rounds[range[1]].name;
  }
  return '';
}

/**
 * Get the date and time that round R will release puzzles.
 * @param {int} round
 * @returns
 */
function localReleaseTime(round:number) {
  let date = new Date(rounds[round].release);

  // Offset to round release time, UTC
  let time = new Date(date);
  time.setMinutes(time.getMinutes() + releaseHourUTC * 60);

  // Offset to local time
  const tzMinutes = new Date().getTimezoneOffset();
  time.setMinutes(time.getMinutes() - tzMinutes);
 
  return time;
}

/**
 * Construct a friendly date+time, for dates in the future.
 * Or simply time for today.
 * Or empty for times in the past.
 * @returns A string like "Mar-3 at 14:05" or "14:05" or "" if in the past
 */
function timeToNextRound() {
  let range = roundsFromDate();
  if (range[1] + 1 >= rounds.length) {
    return '';
  }

  let date = localReleaseTime(range[1] + 1);
  let hh = date.getHours();
  const mm = date.getMinutes();
  const ap = hh < 12 ? "am" : "pm";
  hh = ((hh + 11) % 12) + 1;

  let wait = date.getTime() - Date.now();
  let days = Math.floor(wait / (1000 * 60 * 60 * 24));
  if (days >= 1) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mon = monthNames[date.getMonth()];
    const day = date.getDate();
    return `on ${mon}-${day} at ${hh}:${mm.toString().padStart(2, '0')}${ap}`;
  }
  if (days >= 0) {
    return `at ${hh}:${mm.toString().padStart(2, '0')}${ap}`;
  }
  return '';
}

/**
 * PDF for the current round or mini
 */
function pdfForRound() {
  let search = window.location.search.toLowerCase();
  for (let r = 1; r < rounds.length; r++) {
    let code = 'round=' + rounds[r].name.toLowerCase();
    if (code && search.includes(code)) {
      return rounds[r].pdf;
    }
  }
  for (let m = 0; m < minis.length; m++) {
    let code = 'mini=' + minis[m].name.toLowerCase();
    if (code && search.includes(code)) {
      return minis[m].pdf;
    }
  }
  return '';  // No PDF
}

/**
 * Don't show meta table until we have visible metas
 */
function showMetas() {
  let min = roundsFromUrl()[0];
  let max = roundsFromUrl()[1];
  let m = puzzles.find(puz => puz.round >= min && puz.round <= max && puz.type == types.meta);
  return !!m;
}

/**
 * Mini-events are a single round, so hide round labels
 */
function showRounds() {
  let search = window.location.search.toLowerCase();
  return !search.includes('mini=');
}