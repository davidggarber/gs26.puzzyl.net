[CmdletBinding()]
param([switch]$Manual, [switch]$Fix)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
$tokenVariableName = 'PUZZYL_KIT_NODE_AUTH_TOKEN'

function New-StepResult {
    param([bool]$Complete, [string]$Detail, [string]$Status = 'FAIL')
    [pscustomobject]@{ Complete = $Complete; Detail = $Detail; Status = $Status }
}

function Write-Instructions {
    param([string[]]$Lines)
    $Lines | ForEach-Object { Write-Host ("  {0}" -f $_) }
}

function Get-GitValue {
    param([string[]]$Arguments)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $value = & git @Arguments 2>$null
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldPreference
    }
    if ($exitCode -ne 0) { return '' }
    ($value | Out-String).Trim()
}

function Get-PuzzylKitToken {
    $token = [Environment]::GetEnvironmentVariable($tokenVariableName, 'Process')
    if ([string]::IsNullOrWhiteSpace($token)) {
        $token = [Environment]::GetEnvironmentVariable($tokenVariableName, 'User')
    }
    $token
}

function Read-PuzzylKitPat {
    $securePat = $null
    $credential = $null
    $plainPat = $null
    while ($true) {
        $inputMethod = Read-Host 'Enter C to read the PAT from the clipboard, or T to type it securely'
        if ($inputMethod -match '^(?i)c') {
            if (-not (Get-Command Get-Clipboard -ErrorAction SilentlyContinue)) {
                Write-Host 'Clipboard commands are unavailable. Choose T instead.' -ForegroundColor Yellow
                continue
            }
            $plainPat = [string](Get-Clipboard -Raw)
        } elseif ($inputMethod -match '^(?i)t') {
            $securePat = Read-Host 'Type the GitHub PAT, then press Enter (input is hidden)' -AsSecureString
            $credential = [System.Net.NetworkCredential]::new('', $securePat)
            $plainPat = $credential.Password
        } else {
            Write-Host 'Please enter C or T.' -ForegroundColor Yellow
            continue
        }

        $capturedLength = if ($null -eq $plainPat) { 0 } else { $plainPat.Length }
        Write-Host ("Received {0} characters." -f $capturedLength)
        if ([string]::IsNullOrWhiteSpace($plainPat)) {
            Write-Host 'No PAT was captured. Please paste it again.' -ForegroundColor Yellow
        } elseif ($plainPat.Length -lt 20 -or $plainPat -match '\s') {
            Write-Host 'The captured value does not look like a complete PAT. Please paste it again.' -ForegroundColor Yellow
        } else {
            Write-Host 'PAT captured.' -ForegroundColor Green
            break
        }
        $plainPat = $null
        $credential = $null
        if ($null -ne $securePat) { $securePat.Dispose() }
        $securePat = $null
    }

    $plainPat
}

function Invoke-AuthenticatedNpm {
    param([string[]]$Arguments)

    $token = Get-PuzzylKitToken
    if ([string]::IsNullOrWhiteSpace($token)) {
        return [pscustomobject]@{ ExitCode = -1; Output = @('The Puzzyl Kit PAT is not configured.') }
    }

    $previousToken = [Environment]::GetEnvironmentVariable($tokenVariableName, 'Process')
    $previousPreference = $ErrorActionPreference
    try {
        [Environment]::SetEnvironmentVariable($tokenVariableName, $token, 'Process')
        $ErrorActionPreference = 'Continue'
        $output = & npm.cmd @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        [Environment]::SetEnvironmentVariable($tokenVariableName, $previousToken, 'Process')
        $ErrorActionPreference = $previousPreference
    }
    [pscustomobject]@{ ExitCode = $exitCode; Output = @($output) }
}

