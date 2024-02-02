import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await loginToSlack(page);
    await page.waitForNetworkIdle();
    await page.waitForSelector('[data-qa="message_input"]');

    // send a message to the channel
    await page.click('[data-qa="message_input"]');
    await page.keyboard.type('/bag @kieran');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // wait for new message to load
    await page.waitForSelector('.c-message_kit__blocks span');

    await page.$$eval('.c-message_kit__blocks span', (spans, color) => {
      for (let span of spans) {
        span.style.border = `2px solid ${color}`;
      }
    }, 'red'); // 'red' is the border color, you can change it to any valid CSS color

    // Extract the text content
    const spansText = await page.$$eval('.c-message_kit__blocks span', spans => {
      // get
      return spans.map(span => span.textContent?.trim() || '').join(', ');
    });

    console.log(spansText);
    await page.screenshot({ path: 'screenshot.png' });

    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    throw error
  }
})();
