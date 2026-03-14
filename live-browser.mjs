import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpUrl = process.env.PLAYWRIGHT_CDP_URL ?? "http://127.0.0.1:9222";
const baseUrl =
  process.env.PLAYWRIGHT_LIVE_BASE_URL ??
  "http://localhost:4321/AmberAardvark.net/";
const outputDir = path.resolve("test-results", "live-browser");
const projectPathPrefix = new URL(baseUrl).pathname.replace(/\/$/, "");
const supportedCommands = [
  "status",
  "capture",
  "open",
  "click",
  "fill",
  "type",
  "press",
  "hover",
  "text",
  "console",
  "help",
];

async function main() {
  const command = process.argv[2] ?? "status";
  const args = process.argv.slice(3);
  const browser = await connectToBrowser();

  try {
    if (command === "status") {
      await printStatus(browser);
      return;
    }

    if (command === "capture") {
      const page = await getPreferredPage(browser);
      await capturePage(page);
      return;
    }

    if (command === "help") {
      printUsage();
      return;
    }

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

    if (command === "console") {
      const timeoutMs = parseTimeout(args[0]);
      const page = await getInteractivePage(browser);
      await watchConsole(page, timeoutMs);
      return;
    }

    throw new Error(
      `Unknown command '${command}'. Expected one of: ${supportedCommands.join(", ")}`,
    );
  } finally {
    await browser.close();
  }
}

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

async function getVisibleLocator(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 5000 });
  return locator;
}

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

function printUsage() {
  console.log("Usage: npm run live-browser -- <command> [args]");
  console.log("");
  console.log("Commands:");
  console.log("  status");
  console.log("  capture");
  console.log("  open <path-or-url>");
  console.log("  click <selector>");
  console.log("  fill <selector> <value>");
  console.log("  type <selector> <value>");
  console.log("  press <selector> <key>");
  console.log("  hover <selector>");
  console.log("  text <selector>");
  console.log("  console [milliseconds]");
}

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

main().catch((error) => {
  console.error(error.message);
  if (error instanceof Error && error.message.startsWith("Unknown command '")) {
    printUsage();
  }
  process.exitCode = 1;
});