function Test-Prerequisites {
    $missing = @(@('git', 'node', 'npm.cmd') | Where-Object { -not (Get-Command $_ -ErrorAction SilentlyContinue) })
    if ($missing.Count) { return New-StepResult $false ('Missing: ' + ($missing -join ', ')) }
    New-StepResult $true 'Git, Node.js, and npm are available.'
}
function Show-ManualPrerequisites {
    Write-Instructions @('Install the missing tools shown above.', 'Git: https://git-scm.com/download/win', 'Node.js LTS: https://nodejs.org/', 'Reopen PowerShell after installation.')
}
function Repair-Prerequisites {
    New-StepResult $false 'System software installation requires manual confirmation.'
}

function Test-ProjectFiles {
    $required = @('package.json', 'dev-server.mjs', 'tsconfig.json', 'tsconfig.build.json', 'src\event.ts', 'src\__Template.xhtml')
    $missing = @($required | Where-Object { -not (Test-Path (Join-Path $repoRoot $_)) })
    if ($missing.Count) { return New-StepResult $false ('Missing: ' + ($missing -join ', ')) }
    try { $package = Get-Content (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json }
    catch { return New-StepResult $false ('Invalid package.json: ' + $_.Exception.Message) }
    $expected = Split-Path $repoRoot -Leaf
    if ($package.name -ne $expected) { return New-StepResult $false ("Package name should be '$expected', not '$($package.name)'.") }
    New-StepResult $true 'Required files exist and the package name matches this folder.'
}
function Show-ManualProjectFiles {
    Write-Instructions @('Restore missing files from Git or the event template.', 'Set the package.json name to the repository folder name.', 'Fill in this event''s values in src\event.ts.')
}
function Repair-ProjectFiles {
    $path = Join-Path $repoRoot 'package.json'
    if (-not (Test-Path $path)) { return New-StepResult $false 'package.json cannot be reconstructed safely.' }
    try { $package = Get-Content $path -Raw | ConvertFrom-Json }
    catch { return New-StepResult $false 'Invalid package.json cannot be repaired safely.' }
    $otherFiles = @('dev-server.mjs', 'tsconfig.json', 'tsconfig.build.json', 'src\event.ts', 'src\__Template.xhtml')
    $missing = @($otherFiles | Where-Object { -not (Test-Path (Join-Path $repoRoot $_)) })
    if ($missing.Count) { return New-StepResult $false ('Restore manually: ' + ($missing -join ', ')) }
    $package.name = Split-Path $repoRoot -Leaf
    $package | ConvertTo-Json -Depth 20 | Set-Content $path -Encoding UTF8
    New-StepResult $true 'Updated the package name.'
}

function Test-NpmConfiguration {
    $path = Join-Path $repoRoot '.npmrc'
    $text = if (Test-Path $path) { Get-Content $path -Raw } else { '' }
    $authLines = @($text -split '\r?\n' | Where-Object { $_ -match '_authToken\s*=' })
    $safe = $text -match '@davidggarber:registry=https://npm\.pkg\.github\.com' -and $authLines.Count -eq 1 -and $authLines[0] -eq '//npm.pkg.github.com/:_authToken=${PUZZYL_KIT_NODE_AUTH_TOKEN}'
    if (-not $safe) { return New-StepResult $false ".npmrc must reference $tokenVariableName and contain no literal token." }
    New-StepResult $true ".npmrc safely references $tokenVariableName."
}
function Show-ManualNpmConfiguration {
    Write-Instructions @(
        'Replace .npmrc with exactly these lines:'
        '  @davidggarber:registry=https://npm.pkg.github.com'
        '  //npm.pkg.github.com/:_authToken=${PUZZYL_KIT_NODE_AUTH_TOKEN}'
        'The second line is only a placeholder. It does not store a PAT.'
    )
}
function Repair-NpmConfiguration {
    @('@davidggarber:registry=https://npm.pkg.github.com', '//npm.pkg.github.com/:_authToken=${PUZZYL_KIT_NODE_AUTH_TOKEN}') |
        Set-Content (Join-Path $repoRoot '.npmrc') -Encoding Ascii
    New-StepResult $true 'Wrote the safe project .npmrc configuration.'
}

function Test-NpmCredential {
    $token = [Environment]::GetEnvironmentVariable($tokenVariableName, 'User')
    if ([string]::IsNullOrWhiteSpace($token)) { return New-StepResult $false "$tokenVariableName is not configured for this user." }
    New-StepResult $true "$tokenVariableName is configured for this user (value hidden)."
}
function Show-ManualNpmCredential {
    Write-Instructions @(
        'Create a GitHub Personal access token (classic) with read:packages.'
        'Choose F to read it from the clipboard or hidden input and save it for this Windows user.'
        "The variable name is $tokenVariableName; its value is never printed."
    )
}
function Repair-NpmCredential {
    $pat = Read-PuzzylKitPat
    [Environment]::SetEnvironmentVariable($tokenVariableName, $pat, 'User')
    [Environment]::SetEnvironmentVariable($tokenVariableName, $pat, 'Process')
    $pat = $null
    New-StepResult $true "$tokenVariableName was saved for this Windows user."
}

function Test-NpmPackage {
    $kit = Join-Path $repoRoot 'node_modules\@davidggarber\puzzyl-kit\dist\kit.umd.js'
    if (-not (Test-Path $kit)) { return New-StepResult $false 'puzzyl-kit is not installed.' }
    New-StepResult $true 'puzzyl-kit is installed.'
}
function Show-ManualNpmPackage {
    Write-Instructions @(
        "Configure $tokenVariableName in the preceding step."
        'Then choose F to run authenticated npm install.'
    )
}
function Repair-NpmPackage {
    $result = Invoke-AuthenticatedNpm @('install')
    $result.Output | ForEach-Object { Write-Host $_ }
    if ($result.ExitCode) { return New-StepResult $false ("npm install failed with exit code {0}." -f $result.ExitCode) }
    New-StepResult $true 'Installed npm dependencies.'
}

function Show-PuzzylKitVersions {
    $packagePath = Join-Path $repoRoot 'package.json'
    $installedPath = Join-Path $repoRoot 'node_modules\@davidggarber\puzzyl-kit\package.json'
    $specified = '(not specified)'
    $installed = '(not installed)'
    try { $specified = (Get-Content $packagePath -Raw | ConvertFrom-Json).dependencies.'@davidggarber/puzzyl-kit' } catch {}
    if (Test-Path $installedPath) {
        try { $installed = (Get-Content $installedPath -Raw | ConvertFrom-Json).version } catch { $installed = '(unreadable)' }
    }
    $latest = '(credential not configured)'
    if (-not [string]::IsNullOrWhiteSpace((Get-PuzzylKitToken))) {
        $result = Invoke-AuthenticatedNpm @('view', '@davidggarber/puzzyl-kit', 'version')
        $latest = if ($result.ExitCode -eq 0) { (($result.Output | Out-String).Trim()) } else { '(registry query failed)' }
    }
    Write-Host '       Puzzyl Kit versions:'
    Write-Host ("         Specified: {0}" -f $specified)
    Write-Host ("         Installed: {0}" -f $installed)
    Write-Host ("         Latest:    {0}" -f $latest)
}

function Test-ProductionAssets {
    try { $package = Get-Content (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json }
    catch { return New-StepResult $false 'package.json must be valid first.' }
    $problems = @()
    if ([string]$package.scripts.build -notmatch 'src/kit\.umd\.js') { $problems += 'build does not copy src/kit.umd.js' }
    $ignore = if (Test-Path (Join-Path $repoRoot '.gitignore')) { Get-Content (Join-Path $repoRoot '.gitignore') } else { @() }
    if ($ignore -notcontains 'src/kit.umd.js') { $problems += 'src/kit.umd.js is not gitignored' }
    $badPages = @(Get-ChildItem (Join-Path $repoRoot 'src') -Filter '*.xhtml' | Where-Object { (Get-Content $_.FullName -Raw) -match '/node_modules/@davidggarber/puzzyl-kit/' })
    if ($badPages.Count) { $problems += 'development kit URL in: ' + ($badPages.Name -join ', ') }
    if ($problems.Count) { return New-StepResult $false ($problems -join '; ') }
    New-StepResult $true 'Production kit asset paths are configured.'
}
function Show-ManualProductionAssets {
    Write-Instructions @('Make build copy kit.umd.js into src.', 'Add src/kit.umd.js to .gitignore.', 'Use /kit.umd.js in every XHTML page.')
}
function Repair-ProductionAssets {
    $path = Join-Path $repoRoot 'package.json'
    try { $package = Get-Content $path -Raw | ConvertFrom-Json }
    catch { return New-StepResult $false 'Invalid package.json cannot be repaired safely.' }
    $package.scripts.build = 'tsc -p tsconfig.build.json && node -e "import(''node:fs'').then(fs => fs.default.cpSync(''node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js'', ''src/kit.umd.js''))"'
    $package | ConvertTo-Json -Depth 20 | Set-Content $path -Encoding UTF8
    $ignorePath = Join-Path $repoRoot '.gitignore'
    $ignore = if (Test-Path $ignorePath) { Get-Content $ignorePath } else { @() }
    if ($ignore -notcontains 'src/kit.umd.js') { Add-Content $ignorePath 'src/kit.umd.js' -Encoding Ascii }
    Get-ChildItem (Join-Path $repoRoot 'src') -Filter '*.xhtml' | ForEach-Object {
        $old = Get-Content $_.FullName -Raw
        $new = $old.Replace('/node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js', '/kit.umd.js')
        if ($new -ne $old) { Set-Content $_.FullName $new -Encoding UTF8 }
    }
    New-StepResult $true 'Updated build, .gitignore, and XHTML kit URLs.'
}

function Test-GitSetup {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return New-StepResult $false 'Git is unavailable.' }
    if ((Get-GitValue @('rev-parse', '--is-inside-work-tree')) -ne 'true') { return New-StepResult $false 'Not a Git worktree.' }
    $problems = @()
    if ((Get-GitValue @('branch', '--show-current')) -ne 'main') { $problems += 'branch is not main' }
    if (-not (Get-GitValue @('remote', 'get-url', 'origin'))) { $problems += 'origin is missing' }
    if (-not (Get-GitValue @('config', '--local', '--get', 'user.name'))) { $problems += 'local user.name is missing' }
    if (-not (Get-GitValue @('config', '--local', '--get', 'user.email'))) { $problems += 'local user.email is missing' }
    if ($problems.Count) { return New-StepResult $false ($problems -join '; ') }
    New-StepResult $true 'Branch, origin, and repository-local identity are configured.'
}
function Show-ManualGitSetup {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Instructions @('Install Git: https://git-scm.com/download/win')
        return
    }
    if ((Get-GitValue @('rev-parse', '--is-inside-work-tree')) -ne 'true') {
        Write-Instructions @('Initialize this directory as a Git repository:', '  git init -b main')
        return
    }

    $instructions = @()
    if ((Get-GitValue @('branch', '--show-current')) -ne 'main') {
        $instructions += 'Rename the current branch to main after confirming that is appropriate:'
        $instructions += '  git branch -m main'
    }
    if (-not (Get-GitValue @('remote', 'get-url', 'origin'))) {
        $instructions += 'Create the private GitHub repository, then add its origin:'
        $instructions += '  git remote add origin https://github.com/<account>/<event-slug>.git'
    }
    if (-not (Get-GitValue @('config', '--local', '--get', 'user.name'))) {
        $instructions += 'Set this repository''s Git author name:'
        $instructions += '  git config --local user.name "Your Name"'
    }
    if (-not (Get-GitValue @('config', '--local', '--get', 'user.email'))) {
        $instructions += 'Set this repository''s Git author email:'
        $instructions += '  git config --local user.email "your-email@example.com"'
    }
    Write-Instructions $instructions
}
function Repair-GitSetup {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return New-StepResult $false 'Git must be installed manually.' }
    if ((Get-GitValue @('rev-parse', '--is-inside-work-tree')) -ne 'true') {
        & git init -b main | Out-Null
        if ($LASTEXITCODE) { return New-StepResult $false 'git init failed.' }
    }
    $result = Test-GitSetup
    if ($result.Complete) { return New-StepResult $true 'Initialized Git.' }
    New-StepResult $false 'Branch, origin, or local identity requires manual input.'
}

