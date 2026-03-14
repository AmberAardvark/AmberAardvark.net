# Shared Browser Workflow

This repo uses Playwright to attach to the same Edge window you are using for
local development. The agent can inspect and interact with what you see — no
screenshots or error text copy-pasting required.

## Quick Start

```powershell
npm run start-dev
```

This single command:

1. Auto-detects the dev command, port, and base path from `package.json` and
   framework config files.
2. Starts the dev server in a background window (or detects it is already
   running).
3. Launches a shared Edge instance with CDP enabled.
4. Sets `PLAYWRIGHT_LIVE_BASE_URL` so `live-browser` knows where the site is.

You can also start each piece manually:

```powershell
npm run dev              # terminal 1 — Astro dev server
npm run browser:shared   # terminal 2 — Edge with CDP on port 9222
```

### Portability

`start-dev.ps1` is designed to work on **any repo** that has a `package.json`
with a `dev`, `start`, or `serve` script. Copy `start-dev.ps1`,
`launch-browsers.ps1`, and `live-browser.mjs` into another project, run
`npm run start-dev`, and it will auto-detect the framework.

Override auto-detection with parameters:

```powershell
.\start-dev.ps1 -DevCommand serve -Port 8080 -BasePath /my-app
```

## Command Reference

Run any command via:

```powershell
npm run live-browser -- <command> [args]
```

### Observation

| Command                       | Description                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| `status`                      | List open pages in the shared browser                                 |
| `capture`                     | Screenshot + HTML + metadata to `test-results/live-browser/`          |
| `text <selector>`             | Read visible text from an element                                     |
| `html <selector>`             | Read `innerHTML` from an element                                      |
| `attr <selector> <attribute>` | Read an attribute value                                               |
| `count <selector>`            | Count matching elements                                               |
| `visible <selector>`          | Check if an element is visible (`true`/`false`)                       |
| `links`                       | List all links on the page                                            |
| `meta`                        | Show title, meta tags, and canonical URL                              |
| `screenshot <selector>`       | Screenshot a single element                                           |
| `a11y`                        | Accessibility snapshot + basic audit (missing alt, unlabelled inputs) |
| `eval <expression>`           | Run JavaScript in the page context                                    |

### Navigation

| Command                            | Description                         |
| ---------------------------------- | ----------------------------------- |
| `open <path-or-url>`               | Navigate to a route or full URL     |
| `back`                             | Browser back                        |
| `forward`                          | Browser forward                     |
| `reload`                           | Reload the page                     |
| `scroll [top\|bottom\|<selector>]` | Scroll the page (default: `bottom`) |

### Interaction

| Command                     | Description                                |
| --------------------------- | ------------------------------------------ |
| `click <selector>`          | Click an element                           |
| `fill <selector> <value>`   | Set an input value (clears first)          |
| `type <selector> <value>`   | Type keystrokes into an element            |
| `press <selector> <key>`    | Press a key on an element                  |
| `select <selector> <value>` | Select an option in a `<select>`           |
| `check <selector>`          | Check a checkbox or radio button           |
| `uncheck <selector>`        | Uncheck a checkbox                         |
| `hover <selector>`          | Hover over an element                      |
| `wait <selector>`           | Wait for an element to appear (up to 30 s) |

### Diagnostics

| Command                          | Description                          |
| -------------------------------- | ------------------------------------ |
| `console [ms]`                   | Watch console output (default 5 s)   |
| `network [ms]`                   | Watch network requests (default 5 s) |
| `storage [show\|cookies\|clear]` | Inspect or clear browser storage     |
| `viewport <width> <height>`      | Resize the viewport                  |
| `viewport reset`                 | Restore browser-controlled resizing and prior window size |
| `pdf`                            | Export the page as a PDF             |

## Output Files

All files are written to `test-results/live-browser/`.

| File                     | Produced by  |
| ------------------------ | ------------ |
| `live-browser.png`       | `capture`    |
| `live-browser.html`      | `capture`    |
| `live-browser.json`      | `capture`    |
| `element-screenshot.png` | `screenshot` |
| `a11y-snapshot.json`     | `a11y`       |
| `live-browser.pdf`       | `pdf`        |

## Agent Usage

Once the shared browser is running, you can ask the agent to:

- Capture the current page (screenshot, HTML, metadata)
- Read text, attributes, or HTML from any element
- Navigate to routes, go back/forward, reload
- Click buttons, fill forms, type text, press keys
- Check accessibility (missing alt text, unlabelled inputs)
- Audit SEO meta tags and links
- Watch console output or network traffic for errors
- Inspect or clear localStorage, sessionStorage, cookies
- Resize the viewport for responsive testing
- Export a PDF of the current page
- Run arbitrary JavaScript in the page context

## Notes

- Edge or Chrome required. Firefox does not support CDP attach.
- Actions taken by the agent affect the page you are looking at.
- This repo uses an Astro `base` of `/AmberAardvark.net`, so local navigation
  stays under that path.
- The `PLAYWRIGHT_LIVE_BASE_URL` env var overrides the default base URL.
- `test-results/` is gitignored — captured files are local only.
