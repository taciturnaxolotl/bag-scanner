import puppeteer from 'puppeteer';
import { loginToSlack } from './utils/login-to-slack';

const items = [":-aftermash-complete-series:", ":-aftermash-season-1:", ":-aftermash-season-2:", ":-aluminum-ore:", ":-aluminum:", ":-anvil:", ":-apple:", ":-axe:", ":-banana:", ":-carrot:", ":-coal:", ":-coconut:", ":-cool-shoes:", ":-diamond:", ":-dinoisseur-challenge-coin:", ":-emerald:", ":-fancy-pants:", ":-fashionable-shirt:", ":-fish:", ":-fish-hat:", ":-furnace:", ":-gold-ore:", ":-gold:", ":-gp:", ":-grass-seeds:", ":-hammer:", ":-hat:", ":-iron-ore:", ":-kamina-shades:", ":-kiwi:", ":-knife:", ":-knitting-needles:", ":-log:", ":-lumber:", ":-mash-book:", ":-mash-complete-series:", ":-mash-good-seasons:", ":-mash-movie:", ":-mash-season-1:", ":-mash-season-2:", ":-mash-season-3:", ":-mash-season-4:", ":-mash-season-5:", ":-mash-season-6:", ":-mash-season-7:", ":-mash-season-8:", ":-mash-season-9:", ":-mash-season-10:", ":-mash-season-11:", ":-mash-ultimate-collection:", ":-mushroom:", ":-orange:", ":-pants:", ":-raw-diamond:", ":-raw-emerald:", ":-raw-ruby:", ":-raw-sapphire:", ":-raw-tanzanite:", ":-ruby:", ":-sapphire:", ":-shears:", ":-shirt:", ":-shoes:", ":-shurt:", ":-sockmeister-challenge-coin:", ":-socks:", ":-tanzanite:", ":-top-hat:", ":-wheat-seeds:", ":-wool:", ":-wurlitzer-jukebox:", ":-iron:", ":-rock:", ":-saw:", ":-acorn:", ":-banana-bread:", ":-bone-dust:", ":-bone:", ":-bread:", ":-brick:", ":-cake:", ":-carrot-cake:", ":-cat-hat:", ":-chisel:", ":-clay:", ":-cloth:", ":-coal-dust:", ":-cotton:", ":-diamond-dust:", ":-egg:", ":-emerald-dust:", ":-fishhook:", ":-fishing-rod:", ":-flax:", ":-flour:", ":-fruit-salad:", ":-glass:", ":-glue:", ":-goldwire:", ":-ironwire:", ":-ladder:", ":-loom:", ":-mandrel:", ":-onion:", ":-pickaxe:", ":-potato:", ":-pottery-wheel:", ":-rolling-mill:", ":-ruby-dust:", ":-salt:", ":-sand:", ":-needle:", ":-pot:", ":-sugarcane:", ":-vessel:", ":-water:", ":-wheel:", ":-yarn:", ":-trowel:", ":-sapphire-dust:", ":-tanzanite-dust:", ":-spinning-wheel:", ":-wheat:", ":-thread:", ":-sugar:", ":-stick:", ":-scythe:", ":-shovel:", ":-blahaj:", ":-file:", ":-firewood:", ":-gold-wire:", ":-hairball:", ":-iron-wire:", ":-lapidary-wheel:", ":-range:", ":-stone-mill:", ":-bonsai:"];

async function waitForNewMessage(page: any, start: number) {
  return new Promise(async (resolve) => {
    const message = await page.evaluate(async () => {
      const messages = document.querySelectorAll('[data-qa="bk_markdown_element"]');
      console.log(messages);
      let message = Array.from(messages).pop();
      if (message) {
        return message.textContent;
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
      await page.keyboard.press('Enter');
    }

    await sendCommand('Scanning time!');
    await new Promise(r => setTimeout(r, 2000));

    let running = true;

    // Listen for SIGINT event
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Stopping...');
      running = false;

      browser.close();
    });

    for (const item of items) {
      console.log('Sending item command to use item: ' + item);
      await sendCommand('/item ' + item);

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
    }

  } catch (error) {
    // handle requesting main frame to early error
    throw error
  }
})();