function Test-LocalBuild {
    if (-not (Test-Path (Join-Path $repoRoot 'src\event.js'))) { return New-StepResult $false 'src/event.js has not been built.' }
    if (-not (Test-Path (Join-Path $repoRoot 'src\kit.umd.js'))) { return New-StepResult $false 'src/kit.umd.js has not been built.' }
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { return New-StepResult $false 'npm is unavailable.' }
    $output = & npm.cmd run typecheck 2>&1
    if ($LASTEXITCODE) { return New-StepResult $false (($output | Select-Object -Last 5) -join [Environment]::NewLine) }
    New-StepResult $true 'Generated files exist and typecheck passes.'
}
function Show-ManualLocalBuild {
    Write-Instructions @('Run: npm run build', 'Run: npm run typecheck', 'Resolve any reported errors.')
}
function Repair-LocalBuild {
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { return New-StepResult $false 'npm must be installed manually.' }
    $output = & npm.cmd run build 2>&1
    if ($LASTEXITCODE) { return New-StepResult $false (($output | Select-Object -Last 5) -join [Environment]::NewLine) }
    $output = & npm.cmd run typecheck 2>&1
    if ($LASTEXITCODE) { return New-StepResult $false (($output | Select-Object -Last 5) -join [Environment]::NewLine) }
    New-StepResult $true 'Built and type-checked the project.'
}

