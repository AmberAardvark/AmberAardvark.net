import { chromium } from "@playwright/test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpUrl = process.env.PLAYWRIGHT_CDP_URL ?? "http://127.0.0.1:9222";
const baseUrl =
  process.env.PLAYWRIGHT_LIVE_BASE_URL ??
  "http://localhost:4321/AmberAardvark.net/";
const outputDir = path.resolve("test-results", "live-browser");
const windowStatePath = path.join(outputDir, "window-state.json");
const projectPathPrefix = new URL(baseUrl).pathname.replace(/\/$/, "");

async function main() {
  const command = process.argv[2] ?? "status";
  const args = process.argv.slice(3);

  if (command === "help") {
    printUsage();
    return;
  }

  const browser = await connectToBrowser();

  try {
    // --- Observation ---

    if (command === "status") {
      await printStatus(browser);
      return;
    }

    if (command === "capture") {
      const page = await getPreferredPage(browser);
      await capturePage(page);
      return;
    }

    if (command === "text") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- text "main h1"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      console.log(await locator.innerText());
      return;
    }

    if (command === "html") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- html "main"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      console.log(await locator.innerHTML());
      return;
    }

    if (command === "attr") {
      const selector = requireArg(
        args,
        0,
        'Usage: npm run live-browser -- attr "a.logo" href',
      );
      const attribute = requireArg(
        args,
        1,
        'Usage: npm run live-browser -- attr "a.logo" href',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      console.log(await locator.getAttribute(attribute));
      return;
    }

    if (command === "count") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- count "a"',
      );
      const page = await getInteractivePage(browser);
      const count = await page.locator(selector).count();
      console.log(count);
      return;
    }

    if (command === "visible") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- visible "button.submit"',
      );
      const page = await getInteractivePage(browser);
      const isVisible = await page.locator(selector).first().isVisible();
      console.log(isVisible);
      return;
    }

    if (command === "links") {
      const page = await getInteractivePage(browser);
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]")).map((a) => ({
          text: a.textContent?.trim().slice(0, 80) || "(no text)",
          href: a.href,
        })),
      );
      for (const link of links) {
        console.log(`${link.text}`);
        console.log(`  ${link.href}`);
      }
      console.log(`\n${links.length} links found.`);
      return;
    }

    if (command === "meta") {
      const page = await getInteractivePage(browser);
      const meta = await page.evaluate(() => {
        const title = document.title;
        const metas = Array.from(document.querySelectorAll("meta")).map(
          (m) => ({
            name:
              m.getAttribute("name") ||
              m.getAttribute("property") ||
              m.getAttribute("http-equiv") ||
              "",
            content: m.getAttribute("content") || "",
          }),
        );
        const canonical =
          document.querySelector("link[rel=canonical]")?.getAttribute("href") ||
          "";
        return { title, canonical, meta: metas };
      });
      console.log(`Title: ${meta.title}`);
      if (meta.canonical) console.log(`Canonical: ${meta.canonical}`);
      for (const m of meta.meta) {
        if (m.name && m.content) {
          console.log(`${m.name}: ${m.content}`);
        }
      }
      return;
    }

    if (command === "screenshot") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- screenshot "header"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, "element-screenshot.png");
      await locator.screenshot({ path: filePath });
      console.log(filePath);
      return;
    }

    if (command === "a11y") {
      const page = await getInteractivePage(browser);
      await mkdir(outputDir, { recursive: true });
      let snapshotSaved = false;
      try {
        const snapshot = await page.locator(":root").ariaSnapshot();
        const filePath = path.join(outputDir, "a11y-snapshot.txt");
        await writeFile(filePath, `${snapshot}\n`, "utf8");
        console.log(filePath);
        snapshotSaved = true;
      } catch {
        console.log("(ARIA snapshot not available in this Playwright version)");
      }
      const issues = [];
      const images = await page.locator("img").all();
      for (const img of images) {
        const alt = await img.getAttribute("alt");
        if (!alt) {
          const src = await img.getAttribute("src");
          issues.push(`Missing alt: ${src ?? "(inline image)"}`);
        }
      }
      const inputs = await page
        .locator("input:not([type=hidden]), textarea, select")
        .all();
      for (const input of inputs) {
        const label = await input.getAttribute("aria-label");
        const labelledBy = await input.getAttribute("aria-labelledby");
        const id = await input.getAttribute("id");
        if (!label && !labelledBy) {
          const hasLabelFor = id
            ? await page.locator(`label[for="${id}"]`).count()
            : 0;
          if (!hasLabelFor) {
            const name =
              (await input.getAttribute("name")) ??
              (await input.getAttribute("type")) ??
              "unknown";
            issues.push(`Unlabelled input: ${name}`);
          }
        }
      }
      if (issues.length > 0) {
        console.log(`\nAccessibility issues (${issues.length}):`);
        for (const issue of issues) {
          console.log(`  - ${issue}`);
        }
      } else if (snapshotSaved) {
        console.log("No obvious accessibility issues found.");
      }
      return;
    }

    if (command === "eval") {
      const expression = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- eval "document.title"',
      );
      const page = await getInteractivePage(browser);
      const result = await page.evaluate(expression);
      console.log(
        typeof result === "object" ? JSON.stringify(result, null, 2) : result,
      );
      return;
    }

    // --- Navigation ---

    if (command === "open") {
      const target = requireArg(
        args,
        0,
        "Usage: npm run live-browser -- open /contact",
      );
      const page = await getPreferredPage(browser);
      const resolvedTarget = resolveTarget(target, page.url());
      await page.goto(resolvedTarget, { waitUntil: "networkidle" });
      await logPageState(page, `Opened ${resolvedTarget}`);
      return;
    }

    if (command === "back") {
      const page = await getInteractivePage(browser);
      await page.goBack({ waitUntil: "networkidle" });
      await logPageState(page, "Navigated back");
      return;
    }

    if (command === "forward") {
      const page = await getInteractivePage(browser);
      await page.goForward({ waitUntil: "networkidle" });
      await logPageState(page, "Navigated forward");
      return;
    }

    if (command === "reload") {
      const page = await getInteractivePage(browser);
      await page.reload({ waitUntil: "networkidle" });
      await logPageState(page, "Reloaded");
      return;
    }

    if (command === "scroll") {
      const target = args[0] ?? "bottom";
      const page = await getInteractivePage(browser);
      if (target === "top") {
        await page.evaluate(() => window.scrollTo(0, 0));
      } else if (target === "bottom") {
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
      } else {
        const locator = await getVisibleLocator(page, target);
        await locator.scrollIntoViewIfNeeded();
      }
      await logPageState(page, `Scrolled to ${target}`);
      return;
    }

    // --- Interaction ---

    if (command === "click") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- click "text=Contact Us"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await locator.click();
      await settlePage(page);
      await logPageState(page, `Clicked ${selector}`);
      return;
    }

    if (command === "fill") {
      const selector = requireArg(
        args,
        0,
        'Usage: npm run live-browser -- fill "input[name=email]" "name@example.com"',
      );
      const value = requireArg(
        args,
        1,
        'Usage: npm run live-browser -- fill "input[name=email]" "name@example.com"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await locator.fill(value);
      await logPageState(page, `Filled ${selector}`);
      return;
    }

    if (command === "type") {
      const selector = requireArg(
        args,
        0,
        'Usage: npm run live-browser -- type "textarea" "Hello world"',
      );
      const value = requireArg(
        args,
        1,
        'Usage: npm run live-browser -- type "textarea" "Hello world"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await locator.click();
      await locator.pressSequentially(value);
      await logPageState(page, `Typed into ${selector}`);
      return;
    }

    if (command === "press") {
      const selector = requireArg(
        args,
        0,
        'Usage: npm run live-browser -- press "input[name=q]" Enter',
      );
      const key = requireArg(
        args,
        1,
        'Usage: npm run live-browser -- press "input[name=q]" Enter',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await locator.press(key);
      await settlePage(page);
      await logPageState(page, `Pressed ${key} on ${selector}`);
      return;
    }

    if (command === "select") {
      const selector = requireArg(
        args,
        0,
        'Usage: npm run live-browser -- select "select#country" "US"',
      );
      const value = requireArg(
        args,
        1,
        'Usage: npm run live-browser -- select "select#country" "US"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await locator.selectOption(value);
      await logPageState(page, `Selected "${value}" in ${selector}`);
      return;
    }

    if (command === "check") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- check "input[type=checkbox]"',
      );
      const page = await getInteractivePage(browser);
      const locator = page.locator(selector).first();
      await locator.waitFor({ timeout: 5000 });
      await locator.check();
      await logPageState(page, `Checked ${selector}`);
      return;
    }

    if (command === "uncheck") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- uncheck "input[type=checkbox]"',
      );
      const page = await getInteractivePage(browser);
      const locator = page.locator(selector).first();
      await locator.waitFor({ timeout: 5000 });
      await locator.uncheck();
      await logPageState(page, `Unchecked ${selector}`);
      return;
    }

    if (command === "hover") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- hover "nav a"',
      );
      const page = await getInteractivePage(browser);
      const locator = await getVisibleLocator(page, selector);
      await locator.hover();
      await logPageState(page, `Hovered ${selector}`);
      return;
    }

    if (command === "wait") {
      const selector = requireJoinedArgs(
        args,
        'Usage: npm run live-browser -- wait "text=Loading"',
      );
      const page = await getInteractivePage(browser);
      await page.locator(selector).first().waitFor({ timeout: 30000 });
      console.log(`Found ${selector}`);
      return;
    }

    // --- Diagnostics ---

    if (command === "console") {
      const timeoutMs = parseTimeout(args[0]);
      const page = await getInteractivePage(browser);
      await watchConsole(page, timeoutMs);
      return;
    }

    if (command === "network") {
      const timeoutMs = parseTimeout(args[0]);
      const page = await getInteractivePage(browser);
      await watchNetwork(page, timeoutMs);
      return;
    }

    if (command === "storage") {
      const subcommand = args[0] ?? "show";
      const page = await getInteractivePage(browser);
      if (subcommand === "show") {
        const data = await page.evaluate(() => {
          const local = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            local[key] = localStorage.getItem(key);
          }
          const session = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            session[key] = sessionStorage.getItem(key);
          }
          return { localStorage: local, sessionStorage: session };
        });
        console.log(JSON.stringify(data, null, 2));
      } else if (subcommand === "cookies") {
        const context = page.context();
        const cookies = await context.cookies();
        console.log(JSON.stringify(cookies, null, 2));
      } else if (subcommand === "clear") {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        console.log("Cleared localStorage and sessionStorage.");
      } else {
        throw new Error(
          "Usage: npm run live-browser -- storage [show|cookies|clear]",
        );
      }
      return;
    }

    if (command === "viewport") {
      if (args[0] === "reset" || args[0] === "auto" || args[0] === "release") {
        const page = await getInteractivePage(browser);
        await resetViewportControl(page);
        console.log("Viewport control returned to the browser window.");
        return;
      }

      const width = parseInt(args[0], 10);
      const height = parseInt(args[1], 10);
      if (!width || !height) {
        throw new Error(
          "Usage: npm run live-browser -- viewport 1280 720 | viewport reset",
        );
      }
      const page = await getInteractivePage(browser);
      await saveWindowStateIfNeeded(page);
      await page.setViewportSize({ width, height });
      console.log(`Viewport set to ${width}x${height}`);
      return;
    }

    if (command === "pdf") {
      const page = await getInteractivePage(browser);
      await mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, "live-browser.pdf");
      await page.pdf({ path: filePath, format: "A4" });
      console.log(filePath);
      return;
    }

    throw new Error(
      `Unknown command '${command}'. Run 'npm run live-browser -- help' for available commands.`,
    );
  } finally {
    await browser.close();
  }
}

