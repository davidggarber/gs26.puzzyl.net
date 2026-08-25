// @ts-nocheck -- Legacy classic-script globals are supplied by puzzyl-kit and page templates.

var types = {
    word: { icon: 'word', alt: 'Word puzzle' },
    logic: { icon: 'logic', alt: 'Logic puzzle' },
    math: { icon: 'math', alt: 'Math puzzle' },
    rebus: { icon: 'rebus', alt: 'Rebus puzzle' },
    trivia: { icon: 'trivia', alt: 'Trivia puzzle' },
    search: { icon: 'search', alt: 'Word search puzzle' },
    code: { icon: 'code', alt: 'Encoded puzzle' },
    maze: { icon: 'maze', alt: 'Maze puzzle' },
    jigsaw: { icon: 'jigsaw', alt: 'Jigsaw puzzle' },
    construction: { icon: 'construction', alt: 'Construction puzzle' },
    meta: { icon: 'meta', alt: 'Meta-puzzle' },
    challenge: { icon: 'experiment', alt: 'Challenge' },
    poster: { icon: 'unknown', alt: 'Pre-event puzzle' },
};
var group = {
    puzzle: 'puzzle',
    challenge: 'challenge',
    feeder: 'feeder',
    meta: 'meta',
    pending: '',
    cut: undefined
};
var orient = {
    portrait: 'portrait',
    landscape: 'landscape',
};
var meta = {
};
var challenge = {
}

var puzzles = [
    { round: 0, title: 'Elective Operations', thumb: '', author: 'David Garber', type: types.math, group: group.puzzle, orientation: orient.portrait, cls:'', feeder: [] },
];

var rounds = [
    { filename: 'r1', release: '10/1/2026', pdf: '' },
    { filename: 'r2', release: '10/3/2026', pdf: 'trails' },
    { filename: 'r3', release: '10/10/2026', pdf: 'creeks' },
    { filename: 'r4', release: '10/17/2026', pdf: 'ranges' },
    { filename: 'r5', release: '10/24/2026', pdf: 'bridges' },
];
var minis = [
    { filename: 'Hike', round: 1, pdf: 'hikes' },
    { filename: 'Swim', round: 2, pdf: 'swims' },
    { filename: 'Ride', round: 3, pdf: 'rides' },
    { filename: 'Sail', round: 4, pdf: 'sails' },
];
var releaseHourUTC = 13; // 9am EDT, 6am PDT

