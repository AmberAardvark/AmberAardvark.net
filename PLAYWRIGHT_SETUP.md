# Shared Browser Workflow

This repo can use Playwright to attach to the same Edge window you are using for local Astro development.

That is the practical way to let an agent inspect and interact with what you are seeing. The agent cannot directly read an arbitrary desktop window, but it can control a Chromium-based browser instance that was started with remote debugging enabled.

Within that browser context, the agent can act like a user: navigate, click, hover, type, fill fields, press keys, and capture the resulting rendered page.

## What This Gives You

- You view the site in a normal Edge window.
- The agent can attach to that same browser instance through Playwright CDP.
- The agent can capture the current page state without you copying screenshots or error text by hand.

## One-Time Constraint

Edge must be started with remote debugging enabled before the agent can attach.

If Edge is already open normally, close all Edge windows first.

## Recommended Workflow

1. Start the Astro dev server:

   ```powershell
   npm run dev
   ```

2. In a second terminal, launch a shared Edge window for the local site:

   ```powershell
   npm run browser:shared
   ```

   This opens Edge at `http://localhost:4321/AmberAardvark.net/` with CDP enabled on port `9222`.

3. Use that Edge window as your normal working browser for the site.

4. When you want the agent to inspect what you are seeing, use one of these commands:

   ```powershell
   npm run live-browser -- status
   npm run live-browser -- capture
   npm run live-browser -- help
   ```

## Commands

### Show the pages currently open in the shared Edge instance

```powershell
npm run live-browser -- status
```

### Capture the current local page for agent inspection

```powershell
npm run live-browser -- capture
```

This writes:

- `test-results/live-browser/live-browser.png`
- `test-results/live-browser/live-browser.html`
- `test-results/live-browser/live-browser.json`

### Navigate the shared Edge page to another route

```powershell
npm run live-browser -- open /contact
```

This resolves against the current project page, so `/contact` becomes the local route under `/AmberAardvark.net/`.

You can also pass a full URL.

### Click a visible element in the shared page

```powershell
npm run live-browser -- click "text=Contact Us"
```

### Fill an input field

```powershell
npm run live-browser -- fill "input[name=email]" "name@example.com"
```

### Type keystrokes into an element

```powershell
npm run live-browser -- type "textarea" "Hello from Playwright"
```

### Press a key on an element

```powershell
npm run live-browser -- press "input[name=q]" Enter
```

### Hover over an element

```powershell
npm run live-browser -- hover "nav a"
```

### Read text from an element

```powershell
npm run live-browser -- text "main h1"
```

### Watch console output and page errors

```powershell
npm run live-browser -- console 5000
```

That listens for 5 seconds and prints console events and uncaught page errors from the attached page.

## How to Use This With the Agent

Once the shared browser is running, you can ask the agent to:

- capture the current page,
- inspect the DOM or rendered HTML,
- navigate to another route,
- click buttons or links,
- fill and submit forms,
- read visible text from the page,
- watch the browser console for errors,
- reproduce a local issue in the same browser instance,
- or create a one-off Playwright script that attaches through CDP for a more specific interaction.

## Notes

- This workflow is best with Edge or Chrome. Playwright CDP attach is the reliable option for a shared live browser window.
- Firefox is not the right path for this particular workflow.
- Because the agent is attaching to your live browser session, actions taken by the agent affect the page you are looking at.
- This gives the agent browser-level interaction with the page content. It does not provide desktop-level control over browser chrome, other applications, or native OS dialogs.
- This repo uses an Astro `base` path of `/AmberAardvark.net`, so local navigation needs to stay under that path.
