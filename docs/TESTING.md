# Testing

## Test levels

### Static and unit

```sh
npm run typecheck
npm test
npm run build
```

`npm run check` runs all three.

### Live controller smoke

```sh
npm run smoke
```

Starts a loopback-only HTML page, launches a real browser, fills an input, clicks a button, verifies updated content, writes a screenshot, and closes the browser.

### DSH registry smoke

```sh
npm run smoke:dsh
```

Loads the plugin through a real Cordis context with the DSH tool registry and system-prompt service. It checks all ten tools and performs semantic interactions through `ctx.tools.execute()`.

### Public-site business smoke

```sh
npm run smoke:business
```

Visits Wikipedia, submits a search, verifies the result, captures a screenshot, and uses browser history.

### Expanded public-site suite

```sh
npm run test:real-world
```

Current cases:

- visible-text extraction from Wikipedia;
- Selenium's public GET demonstration form;
- httpbin's public POST echo form;
- multiple tabs across Example Domain and IANA.

The suite uses invented values and writes sanitized evidence under `.dsh-browser/real-world-suite/`. It redacts password arguments, sensitive query parameters, and sensitive values appearing in later snapshot excerpts.

To test an installed profile artifact instead of the source build:

```sh
DSH_BROWSER_PLUGIN_PATH=/absolute/profile/node_modules/dsh-playwright-browser/lib/index.js \
  npm run test:real-world
```

## Browser selection during tests

Set `DSH_BROWSER_EXECUTABLE_PATH` to force a browser executable. Set `DSH_BROWSER_FORCE_AUTO_DETECT=1` in the smoke tests to exercise automatic fallback.

## Autonomous DSH acceptance

Autonomous tests require a configured DSH model credential. Do not commit or print credentials. Run the installed plugin in an isolated DSH home and give the model a bounded public-site task that explicitly states whether form submission is authorized.

Audit the resulting DSH session log to confirm:

- the requested model route was used;
- only expected tools ran;
- tool errors are understood rather than hidden;
- tabs and browser resources were closed.

## Current coverage gaps

- Firefox and WebKit live runs.
- Windows and Linux host matrices.
- File upload and download.
- Popups and multi-page authentication.
- Sites requiring a logged-in account.
- Proxy, client-certificate, and enterprise browser policies.
- CAPTCHA, payment, and other consequential workflows.

These gaps must not be represented as tested capabilities.
