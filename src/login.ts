// Runtime helpers come from kit.umd.js so this compiles to a classic script.
declare const doLogin: typeof import("@davidggarber/puzzyl-kit").doLogin;
declare const doLogout: typeof import("@davidggarber/puzzyl-kit").doLogout;
declare const getSyncDetails: typeof import("@davidggarber/puzzyl-kit").getSyncDetails;
declare const hasClass: typeof import("@davidggarber/puzzyl-kit").hasClass;
declare const isModal: typeof import("@davidggarber/puzzyl-kit").isModal;
declare const splitEmoji: typeof import("@davidggarber/puzzyl-kit").splitEmoji;
declare const toggleClass: typeof import("@davidggarber/puzzyl-kit").toggleClass;
declare const urlArgExists: typeof import("@davidggarber/puzzyl-kit").urlArgExists;

const LOGIN_TBD = 0;
const LOGIN_MODE = 1;
const LOGGED_IN_MODE = 2;
const LOGOUT_MODE = 3;

function postSetup() {
  var body = document.getElementById('LoginUI');
  // In modal UI, initialize to either login or logout
  // In modeless UI, initialized to either login or logged-in
  var hasPlayer = !!getSyncDetails().playerName;
  toggleClass(body, 'logout', hasPlayer && isModal());
  toggleClass(body, 'logged-in', hasPlayer && !isModal());
  initFields(false);
}

function toggleLogout(mode:number) {
  var body = document.getElementById('LoginUI');
  if (mode != LOGIN_TBD) {
    toggleClass(body, 'logout', mode == LOGOUT_MODE);
    toggleClass(body, 'logged-in', mode == LOGGED_IN_MODE);
  }
  initFields(true);
}

function initFields(newEmoji:boolean) {
  var body = document.getElementById('LoginUI');
  if (hasClass(body, 'logged-in')) {
    document.getElementById('logged-in-player')!.innerText = `${getSyncDetails().playerName} ${getSyncDetails().emojiAvatar}`;
    document.getElementById('logged-in-team')!.innerText = 
      getSyncDetails().teamName ? 'You are on team' : 'You are playing solo.';
    document.getElementById('logged-in-team2')!.innerText = getSyncDetails().teamName || '';
  }
  else if (hasClass(body, 'logout')) {
    document.getElementById('logout-player')!.innerText = getSyncDetails().playerName || '';
    document.getElementById('as-avatar')!.innerText = getSyncDetails().emojiAvatar || '';
    document.getElementById('on-team-name')!.innerText = 
      getSyncDetails().teamName ? `On team ${getSyncDetails().teamName}.` : 'Playing solo.';

    if (!isModal()) {
      // Default to Erase Player from kickoff page
      (document.getElementById('delete')! as HTMLInputElement).checked = true;
    }
  }
  else if (newEmoji) {
    randomEmoji();        
  }
}

function max1emoji() {
  var avatar = document.getElementById('avatar')! as HTMLInputElement;
  var chars = splitEmoji(avatar.value);
  if (chars.length > 1) {
    avatar.value = chars[chars.length - 1];
    avatar.select();
  }
}

function selectAll(input: HTMLInputElement) {
  input.select();
}

