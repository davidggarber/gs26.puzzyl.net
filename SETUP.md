# Puzzyl Event Project Setup Checklist

Generic instructions for creating a new puzzle event repo.

- `<projects-root>` is the local parent directory that contains your Git repository
  checkouts. The template and event repositories are sibling directories beneath it;
  no particular drive or folder name is required.
- `<event-slug>` is the event's complete hostname, such as `safariposters.puzzyl.net`.
  The same value is used for the event's directory, npm package, and GitHub repository
  names. Where a service does not allow periods, replace them with hyphens; for example,
  the Azure resource name would be `safariposters-puzzyl-net`.

---

## setup-check.md

Most setup steps can be achieved by running `setup-check.ps1`.

It takes these arguments:
- Fix: attepts to fix each step itself
- Manual: guides the user to fix the next unfinished step, skipping steps that are already working
- (no arguments): reports on the status of each step, without changing anything
- Verbose: prints out any configuration steps that have been decided and stored locally

## Local npm authentication for GitHub Packages

`@davidggarber/puzzyl-kit` is stored in GitHub Packages. Even on a computer that is
already signed in to GitHub, `npm install` needs a GitHub Personal Access Token (PAT)
belonging to an account that can read the package.

Personal and business PATs can coexist on one computer, but npm identifies credentials
by registry host, and both accounts use `npm.pkg.github.com`. Avoid `npm login` for this
setup because logging in again can replace the token for the other account. Puzzyl event
projects instead share the user-scoped `PUZZYL_KIT_NODE_AUTH_TOKEN` variable. Its specific
name avoids collision with unrelated npm projects and lets `setup-check.ps1 -Verbose`
query the package registry without prompting every time.

### One-time setup for each GitHub account

1. In GitHub, open **Settings → Developer settings → Personal access tokens → Tokens
  (classic) → Generate new token (classic)**.
2. Give the token a recognizable name, such as `Personal npm packages`, and choose a
  reasonable expiration date.
3. Select only the `read:packages` scope. The GitHub account must also have access to the
  repository/package being installed.
4. Generate the token and save it in a password manager immediately. GitHub displays the
  value only once.
5. If an organization uses SAML SSO, use **Configure SSO** beside the token to authorize
  it for that organization.

### Install the package for this project

1. Run the guided setup:

  ```powershell
  .\setup-check.ps1 -Manual
  ```

2. At **Configure npm registry**, choose `F` if the script reports a problem. The script
  will write these project-local settings:

  ```ini
  @davidggarber:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${PUZZYL_KIT_NODE_AUTH_TOKEN}
  ```

  `${PUZZYL_KIT_NODE_AUTH_TOKEN}` is a placeholder, not the PAT itself.

3. At **Configure Puzzyl Kit credential**, choose `F`. The script reads the PAT from the
  clipboard or hidden input and stores it in `PUZZYL_KIT_NODE_AUTH_TOKEN` for the current
  Windows user. New terminals inherit it; the current setup process can use it immediately.

4. At **Install puzzyl-kit**, choose `F` to run authenticated `npm install`.

### Token safety

- Never put a literal PAT in `.npmrc`, `package.json`, a script, source control, chat,
  screenshots, or build logs. Do not rely on `.gitignore` to protect a secret after it
  has been committed.
- A user environment variable is persistent configuration, not a protected secret store.
  Processes running as the same Windows user may be able to read it. Use a dedicated,
  minimally scoped PAT and revoke it if the machine or account is compromised.
- Give tokens the minimum scope and a finite expiration. `npm install` needs
  `read:packages`, not package-write or repository-write access.
- If a token is exposed, revoke it immediately in GitHub, create a replacement, and
  update any password-manager or CI-secret entry that used it.

---

## Phase 1 — Local project

- [ ] Create the directory `<projects-root>\<event-slug>`
- [ ] Copy all template files from `<projects-root>\puzzyl-event-template`:
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
- [ ] Complete **Local npm authentication for GitHub Packages** above
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

### Part 1 — Create the resource and workflow

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
3. If Azure requires Build Details, choose `Custom` and accept the generated values.
  These values will be made authoritative in the generated workflow YAML.
4. Click **Review + create**, then **Create**. Azure commits a GitHub Actions workflow
  file to the repository. The initial workflow run may fail until Part 2 is complete.
5. Wait for the workflow commit, then pull it locally:

  ```powershell
  git pull
  ```

6. Confirm `.github/workflows/azure-static-web-apps-<random>.yml` now exists locally.

### Part 2 — Configure the generated workflow

First complete the online-only setup:

1. Open the GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Name: `NPM_TOKEN`.
4. Secret: paste the GitHub PAT with `read:packages` access.
5. Click **Add secret**. The PAT is stored by GitHub and is not added to the repository.

Then edit `.github/workflows/azure-static-web-apps-<random>.yml` locally:

1. Upgrade the checkout action:

  ```yaml
  - uses: actions/checkout@v4
  ```

2. In the **Build And Deploy** step, set these values under `with:`:

```yaml
          app_location: "/"
          api_location: ""
          output_location: "src"
          app_build_command: "npm run build"
```

3. In that same **Build And Deploy** step, add `env:` at the same indentation level as
  `uses:` and `with:`:

  ```yaml
        env:
          PUZZYL_KIT_NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  ```

4. Save, commit, and push the YAML file.
5. Confirm the Actions workflow run succeeds (GitHub → Actions tab).
6. Confirm the default Azure URL serves the site
  *(e.g. `https://<random>.azurestaticapps.net/__Template.xhtml`)*

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
