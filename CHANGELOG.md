# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-08-14

### Added

- Snapshot-derived `<role>|<name>` shorthand for semantic targets.
- Expanded public-site acceptance suite with sanitized JSONL and Markdown evidence.
- English and Simplified Chinese project documentation.
- Architecture, testing, release, contribution, security, and governance documentation.
- CI and manually triggered live-browser workflows.

### Fixed

- Repeated autonomous-agent locator failures caused by snapshot-friendly role syntax.
- Sensitive test values leaking into later log excerpts.

## [0.1.2] - 2026-08-13

### Added

- Automatic fallback from a missing Playwright Chromium build to installed Chrome or Edge.
- Browser environment diagnostics and authorization-aware setup guidance.

## [0.1.1] - 2026-08-13

### Fixed

- Out-of-tree DSH profile installation no longer depends on DSH implementation packages resolving from the plugin directory.
- Cordis is now an optional type peer.

## [0.1.0] - 2026-08-13

### Added

- Initial DSH bundle with semantic browser tools, multi-tab state, screenshots, history, waits, cancellation, and Cordis lifecycle cleanup.