// --- Connection ---

async function connectToBrowser() {
  try {
    return await chromium.connectOverCDP(cdpUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not connect to the shared browser at ${cdpUrl}. Start it with 'npm run browser:shared' first.\n${message}`,
    );
  }
}

// --- Page selection ---

async function printStatus(browser) {
  const pages = getAllPages(browser);

  if (pages.length === 0) {
    console.log("Connected, but no pages are open.");
    return;
  }

  for (const [index, page] of pages.entries()) {
    let title = "";

    try {
      title = await page.title();
    } catch {
      title = "(title unavailable)";
    }

    console.log(`${index + 1}. ${title}`);
    console.log(`   ${page.url() || "(about:blank)"}`);
  }
}

async function getPreferredPage(browser) {
  const pages = getAllPages(browser);

  if (pages.length === 0) {
    throw new Error("Connected to Edge, but no pages are open.");
  }

  const rankedPages = pages
    .map((page) => ({ page, score: scorePage(page.url()) }))
    .sort((left, right) => right.score - left.score);

  return rankedPages[0]?.page ?? pages[0];
}

async function getInteractivePage(browser) {
  const page = await getPreferredPage(browser);
  await page.bringToFront();
  await page.waitForLoadState("domcontentloaded");
  return page;
}

function getAllPages(browser) {
  return browser.contexts().flatMap((context) => context.pages());
}

// --- Locators ---

async function getVisibleLocator(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 5000 });
  return locator;
}

// --- Capture ---

async function capturePage(page) {
  await mkdir(outputDir, { recursive: true });

  await page.bringToFront();
  await page.waitForLoadState("domcontentloaded");

  const screenshotPath = path.join(outputDir, "live-browser.png");
  const htmlPath = path.join(outputDir, "live-browser.html");
  const metadataPath = path.join(outputDir, "live-browser.json");

  const html = await page.content();
  const metadata = {
    title: await page.title(),
    url: page.url(),
    capturedAt: new Date().toISOString(),
  };

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(htmlPath, html, "utf8");
  await writeFile(
    metadataPath,
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );

  console.log(`Captured ${metadata.title}`);
  console.log(metadata.url);
  console.log(screenshotPath);
  console.log(htmlPath);
  console.log(metadataPath);
}

// --- State helpers ---

async function logPageState(page, action) {
  console.log(action);
  console.log(await page.title());
  console.log(page.url());
}

async function settlePage(page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
    return;
  } catch {}

  try {
    await page.waitForLoadState("load", { timeout: 5000 });
  } catch {}
}

async function resetViewportControl(page) {
  const session = await page.context().newCDPSession(page);

  try {
    await session.send("Emulation.clearDeviceMetricsOverride");
    await restoreWindowState(session);
  } finally {
    await session.detach();
  }
}

async function saveWindowStateIfNeeded(page) {
  try {
    await readFile(windowStatePath, "utf8");
    return;
  } catch {}

  await mkdir(outputDir, { recursive: true });

  const session = await page.context().newCDPSession(page);

  try {
    const { bounds } = await session.send("Browser.getWindowForTarget");
    const normalizedBounds = normalizeWindowBounds(bounds);
    await writeFile(
      windowStatePath,
      `${JSON.stringify(normalizedBounds, null, 2)}\n`,
      "utf8",
    );
  } finally {
    await session.detach();
  }
}

async function restoreWindowState(session) {
  let savedBounds;

  try {
    const raw = await readFile(windowStatePath, "utf8");
    savedBounds = JSON.parse(raw);
  } catch {
    return;
  }

  const { windowId } = await session.send("Browser.getWindowForTarget");
  const bounds =
    savedBounds.windowState && savedBounds.windowState !== "normal"
      ? { windowState: savedBounds.windowState }
      : {
          left: savedBounds.left,
          top: savedBounds.top,
          width: savedBounds.width,
          height: savedBounds.height,
        };

  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds,
  });

  await rm(windowStatePath, { force: true });
}

function normalizeWindowBounds(bounds) {
  return {
    windowState: bounds.windowState ?? "normal",
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };
}

// --- Watchers ---

async function watchConsole(page, timeoutMs) {
  const events = [];
  const onConsole = (message) => {
    events.push({ type: message.type(), text: message.text() });
  };
  const onPageError = (error) => {
    events.push({ type: "pageerror", text: error.message });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    console.log(`Listening for console events for ${timeoutMs}ms...`);
    await page.waitForTimeout(timeoutMs);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }

  if (events.length === 0) {
    console.log("No console events captured.");
    return;
  }

  for (const event of events) {
    console.log(`[${event.type}] ${event.text}`);
  }
}

async function watchNetwork(page, timeoutMs) {
  const requests = [];
  const onRequest = (request) => {
    requests.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
    });
  };
  const onResponse = (response) => {
    const existing = requests.find(
      (r) => r.url === response.url() && !r.status,
    );
    if (existing) {
      existing.status = response.status();
    }
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  try {
    console.log(`Listening for network requests for ${timeoutMs}ms...`);
    await page.waitForTimeout(timeoutMs);
  } finally {
    page.off("request", onRequest);
    page.off("response", onResponse);
  }

  if (requests.length === 0) {
    console.log("No network requests captured.");
    return;
  }

  for (const req of requests) {
    const status = req.status ? `${req.status}` : "pending";
    console.log(`[${status}] ${req.method} ${req.resourceType} ${req.url}`);
  }
  console.log(`\n${requests.length} requests captured.`);
}

// --- Argument helpers ---

function requireArg(args, index, usage) {
  const value = args[index];

  if (!value) {
    throw new Error(usage);
  }

  return value;
}

function requireJoinedArgs(args, usage) {
  const value = args.join(" ").trim();

  if (!value) {
    throw new Error(usage);
  }

  return value;
}

function parseTimeout(value) {
  if (!value) {
    return 5000;
  }

  const timeoutMs = Number(value);

  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new Error("Usage: npm run live-browser -- console 5000");
  }

  return timeoutMs;
}

// --- Help ---

function printUsage() {
  console.log("Usage: npm run live-browser -- <command> [args]");
  console.log("");
  console.log("Observation:");
  console.log("  status                          List open pages");
  console.log("  capture                         Screenshot + HTML + metadata");
  console.log("  text <selector>                 Read visible text");
  console.log("  html <selector>                 Read innerHTML");
  console.log("  attr <selector> <attribute>     Read element attribute");
  console.log("  count <selector>                Count matching elements");
  console.log("  visible <selector>              Check if element is visible");
  console.log("  links                           List all links on the page");
  console.log(
    "  meta                            Show page title, meta tags, canonical",
  );
  console.log("  screenshot <selector>           Screenshot a single element");
  console.log(
    "  a11y                            Accessibility snapshot + basic audit",
  );
  console.log("  eval <expression>               Run JS in the page context");
  console.log("");
  console.log("Navigation:");
  console.log("  open <path-or-url>              Navigate to a route or URL");
  console.log("  back                            Browser back");
  console.log("  forward                         Browser forward");
  console.log("  reload                          Reload the page");
  console.log("  scroll [top|bottom|<selector>]  Scroll the page");
  console.log("");
  console.log("Interaction:");
  console.log("  click <selector>                Click an element");
  console.log("  fill <selector> <value>         Set input value");
  console.log(
    "  type <selector> <value>         Type keystrokes into an element",
  );
  console.log("  press <selector> <key>          Press a key on an element");
  console.log(
    "  select <selector> <value>       Select an option in a <select>",
  );
  console.log("  check <selector>                Check a checkbox or radio");
  console.log("  uncheck <selector>              Uncheck a checkbox");
  console.log("  hover <selector>                Hover over an element");
  console.log(
    "  wait <selector>                 Wait for element to appear (30s)",
  );
  console.log("");
  console.log("Diagnostics:");
  console.log(
    "  console [ms]                    Watch console output (default 5s)",
  );
  console.log(
    "  network [ms]                    Watch network requests (default 5s)",
  );
  console.log(
    "  storage [show|cookies|clear]    Inspect or clear browser storage",
  );
  console.log("  viewport <width> <height>       Resize the viewport");
  console.log(
    "  viewport reset                  Return viewport control to the browser",
  );
  console.log("  pdf                             Export page as PDF");
}

// --- URL resolution ---

function resolveTarget(target, currentUrl) {
  if (/^https?:\/\//i.test(target)) {
    return target;
  }

  if (target.startsWith("/")) {
    return new URL(target.slice(1), ensureTrailingSlash(baseUrl)).toString();
  }

  if (currentUrl && isProjectPage(currentUrl)) {
    return new URL(target, ensureTrailingSlash(currentUrl)).toString();
  }

  return new URL(target, ensureTrailingSlash(baseUrl)).toString();
}

function scorePage(url) {
  if (!url) {
    return -100;
  }

  if (url.startsWith("chrome-error://")) {
    return -50;
  }

  if (url.startsWith(baseUrl)) {
    return 100;
  }

  if (isProjectPage(url)) {
    return 90;
  }

  if (/localhost|127\.0\.0\.1/.test(url)) {
    return 40;
  }

  return 0;
}

function isProjectPage(url) {
  try {
    const parsedUrl = new URL(url);
    return (
      /localhost|127\.0\.0\.1/.test(parsedUrl.hostname) &&
      parsedUrl.pathname.startsWith(projectPathPrefix)
    );
  } catch {
    return false;
  }
}

function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

// --- Entry ---

main().catch((error) => {
  console.error(error.message);
  if (
    error instanceof Error &&
    error.message.includes("Run 'npm run live-browser -- help'")
  ) {
    printUsage();
  }
  process.exitCode = 1;
});
