import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

async function waitForNewMessage(page: any) {
  return new Promise(async (resolve) => {
    const message = await page.evaluate(() => {
      const messages = document.querySelectorAll('.p-rich_text_section');
      const message = Array.from(messages).pop();
      if (message) {
        return message.textContent;
      }
    });

    if (message && message.includes("@kieran") && (message.includes('What you') && !message.includes(':loading-dots:'))) {
      resolve(message);
    } else {
      setTimeout(() => {
        resolve(waitForNewMessage(page));
      }, 1000);
    }
  });
}

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await loginToSlack(page);
    await page.waitForSelector('[data-qa="message_input"]');

    // send a message to the channel
    async function sendCommand(command: string) {
      await page.click('[data-qa="message_input"]');
      await page.keyboard.type(command);
      await page.keyboard.press('Enter');
    }

    await sendCommand('Mining time!');
    await new Promise(r => setTimeout(r, 1000));

    for (let i = 0; i < 100; i++) {
      console.log('Sending command to use pickaxe #' + i);
      await sendCommand('/use pickaxe');

      await new Promise(r => setTimeout(r, 1000));

      await waitForNewMessage(page).then((message: any) => {
        console.log('Received message: ' + message);
      });
    }

    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    throw error
  }
})();
