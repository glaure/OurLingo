import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { VocabularyUnit } from '../src/vocabulary'

const unit = JSON.parse(
  readFileSync('public/data/more-1-unit-1.json', 'utf8'),
) as VocabularyUnit

test('review, search, edit, approve and reload saved vocabulary', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.vocabulary-row')).toHaveCount(42)
  await expect(
    page.getByRole('button', { name: 'Practice', exact: true }),
  ).toBeDisabled()
  await page.getByLabel('Search vocabulary').fill('school bag')
  await expect(page.locator('.vocabulary-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear search' }).click()
  await page
    .getByLabel('German entry 1', { exact: true })
    .fill('geben; übergeben')
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save & approve' }).click()
  await expect(page.getByRole('status')).toContainText('approved and saved')
  await page.reload()
  await expect(page.getByLabel('German entry 1', { exact: true })).toHaveValue(
    'geben; übergeben',
  )
  await expect(
    page.getByRole('button', { name: 'Practice', exact: true }),
  ).toBeEnabled()
  expect(errors).toEqual([])
})

test('add, validate, remove and download entries', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.vocabulary-row')).toHaveCount(42)
  await page.getByRole('button', { name: 'Add a word or phrase' }).click()
  await page.getByRole('button', { name: 'Save & approve' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Entry 43 needs both English and German',
  )
  await page.getByLabel('English entry 43', { exact: true }).fill('hello')
  await page.getByLabel('German entry 43', { exact: true }).fill('hallo')
  await page.getByRole('button', { name: 'Save & approve' }).click()
  await expect(page.getByRole('status')).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Remove entry 43', exact: true })
    .click()
  await expect(page.locator('.vocabulary-row')).toHaveCount(42)
  await expect(
    page.getByRole('button', { name: 'Practice', exact: true }),
  ).toBeDisabled()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download vocabulary backup' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('ourlingo-more-1-unit-1.json')
  const filePath = await download.path()
  expect(filePath).toBeTruthy()
  const backup = JSON.parse(readFileSync(filePath!, 'utf8')) as VocabularyUnit
  expect(backup.entries).toHaveLength(42)
  expect(backup.reviewStatus).toBe('pending')
})

test('complete a round, retry a missed word, and practise the opposite direction', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save & approve' }).click()
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByLabel('Words per round').selectOption('5')
  await page.getByRole('button', { name: 'Start practice' }).click()
  for (let question = 0; question < 5; question++) {
    const prompt = await page.locator('.question-word').innerText()
    const entry = unit.entries.find((item) => item.german === prompt)
    expect(entry).toBeTruthy()
    await page
      .getByLabel('In English', { exact: true })
      .fill(question === 0 ? 'wrong answer' : entry!.english)
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByRole('status')).toContainText(
      question === 0 ? 'One to practise again' : "That's right!",
    )
    await page
      .getByRole('button', {
        name: question === 4 ? 'See results' : 'Next word',
      })
      .click()
  }
  await expect(page.locator('.score')).toHaveText('4 / 5')
  await page.getByRole('button', { name: 'Retry missed words' }).click()
  await expect(page.getByText('Question 1 of 1')).toBeVisible()
  const prompt = await page.locator('.question-word').innerText()
  await page
    .getByLabel('In English', { exact: true })
    .fill(unit.entries.find((entry) => entry.german === prompt)!.english)
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByRole('button', { name: 'See results' }).click()
  await expect(page.locator('.score')).toHaveText('1 / 1')
  await page.getByRole('button', { name: 'Practice settings' }).click()
  await page.getByText('Deutsch', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const english = await page.locator('.question-word').innerText()
  const german = unit.entries
    .find((entry) => entry.english === english)!
    .german.split(/[;,]/)[0]
  await page.getByLabel('Auf Deutsch', { exact: true }).fill(german)
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByRole('status')).toContainText("That's right!")
})

test('invalid browser data falls back to the original photo transcription', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('ourlingo.more-1-unit-1.v1', '{not json'),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('original transcription')
  await expect(page.locator('.vocabulary-row')).toHaveCount(42)
})

