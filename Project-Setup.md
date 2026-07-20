# Puzzyl Event Project Setup Checklist

Generic instructions for creating a new puzzle event repo.
Replace `<event-slug>` with the subdomain name (e.g. `safariposters.puzzyl.net`).

---

## Phase 1 — Local project

- [ ] Create the directory `D:\git\<event-slug>`
- [ ] Copy all template files from `D:\git\puzzyl-event-template`:
  - `.npmrc`
  - `.gitignore`
  - `package.json`
  - `tsconfig.json`
  - `tsconfig.build.json`
  - `dev-server.mjs`
  - `src/event.ts`
  - `src/__Template.xhtml`
  - `src/css/`  *(shared CSS — PageSizes, TextInput, Poster, etc.)*
  - `src/images/`  *(shared icons, stamps, stars)*
- [ ] In `package.json`, set `"name"` to `<event-slug>`
- [ ] In `src/event.ts`, fill in the event details:
  - `title`
  - `cssRoot` (usually `'css/'`)
  - `imageRoot` (usually `'images/'`)
  - `fontCss` (event-specific font stylesheet, e.g. `'css/Fonts26.css'`)
  - `icon` (favicon filename)
  - `logo` (banner image filename)
- [ ] Run `npm install`
- [ ] Run `npm run build`  *(compiles `src/event.ts` → `src/event.js`)*
- [ ] Run `npm run typecheck`  *(should produce no errors)*
- [ ] Run `npm run dev` and open `http://127.0.0.1:3000/__Template.xhtml` — verify the page loads

---

## Phase 2 — First puzzle page

- [ ] Copy `src/__Template.xhtml` → `src/<PuzzleName>.xhtml`
- [ ] Fill in `title`, `author`, `copyright` in `window.boiler`
- [ ] Set `boiler.lookup.file` if the puzzle uses a lookup table
- [ ] Add puzzle content inside `<div id="pageBody">`
- [ ] Verify at `http://127.0.0.1:3000/<PuzzleName>.xhtml`

---

## Phase 3 — GitHub

- [ ] Create a new **private** repo on GitHub named `<event-slug>`
  *(e.g. `github.com/davidggarber/safariposters.puzzyl.net`)*
- [ ] In the local directory: `git init`
- [ ] `git add` all files except those in `.gitignore`
  *(do NOT commit `src/event.js` — it is gitignored as a build artifact)*
- [ ] `git commit -m "Initial project setup"`
- [ ] `git remote add origin https://github.com/davidggarber/<event-slug>.git`
- [ ] `git push -u origin main`

---

## Phase 4 — Prepare for production

The dev server falls back to the repo's `node_modules/` for the kit script, but Azure
Static Web App only serves the `src/` folder. Before the first deployment, the kit file
must land inside `src/`.

- [ ] Update the `build` script in `package.json` to copy the kit after compiling:
  ```json
  "build": "tsc -p tsconfig.build.json && node -e \"import('node:fs').then(fs => fs.default.cpSync('node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js', 'src/kit.umd.js'))\""
  ```
- [ ] Add `src/kit.umd.js` to `.gitignore`
- [ ] In every `.xhtml` page (including `__Template.xhtml`), change the kit script tag from:
  ```html
  <script src="/node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js"></script>
  ```
  to:
  ```html
  <script src="/kit.umd.js"></script>
  ```
- [ ] Run `npm run build` and confirm `src/kit.umd.js` is created
- [ ] Confirm `http://127.0.0.1:3000/__Template.xhtml` still works with the new path

---

## Phase 5 — Azure Static Web App

- [ ] In the Azure Portal, create a new **Static Web App**
  - Subscription: *(your subscription)*
  - Resource group: *(create or reuse)*
  - Name: `<event-slug>` (e.g. `safariposters-puzzyl-net`)
  - Region: closest to your audience
  - Plan type: Free
- [ ] Connect to GitHub:
  - Organisation / account: `davidggarber`
  - Repository: `<event-slug>`
  - Branch: `main`
- [ ] Set build details:
  - App location: `/`  *(repo root — where `package.json` is)*
  - Output location: `src`  *(the folder served as the web root)*
  - Build command: `npm run build`
- [ ] Click **Create** — Azure commits a GitHub Actions workflow file to the repo
  *(pull it locally: `git pull`)*
- [ ] Confirm the Actions workflow run succeeds (GitHub → Actions tab)
- [ ] Confirm the default Azure URL serves the site
  *(e.g. `https://<random>.azurestaticapps.net/__Template.xhtml`)*

---

## Phase 6 — Custom subdomain

- [ ] In the Azure Portal → your Static Web App → **Custom domains** → Add
  - Enter `<event-slug>` (e.g. `safariposters.puzzyl.net`)
  - Azure will show a **CNAME** record to add in DNS
- [ ] In the DNS provider for `puzzyl.net`, add the CNAME:
  - Name: `<subdomain>` (e.g. `safariposters`)
  - Value: `<random>.azurestaticapps.net`
- [ ] Wait for DNS propagation (minutes to hours)
- [ ] Back in Azure, click **Validate** — Azure provisions an SSL certificate automatically
- [ ] Confirm `https://<event-slug>/<PuzzleName>.xhtml` loads correctly

---

## Checklist for each subsequent puzzle page

- [ ] Copy `src/__Template.xhtml` → `src/<PuzzleName>.xhtml`
- [ ] Fill in `boiler` fields: `title`, `author`, `copyright`, `lookup`
- [ ] Build puzzle content
- [ ] Test locally at `http://127.0.0.1:3000/<PuzzleName>.xhtml`
- [ ] Commit and push — Azure deploys automatically via GitHub Actions
