import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    // Plain static server over the real deployable output — no build
    // step, this is the exact same tree that gets deployed. Defaults to
    // the checked-in `site/` for local/manual runs; CI points this at
    // the freshly built, release-gated artifact instead (see
    // .github/workflows/release.yml and ci/release_gate.sh) so what gets
    // audited/tested is exactly what would ship, not the working tree.
    command: `npx http-server ${process.env.MYLINGO_SITE_DIR || './site'} -p 4173 -c-1 --silent`,
    url: 'http://127.0.0.1:4173/main/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } }
  ]
});
