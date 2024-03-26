import fs from 'fs/promises'
import { Page } from 'puppeteer'
const COOKIES_FOLDER_PATH = process.env.COOKIES_FOLDER_PATH || 'cookies/'
const COOKIES_FILE_NAME = process.env.COOKIES_FILE_NAME || 'cookies.json'
const COOKIES_FILE_PATH = COOKIES_FOLDER_PATH + COOKIES_FILE_NAME

export async function loginToSlack(page: Page) {
  try {
    // import cookies as json
    try {
      await fs.stat(COOKIES_FILE_PATH)

      console.log(`${COOKIES_FILE_PATH} exists.`)

      const cookies = JSON.parse(await fs.readFile(COOKIES_FILE_PATH, 'utf-8'))
      // set cookies
      for (let cookie of cookies) {
        await page.setCookie(cookie)
      }
      console.log('Cookies set.')

      await page.goto("https://app.slack.com/client/T0266FRGM/C06P09REBK4")
    }
    catch (error) {
      console.error(`${COOKIES_FILE_PATH} doesn't exist.`)
      await loginAndSaveCookies(page)
      return
    }

  } catch (error) {
    throw error
  }
}

async function loginAndSaveCookies(page: Page) {
  page.goto("https://hackclub.slack.com/?redir=%2Fgantry%2Fauth%3Fapp%3Dclient%26lc%3D1710353161%26return_to%3D%252Fclient%252FT0266FRGM%252FC06P09REBK4%26teams%3D")

  console.log("nav 1 complete")

  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  // wait for user confirmation in cli
  console.log('Please login to your workspace and press any key to continue...')
  process.stdin.setRawMode(true)
  process.stdin.resume()
  await new Promise(resolve => process.stdin.on('data', resolve))
  process.stdin.setRawMode(false)

  const cookies = await page.cookies()
  saveCookies(cookies)
}

async function saveCookies(cookies: any[]) {
  await createFolderIfDoesntExist(COOKIES_FOLDER_PATH)
  // convert cookies to json and save to file
  fs.writeFile(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2))
}

async function createFolderIfDoesntExist(folderPath: string) {
  try {
    await fs.stat(folderPath)
  } catch (error) {
    console.error(`${folderPath} directory doesn't exist.`)
    try {
      await fs.mkdir(folderPath)
      console.log('Created directory:', folderPath)
    } catch (error) {
      console.error('Failed to create directory.')
      throw error
    }
  }
}
