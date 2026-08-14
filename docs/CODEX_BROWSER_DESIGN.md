# Codex Browser design mapping

This document explains exactly how the project used the Codex Browser skill as a behavioral reference.

It is a clean-room adaptation of interaction principles. The project does not copy or ship Codex's private browser client, browser bindings, transport, extension integration, runtime bootstrap, or authenticated sessions. Codex and OpenAI are trademarks of their respective owner; this project is not affiliated with or endorsed by OpenAI.

## Reference method

The implementation work followed this sequence:

1. Read the complete Browser skill instructions as the primary behavioral specification.
2. Extract stable user-facing invariants rather than internal implementation details.
3. Map each invariant to a DSH-native service, tool, prompt rule, or lifecycle behavior.
4. Compare a small set of community DSH browser plugins only for packaging and integration patterns.
5. Validate the resulting behavior through real DSH tool-registry and autonomous-agent tests.

The official DSH source remained authoritative for plugin packaging, Cordis lifecycle, tool schemas, profile patches, and agent integration.

## Behavior mapping

| Codex Browser principle | DSH implementation in this project |
|---|---|
| Keep a browser binding alive across actions | One lazy `BrowserController` owns a reusable Playwright browser/context |
| Treat a tab binding separately from the browser | Stable `tab-N` IDs map to controller-owned Playwright pages |
| Reuse valid browser and tab state | Tools default to the active tab and keep other tabs alive until explicitly closed |
| Inspect current state before acting | `browser_open`, navigation, and mutation tools return fresh bounded snapshots |
| Observe again after an interaction | Click, fill, press, wait, and history operations all return post-action state |
| Prefer semantic interaction | `role=`, role shorthand, `label=`, `placeholder=`, `text=`, and `testid=` locators |
| Keep CSS as a compatibility escape hatch | Explicit `css=` and legacy bare CSS remain available |
| Treat page content as untrusted | A DSH system-prompt section states that rendered content is data, never instruction |
| Respect explicit browser choice | Explicit `channel` and `executablePath` override automatic detection |
| Avoid inspecting personal browser secrets | The plugin never reads cookie databases, passwords, browser profiles, or extension state |
| Preserve authentication boundaries | Persistent state is allowed only through an explicitly configured, dedicated `userDataDir` |
| Confirm consequential actions | Prompt guidance covers credentials, purchases, permissions, account changes, downloads, and CAPTCHA |
| Support screenshots as durable evidence | `browser_screenshot` writes a PNG and returns an absolute path |
| Clean up owned resources | Cordis effect disposal closes controller-owned pages, context, and browser |
| Make cancellation cooperative | Closing a tab interrupts in-flight Playwright work on that page |

## Deliberate adaptations

### Browser selection

Codex can select an in-app browser or a connected external browser and may reuse an existing signed-in session. A standalone DSH plugin does not have that Codex runtime. This project therefore owns an isolated Playwright process.

Startup order for unconfigured Chromium is:

1. Playwright-managed Chromium.
2. Installed Google Chrome.
3. Installed Microsoft Edge.

An explicit `channel` or `executablePath` always wins. Firefox and WebKit require their Playwright-managed browser or an explicit executable.

### Target representation

Codex Browser can expose runtime-specific interactive references. Those references are not portable to DSH, so the plugin uses compact semantic target strings. Real autonomous tests showed that models naturally derive `textbox|Name` from accessibility snapshots, which led to the role shorthand accepted since version 0.1.3.

### Screenshots

Codex can move image objects through its own runtime. DSH model routes and attachment capabilities vary, so this plugin returns an absolute PNG path. A caller may pass that path to an available image-reading tool.

### Tool transport

Codex's Browser skill uses its own browser runtime and execution surface. This project instead registers raw DSH tool definitions against `ctx.tools`; tool arguments and results use JSON schemas, and cancellation comes from the DSH tool execution signal.

## What was not copied

- Codex browser-client source or module code.
- Node execution/bootstrap instructions.
- Browser-extension protocols.
- In-app browser discovery logic.
- OpenAI account, cookie, or session handling.
- Private tool schemas or opaque interactive-reference formats.
- Codex authentication state.

## Validation of the mapping

The mapping is tested at increasing levels:

1. Target parser unit tests.
2. Live controller smoke test.
3. Real Cordis and DSH tool-registry smoke test.
4. Installation into an isolated official DSH profile.
5. Public-site scripted workflows with sanitized tool logs.
6. Official `deepseek-v4-flash` autonomous-agent workflows.

See [TESTING.md](TESTING.md) for commands and current coverage boundaries.