function Test-AzureDeployment {
    $files = @(Get-ChildItem (Join-Path $repoRoot '.github\workflows') -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in @('.yml', '.yaml') })
    if (-not $files.Count) { return New-StepResult $false 'No Azure workflow found.' 'WARN' }
    $text = ($files | ForEach-Object { Get-Content $_.FullName -Raw }) -join [Environment]::NewLine
    $problems = @()
    if ($text -notmatch 'actions/checkout@v4') { $problems += 'actions/checkout@v4 is missing' }
    if ($text -notmatch 'PUZZYL_KIT_NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*\}\}') { $problems += 'NPM_TOKEN mapping is missing' }
    if ($problems.Count) { return New-StepResult $false ($problems -join '; ') }
    New-StepResult $true 'Azure workflow checkout and package authentication are configured.'
}
function Show-ManualAzureDeployment {
    $origin = Get-GitValue @('remote', 'get-url', 'origin')
    $repository = if ($origin -match 'github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$') { "$($Matches[1])/$($Matches[2])" } else { '<GitHub account>/<repository>' }
    $workflowFolder = Join-Path $repoRoot '.github\workflows'

    Write-Host '  1. Create the Azure Static Web App:'
    Write-Host '     Azure Portal -> Create a resource -> Static Web App'
    Write-Host '     On the Basics page, select your subscription and resource group.'
    Write-Host ("     Connect GitHub repository: {0}" -f $repository)
    Write-Host '     Branch: main'
    Write-Host ''
    Write-Host '  2. In Build Details, enter every setting below:'
    Write-Host '     Build Presets: Custom'
    Write-Host '     App location: /'
    Write-Host '     API location: leave blank'
    Write-Host '     Output location: src'
    Write-Host '     Build command: npm run build'
    Write-Host ''
    Write-Host '     The Azure creation settings are now complete. Click Review + create, then Create.'
    Write-Host '     Wait for deployment to finish. Azure will commit a GitHub Actions workflow.'
    Write-Host '     Run: git pull'
    Write-Host ("     The generated YAML file will appear in: {0}" -f $workflowFolder)
    Write-Host ''
    Write-Host '  3. Update the generated workflow YAML in .github/workflows:'
    Write-Host '     Find the checkout step, which looks like:'
    Write-Host '       - uses: actions/checkout@v3'
    Write-Host '     Change only its version to:'
    Write-Host '       - uses: actions/checkout@v4'
    Write-Host ''
    Write-Host '  4. Add the GitHub Actions package secret:'
    Write-Host ("     Open https://github.com/{0}/settings/secrets/actions" -f $repository)
    Write-Host '     Click New repository secret.'
    Write-Host '     Name: NPM_TOKEN'
    Write-Host '     Secret: paste the GitHub PAT with read:packages access.'
    Write-Host '     Click Add secret.'
    Write-Host ''
    Write-Host '  5. Map that secret in the generated workflow YAML:'
    Write-Host '     Find the step named Build And Deploy.'
    Write-Host '     Add this env block at the same indentation level as with: and uses:'
    Write-Host '       env:'
    Write-Host '         PUZZYL_KIT_NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}'
    Write-Host ''
    Write-Host '  6. Save, commit, and push the workflow YAML. Then confirm the run succeeds in GitHub -> Actions.'
}
function Repair-AzureDeployment {
    New-StepResult $false 'Azure resources and GitHub secrets require manual authentication.'
}