var metas = {
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

// Pass any url arguments on to the puzzles, plus the event identifier
//  - ps23 event is for single-player puzzling.
//  - gs26 event is an event, with teams and a leaderboard.
// Note that in all cases, the result is at least '?'.
var _urlEventArguments = (window.location.search.indexOf('gs26') > 0 || window.location.search.indexOf('ps22') > 0)
    ? window.location.search  // no change
    : window.location.search === '' ? '?gs26'
    : (window.location.search + '&gs26');

// Fill in the puzzle hrefs
for (var puz of puzzles) {
    if (!puz['file']) {
        // The assumed name is a CamelCase version of the original
        var words = puz.title.split(' ');
        puz['file'] = '';
        for (var w = 0; w < words.length; w++) {
            if (words[w].length > 0) {
                var word = words[w][0].toUpperCase() + words[w].substring(1);
                puz['file'] += word;
            }
        }
    }
    puz['href'] = puz['file'] + '.xhtml' + _urlEventArguments;
}

var first_puzzle_solve_id_ = 500;
var first_meta_solve_id_ = first_puzzle_solve_id_ - 2;
var first_challenge_solve_id_ = first_puzzle_solve_id_ - 5;
function puzzleSolveId(puz) {
    // Each group is in a separate id range
    var id = puz.group == group.puzzle ? first_puzzle_solve_id_
        : puz.group == group.meta ? first_meta_solve_id_ : first_challenge_solve_id_;
    for (var i = 0; i < puzzles.length; i++) {
        if (puzzles[i].group != puz.group) {
            continue;
        }
        if (puz == puzzles[i]) {
            return id;
        }
        id++;
    }
    return -1;
}

function expandPuzzles() {
  toggleClass(document.getElementById('table'), 'no-solver', !theSafariDetails.solverSite);
  var list = document.getElementById('puzzle_list');
  var metas = document.getElementById('meta_list');
  for (var i = 0; i < puzzles.length; i++) {
      var puz = puzzles[i];
      if (puz.group == group.puzzle) {
          var tr = document.createElement('tr');
          var thIcon = document.createElement('td');
          var tdTitle = document.createElement('td');
          var tdAuthor = document.createElement('td');
          var tdFeeder = document.createElement('td');
          var tdSubmit = document.createElement('td');
          tr.id = puzzleFile(puz);
          tr.classList.add('sortable');
          thIcon.classList.add('icons');
          tdTitle.classList.add('html');
          tdAuthor.classList.add('author');
          tdFeeder.classList.add('feeders');
          tdSubmit.classList.add('submital')

          var imgIcon = document.createElement('img');
          var aTitle = document.createElement('a');
          if (puz.icon) {
              imgIcon.src = 'Icons/' + puz.icon + '.png';
          }
          else {
              imgIcon.src = 'Icons/' + puz.type.icon + '.png';
              imgIcon.title = puz.type.alt;
          }
          if (puz.group != group.pending) {
              aTitle.href = puzzleHref(puz);
          }
          aTitle.target = '_blank';
          aTitle.innerText = puz.title;
          aTitle.classList.add('hover');
          tdAuthor.innerText = puz.author;
          var imgThumb = document.createElement('img');
          imgThumb.classList.add('thumb');
          imgThumb.src = 'Thumbs/' + puz.thumb + '.png';
          aTitle.appendChild(imgThumb);

          if (puz.feeder) {
              tdFeeder.appendChild(createFeeder(puz.feeder, false));
          }

          tr.appendChild(thIcon);
          tr.appendChild(tdTitle);
          tr.appendChild(tdFeeder);
          tr.appendChild(tdAuthor);
          tr.appendChild(tdSubmit);
          thIcon.appendChild(imgIcon);
          tdTitle.appendChild(aTitle);

          if (puz.group == group.meta) {
              metas.appendChild(tr);
          }
          else {
              list.appendChild(tr);
          }
      }
      addSolverLink(puz);
      markAsSolved(puzzleFile(puz));
  }

  var hovers = document.getElementsByClassName('hover');
  for (var i = 0; i < hovers.length; i++) {
      var aTitle = hovers[i];
      var td = findParentOfTag(aTitle, 'td');
      td.onmouseover=function(e){bigThumb(e)};
      td.onmouseout=function(e){littleThumb(e)};
  }
}

function addSolverLink(puz) {
  var tr = document.getElementById(puzzleFile(puz));
  if (tr) {
      var td = tr.getElementsByClassName('submital')[0];
      if (theSafariDetails.solverSite) {
          var aSubmit = document.createElement('a');
          aSubmit.href = theSafariDetails.solverSite + '/Solve?id=' + puzzleSolveId(puz);
          aSubmit.target = '_blank';
          aSubmit.appendChild(document.createTextNode('submit'));
          td.appendChild(aSubmit);
      }
  }
}

function markAsSolved(puzFile) {
  var tr = document.getElementById(puzFile);
  if (tr && !hasClass(tr, 'solved')) {
      var pStatus = getPuzzleStatus(puzFile);
      if (pStatus == 'solved') {
          var check = document.createElement('img');
          check.src = '../Icons/Check.png';
          toggleClass(check, 'solve-check', true);

          var td = tr.getElementsByClassName('submital')[0];
          td.appendChild(check);
          toggleClass(tr, 'solved', true);
      }
  }
}

// feed is a struct: [0] is the feeder name, [1] is the index (or 0 if indexes are used)
function createFeeder(feed, unlocked, altImg) {
  var spanFeed = document.createElement(unlocked ? 'a' : 'span');
  spanFeed.classList.add(feed[0]);
  spanFeed.title = feeders[feed[0]].tooltip;
  var imgFeed = document.createElement('img');
  imgFeed.classList.add(feed[0] + '-' + feed[1]);

  if (unlocked) {
      imgFeed.src = feeders[feed[0]].unlocked;
      spanFeed.classList.add('unlocked');
      spanFeed.target = '_blank';
      spanFeed.href = feeders[feed[0]].materials[feed[1]];
  }
  else {
      imgFeed.src = feeders[feed[0]].locked;
      spanFeed.classList.add('locked');
  }
  if (altImg) {
      imgFeed.src = altImg;
  }
  spanFeed.appendChild(imgFeed);
  var subFeed = document.createElement('sub');
  if (feed.length > 1 && feed[1] > 0) {
      subFeed.innerText = feed[1];
  }
  else {
      subFeed.innerText = ' ';  // need something, or else rows with subs will be taller
  }
  spanFeed.appendChild(subFeed);
  return spanFeed;
}

function updateProgress() {
  var feederKeys = Object.keys(feeders);
  for (var f = 0; f < feederKeys.length; f++) {
      var key = feederKeys[f];
      var feed = feeders[key];
      if (feed.type == 'meta') {
          var store = feed.store;
          var td = document.getElementById(key + '-unlocked');
          for (var i = 1; i <= feed.count; i++) {
              if (i in feed.materials) {
                  continue;
              }
              var materials = loadMetaMaterials(store, 0, i);
              if (materials != null) {
                  feed.materials[i] = materials['src'];
                  td.appendChild(createFeeder([key, i], true));

                  var imgs = document.getElementsByClassName(key + '-' + i);
                  for (var m = 0; m < imgs.length; m++) {
                      var img = imgs[m];
                      img.src = feeders[key].unlocked;
                      var span = img.parentNode;
                      span.classList.remove('locked');  // span
                      span.classList.add('unlocked');  // span
                  }
              }
          }
      }
      else {  // feed.type == 'challenge'
          td = document.getElementById(key + '-unlocked');
          if (!td || Object.keys(feed.materials).length > 0) {
              continue;
          }
          var materials = loadMetaMaterials(chal, 0, 1);
          if (materials != null) {
              feed.materials[0] = materials['src'];
              td.appendChild(createFeeder([chal, 0], true, 'Icons/ticket.png'));
          }
      }
  }

  var solved = listPuzzlesOfStatus('solved');
  for (var i = 0; i < solved.length; i++) {
      var name = solved[i];
      markAsSolved(name);
  }
}

// 1, 2, ... means that column index is sorted ascending
// -1, -2, ... means that (abs) column index is sorted descenind
var sortOrder = 2;  // Puzzle name

function sortTable(th) {
  var tr = th.parentNode;
  var allThs = tr.getElementsByTagName('th');
  var col = 0;
  for (var c of allThs) {
    col++;
    if (c == th) {
      break;
    }
  }

  var sortNumeric = hasClass(th, 'sort-numeric');
  var tbody = document.getElementById('puzzle_list');
  var rows = document.getElementsByClassName('sortable');
  var lookup = {};
  var order = [];
  for (var i = rows.length - 1; i >= 0; i--) {
      var row = rows[i];
      if (row.parentNode != tbody) {
          continue;
      }
      var cols = row.getElementsByTagName('td');
      var cell = cols[col - 1];
      var prevOrder = String(i).padStart(2, '0');
      var val = cell.innerHTML + ' ' + prevOrder;
      if (hasClass(th, 'completed') && hasClass(cell.parentNode, 'solved')) {
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
    order.sort((a,b) => { return parseFloat(a) - parseFloat(b) });
  }
  else {
    order.sort();
  }
  sortOrder = (sortOrder == col) ? -col : col;
  if (sortOrder < 0) {
      order.reverse();
  }
  for (var i = 0; i < order.length; i++) {
      var row = lookup[order[i]];
      tbody.appendChild(row);
  }
  // update header with arrow indicating sort order
  for (var t of allThs) {  // Clear previous sort state from all columns
    toggleClass(t, 'sortedAsc', false);
    toggleClass(t, 'sortedDesc', false);
  }
  toggleClass(th, 'sortedAsc', sortOrder > 0);
  toggleClass(th, 'sortedDesc', sortOrder < 0);
}

function bigThumb(evt) {
  var td = evt.target;
  if (td.tagName != 'A') {
      td = td.parentNode;
  }
  td.classList.add('big');
  td.classList.remove('little');
  var tr = findParentOfTag(td, 'tr');
  tr.classList.add('big');
}
function littleThumb(evt) {
  var td = evt.target;
  if (td.tagName != 'A') {
      td = td.parentNode;
  }
  td.classList.remove('big');
  td.classList.add('little');
  var tr = findParentOfTag(td, 'tr');
  tr.classList.remove('big');
}

function setupSolvables() {
  boiler.lookup.teammates = boiler.lookup.teammates || [];
  boiler.lookup.solves = boiler.lookup.solves || {};
  document.addEventListener('visibilitychange', function (event) { syncProgress(); });
  var body = document.getElementsByTagName('body')[0];
  body.addEventListener('focus', function (event) { syncProgress(); } );
  // Then run it now.
  syncProgress();
}

var _unlocked_feeders = {};
var _refresh_interval = undefined;
var _stopRefreshing = new Date().getTime();
var _refreshEvery = 15 * 1000;  // 15 seconds
var _teammates = typeof _teammates === 'undefined' ? [] : _teammates;
var _teamName = typeof _teamName === 'undefined' ? '' : _teamName;
var _teamSolves = typeof _teamSolves === 'undefined' ? [] : _teamSolves;
var _remoteUnlocked = typeof _remoteUnlocked === 'undefined' ? [] : _remoteUnlocked;


function syncProgress() {
  if (document.hidden) {
    return;
  }
  for (var i = 0; i < puzzles.length; i++) {
    var puz = puzzles[i];
    updateSolves(puz.file, puz.round);
  }
  
  syncUnlockedMetas();

  // Once we start syncing, check every 15 seconds for 3 hours
  _stopRefreshing = new Date().getTime() + 3 * 60 * 60 * 1000;  // 1 hour of refreshes
  _refresh_interval = setInterval(timeToRefreshTeam, _refreshEvery);
  timeToRefreshTeam();  // With an initial call immediately
}

function syncUnlockedMetas() {
  var metaKeys = Object.keys(metas);
  for (var m = 0; m < metaKeys.length; m++) {
    var metaInfo = metas[metaKeys[m]];
    for (var i = 0; i <= metaInfo.count; i++) {
      updateUnlocked(metaInfo.store, i);
    }
  }
}

function timeToRefreshTeam() {
  if (new Date().getTime() >= _stopRefreshing) {
    clearInterval(_refresh_interval);
  }
  if (document.visibilityState == 'visible') {
    refreshTeamHomePage(refreshTeamProgress);
  }
}

function updateSolves(puzFile, round) {
  var pStatus = getPuzzleStatus(puzFile);
  var tr = document.getElementById(puzFile);
  if (tr) {
    toggleClass(tr, 'solved', pStatus == 'solved');
  }
  if (round == 0) {
    // HACK HACK HACK HACK HACK :(
    // Look in the Posters folder
    if (hasClass(tr, 'hidden')) {
      pStatus = getPuzzleStatus('url_' + puzFile, undefined, '../Posters/puzzle_list');
      if (pStatus) {  // Show row, and overwrite the link URL
        var hovers = tr.getElementsByClassName('hover');
        if (hovers.length > 0) {
          toggleClass(tr, 'hidden', false);
          hovers[0].href = pStatus;
        }
      }
    }
    pStatus = getPuzzleStatus(puzFile, undefined, '../Posters/puzzle_list');
    if (tr) {
      toggleClass(tr, 'solved', pStatus == 'solved');
    }
  }
}

/**
 * Check to see if a meta material we know by title, has new local data.
 * That would mean it has been unlocked - either locally or by team sync.
 * For each, change their UI to unlocked, and hook up their link to that URL.
 * @param {*} meta
 * @param {*} i
 */
function updateUnlocked(meta, i) {
  var puzFile = `${meta}-${i}`;
  if (!(puzFile in _unlocked_feeders)) {
    var pStatus = getPuzzleStatus(puzFile);
    if (pStatus) {
      var mat = loadMetaMaterials(meta, 0, i);
      if (mat) {
        _unlocked_feeders[puzFile] = true;
        var links = document.getElementsByClassName(puzFile);
        for (var a = 0; a < links.length; a++) {
          toggleClass(links[a], 'unlocked', true);
          links[a].href = mat.src + _urlEventArguments;
          if (links[a].title.endsWith(' (locked)')) {
            links[a].title = links[a].title.substring(0, links[a].title.length - 9);
          }
        }
      }
    }
  }
}

function refreshTeamProgress() {
  var overwrite = false;  // Prefer to merge where possible
  if (JSON.stringify(_teammates) != JSON.stringify(boiler.lookup.teammates)) {
    overwrite = boiler.lookup.teammates.length > _teammates.length;  // when we drop a team member
    boiler.lookup.teammates = _teammates;
    boiler.lookup.teamname = _teamName;
    refillFromTemplate(document.getElementById('team-roster'), 'teammate-list');
    updatePresence()
  }

  if (mergeSolves(overwrite)) {
    for (var puz of puzzles) {
      var tr = document.getElementById(puz.file);
      if (tr) {
        var span = tr.getElementsByClassName('teammate-solves')[0];
        if (span) {
          var solvers = boiler.lookup.solves[tr.getAttribute('name')] || [];
          var args = {solvers: solvers};
          refillFromTemplate(span, 'teammate-solves', args);
        }
      }
    }
  }

  if (_remoteUnlocked.length > 0) {
    var foundNew = false;
    var newlyUnlocked = [];
    for (var ru of _remoteUnlocked) {
      if (!ru.PuzzleName) {
        continue;  // bad data. Don't load, since we'll never be able to acknowledge the load
      }
      if (!(ru.PuzzleName in _unlocked_feeders)) {
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

function updatePresence() {
  var presences = document.getElementsByClassName('presence-avatar');
  for (var i = presences.length - 1; i >= 0; i--) {
    var pres = presences[i];
    pres.parentNode.removeChild(pres);
  }

  for (var pp of boiler.lookup.teammates) {
    if (pp.Presence) {
      var tr = document.getElementsByName(pp.Presence)[0];
      if (tr) {
        var td = tr.getElementsByClassName('presence')[0];
        var span = document.createElement('span');
        toggleClass(span, 'presence-avatar', true);
        span.appendChild(document.createTextNode(pp.Avatar));
        span.setAttribute('title', pp.PlayerName);
        td.appendChild(span);
      }
    }
  }
}

function mergeSolves(overwrite)
{
  if (overwrite || _teamSolves.length == 0) {
    boiler.lookup.solves = {};
    return true;  // Special case: clear all
  }

  // _teamSolves is a list of tuples: PuzzleName and a list of players (PlayerName + Avatar)
  // boiler.lookup.solves is a dictionary of puzzle names to the list of players
  var changes = false;
  for (var i = 0; i < _teamSolves.length; i++) {
    var puz = _teamSolves[i].PuzzleName;
    var update = _teamSolves[i].Solvers;
    var keep = boiler.lookup.solves[puz] || [];
    // Make sure that new solvers are appended to existing ones
    for (var u = 0; u < update.length; u++) {
      var plyr = update[u];
      if (!keep.find(p => p.Player==plyr.Player && p.Avatar == plyr.Avatar)) {
        keep.push(update[u]);
        changes = true;
      }
    }
    boiler.lookup.solves[puz] = keep;
  }
  return changes;
}

function loadViaIframe(urls) {
  var div = document.getElementById('iframe-loader');
  for (var url of urls) {
    // Create a bunch of single-use iframes
    var url = urls.pop();
    const iframe = document.createElement('iframe');
    iframe.src = url;
    // Once we have confirmation of the iframe's load, scan for new data
    iframe.onload = function(){setTimeout(() => syncUnlockedMetas(), 500)};
    div.appendChild(iframe);
  }
}

/**
 * What round are we in currently?
 * Could be triggered by the current date & time, or by a URL argument.
 * @returns The index of the round.
 */
function roundFromDate() {
  var search = window.location.search.toLowerCase();
  var now = new Date();
  for (var r = rounds.length - 1; r >= 0; r--) {
    var rd = localReleaseTime(r);
    if (now >= rd) {
      return r;
    }
    var code = 'round=' + rounds[r].filename.toLowerCase();
    if (code && search.includes(code)) {
      return r;
    }
  }
  for (var m = 0; m < minis.length; m++) {
    var code = 'mini=' + minis[m].filename.toLowerCase();
    if (code && search.includes(code)) {
      return minis[m].round;
    }
  }
  return 0;
}

function minRoundFromUrl() {
  var search = window.location.search.toLowerCase();
  for (var r = 1; r < rounds.length; r++) {
    var code = 'round=' + rounds[r].filename.toLowerCase();
    if (code && search.includes(code)) {
      return 0;
    }
  }
  for (var m = 0; m < minis.length; m++) {
    var code = 'mini=' + minis[m].filename.toLowerCase();
    if (code && search.includes(code)) {
      return minis[m].round;
    }
  }
  return 0;
}

function maxRoundFromUrl() {
  var search = window.location.search.toLowerCase();
  for (var r = 1; r < rounds.length; r++) {
    var code = 'round=' + rounds[r].filename.toLowerCase();
    if (code && search.includes(code)) {
      return r;
    }
  }
  for (var m = 0; m < minis.length; m++) {
    var code = 'mini=' + minis[m].filename.toLowerCase();
    if (code && search.includes(code)) {
      return minis[m].round;
    }
  }
  return rounds.length - 1;
}

/**
 * Name of the current round.
 * Used during sync, but not part of UI.
 * @returns round name, as titleSync.
 */
function roundName() {
  var round = roundFromDate();
  return rounds[round].filename;
}

/**
 * Get the date and time that round R will release puzzles.
 * @param {int} round
 * @returns
 */
function localReleaseTime(round) {
  var date = new Date(rounds[round].release);

  // Offset to round release time, UTC
  var time = new Date(date);
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
 * @param {Date} date
 * @returns A string like "Mar-3 at 14:05" or "14:05" or "" if in the past
 */
function timeToNextRound() {
  var round = roundFromDate();
  if (round + 1 >= rounds.length) {
    return '';
  }

  var date = localReleaseTime(round + 1);
  let hh = date.getHours();
  const mm = date.getMinutes();
  const ap = hh < 12 ? "am" : "pm";
  hh = ((hh + 11) % 12) + 1;

  var wait = date - new Date();
  var days = Math.floor(wait / (1000 * 60 * 60 * 24));
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

// PDF for the current round or mini
function pdfForRound() {
  var search = window.location.search.toLowerCase();
  for (var r = 1; r < rounds.length; r++) {
    var code = 'round=' + rounds[r].filename.toLowerCase();
    if (code && search.includes(code)) {
      return rounds[r].pdf;
    }
  }
  for (var m = 0; m < minis.length; m++) {
    var code = 'mini=' + minis[m].filename.toLowerCase();
    if (code && search.includes(code)) {
      return minis[m].pdf;
    }
  }
  return '';  // No PDF
}

// Don't show meta table until we have visible metas
function showMetas() {
  var min = minRoundFromUrl();
  var max = roundFromDate();
  var m = puzzles.find(puz => puz.round >= min && puz.round <= max && puz.type == types.meta);
  return !!m;
}

// Mini-events are a single round, so hide round labels
function showRounds() {
  var search = window.location.search.toLowerCase();
  return !search.includes('mini=');
}