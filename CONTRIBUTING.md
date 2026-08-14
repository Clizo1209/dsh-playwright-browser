# Contributing

Thank you for improving `dsh-playwright-browser`.

## Before starting

- Search existing issues before proposing a large change.
- Keep the plugin compatible with its declared Node.js and DSH ranges.
- Treat live page content and external test sites as untrusted input.
- Do not include credentials, personal browser profiles, cookies, session logs, or private screenshots.

For a substantial API, tool-schema, security-boundary, or lifecycle change, open a design issue before implementation when a public repository is available.

## Development setup

```sh
npm ci
npm run check
```

The default test suite does not require public network access. Live tests are separate:

```sh
npm run smoke
npm run smoke:dsh
npm run smoke:business
npm run test:real-world
```

## Change expectations

- Add or update tests for observable behavior.
- Keep tool results bounded and JSON-schema compatible.
- Forward DSH cancellation signals through new operations.
- Return fresh state after browser mutations.
- Prefer semantic locators over CSS-only APIs.
- Do not add arbitrary page JavaScript evaluation without prior security design review.
- Document configuration, compatibility, and safety changes.
- Add user-visible changes to `CHANGELOG.md`.

## Pull requests

A pull request should contain:

- a focused description of the problem and solution;
- tests performed and their results;
- compatibility or migration notes;
- screenshots or sanitized logs only when they materially help review;
- no generated `lib/`, tarballs, browser artifacts, local DSH homes, or planning notes.

Maintainers may ask that unrelated changes be split into separate pull requests.

## Commit style

Use short imperative subjects. Conventional prefixes are encouraged:

```text
feat: add popup-aware tab selection
fix: preserve cancellation during navigation
docs: explain browser profile isolation
test: cover role shorthand targets
chore: prepare 0.1.3 release
```

Commits should be logically reviewable. Do not combine generated artifacts, refactors, behavior changes, and release metadata unless they are inseparable.

## Reporting security problems

Follow [SECURITY.md](SECURITY.md). Do not open a public issue containing an exploitable report, credential, or private session artifact.