var emojiAnimals = "🫈🐵🐒🦍🦧🐶🐕🦮🐕‍🦺🐩🐺🦊🦝🐱🐈🐈‍⬛🦁🐯🐅🐆🐴🫎🫏🐎🦄🦓🦌🦬🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦣🦏🦛🐭🐁🐀🐹🐰🐇🐿️🦫🦔🦇🐻🐻‍❄️🐨🐼🦥🦦🦨🦘🦡🐾🦃🐔🐓🐣🐤🐥🐦🐧🕊️🦅🦆🦢🦉🦤🪶🦩🦚🦜🪽🐦‍⬛🪿🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🦭🐟🐠🐡🦈🫍🐙🐚🪸🦀🦞🦐🦑🪼🐌🦋🐛🐜🐝🪲🐞🦗🪳🕷️🕸️🦂🦟🪰🪱🦠";
var emojiMore = "💐🌸💮🪷🏵️🌹🥀🌺🌻🌼🌷🪻🌱🪴🌲🌳🌴🌵🌾🌿☘️🍀🍁🍂🍃🪹🪺🍄🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🫐🥝🍅🫒🥥🥑🍆🥔🥕🌽🌶️🫑🥒🥬🥦🧄🧅🥜🫘🌰🫚🫛🍞🥐🥖🫓🥨🥯🥞🧇🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🫔🥙🧆🥚🍳🥘🍲🫕🥣🥗🍿🧈🧂🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🫖🍵🍶🍾🍷🍸🍹🍺🍻🥂🥃🫗🥤🧋🧃🧉🧊🫙"
        + "🎃🎄🎆🎇🧨✨🎈🎉🎊🎋🎍🎎🎏🎐🎑🧧🎀🎁🎗️🎟️🎫🎖️🏆🏅⚽⚾🥎🏀🏐🏈🏉🎾🥏🎳🏏🏑🏒🥍🏓🏸🥊🥋🥅⛳⛸️🎣🤿🎽🎿🛷🥌🎯🪀🪁🔫🎱🔮🪄🎮🕹️🎰🎲🧩🧸🪅🪩🪆♟️🃏🀄🎴🎭🖼️🎨🧵🪡🧶🪢"
        + "👓🕶️🥽🥼🦺👑🪎👒🎩🎓🧢🪖⛑️📿💄💍💎🎼🎵🎶🎙️🎚️🎛️🎤🎧📻🎹🎷🪊🪗🎸🎹🎺🎻🪕🥁🪘💣🔨🪓⛏️⚒️🛠️🗡️⚔️🪃🏹🛡️🪚🔧🪛🔩⚙️🗜️⚖️🦯🔗⛓️🪝🧰🧲🪜🔭⚗️🧪🧫🧬🔬🔭📡🫯"
        + emojiAnimals;

var undoEmoji:string[] = [];
var redoEmoji:string[] = [];
function randomEmoji(wider:boolean = false) {
  var avatar = document.getElementById('avatar')! as HTMLInputElement;
  var cur = avatar.value;
  if (cur) {
    undoEmoji.push(cur);
    showUndoRedo();
  }
  
  var chars = splitEmoji(wider ? emojiMore : emojiAnimals);
  var rand = Math.floor(Math.random() * chars.length);
  avatar.value = chars[rand];
}
function prevEmoji() {
  var avatar = document.getElementById('avatar')! as HTMLInputElement;
  var ch = undoEmoji.pop();
  if (ch) {
    redoEmoji.push(avatar.value);
    avatar.value = ch;
  }
  showUndoRedo();
}
function nextEmoji() {
  var avatar = document.getElementById('avatar')! as HTMLInputElement;
  var ch = redoEmoji.pop();
  if (ch) {
    undoEmoji.push(avatar.value);
    avatar.value = ch;
  }
  showUndoRedo();
}
function showUndoRedo() {
  document.getElementById('redo')!.style.color = 
    redoEmoji.length > 0 ? 'initial' : 'transparent';
  document.getElementById('undo')!.style.color = 
    undoEmoji.length > 0 ? 'initial' : 'transparent';
}

function validateName() {
  var player = document.getElementById('playerName')! as HTMLInputElement;
  var pName = player.value || '';
  if (pName.trim().length > 0) {
    document.getElementById('login-button')!.removeAttribute('disabled');
  }
  else {
    document.getElementById('login-button')!.setAttribute('disabled', 'true');
  }
}

function login() {
  var player = document.getElementById('playerName')! as HTMLInputElement;
  var team = document.getElementById('teamName')! as HTMLInputElement;
  var avatar = document.getElementById('avatar')! as HTMLInputElement;
  var pName = player.value;
  var tName = team.value;
  var emoji = avatar.value;
  doLogin(pName, tName, emoji);
  if (urlArgExists('modal')) {
    dismissModal();
  }
  else {
    // Pivot UI to LoggedIn
    toggleLogout(LOGGED_IN_MODE);
  }
}

async function logout() {
  await doLogout(isModal(), (document.getElementById('delete')! as HTMLInputElement).checked);
  if (isModal()) {
    dismissModal();
  }
  else {
    // Pivot UI to LogIn
    toggleLogout(LOGIN_MODE);
  }
}

function invite_logout() {
  if (isModal()) {
    console.error('Should never be in this mode while modal');
    dismissModal();
  }
  else {
    // Pivot UI to LogOut
    toggleLogout(LOGOUT_MODE);
  }
}

function dismissModal() {
  if (window.parent !== window) {
    const targetOrigin = window.location.origin;
    window.parent.postMessage(
      'puzzyl:login-modal-dismiss',
      targetOrigin === 'null' ? '*' : targetOrigin,
    );
  }        
}

function cancel() {
  dismissModal();
}
