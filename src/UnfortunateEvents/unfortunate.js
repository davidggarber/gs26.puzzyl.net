// To start, all center wordles are spaces
const metaWordles = Array.from({ length: 5 }, () => Array(5).fill(' '));
let metaWordlesTimer = 0;

function onInputChange(inp/*:TextInputElement*/) {
  var dat = getOptionalStyle(inp, 'data-feeder-wordle');
  if (dat) {
    coords = dat.split('-').map(Number);
    if (inp.value) {
      metaWordles[coords[1]][coords[2]] = inp.value;
    }

    // Schedule one cache call; coalesce repeats until it runs.
    queueCacheMetaWordles();
  }
}

function onSubmit(guess, response) {
  if (response == 1) {
    var word = guess + '     ';  // pad with spaces
    for (var i = 0; i < 5; i++) {
      metaWordles[4][i] = word[i];
    }
    updatePuzzleList(`UnfortunateMeta-${boiler.lookup.part}`, 'loaded');
    cacheMetaWordles();
  }
}

function queueCacheMetaWordles() {
  if (!metaWordlesTimer) {
    metaWordlesTimer = setTimeout(() => {
      metaWordlesTimer = 0;
      cacheMetaWordles();
    }, 0);
  }
}

function cacheMetaWordles() {
  if (urlArgs['from'] != 'sync') {
    var words = metaWordles.map(row => row.join(''));
    saveMetaMaterials('UnfortunateMeta', 0, boiler.lookup.part, words);
  }
}
