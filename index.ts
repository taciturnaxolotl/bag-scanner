import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

async function waitForNewMessage(page: any, start: number) {
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

    if (message && ((message.includes('What you') || message.includes("nothing good here") || message.includes("Uncertainty is a part of life")) && !message.includes(':loading-dots:'))) {
      resolve(message);
    } else if (start + 10000 < Date.now()) {
      resolve('timeout after 30 seconds of waiting for a new message.');
    } else {
      setTimeout(() => {
        resolve(waitForNewMessage(page, start));
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

    // await sendCommand('Mining time!');
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

      await waitForNewMessage(page, Date.now()).then((message: any) => {
        // regex for  @kieran ran /use pickaxe:You find a spot that looks promising and start breaking things apart with heavy swings of your pickaxe.Not much here, but you take a solid-looking rock as a consolation prize.What you got: x1  Rock (edited)
        const regex = /What you (got|lost): x(\d+) (.*?)(?= What|$)(?= \(edited\)|$)?/g;

        const match = regex.exec(message);

        if (match !== null) {
          console.log(`${new Date().toLocaleString()} - ${match[1]} x${match[2]} ${match[3]} ${match[4] ? `${match[4]} x${match[5]} ${match[6]}` : ''}`);
        } else {
          console.log(message);
        }
      });

      i++;
    }

  } catch (error) {
    // handle requesting main frame to early error
    throw error
  }
})();
