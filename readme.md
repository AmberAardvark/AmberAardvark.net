# AmberAardvark.net

## Project Setup

This project uses **Astro** with the **ScrewFast** theme.

- **Theme Documentation:** See `README.screwfast.md`
- **CMS:** Front Matter CMS (VS Code Extension) or Sveltia CMS (Web)

## Development

### Start Development Server

```bash
npm run dev
```

### Testing with Playwright

This project uses Playwright for browser testing with your system-installed Firefox and Edge browsers.

**Launch browsers for testing:**

```bash
npm run browsers
```

This opens Firefox and Edge with debugging enabled and your existing session cookies.

**Run tests:**

```bash
npm test              # Run all tests
npm run test:ui       # Open Playwright UI
npm run test:headed   # See browser window
npm run test:debug    # Debug mode
```

### Review Dependabot PRs

**Interactive review:**

```bash
npm run review-deps
```

This will:

- List all Dependabot PRs
- Show version type (MAJOR/MINOR/PATCH)
- Display security status
- Show test results
- Prompt you to merge, test locally, view, or skip each PR

**Auto-merge patches:**

```bash
npm run review-deps:auto
```

Automatically merges patch updates that pass tests.

## Going Live (Custom Domain)

Currently, the site is configured for a temporary GitHub Pages URL (`https://AmberAardvark.github.io/AmberAardvark.net/`) and blocks search engines.

When you are ready to launch on **https://AmberAardvark.net**:

1.  **Update Configuration:**
    Open `astro.config.mjs` and update the variables at the top:

    ```javascript
    // Change these:
    const site = "https://AmberAardvark.github.io";
    const base = "/AmberAardvark.net";

    // To this:
    const site = "https://AmberAardvark.net";
    const base = "";
    ```

2.  **Allow Search Engines:**
    Delete the `public/robots.txt` file.

3.  **Configure DNS:**
    Create a `public/CNAME` file containing `AmberAardvark.net` (or configure it in GitHub Pages settings).

4.  **Push to Main:**
    Commit and push these changes. The GitHub Action will redeploy the site.
