const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // wait
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function main() {
  console.log('Starting preview server for landing app on port 5175...');
  const server = spawn('npx', ['vite', 'preview', '--port', '5175'], {
    cwd: path.join(__dirname, '..', 'apps', 'landing'),
    stdio: 'pipe',
    shell: true
  });

  server.stdout.on('data', data => console.log(`[Vite stdout] ${data}`));
  server.stderr.on('data', data => console.error(`[Vite stderr] ${data}`));

  try {
    await waitForServer('http://localhost:5175');
    console.log('Landing server is ready!');

    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    // 1. Landing Desktop (1440px)
    console.log('Capturing Landing Desktop (1440px)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'landing-desktop-1440.png'), fullPage: true });
    console.log('Saved landing-desktop-1440.png');

    // 2. Landing Mobile (390px)
    console.log('Capturing Landing Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'landing-mobile-390.png'), fullPage: true });
    console.log('Saved landing-mobile-390.png');

    // 3. Design System Desktop (1440px)
    console.log('Capturing Design System Desktop (1440px)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto('http://localhost:5175/design-system', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'design-system-desktop-1440.png'), fullPage: true });
    console.log('Saved design-system-desktop-1440.png');

    // 4. Design System Mobile (390px)
    console.log('Capturing Design System Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5175/design-system', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'design-system-mobile-390.png'), fullPage: true });
    console.log('Saved design-system-mobile-390.png');

    await browser.close();
    console.log('All screenshots captured successfully!');
  } finally {
    server.kill();
  }
}

main().catch(err => {
  console.error('Fatal error during screenshot capture:', err);
  process.exit(1);
});

