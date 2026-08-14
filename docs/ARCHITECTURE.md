# Architecture

## Overview

`dsh-playwright-browser` is one installable DSH bundle. Its profile patch mounts one Cordis plugin, and that plugin contributes a system-prompt section plus ten model-facing tools.

```text
DSH profile
  -> cordis.patch.yml
    -> src/index.ts (plugin entry)
      -> DSH tool registry
      -> DSH system prompt
      -> BrowserController
        -> Playwright Browser
          -> BrowserContext
            -> Page / stable tab id
```

## Components

### Plugin entry

`src/index.ts` owns:

- the public configuration schema;
- the system-prompt safety and operating guidance;
- raw DSH-compatible JSON tool definitions;
- argument validation and output rendering;
- Cordis lifecycle registration.

The runtime intentionally avoids importing DSH implementation packages. This keeps an out-of-tree profile installation independent of DSH's internal pnpm dependency layout. Cordis remains an optional type peer.

### Browser controller

`src/browser-controller.ts` owns:

- lazy browser startup;
- browser executable fallback;
- persistent or ephemeral browser contexts;
- stable tab identifiers and active-tab state;
- timeouts and bounded snapshots;
- navigation, interaction, screenshots, and history;
- cooperative cancellation and cleanup.

The controller is exported as `dsh-playwright-browser/controller` so consumers can build a different tool surface without duplicating browser lifecycle logic.

### Semantic targets

`src/target.ts` translates compact target strings to strict Playwright locators. Semantic forms are preferred. CSS exists for compatibility, while arbitrary JavaScript evaluation is deliberately absent.

## Browser lifecycle

1. Plugin application constructs a controller but starts no browser.
2. The first browser operation starts the configured browser.
3. Missing default Chromium triggers bounded Chrome/Edge fallback.
4. Pages receive monotonic `tab-N` IDs.
5. A page close removes its mapping and selects another live tab when available.
6. Cordis disposal closes the context and browser.

## Cancellation

Playwright locator calls do not directly accept an `AbortSignal`. The controller races an operation against the DSH signal. Cancellation closes the affected page, waits for the interrupted Playwright promise to settle, and raises an `AbortError`.

## Security boundaries

- Only `http:`, `https:`, and `about:` navigation is accepted.
- Embedded URL credentials are rejected.
- The controller does not expose page JavaScript evaluation.
- Personal browser stores are not discovered or inspected.
- Screenshots stay on the local filesystem.
- Page text is returned as untrusted observation.

This is browser automation, not a complete web security sandbox. Operators must still apply network controls appropriate to their environment.
