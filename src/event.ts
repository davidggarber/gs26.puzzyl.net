// No top-level import — this file compiles to a plain script, not an ES module,
// so it can be loaded in XHTML with a plain <script> tag.

interface Window {
  PuzzylKit: {
    registerDefaultEvent(details: import('@davidggarber/puzzyl-kit').PuzzleEventDetails): void
    dismissLogin: typeof import('@davidggarber/puzzyl-kit').dismissLogin
  }
}

// TODO: import from puzzyl-kit
// type EventSyncConfig = {
//   eventName: string;  // Identifies the event on the server.
//   hasLogin: boolean;  // If false, no attempt to get user identity at all. Any syncing is anonymous.
//   hasTeams: boolean;   // If false, every player is solo or anonymous.
//   syncSolves: boolean;  // If true, each user solve is sent to the server
//   syncUsage: boolean;  // If true, the track finer-grain user progress
//   offerRatings: RatingDetails;  // Which, if any, ratings UI to display
// }
// type RatingDetails = {
//   fun: boolean,
//   difficulty: boolean,
//   feedback: boolean
// }


const safariEvent: import('@davidggarber/puzzyl-kit').PuzzleEventDetails = {
  title: 'Giving Safari 26',
  cssRoot: 'css/',
  imageRoot: 'images/',
  iconRoot: 'images/icons/',
  googleFonts: 'Henny+Penny,Fontdiner+Swanky,Fuzzy+Bubbles,Handlee',
  fontCss: 'css/Fonts.css',
  links: [],
  icon: 'images/favicon.png',
  logo: 'images/logo.png',
  validation: true,
  helpLink: '/TipsTricks.xhtml',
  getEventSync: getSyncConfig,
};

window.PuzzylKit.registerDefaultEvent(safariEvent);

if (window.parent === window) {
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || event.data !== 'puzzyl:login-modal-dismiss') {
      return;
    }

    const iframe = document.getElementById('modal-iframe');
    if (!(iframe instanceof HTMLIFrameElement) || event.source !== iframe.contentWindow) {
      return;
    }

    window.PuzzylKit.dismissLogin(null);
  });
}

function getEventCode():string {
  if (window.location.search) {
    const urlArgs = new URLSearchParams(window.location.search);

    if (urlArgs.has('gs26')) {
        return 'gs26';
    }
  }
  return 'ps23';
}

function getSyncConfig(): import('@davidggarber/puzzyl-kit').EventSyncConfig|undefined {
  const code = getEventCode();
  if (window.location.search) {
    const urlArgs = new URLSearchParams(window.location.search);

    if (code === 'gs26') {
      // gs26 means this is the giving event, with team and sync support
      return {
        eventName: 'Giving Safari 26',
        eventSync: 'GivingSafari26',
        eventKey: 'gs26',
        hasLogin: true,
        hasTeams: true,
        syncSolves: true,
        syncUsage: true,
        offerRatings: {
          fun: true,
          difficulty: true,
          feedback: true
        }
      };
    }
  }

  // Otherwise, this is just a collection of PS23 puzzles, with no sync
  return {
    eventName: 'Puzzle Safari 23',
    eventKey: 'ps23',
    eventSync: '',
    hasLogin: false,
    hasTeams: false,
    syncSolves: false,
    syncUsage: false,
    offerRatings: {
      fun: false,
      difficulty: false,
      feedback: false
    }
  };
}
