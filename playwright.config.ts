import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the production build (npm run build), served the
// way GitHub Pages serves it. Chromium runs every suite; Firefox runs the
// tests tagged @firefox. CHROME_PATH / FIREFOX_PATH point at local browsers
// when Playwright's own builds are not installed.
const port = Number(process.env.PORT ?? 4173);
const chromePath = process.env.CHROME_PATH;
const firefoxPath = process.env.FIREFOX_PATH;

export default defineConfig({
	testDir: 'tests/e2e',
	timeout: 90_000,
	expect: { timeout: 6_000 },
	fullyParallel: true,
	workers: process.env.CI ? 2 : 4,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]] : [['list']],
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		trace: 'retain-on-failure'
	},
	webServer: {
		command: `node tests/support/serve.mjs build ${port}`,
		url: `http://127.0.0.1:${port}/`,
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 900 },
				launchOptions: { executablePath: chromePath, args: ['--enable-unsafe-swiftshader'] }
			}
		},
		{
			name: 'firefox',
			grep: /@firefox/,
			use: {
				...devices['Desktop Firefox'],
				viewport: { width: 1440, height: 900 },
				// Headless Firefox on a GPU-less runner blocklists WebGL; desktop
				// Firefox has it, so let the lab's three.js variant run (it still
				// falls back to SVG if no context can be created).
				launchOptions: { executablePath: firefoxPath, firefoxUserPrefs: { 'webgl.force-enabled': true } }
			}
		}
	]
});
