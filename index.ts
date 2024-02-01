import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://hackclub.slack.com/?redir=%2Fgantry%2Fauth%3Fapp%3Dclient%26lc%3D1706820638%26return_to%3D%252Fclient%252FT0266FRGM%252FC06GC9FQLQP%26teams%3D');
    await page.waitForNetworkIdle()

    await page.waitForSelector(".p-view_header__channel_title", { timeout: 60000 });

    await page.waitForNavigation({ waitUntil: 'networkidle0' })



    await browser.close();
  } catch (error) {
    console.error(error)
  }
})();