function Get-SetupSteps {
    @(
        [pscustomobject]@{ Name = 'Install prerequisites'; Test = 'Test-Prerequisites'; Manual = 'Show-ManualPrerequisites'; Repair = 'Repair-Prerequisites' }
        [pscustomobject]@{ Name = 'Verify project files'; Test = 'Test-ProjectFiles'; Manual = 'Show-ManualProjectFiles'; Repair = 'Repair-ProjectFiles' }
        [pscustomobject]@{ Name = 'Configure npm registry'; Test = 'Test-NpmConfiguration'; Manual = 'Show-ManualNpmConfiguration'; Repair = 'Repair-NpmConfiguration' }
        [pscustomobject]@{ Name = 'Configure Puzzyl Kit credential'; Test = 'Test-NpmCredential'; Manual = 'Show-ManualNpmCredential'; Repair = 'Repair-NpmCredential' }
        [pscustomobject]@{ Name = 'Install puzzyl-kit'; Test = 'Test-NpmPackage'; Manual = 'Show-ManualNpmPackage'; Repair = 'Repair-NpmPackage' }
        [pscustomobject]@{ Name = 'Configure production assets'; Test = 'Test-ProductionAssets'; Manual = 'Show-ManualProductionAssets'; Repair = 'Repair-ProductionAssets' }
        [pscustomobject]@{ Name = 'Configure Git'; Test = 'Test-GitSetup'; Manual = 'Show-ManualGitSetup'; Repair = 'Repair-GitSetup' }
        [pscustomobject]@{ Name = 'Build and type-check'; Test = 'Test-LocalBuild'; Manual = 'Show-ManualLocalBuild'; Repair = 'Repair-LocalBuild' }
        [pscustomobject]@{ Name = 'Configure Azure deployment'; Test = 'Test-AzureDeployment'; Manual = 'Show-ManualAzureDeployment'; Repair = 'Repair-AzureDeployment' }
    )
}

