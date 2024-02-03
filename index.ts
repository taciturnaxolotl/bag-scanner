import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse'
import { loginToSlack } from './utils/login-to-slack';

type hackclubers = {
  name: string;
  whatIDo: string;
  accountType: string;
  accountCreated: string;
  daysActive: string;
  messagesPosted: string;
};

const hackclubers: hackclubers[] = [];
(() => {
  const csvFilePath = path.resolve(import.meta.dir, 'hackclub-users.csv');

  const headers = ['name', 'whatIDo', 'accountType', 'accountCreated', 'daysActive', 'messagesPosted'];

  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  parse(fileContent, {
    delimiter: ',',
    columns: headers,
  }, (error, result: hackclubers[]) => {
    if (error) {
      console.error(error);
    }
    console.log("Result", result);
    hackclubers.push(...result);
  });
})();


(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await loginToSlack(page);
    await page.waitForNetworkIdle();
    await page.waitForSelector('[data-qa="message_input"]');

    // send a message to the channel
    async function sendCommand(command: string) {
      await page.click('[data-qa="message_input"]');
      await page.keyboard.type(command);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    for (let i = 0; i < hackclubers.length; i++) {
      const { name } = hackclubers[i];
      await sendCommand('/bag @' + name);
    }

    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    throw error
  }
})();
