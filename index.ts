import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

async function waitForNewMessage(page: any, start: number) {
  return new Promise(async (resolve) => {
    const message = await page.evaluate(async () => {
      const messages = document.querySelectorAll('[data-qa="message_content"]');
      console.log(messages);
      let message = Array.from(messages).pop();
      if (message) {
        // get the text content of the message and the alt text of any image tags in the message
        let newMessage;
        const images = message.querySelectorAll('img');
        if (images.length) {
          newMessage = {
            textContent: message.textContent,
            images: Array.from(images).map((img: any) => img.alt)
          };
        } else {
          newMessage = {
            textContent: message.textContent
          };
        }
        return newMessage;
      }
    });

    if (message) {
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
      await new Promise(r => setTimeout(r, 1000));
      await page.keyboard.press('Enter');
    }

    await sendCommand('Crafting time!');
    await new Promise(r => setTimeout(r, 2000));

    let running = true;

    // Listen for SIGINT event
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Stopping...');
      running = false;

      browser.close();
    });

    for (let i = 0; i < 10 && running; i++) {
      await sendCommand('/craft :-iron_ore: :-coal: :-furnace:');

      await new Promise(r => setTimeout(r, 1000));

      await waitForNewMessage(page, Date.now()).then((message: any) => {
        // click the data-qa-action-id="complete-crafting"
        page.click('[data-qa-action-id="complete-crafting"]');

        console.log(message);
      });
    }

  } catch (error) {
    // handle requesting main frame to early error
    throw error
  }
})();
