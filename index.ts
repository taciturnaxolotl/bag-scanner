import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await loginToSlack(page);

    await page.screenshot({ path: 'scrn-shot.png' });
    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    throw error
  }
})();
