# TWD Hack Night - GitHub Actions

[Intro to GH Actions](https://fullstackopen.com/en/part11/getting_started_with_git_hub_actions#getting-started-with-workflows)
[Guide to Conventional Commits](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13)
[`commit-and-tag-version` Docs](https://github.com/absolute-version/commit-and-tag-version)
## Stage 1 - Create a "Hello World" workflow
- [ ] Workflow should run when triggered manually
- [ ] Workflow should output "hello world" to the console when run
---

## Stage 2 - Create a conditional workflow that installs dependencies
- [ ] Workflow should only run on a specific condition
- [ ] Workflow should check out the repository
- [ ] Workflow should install dependencies when run
- [ ] _**Bonus: Implement dependency caching**_
---

## Stage 3 - Create a CI workflow
- [ ] Workflow should run on push to all branches other than "main"
- [ ] Workflow should run on pull requests to 'main'
- [ ] Workflow should lint, test, and build the package when run
- [ ] _**Bonus: Test for multiple node versions**_
- [ ] _**Bonus: Limit Concurrency**_
---

## Stage 4 - Create a PUBLISH workflow
- [ ] Workflow should run on push to the "main" branch
- [ ] Workflow shoul use the repository secrets (NPM_TOKEN, GITHUB_TOKEN)
- [ ] Workflow should publish the package to npm when run
- *TIP: If you dont bump the version, publish will fail (run `npm run version` before pushing)*
---

## Stage 5 - Create a STAGING workflow

- [ ] Workflow should run on push to the "stage" branch
- [ ] Workflow should publish to the Github Package Registry when run, with a tag of `next`
- [ ] Workflow should not publish to npm when run
- *TIP: If you dont bump the version, publish will fail (run `npm run version` before pushing)*
---

## Stage 6 - Create a VERSION workflow

- [ ] Workflow should run on pull request to the "stage" branch
- [ ] Workflow should use 'commit-and-tag-version' to bump the version
- [ ] Workflow should push the version update to the current branch to update the PR
- [ ] Workflow should not publish to anything when run
---

## Stage 7 - Create a CODECOV workflow

- [ ] Workflow should run on push to the "main" branch
- [ ] Workflow should run tests and generate coverage reports
- [ ] Workflow should publish reports to a separate repo
- [ ] Reports should be put in a subdirectory matching the reporting repo's name, creating if none exists
---
