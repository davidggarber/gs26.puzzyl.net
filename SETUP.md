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

## Phase 2 — For each puzzle page

- All puzzles should live in the `src/` folder
- Copy `src/__Template.xhtml` → `src/<PuzzleName>.xhtml`
- Support files used by a single puzzle should be a sub-folder `src/<PuzzleName>`
- In the puzzle's `window.boiler` script object...
  - Fill in `title`, `author`, `copyright`
  - Add values to `boiler.lookup` that will be read by the dynamic builder
- Add puzzle content inside `<div id="pageBody">`
- Add page-level styles -- especially overrides to shared css rules -- inside the `#Local` block.
- Verify at `http://127.0.0.1:3000/<PuzzleName>.xhtml`

---

## Phase 3 — GitHub

- Create a new *private* repo on GitHub named `<event-slug>`
    *(e.g. `github.com/davidggarber/safariposters.puzzyl.net`)*
  - Description = *something disambiguating*
  - Visibility = private
  - Template = no
  - Readme = no
  - .gitignore = no
  - .license = no
- In the local directory: `git init -b main`
  - If you forget `-b main`, you can subsequently `git branch -m master main` to rename it.
- `git add` all files except those in `.gitignore`
  *(do NOT commit `src/event.js` — it is gitignored as a build artifact)*
- `git commit -m "Initial project setup"`
- `git remote add origin https://github.com/davidggarber/<event-slug>.git`
- `git push -u origin main`

---

## Phase 4 — Prepare for production

All `.xhtml` pages already use `<script src="/kit.umd.js">` — the dev server aliases that
path to `node_modules/` automatically. Azure Static Web App only serves the `src/` folder,
so the build step must copy the file there.

1. Update the `build` script in `package.json` to copy the kit after compiling:
  ```json
  "build": "tsc -p tsconfig.build.json && node -e \"import('node:fs').then(fs => fs.default.cpSync('node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js', 'src/kit.umd.js'))\""
  ```
2. Add `src/kit.umd.js` to `.gitignore`
3. Run `npm run build` and confirm `src/kit.umd.js` is created
4. Confirm `http://127.0.0.1:3000/__Template.xhtml` still works

---

## Phase 5 — Azure Static Web App

1. In the Azure Portal, create a new **Static Web App**
   - Subscription: *(your subscription)*
   - Resource group: *(create or reuse)*
   - Name: `<event-slug>` (e.g. `safariposters-puzzyl-net`)
   - Region: closest to your audience
   - Plan type: Free
2. Connect to GitHub:
   - Organisation / account: `davidggarber`
   - Repository: `<event-slug>`
   - Branch: `main`
3. Set build details:
   - Build template: `Custom`
   - App location: `/`  *(repo root — where `package.json` is)*
   - Api location: *leave blank*
   - Output location: `src`  *(the folder served as the web root)*
   - Build command: `npm run build`
4. Click **Create** — Azure commits a GitHub Actions workflow file to the repo
  *(pull it locally: `git pull`)*
5. Fix the generated workflow YAML — see **Phase 5b** below
6. Confirm the Actions workflow run succeeds (GitHub → Actions tab)
7. Confirm the default Azure URL serves the site
  *(e.g. `https://<random>.azurestaticapps.net/__Template.xhtml`)*

---

## Phase 5b — Fix the generated workflow YAML

Azure generates `.github/workflows/azure-static-web-apps-<random>.yml` and commits it,
but it needs a few tweaks before the build will succeed.

### Upgrade `actions/checkout`

The generated file uses `actions/checkout@v3` (deprecated Node.js 20). Change it to `v4`:

```yaml
- uses: actions/checkout@v4
```

### Allow the build to read GitHub Package Registry

`puzzyl-kit` is hosted on GitHub Package Registry. The auto-generated `GITHUB_TOKEN` only
has access to the *current* repo, not to packages from other repos. A PAT is required.

**One-time setup — create the PAT:**

1. **GitHub** → your avatar → Settings → Developer settings → Personal access tokens →
   Tokens (classic) → Generate new token
2. Scope: `read:packages` only
3. Copy the token value

**Per-repo setup — add the secret:**

1. Go to the repo on GitHub → Settings → Secrets and variables → Actions
2. New repository secret: name = `NPM_TOKEN`, value = the PAT from above

**In the workflow YAML**, add an `env:` block to the Build And Deploy step:

```yaml
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          ...
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

*(The `.npmrc` template already contains `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}`,
so npm will pick this up automatically.)*

Commit and push the updated workflow file to trigger a fresh build.

---

## Phase 6 — Custom subdomain

- In the Azure Portal...
  - your Static Web App →
    - Custom domains →
      - Add → Custom domain on *other* DNS
        1. Full domain = `safariposters.puzzyl.net`
        2. Hostname record type = `CNAME`
        3. _Azure will show a **CNAME** record to add in DNS_
- In the DNS provider for `puzzyl.net`...
  - Domain →
    - DNS →
      - DNS Records →
        - Add New Record
          1. Type = `CNAME`
          2. Name = `safariposters`
          3. Value = *copy #3 from Azure, above*
          4. TTL = 1/2 hour seems fine
          5. **Save**
- Back in Azure portal
  4. **Add**
  5. Refresh the Custom domains page. **Status = Validated**
- Confirm `https://safariposters.puzzyl.net/index.html` loads correctly

---

## Checklist for each subsequent puzzle page

- Copy `src/__Template.xhtml` → `src/<PuzzleName>.xhtml`
- Fill in `boiler` fields: `title`, `author`, `copyright`, `lookup`
- Build puzzle content
- Create a validation file using https://www.puzzyl.net/Samples/Validate.xhtml
- Test locally at `http://127.0.0.1:3000/<PuzzleName>.xhtml`
- Commit and push — Azure deploys automatically via GitHub Actions