function Invoke-StepOperation {
    param([pscustomobject]$Step, [ValidateSet('Test', 'Manual', 'Repair')][string]$Operation)
    $name = $Step.$Operation
    & (Get-Command $name -CommandType Function)
}

function Invoke-InteractiveSetup {
    param([bool]$AutoRepair)
    $steps = @(Get-SetupSteps)
    Write-Host $(if ($AutoRepair) { 'Automatic setup with manual fallback' } else { 'Interactive manual setup' }) -ForegroundColor Cyan
    for ($index = 0; $index -lt $steps.Count; $index++) {
        $step = $steps[$index]
        Write-Host ''
        Write-Host ("Step {0} of {1}: {2}" -f ($index + 1), $steps.Count, $step.Name) -ForegroundColor Cyan
        $result = Invoke-StepOperation $step Test
        if ($result.Complete) {
            Write-Host ("[PASS] {0}" -f $result.Detail) -ForegroundColor Green
            continue
        }
        Write-Host ("[NEEDS SETUP] {0}" -f $result.Detail) -ForegroundColor Yellow
        $changed = $false
        if ($AutoRepair) {
            Write-Host 'Attempting automatic repair...'
            $repair = Invoke-StepOperation $step Repair
            Write-Host ("  {0}" -f $repair.Detail)
            $result = Invoke-StepOperation $step Test
            if ($result.Complete) {
                Write-Host ("[PASS] {0}" -f $result.Detail) -ForegroundColor Green
                $changed = $true
            }
        }
        while (-not $result.Complete) {
            if (-not $AutoRepair) {
                $answer = Read-Host 'Enter F to let the script fix this step, M for manual instructions, or S to stop'
                if ($answer -match '^(?i)s') { Write-Host 'Setup stopped. Run this command later to resume.'; return $false }
                if ($answer -match '^(?i)f') {
                    $repair = Invoke-StepOperation $step Repair
                    Write-Host ("  {0}" -f $repair.Detail)
                    $result = Invoke-StepOperation $step Test
                    if ($result.Complete) {
                        Write-Host ("[PASS] {0}" -f $result.Detail) -ForegroundColor Green
                        $changed = $true
                    } else {
                        Write-Host ("[STILL INCOMPLETE] {0}" -f $result.Detail) -ForegroundColor Yellow
                    }
                    continue
                }
                if ($answer -notmatch '^(?i)m') {
                    Write-Host 'Please enter F, M, or S.' -ForegroundColor Yellow
                    continue
                }
            }

            Write-Host 'Complete just this step:'
            Invoke-StepOperation $step Manual
            $answer = Read-Host 'After completing it, enter R to recheck or S to stop'
            if ($answer -match '^(?i)s') { Write-Host 'Setup stopped. Run this command later to resume.'; return $false }
            if ($answer -notmatch '^(?i)r') {
                Write-Host 'Please enter R or S.' -ForegroundColor Yellow
                continue
            }
            $result = Invoke-StepOperation $step Test
            if (-not $result.Complete) {
                Write-Host ("[STILL INCOMPLETE] {0}" -f $result.Detail) -ForegroundColor Yellow
            } else {
                Write-Host ("[PASS] {0}" -f $result.Detail) -ForegroundColor Green
                $changed = $true
            }
        }
        if ($changed -and $index -lt $steps.Count - 1) {
            $answer = Read-Host 'This step is complete. Enter C to continue or S to stop'
            if ($answer -match '^(?i)s') { Write-Host 'Setup stopped. Run this command later to resume.'; return $false }
        }
    }
    Write-Host ''; Write-Host 'All setup steps are complete.' -ForegroundColor Green
    $true
}

