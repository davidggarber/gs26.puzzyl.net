# Guidelines for setup-check.ps1

Proposal for a script meant to automate as many setup steps as possible, to run after first `git clone`-ing this repo. The hope is that for most users, this will take the place of the manual steps descibed in 
- README.md
- SETUP.md
- Project-Setup.md

It should be written as generically as possible. Not only to work on different machine configurations, coexisting with other projects. It should be written so that it can be directly copied to sibling projects that will also reference the puzzyl-kit and run on Azure.

## Run modes

Plan for several run modes, triggered by flags. 
- `setup-check.ps1` would check the health of the setup, without changing anything. It would report back which steps appear to be setup correctly, and which (or perhaps the first) step that isn't.
- `setup-check.ps1 --verbose` would dump all details, such as interesting values from `git config --local`
- `setup-check.ps1 --manual` would guide a human through each setup step
- `setup-check.ps1 --fix` would attempt to setup things manually, falling back to the manual versions where necessary

## Eventual testing

When this is fully working, I would like to be able to clone this repo to another machine, and run this tool to setup quickly.

## Document clean-up

Once completed, SETUP.md and related files can be simplified, and encourage users to run setup-check.ps1. This spec will eventually be deleted entirely.
