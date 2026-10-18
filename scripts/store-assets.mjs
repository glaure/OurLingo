// Creates the Google Play store graphics in store-assets/:
// phone screenshots (1080x1920) from the real app and the feature graphic
// (1024x500). Run with: node scripts/store-assets.mjs
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = `${root}store-assets`
const books = ['MORE! 1', 'MORE! 2', 'MORE! 3', 'MORE! 4']
mkdirSync(out, { recursive: true })

const unitData = (file) =>
  JSON.parse(readFileSync(`${root}public/data/${file}`, 'utf8'))
const moreOne = unitData('more-1-unit-1.json')
const moreTwo = unitData('more-2-unit-1.json')

// Sample progress: MORE! 1 Unit 1 completed, MORE! 2 Unit 1 well under way.
const record = (book, entry, streak, wrong = 0) => ({
  book,
  unit: 1,
  english: entry.english,
  german: entry.german,
  correctAttempts: Math.max(streak, 1),
  incorrectAttempts: wrong,
  correctStreak: streak,
  lastPracticedAt: new Date().toISOString(),
})
const progress = {
  schemaVersion: 1,
  records: [
    ...moreOne.entries.map((entry) => record('MORE! 1', entry, 3)),
    ...moreTwo.entries.slice(0, 18).map((entry) => record('MORE! 2', entry, 3)),
    ...moreTwo.entries.slice(18, 26).map((entry) => record('MORE! 2', entry, 1, 1)),
  ],
}

const server = await createServer({
  root,
  server: { port: 5182, strictPort: true },
  logLevel: 'error',
})
await server.listen()
const base = 'http://localhost:5182/'
const browser = await chromium.launch()

try {
  const page = await browser.newPage({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    colorScheme: 'light',
  })
  await page.addInitScript(
    ({ books, progress }) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(
        'ourlingo.settings.v1',
        JSON.stringify({
          schemaVersion: 1,
          theme: 'light',
          books,
          knownBooks: books,
          progression: 'completed-and-next',
        }),
      )
      localStorage.setItem('ourlingo.learning.v1', JSON.stringify(progress))
    },
    { books, progress },
  )
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${out}/${name}.png` })
  }
  const backToSetup = async () => {
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Back to practice' }).click()
  }

  // 1. Colourful unit library.
  await page.goto(base)
  await page.locator('.unit-card').nth(3).waitFor()
  await shot('01-library')

  // 2. Practice setup with progress statistics.
  await page
    .getByRole('button', { name: 'Practise MORE! 2 Unit 1', exact: true })
    .click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('02-practice-setup')

  // 3. Description question in multiple choice, answered correctly.
  await page.getByText('Multiple choice', { exact: true }).click()
  await page
    .getByRole('radio', { name: 'Description → English', exact: true })
    .check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const clue = await page.locator('.question-word').textContent()
  const answer = moreTwo.entries.find((entry) => entry.description === clue)
  await page
    .getByRole('group', { name: 'Answer in English' })
    .getByText(answer.english, { exact: true })
    .click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('03-description-question')
  await backToSetup()

  // 4. Matching words with descriptions, one pair already found.
  await page.getByText('Matching pairs', { exact: true }).click()
  await page
    .getByRole('radio', { name: 'English + Description', exact: true })
    .check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const englishTiles = page
    .getByRole('group', { name: 'English matching words' })
    .locator('.matching-tile > span:first-child')
  const firstText = await englishTiles.first().textContent()
  const pair = moreTwo.entries.find((entry) => entry.english === firstText)
  await page
    .getByRole('button', { name: `English: ${pair.english}`, exact: true })
    .click()
  await page
    .getByRole('button', { name: `Description: ${pair.description}`, exact: true })
    .click()
  await englishTiles.nth(1).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('04-matching-descriptions')
  await backToSetup()

  // 5. Results with three stars after a perfect typed round.
  await page.getByText('Type answer', { exact: true }).click()
  await page
    .getByRole('radio', { name: 'Deutsch → English', exact: true })
    .check()
  await page.getByLabel('Words per round').selectOption('5')
  await page.getByRole('button', { name: 'Start practice' }).click()
  for (let question = 0; question < 5; question += 1) {
    const german = await page.locator('.question-word').textContent()
    const entry = moreTwo.entries.find((item) => item.german === german)
    await page
      .getByLabel('In English', { exact: true })
      .fill(entry.english.split(/[;,]/)[0].replace(/\([^)]*\)/g, '').trim())
    await page.getByRole('button', { name: 'Check answer' }).click()
    await page.getByRole('button', { name: /Next word|See results/ }).click()
  }
  await page.locator('.result-stars').waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/05-results.png` })
  await page.close()

  // Feature graphic in the style of the app icon.
  const graphic = await browser.newPage({
    viewport: { width: 1024, height: 500 },
  })
  await graphic.goto(base)
  const fonts = '/@fs' + root + 'node_modules/@fontsource-variable'
  await graphic.setContent(`<!doctype html>
<style>
  @font-face { font-family: 'DM Sans'; src: url('${fonts}/dm-sans/files/dm-sans-latin-wght-normal.woff2') format('woff2'); font-weight: 100 1000; }
  @font-face { font-family: 'Fraunces'; src: url('${fonts}/fraunces/files/fraunces-latin-wght-normal.woff2') format('woff2'); font-weight: 100 900; }
  html, body { margin: 0; }
  .art { width: 1024px; height: 500px; box-sizing: border-box; padding: 0 84px;
    display: flex; align-items: center; gap: 56px; overflow: hidden; position: relative;
    background: radial-gradient(circle at 88% 18%, #fff7d6 0 120px, transparent 121px), #eaf4ef;
    font-family: 'DM Sans'; color: #243c35; }
  .icon { flex: none; width: 216px; height: 216px; border-radius: 52px; background: #fff;
    display: grid; place-items: center; box-shadow: 0 18px 40px #1d2f2522; }
  .wordmark { font: 700 76px 'DM Sans'; letter-spacing: -1px; }
  .wordmark span { color: #26785e; }
  .wordmark i { display: inline-block; width: 16px; height: 16px; border-radius: 50%; background: #e7a73c; margin-left: 4px; }
  .tagline { font: 600 34px/1.25 'Fraunces'; margin: 10px 0 26px; white-space: nowrap; }
  .tagline span { color: #26785e; }
  .books { display: flex; gap: 12px; }
  .book { font: 700 22px 'DM Sans'; padding: 10px 18px; border-radius: 999px; color: #fff; }
</style>
<div class="art">
  <div class="icon">
    <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#26785e" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 7v14" />
      <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-4a4 4 0 0 0-4 2 4 4 0 0 0-4-2H4a1 1 0 0 1-1-1Z" />
    </svg>
  </div>
  <div>
    <div class="wordmark">Our<span>Lingo</span><i></i></div>
    <div class="tagline">Englisch-Vokabeln üben<br /><span>Wort für Wort</span></div>
    <div class="books">
      <span class="book" style="background:#26785e">MORE! 1</span>
      <span class="book" style="background:#c2413b">MORE! 2</span>
      <span class="book" style="background:#2f6fb7">MORE! 3</span>
      <span class="book" style="background:#7b4bb8">MORE! 4</span>
    </div>
  </div>
</div>`)
  await graphic.evaluate(() => document.fonts.ready)
  await graphic.locator('.art').screenshot({ path: `${out}/feature-graphic.png` })
  await graphic.close()
} finally {
  await browser.close()
  await server.close()
}
console.log(`Store graphics written to ${out}`)
