const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'design-research');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureSite(url, name) {
  console.log(`\nLaunching browser for ${name} (${url})...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    // 1. Desktop Viewport (1440px)
    console.log(`Capturing ${name} desktop (1440px)...`);
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await pageDesktop.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('Goto warning:', e.message));

    // Smooth scroll down to trigger lazy animations
    await pageDesktop.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    await new Promise(r => setTimeout(r, 1000));
    await pageDesktop.screenshot({
      path: path.join(OUTPUT_DIR, `${name}-desktop-1440.png`),
      fullPage: true
    });
    console.log(`Saved ${name}-desktop-1440.png`);

    // Extract styles & sections
    const extractedData = await pageDesktop.evaluate(() => {
      const getStyles = () => {
        const computed = Array.from(document.querySelectorAll('*'));
        const fonts = new Set();
        const colors = new Set();
        const bgColors = new Set();

        computed.slice(0, 500).forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.fontFamily) fonts.add(style.fontFamily);
          if (style.color) colors.add(style.color);
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            bgColors.add(style.backgroundColor);
          }
        });

        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName,
          text: h.innerText.slice(0, 80).trim(),
          font: window.getComputedStyle(h).fontFamily,
          size: window.getComputedStyle(h).fontSize,
          weight: window.getComputedStyle(h).fontWeight,
          color: window.getComputedStyle(h).color
        }));

        const buttons = Array.from(document.querySelectorAll('button, a.btn, a[class*="button"], a[class*="btn"]')).slice(0, 10).map(b => ({
          text: b.innerText.slice(0, 40).trim(),
          bg: window.getComputedStyle(b).backgroundColor,
          color: window.getComputedStyle(b).color,
          radius: window.getComputedStyle(b).borderRadius,
          font: window.getComputedStyle(b).fontFamily
        }));

        const sections = Array.from(document.querySelectorAll('section, header, footer, main > div')).slice(0, 20).map((s, idx) => ({
          idx,
          tag: s.tagName,
          id: s.id,
          class: s.className,
          heading: s.querySelector('h1, h2, h3')?.innerText?.slice(0, 80)?.trim() || '',
          bg: window.getComputedStyle(s).backgroundColor
        }));

        return {
          title: document.title,
          fonts: Array.from(fonts).slice(0, 15),
          colors: Array.from(colors).slice(0, 20),
          bgColors: Array.from(bgColors).slice(0, 20),
          headings,
          buttons,
          sections
        };
      };
      return getStyles();
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${name}-extracted.json`),
      JSON.stringify(extractedData, null, 2)
    );
    await pageDesktop.close();

    // 2. Mobile Viewport (390px)
    console.log(`Capturing ${name} mobile (390px)...`);
    const pageMobile = await browser.newPage();
    await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pageMobile.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('Goto warning:', e.message));

    await pageMobile.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    await new Promise(r => setTimeout(r, 1000));
    await pageMobile.screenshot({
      path: path.join(OUTPUT_DIR, `${name}-mobile-390.png`),
      fullPage: true
    });
    console.log(`Saved ${name}-mobile-390.png`);
    await pageMobile.close();

  } catch (err) {
    console.error(`Error capturing ${name}:`, err);
  } finally {
    await browser.close();
  }
}

async function main() {
  await captureSite('https://petersonacademy.com/', 'peterson-academy');
  await captureSite('https://www.artofconversation.in/', 'art-of-conversation');
  console.log('Design research capture complete!');
}

main();

