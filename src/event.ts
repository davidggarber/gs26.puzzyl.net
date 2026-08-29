// No top-level import — this file compiles to a plain script, not an ES module,
// so it can be loaded in XHTML with a plain <script> tag.

interface Window {
  PuzzylKit: {
    registerDefaultEvent(details: import('@davidggarber/puzzyl-kit').PuzzleEventDetails): void
  }
}

const safariEvent: import('@davidggarber/puzzyl-kit').PuzzleEventDetails = {
  title: 'Giving Safari 26',
  cssRoot: 'css/',
  imageRoot: 'images/',
  googleFonts: 'Henny+Penny,Fontdiner+Swanky,Fuzzy+Bubbles,Handlee',
  fontCss: 'css/Fonts.css',
  links: [],
  icon: 'images/favicon.png',
  logo: 'images/logo.png',
  validation: true,
};

window.PuzzylKit.registerDefaultEvent(safariEvent);