function Invoke-HealthCheck {
    $passed = 0; $failed = 0; $warnings = 0
    foreach ($step in @(Get-SetupSteps)) {
        $result = Invoke-StepOperation $step Test
        if ($result.Complete) { $passed++; $label = 'PASS'; $color = 'Green' }
        elseif ($result.Status -eq 'WARN') { $warnings++; $label = 'WARN'; $color = 'Yellow' }
        else { $failed++; $label = 'FAIL'; $color = 'Red' }
        Write-Host ("[{0}] {1}: {2}" -f $label, $step.Name, $result.Detail) -ForegroundColor $color
        if ($VerbosePreference -eq 'Continue') { Write-Host ("       {0}; {1}; {2}" -f $step.Test, $step.Manual, $step.Repair) }
    }
    if ($VerbosePreference -eq 'Continue') { Show-PuzzylKitVersions }
    Write-Host ''; Write-Host ("Summary: {0} passed, {1} failed, {2} warnings" -f $passed, $failed, $warnings)
    $failed -eq 0
}

Push-Location $repoRoot
try {
    Write-Host ("Setup check: {0}" -f $repoRoot) -ForegroundColor Cyan
    if ($Manual -and $Fix) { throw 'Choose either -Manual or -Fix, not both.' }
    if ($Manual) { $complete = Invoke-InteractiveSetup $false }
    elseif ($Fix) { $complete = Invoke-InteractiveSetup $true }
    else { $complete = Invoke-HealthCheck }
    if ($complete) { exit 0 }
    exit 1
} finally { Pop-Location }