# Local Mac mini GitHub Actions CI

Runner: `mac-mini-m4`, labels `[mac-mini-m4, macos-arm64]`, native macOS ARM64.
Workflow: `.github/workflows/mac-mini-ci.yml`. Runs on pushes to main/master or the trusted setup branch and via workflow_dispatch; no pull_request/fork trigger on this user-account host.

Scope: **TypeScript compiler build; no external blocklist publication**.

Commands:
```bash
npm install --ignore-scripts --no-audit --no-fund
npm run build
```

No deploy, publishing, host installer/apply, Apple Notes automation or signing is performed. Failures are preserved; jobs do not use continue-on-error. A source/data check is not a native application or hardware test. Initial run results belong to the actual GitHub job links, not this plan.

Each repository registration can run one job; GitLab concurrent=3 does not cap aggregate GitHub work. Initial rollout is dispatched in batches of at most three repositories.

Test reports are copied to `~/.local/share/github-ci-reports/<owner>/<repo>/<run-id>/` on the Mac. GitHub storage is quota-limited; remote artifact upload is opt-in with repository variable `MAC_CI_UPLOAD_ARTIFACTS=true`. All test/build failures still fail the job; only the optional report transport is disabled by default.
