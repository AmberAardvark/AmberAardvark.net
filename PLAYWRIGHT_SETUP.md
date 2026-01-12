# Using Playwright with Your Existing Browser Sessions

## Firefox with Your Profile

1. **Find your Firefox profile path:**
   - Open Firefox
   - Type `about:profiles` in the address bar
   - Copy the path of your "Root Directory" (usually looks like: `C:\Users\YourUsername\AppData\Roaming\Mozilla\Firefox\Profiles\xxxxxxxx.default-release`)

2. **Update `playwright.config.ts`:**
   - Uncomment the `args` line in the Firefox project
   - Replace the profile path with yours

3. **Run tests:**
   ```bash
   npm test -- --project=firefox
   ```

## Edge with Your Profile

**Option A: Let Playwright launch Edge with your profile**

Update the Edge project in `playwright.config.ts`:

```typescript
{
  name: 'edge',
  use: {
    channel: 'msedge',
    launchOptions: {
      args: [
        '--user-data-dir=C:\\Users\\YourUsername\\AppData\\Local\\Microsoft\\Edge\\User Data',
        '--profile-directory=Default'
      ],
    },
  },
}
```

**Option B: Connect to already-running Edge**

1. Close all Edge windows
2. Launch Edge from command line:
   ```powershell
   & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\Microsoft\Edge\User Data"
   ```
3. Create a new test file that connects to it:

   ```typescript
   import { chromium } from "@playwright/test";

   const browser = await chromium.connectOverCDP("http://localhost:9222");
   ```

## Important Notes

- Using your real profile can affect your actual browsing sessions
- Tests may be less reliable due to existing browser state
- Consider using storage state export instead for more stable tests
