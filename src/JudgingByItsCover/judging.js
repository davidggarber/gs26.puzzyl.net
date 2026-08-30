/**
 * Cache the currently-playing audio, so we can pause it if asked
 */
var _currently_playing = null;

/**
 * Tag the parent row of the audio that's playing, and clear other rows
 * @param {*} aud 
 */
function onPlay(aud) {
  if (_currently_playing != null && _currently_playing != aud) {
    _currently_playing.pause();
    var tr = findParentOfTag(_currently_playing, 'tr');
    toggleClass(tr, 'playing', false);
  }
  _currently_playing = aud;
  if (aud) {
    var tr = findParentOfTag(aud, 'tr');
    toggleClass(tr, 'playing', true);
  }
}

/**
 * Start or stop the audio, and flag the playing row for a highlight
 * @param {HTMLElement} elmt any element in a row that contains an audio
 */
function toggleAudio(elmt) {
  // Whenever the user types ENTER, play (or pause) the audio on that row
  var tr = findParentOfTag(elmt, 'tr');
  var aud = tr ? tr.getElementsByTagName('audio')[0] : null;
  if (aud) {
    if (aud == _currently_playing) {
      aud.pause();
      onPlay(null);
    }
    else {
      onPlay(aud);
      aud.play();
    }
  }
}
/**
 * Enter (in the input fields) toggles that row's audio
 * @param {*} evt 
 */
function onInputKeyDown(evt) {
  if (evt.key === 'Enter') {
    toggleAudio(evt.target);
  }
}
