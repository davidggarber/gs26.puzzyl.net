# safariposters.puzzyl.net

Test repo for the published `@davidggarber/puzzyl-kit` package.

## Goal 1: Proof of concept for puzzle event repos

Confirm that the published puzzyl-kit can be consumed by a second repo, which represents a single event.
Consumed means that it
- installs
- type-checks
- serves puzzle pages locally for testing

This is a proof of concept, and we can adjust the contract between this project and the puzzyl-kit package until we have something easy to setup and re-use.

### Recap of the puzzyl-kit mechanism

Puzzyl-kit is written in TypeScript.
It post-processes a web-page, looking for special elements, and converting them in-place into more complex structures.
Each web page can provide runtime settings and variables for that post processing, in the form of the `boiler` global variable that every page must create in a script on the page.

On this computer, the puzzyl-kit is found at `d:\git\puzzyl-kit`.

## Goal 2: Be able to test a puzzle webpage locally

Here are several asks, grouped into high and low priorities:

### Highest priorities for server tech

1. The live website can run in an Azure *Static Web App* server. No actively-running server-side scripts.
2. The local test site should be as close to that experience as possible, up to even just file:// protocol.
3. A single web page is a .xhtml file, which imports the puzzyl-kit scripts. <br>
The kit then executes its post-processing as soon as the full page.xhtml has been loaded, including all HTML elements and any other scripts referenced by the page.
4. When testing in a browser, the devtools debugger can set breakpoints in puzzyl-kit

### Other priorities for server tech

5. Changes to the page are easy to see in the page I'm actively debugging.
6. When working on new features for the puzzyle-kit, I'd like to be able to link directly to the puzzyl-kit in its own repo, and both debug that copy of the code directly, and also change/rebuild that package quickly.<br>
As a fallback, it would be acceptable if this only worked for test webpages within the puzzyl-kit project itself.
7. The event repo provides a shared code block, which fills in some settings for puzzyl-kit. 
This replaces the global collection of all event details in the former _events.ts.

## Goal 3: Publish this proof of concept

This repo will be stored in github, in a `safariposters.puzzyl.net` repo.
It will be published to an Azure static web app, visible to the public at `https://safariposters.puzzyl.net`.

## Architecture

We use a plain Node.js static file server for local development. There is no bundler.

**Why not Vite:** Vite is designed around owning the HTML entry point and bundling a JavaScript app.
Our pages are `.xhtml` files that must be served raw as `application/xhtml+xml`. The only workable
Vite approach required fetching the xhtml via JavaScript and manually transplanting elements into a
wrapper page, which created an unsolvable script-ordering problem: puzzyl-kit ran before
`window.boiler` was set.

**Plain static server:** `dev-server.mjs` is ~50 lines of Node.js `http` module. It serves `src/`
as the web root (so `/Computers.xhtml` → `src/Computers.xhtml`), with a fallback to the repo root
for files not found in `src/` (used to reach `node_modules/` during dev). The browser loads `.xhtml`
files as real XHTML documents, inline scripts run in document order, and puzzyl-kit processes the
page on `DOMContentLoaded` — the same ordering as production.

**Azure Static Web App:** configure "App location" as `src/`. The published URL
`https://safariposters.puzzyl.net/Computers.xhtml` matches the local dev URL
`http://127.0.0.1:3000/Computers.xhtml` exactly.

**puzzyl-kit in pages:** Each `.xhtml` page loads the kit directly via:
```html
<script src="/node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js"></script>
```
The UMD build is a self-contained script with no dependencies. For production deployment, this file
would be copied to `dist/` alongside the page assets.

**TypeScript:** `src/event.ts` and any future event-repo TS is type-checked with `tsc --noEmit`.
No emit, no bundling. TypeScript is a dev-time tool only.

## Commands

```powershell
npm install
npm run typecheck   # type-check src/*.ts — no output, just errors
npm run build       # compiles our .ts files
npm run dev         # start dev server at http://127.0.0.1:3000
npm run dev:alpha   # same server, but /kit.umd.js comes from D:\git\puzzyl-kit\dist
```

Visit `http://127.0.0.1:3000/[name].xhtml` to test the puzzle page.

## Project structure

```
dev-server.mjs                          plain static file server
src/
  event.ts                              event metadata (type-checked only, not served)
  Computers.xhtml                       first test puzzle page
  Css/Poster.css                        shared puzzle styles
  Computers/                            images for the Computers puzzle
  V/cpr.js                              legacy vendor script (pre-npm era, kept for reference)
  poster.js                             shared puzzle script
node_modules/@davidggarber/puzzyl-kit/
  dist/kit.umd.js                       kit loaded directly by .xhtml pages
```

## Current success status

Note: we are using `Computers.xhtml` as our first test page.

- [x] `npm install` succeeds
- [x] `npm run typecheck` succeeds
- [x] `npm run dev` starts a server at http://127.0.0.1:3000
- [ ] Able to visit Computers.xhtml at `http://127.0.0.1:3000/Computers.xhtml`
- [ ] The page loads with no errors in the devtools console
- [ ] The page successfully runs its runtime builder
