import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

async function waitForNewMessage(page: any) {
  const start = Date.now();

  return new Promise(async (resolve) => {
    const message = await page.evaluate(() => {
      const messages = document.querySelectorAll('.p-rich_text_section');
      let message = Array.from(messages).pop();
      if (message) {
        // find the last message that contains @kieran
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].textContent?.includes('@kieran ran /use')) {
            message = messages[i];
            break;
          }
        }
        return message.textContent;
      }
    });

    if (message && ((message.includes('What you') || message.includes("nothing good here")) && !message.includes(':loading-dots:'))) {
      resolve(message);
    } else if (start + 30000 < Date.now()) {
      resolve('timeout after 30 seconds of waiting for a new message.');
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
    await new Promise(r => setTimeout(r, 2000));

    let i = 0;
    let running = true;

    // Listen for SIGINT event
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Stopping...');
      running = false;

      browser.close();
    });

    while (true) {
      console.log('Sending command to use pickaxe #' + i);
      await sendCommand('/use pickaxe');

      await new Promise(r => setTimeout(r, 1000));

      await waitForNewMessage(page).then((message: any) => {
        console.log('Received message: ' + message);
      });

      i++;
    }

  } catch (error) {
    // handle requesting main frame to early error
    throw error
  }
})();