for (const direction of ['english', 'german'] as const) {
  test(`multiple choice in ${direction} supports single selection, feedback, scoring and retries`, async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Save & approve' }).click()
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByText('Multiple choice', { exact: true }).click()
    if (direction === 'german')
      await page.getByText('Deutsch', { exact: true }).click()
    await page.getByLabel('Words per round').selectOption('5')
    await page.getByRole('button', { name: 'Start practice' }).click()
    for (let question = 0; question < 5; question++) {
      const prompt = await page.locator('.question-word').innerText()
      const entry = unit.entries.find(
        (item) =>
          item[direction === 'english' ? 'german' : 'english'] === prompt,
      )!
      await expect(page.locator('.answer-choice')).toHaveCount(4)
      await expect(
        page.getByRole('button', { name: 'Check answer' }),
      ).toBeDisabled()
      const labels = await page.locator('.answer-choice span').allTextContents()
      expect(labels.filter((text) => text === entry[direction])).toHaveLength(1)
      const selected =
        question === 0
          ? labels.find((text) => text !== entry[direction])!
          : entry[direction]
      await page.getByRole('radio', { name: selected, exact: true }).check()
      await expect(page.locator('.answer-choices input:checked')).toHaveCount(1)
      expect(
        await page.locator('.answer-choice span').allTextContents(),
      ).toEqual(labels)
      await page.getByRole('button', { name: 'Check answer' }).click()
      await expect(page.getByRole('status')).toContainText(
        question === 0 ? 'One to practise again' : "That's right!",
      )
      await expect(page.locator('.answer-choice.correct')).toHaveCount(1)
      for (const radio of await page.locator('.answer-choices input').all())
        await expect(radio).toBeDisabled()
      await page
        .getByRole('button', {
          name: question === 4 ? 'See results' : 'Next word',
        })
        .click()
    }
    await expect(page.locator('.score')).toHaveText('4 / 5')
    await page.getByRole('button', { name: 'Retry missed words' }).click()
    await expect(page.getByText('Question 1 of 1')).toBeVisible()
    await expect(page.locator('.answer-choice')).toHaveCount(4)
    const prompt = await page.locator('.question-word').innerText()
    const entry = unit.entries.find(
      (item) => item[direction === 'english' ? 'german' : 'english'] === prompt,
    )!
    await page
      .getByRole('radio', { name: entry[direction], exact: true })
      .check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await page.getByRole('button', { name: 'See results' }).click()
    await expect(page.locator('.score')).toHaveText('1 / 1')
  })
}

test('a single-entry unit offers typed practice instead of a misleading choice', async ({
  page,
}) => {
  await page.addInitScript(
    (data) =>
      localStorage.setItem('ourlingo.more-1-unit-1.v1', JSON.stringify(data)),
    { ...unit, reviewStatus: 'approved', entries: unit.entries.slice(0, 1) },
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByText('Multiple choice', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByRole('alert')).toContainText('at least two distinct')
  await expect(page.locator('.question-word')).toHaveCount(0)
  await page.getByText('Type answer', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByLabel('In English', { exact: true })).toBeVisible()
})

for (const width of [1440, 768, 390, 320]) {
  test(`review and practice fit the ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.vocabulary-row')).toHaveCount(42)
    await page.evaluate(() => document.fonts.ready)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    const clippedFields = await page
      .locator('.entry-field textarea')
      .evaluateAll((fields) =>
        fields
          .filter((field) => field.scrollHeight > field.clientHeight + 1)
          .map((field) => field.getAttribute('aria-label')),
      )
    expect(clippedFields).toEqual([])
    if (width > 850)
      expect(
        await page
          .locator('.study-image img')
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0)
    await page.screenshot({ path: `/tmp/ourlingo-review-${width}.png` })
    await page.getByRole('button', { name: 'Save & approve' }).click()
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByRole('button', { name: 'Start practice' }).click()
    await expect(page.getByLabel('In English', { exact: true })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({ path: `/tmp/ourlingo-practice-${width}.png` })
    page.once('dialog', (dialog) => dialog.accept())
    await page
      .getByRole('button', { name: 'Back to practice', exact: true })
      .click()
    await page.getByText('Multiple choice', { exact: true }).click()
    await page.getByRole('button', { name: 'Start practice' }).click()
    await expect(page.locator('.answer-choice')).toHaveCount(4)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.locator('.answer-choice').first().click()
    await expect(page.locator('.answer-choices input:checked')).toHaveCount(1)
    await page.screenshot({
      path: `/tmp/ourlingo-multiple-choice-${width}.png`,
    })
  })
}
