/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { VocabularyUnit } from '../src/vocabulary.ts'

const unit = JSON.parse(
  readFileSync('public/data/more-1-unit-1.json', 'utf8'),
) as VocabularyUnit

const unitTwo = JSON.parse(
  readFileSync('public/data/more-1-unit-2.json', 'utf8'),
) as VocabularyUnit

const moreTwoFixtures = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
  (number) =>
    JSON.parse(
      readFileSync(`public/data/more-2-unit-${number}.json`, 'utf8'),
    ) as VocabularyUnit,
)

const moreOneFixtures = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
  (number) =>
    JSON.parse(
      readFileSync(`public/data/more-1-unit-${number}.json`, 'utf8'),
    ) as VocabularyUnit,
)

// Most tests use a device that is already set up and shows every unit; tests
// tagged @first-start begin without saved settings.
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.tags.includes('@first-start')) return
  await page.addInitScript(() => {
    if (localStorage.getItem('ourlingo.settings.v1')) return
    const books = ['MORE! 1', 'MORE! 2', 'MORE! 3', 'MORE! 4']
    localStorage.setItem(
      'ourlingo.settings.v1',
      JSON.stringify({
        schemaVersion: 1,
        theme: 'system',
        books,
        knownBooks: books,
        progression: 'all',
      }),
    )
  })
})

test('MORE! 2 Irregular Verbs supports phone review, practice, progress and permanent deletion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  const practise = page.getByRole('button', { name: 'Practise MORE! 2 Irregular Verbs', exact: true })
  await expect(practise).toBeEnabled()
  await page.getByRole('radio', { name: 'MORE! 2', exact: true }).check()
  await expect(page.locator('.unit-card')).toHaveCount(16)
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page.getByRole('button', { name: 'Add unit', exact: true }).click()
  await expect(page.getByLabel('Unit number', { exact: true })).toHaveValue('16')
  await page.getByRole('button', { name: 'Review MORE! 2 Irregular Verbs', exact: true }).click()
  await expect(page.locator('.vocabulary-row')).toHaveCount(59)
  await expect(page.getByLabel('English entry 1', { exact: true })).toHaveValue('be - was/were - been')
  await page.getByLabel('German entry 1', { exact: true }).fill('sein; existieren')
  await page.getByRole('button', { name: 'Save & approve', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page.getByRole('button', { name: 'Review MORE! 2 Irregular Verbs', exact: true }).click()
  await expect(page.getByLabel('German entry 1', { exact: true })).toHaveValue('sein; existieren')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/irregular-verbs-phone.png', fullPage: true })
  await page.getByRole('button', { name: 'Kid space', exact: true }).click()
  await practise.click()
  await page.getByText('Type answer', { exact: true }).click()
  await page.getByLabel('Words per round').selectOption('5')
  await page.getByRole('button', { name: 'Start practice' }).click()
  const verbs = JSON.parse(readFileSync('public/data/more-2-irregular-verbs.json', 'utf8')) as VocabularyUnit
  for (let question = 0; question < 5; question++) {
    const prompt = await page.locator('.question-word').innerText()
    const entry = verbs.entries.find((item) => item.german === prompt || (item.german === 'sein' && prompt === 'sein; existieren'))!
    await page.getByRole('textbox', { name: 'In English', exact: true }).fill(entry.english)
    await page.getByRole('button', { name: 'Check answer', exact: true }).click()
    await page.getByRole('button', { name: question === 4 ? 'See results' : 'Next word', exact: true }).click()
  }
  await page.reload()
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('ourlingo.learning.v1')!).records)
  expect(records.filter((record: { unit: string }) => record.unit === 'irregular-verbs')).toHaveLength(5)
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete MORE! 2 Irregular Verbs', exact: true }).click()
  await page.reload()
  await expect(practise).toHaveCount(0)
})

async function openReview(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 1 Unit 1', exact: true })
    .click()
}

async function completeMatchingBoard(
  page: Page,
  entries: Array<{ english: string; german: string }>,
) {
  const englishGroup = page.getByRole('group', {
    name: 'English matching words',
  })
  const english = await englishGroup
    .locator('.matching-tile > span:first-child')
    .allTextContents()
  for (const text of english) {
    const entry = entries.find((item) => item.english === text)!
    await page
      .getByRole('button', { name: `English: ${entry.english}`, exact: true })
      .click()
    await page
      .getByRole('button', { name: `Deutsch: ${entry.german}`, exact: true })
      .click()
  }
  await expect(page.getByRole('status')).toContainText(
    /Board complete|All boards complete/,
  )
}

test('review, search, edit, approve and reload saved vocabulary', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openReview(page)
  await expect(page.getByText('v0.2.3', { exact: true })).toBeVisible()
  await expect(page.locator('.vocabulary-row')).toHaveCount(42)
  await expect(
    page.getByRole('button', { name: 'Practice', exact: true }),
  ).toBeEnabled()
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
  await expect(
    page.getByRole('region', { name: 'Kid space', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 1 Unit 1', exact: true })
    .click()
  await expect(page.getByLabel('German entry 1', { exact: true })).toHaveValue(
    'geben; übergeben',
  )
  await expect(
    page.getByRole('button', { name: 'Practice', exact: true }),
  ).toBeEnabled()
  expect(errors).toEqual([])
})

test('add, validate, remove and download entries', async ({ page }) => {
  await openReview(page)
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
  await openReview(page)
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
  await page.getByRole('radio', { name: 'English → Deutsch', exact: true }).check()
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
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 1 Unit 1', exact: true })
    .click()
  await expect(page.locator('.vocabulary-row')).toHaveCount(42)
})

for (const direction of ['english', 'german'] as const) {
  test(`multiple choice in ${direction} supports single selection, feedback, scoring and retries`, async ({
    page,
  }) => {
    await openReview(page)
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByText('Multiple choice', { exact: true }).click()
    if (direction === 'german')
      await page.getByRole('radio', { name: 'English → Deutsch', exact: true }).check()
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

test('kid space is the default, migration preserves approved edits, and parent controls stay out of learning', async ({
  page,
}) => {
  const saved = {
    ...unit,
    reviewStatus: 'approved',
    entries: unit.entries.map((entry, index) =>
      index === 0 ? { ...entry, german: 'geben; schenken' } : entry,
    ),
  }
  await page.addInitScript(
    (data) =>
      localStorage.setItem('ourlingo.more-1-unit-1.v1', JSON.stringify(data)),
    saved,
  )
  await page.goto('/')
  await expect(
    page.getByRole('region', { name: 'Kid space', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Review vocabulary', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Add unit', exact: true }),
  ).toHaveCount(0)
  await expect(page.locator('.entry-field')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true }),
  ).toBeEnabled()
  const migrated = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ourlingo.library.v1')!),
  )
  expect(migrated.units).toHaveLength(59)
  expect(migrated.units[0].entries[0].german).toBe('geben; schenken')
  expect(migrated.units[0].reviewStatus).toBe('approved')
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Kid space', exact: true }),
  ).toBeVisible()
})

test('create units in both books, keep their words separate, and practise the selected unit', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  for (const data of [
    {
      book: 'MORE! 1',
      number: '16',
      title: 'At school',
      words: [
        { english: 'book', german: 'Buch' },
        { english: 'pen', german: 'Stift' },
      ],
    },
    {
      book: 'MORE! 2',
      number: '16',
      title: 'Feelings',
      words: [
        { english: 'happy', german: 'glücklich' },
        { english: 'sad', german: 'traurig' },
      ],
    },
  ]) {
    await page.getByRole('button', { name: 'My units', exact: false }).click()
    await page.getByRole('button', { name: 'Add unit', exact: true }).click()
    await page
      .getByRole('combobox', { name: 'Book', exact: true })
      .selectOption(data.book)
    await page.getByLabel('Unit number', { exact: true }).fill(data.number)
    await page.getByLabel('Title (optional)', { exact: true }).fill(data.title)
    await page.getByRole('button', { name: 'Create unit', exact: true }).click()
    await expect(page.locator('.vocabulary-row')).toHaveCount(0)
    for (const [index, word] of data.words.entries()) {
      await page.getByRole('button', { name: 'Add a word or phrase' }).click()
      await page
        .getByLabel(`English entry ${index + 1}`, { exact: true })
        .fill(word.english)
      await page
        .getByLabel(`German entry ${index + 1}`, { exact: true })
        .fill(word.german)
    }
    await page.getByRole('button', { name: 'Save & approve' }).click()
    await expect(page.getByRole('status')).toContainText('approved and saved')
  }
  await page.getByRole('button', { name: 'Kid space', exact: true }).click()
  await expect(page.locator('.unit-card')).toHaveCount(61)
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true }),
  ).toBeEnabled()
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 16', exact: true })
    .click()
  await page.getByText('Multiple choice', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByText('Question 1 of 2')).toBeVisible()
  const choices = await page.locator('.answer-choice span').allTextContents()
  expect(choices.sort()).toEqual(['book', 'pen'])
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'My units', exact: false }).click()
  await page
    .getByRole('button', { name: 'Practise MORE! 2 Unit 16', exact: true })
    .click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  expect(
    (await page.locator('.answer-choice span').allTextContents()).sort(),
  ).toEqual(['happy', 'sad'])
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ourlingo.library.v1')!),
  )
  expect(stored.units).toHaveLength(61)
  expect(
    stored.units.find(
      (item: VocabularyUnit) => item.book === 'MORE! 1' && item.unit === 1,
    ).entries,
  ).toHaveLength(42)
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Kid space', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.unit-card')).toHaveCount(61)
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 2 Unit 16', exact: true }),
  ).toBeEnabled()
  await page.getByRole('radio', { name: 'MORE! 2', exact: true }).check()
  await expect(page.locator('.unit-card')).toHaveCount(17)
})

test('duplicate units cannot overwrite data and unsaved review changes require confirmation', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page.getByRole('button', { name: 'Add unit', exact: true }).click()
  await page.getByLabel('Unit number', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Create unit', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('already exists')
  await expect(page.locator('.unit-card')).toHaveCount(59)
  await page.getByLabel('Unit number', { exact: true }).fill('16')
  await page.getByRole('button', { name: 'Create unit', exact: true }).click()
  await page.getByRole('button', { name: 'Add a word or phrase' }).click()
  await page.getByLabel('English entry 1', { exact: true }).fill('hello')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Kid space', exact: true }).click()
  await expect(page.getByLabel('English entry 1', { exact: true })).toHaveValue(
    'hello',
  )
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Kid space', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 16', exact: true }),
  ).toBeDisabled()
  await page.reload()
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 1 Unit 16', exact: true })
    .click()
  await expect(page.locator('.vocabulary-row')).toHaveCount(0)
})

test('confirmed unit deletion persists and an empty library does not restore deleted units', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page
    .getByRole('button', { name: 'Delete MORE! 1 Unit 1', exact: true })
    .click()
  await expect(page.locator('.unit-card')).toHaveCount(59)
  const unitsPerBook = { 'MORE! 1': 15, 'MORE! 2': 15, 'MORE! 3': 14, 'MORE! 4': 14 }
  for (const name of [
    ...Object.entries(unitsPerBook).flatMap(([book, count]) =>
      Array.from({ length: count }, (_, index) => `${book} Unit ${index + 1}`),
    ),
    'MORE! 2 Irregular Verbs',
  ]) {
    page.once('dialog', (dialog) => dialog.accept())
    await page
      .getByRole('button', { name: `Delete ${name}`, exact: true })
      .click()
  }
  await expect(page.locator('.unit-card')).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Kid space', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'No units here yet.' }),
  ).toBeVisible()
  await expect(page.getByText('Opening your vocabulary...')).toHaveCount(0)
})

test('Unit 2 installs into an existing library, supports phone review, approval and a complete practice round', async ({
  page,
}) => {
  const saved = {
    ...unit,
    reviewStatus: 'approved',
    entries: [{ ...unit.entries[0], german: 'geben; schenken' }],
  }
  await page.addInitScript((data) => {
    if (!localStorage.getItem('ourlingo.library.v1'))
      localStorage.setItem(
        'ourlingo.library.v1',
        JSON.stringify({ schemaVersion: 1, units: [data] }),
      )
  }, saved)
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 2', exact: true }),
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 1 Unit 2', exact: true })
    .click()
  await expect(page.locator('.vocabulary-row')).toHaveCount(41)
  await expect(page.getByLabel('English entry 1', { exact: true })).toHaveValue(
    'zoo',
  )
  await expect(page.getByLabel('Example entry 2', { exact: true })).toHaveValue(
    "The parrot is blue and yellow. It's beautiful.",
  )
  await page.evaluate(() => document.fonts.ready)
  const clipped = await page
    .locator('.entry-field textarea')
    .evaluateAll((fields) =>
      fields
        .filter((field) => field.scrollHeight > field.clientHeight + 1)
        .map((field) => field.getAttribute('aria-label')),
    )
  expect(clipped).toEqual([])
  await page.screenshot({ path: '/tmp/ourlingo-unit-2-review-phone.png' })
  await page.getByRole('button', { name: 'Save vocabulary' }).click()
  await page.getByRole('button', { name: 'Kid space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 2', exact: true })
    .click()
  await page.getByText('Multiple choice', { exact: true }).click()
  await page.getByLabel('Words per round').selectOption('5')
  await page.getByRole('button', { name: 'Start practice' }).click()
  for (let question = 0; question < 5; question++) {
    const prompt = await page.locator('.question-word').innerText()
    const labels = await page.locator('.answer-choice span').allTextContents()
    const translations = unitTwo.entries
      .filter((entry) => entry.german === prompt)
      .map((entry) => entry.english)
    const correct = labels.filter((text) => translations.includes(text))
    expect(correct).toHaveLength(1)
    expect(
      labels.every((text) =>
        unitTwo.entries.some((entry) => entry.english === text),
      ),
    ).toBe(true)
    await page.getByRole('radio', { name: correct[0], exact: true }).check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByRole('status')).toContainText("That's right!")
    await page
      .getByRole('button', {
        name: question === 4 ? 'See results' : 'Next word',
      })
      .click()
  }
  await expect(page.locator('.score')).toHaveText('5 / 5')
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 2', exact: true }),
  ).toBeEnabled()
  const library = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ourlingo.library.v1')!),
  )
  expect(library.units[0].entries[0].german).toBe('geben; schenken')
  expect(library.units[0].reviewStatus).toBe('approved')
})

for (const state of ['edited', 'empty'] as const) {
  test(`Unit 2 preserves an ${state} existing unit appropriately`, async ({
    page,
  }) => {
    const saved = {
      ...unitTwo,
      title: 'My zoo words',
      entries:
        state === 'edited'
          ? [{ english: 'custom word', german: 'mein Wort', example: null }]
          : [],
      reviewStatus: state === 'edited' ? 'approved' : 'pending',
    }
    await page.addInitScript(
      (data) =>
        localStorage.setItem(
          'ourlingo.library.v1',
          JSON.stringify({ schemaVersion: 1, units: [data] }),
        ),
      saved,
    )
    await page.goto('/')
    await expect(page.getByText('My zoo words', { exact: true })).toBeVisible()
    await page
      .getByRole('button', { name: 'Parent space', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Review MORE! 1 Unit 2', exact: true })
      .click()
    await expect(page.locator('.vocabulary-row')).toHaveCount(
      state === 'edited' ? 1 : 41,
    )
    await expect(
      page.getByLabel('English entry 1', { exact: true }),
    ).toHaveValue(state === 'edited' ? 'custom word' : 'zoo')
    if (state === 'edited')
      await expect(
        page.getByRole('button', { name: 'Save vocabulary', exact: true }),
      ).toBeVisible()
  })
}

test('previously installed bundled units are approved on upgrade', async ({
  page,
}) => {
  const allUnits = [unit, unitTwo, ...moreOneFixtures, ...moreTwoFixtures]
  await page.addInitScript((units) => {
    localStorage.setItem(
      'ourlingo.library.v1',
      JSON.stringify({
        schemaVersion: 1,
        units: units.map((item) => ({ ...item, reviewStatus: 'pending' })),
        bundledUnitKeys: units.map((item) => `${item.book}:${item.unit}`),
      }),
    )
  }, allUnits)
  await page.goto('/')
  await expect(page.locator('.unit-card')).toHaveCount(59)
  for (const bundled of allUnits) {
    await expect(
      page.getByRole('button', {
        name: `Practise ${bundled.book} Unit ${bundled.unit}`,
        exact: true,
      }),
    ).toBeEnabled()
  }
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ourlingo.library.v1')!),
  )
  expect(saved.units.every((item: VocabularyUnit) => item.reviewStatus === 'approved')).toBe(true)
})

test('parent learning report marks a word known after three correct rounds', async ({
  page,
}) => {
  const singleWordUnit = {
    ...unit,
    reviewStatus: 'approved' as const,
    entries: [{ english: 'picture', german: 'Bild', example: null }],
  }
  await page.addInitScript((data) => {
    localStorage.setItem(
      'ourlingo.more-1-unit-1.v1',
      JSON.stringify(data),
    )
  }, singleWordUnit)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  for (let round = 1; round <= 3; round++) {
    if (round === 1)
      await page.getByRole('button', { name: 'Start practice' }).click()
    else await page.getByRole('button', { name: 'Another round' }).click()
    await expect(page.locator('.question-word')).toHaveText('Bild')
    await page.getByLabel('In English', { exact: true }).fill('picture')
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByRole('status')).toContainText("That's right!")
    await page.getByRole('button', { name: 'See results' }).click()
  }
  const savedProgress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ourlingo.learning.v1')!),
  )
  expect(savedProgress.records[0].correctStreak).toBe(3)
  await page.reload()
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page.getByRole('button', { name: 'Learning report', exact: true }).click()
  const report = page.getByRole('region', {
    name: 'MORE! 1 Unit 1 progress',
  })
  await expect(report.getByText('Known (1)', { exact: true })).toBeVisible()
  await expect(report.getByText('Still learning (0)', { exact: true })).toBeVisible()
  await report.getByText('Known (1)', { exact: true }).click()
  await expect(report.getByText('picture', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('an unavailable Unit 2 download leaves saved Unit 1 available', async ({
  page,
}) => {
  await page.addInitScript(
    (data) =>
      localStorage.setItem(
        'ourlingo.library.v1',
        JSON.stringify({ schemaVersion: 1, units: [data] }),
      ),
    { ...unit, reviewStatus: 'approved' },
  )
  await page.route('**/data/more-1-unit-2.json', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText(
    'Unit 2 could not be added',
  )
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true }),
  ).toBeEnabled()
  await expect(page.locator('.unit-card')).toHaveCount(58)
})

for (const fixture of moreOneFixtures) {
  test(`MORE! 1 Unit ${fixture.unit} supports phone review and translation provenance`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/')
    await expect(
      page.getByRole('button', {
        name: `Practise MORE! 1 Unit ${fixture.unit}`,
        exact: true,
      }),
    ).toBeEnabled()
    await page.getByRole('radio', { name: 'MORE! 1', exact: true }).check()
    await expect(page.locator('.unit-card')).toHaveCount(15)
    await page.getByRole('button', { name: 'Parent space', exact: true }).click()
    await page
      .getByRole('button', {
        name: `Review MORE! 1 Unit ${fixture.unit}`,
        exact: true,
      })
      .click()
    await expect(page.locator('.vocabulary-row')).toHaveCount(
      fixture.entries.length,
    )
    const suggestedIndex = fixture.entries.findIndex(
      (entry) => entry.origin === 'word-file',
    )
    const suggested = fixture.entries.filter(
      (entry) => entry.origin === 'word-file',
    ).length
    await expect(
      page.getByText('Suggested translation', { exact: true }),
    ).toHaveCount(suggested)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    if (suggestedIndex >= 0) {
      await page
        .getByLabel(`German entry ${suggestedIndex + 1}`, { exact: true })
        .fill(fixture.entries[suggestedIndex].german.toUpperCase())
      await expect(
        page.getByText('Parent translation', { exact: true }),
      ).toHaveCount(1)
    }
    await page
      .getByRole('button', {
        name: suggested ? 'Save & approve' : 'Save vocabulary',
      })
      .click()
    const saved: VocabularyUnit = await page.evaluate(
      (number) =>
        JSON.parse(localStorage.getItem('ourlingo.library.v1')!).units.find(
          (item: VocabularyUnit) =>
            item.book === 'MORE! 1' && item.unit === number,
        ),
      fixture.unit,
    )
    expect(saved.entries).toHaveLength(fixture.entries.length)
    expect(saved.entries.filter((entry) => entry.origin === 'word-file')).toHaveLength(
      suggested,
    )
    if (suggestedIndex >= 0)
      expect(saved.entries[suggestedIndex].translationSource).toBe('parent')
    await page.getByRole('button', { name: 'Kid space', exact: true }).click()
    await page
      .getByRole('button', {
        name: `Practise MORE! 1 Unit ${fixture.unit}`,
        exact: true,
      })
      .click()
    await page.getByText('Type answer', { exact: true }).click()
    await page.getByRole('button', { name: 'Start practice' }).click()
    await expect(page.locator('.question-word')).toBeVisible()
  })
}

for (const fixture of moreTwoFixtures) {
  test(`MORE! 2 Unit ${fixture.unit} supports phone review, translation provenance and practice`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: fixture.unit === 1 ? 390 : 320,
      height: 900,
    })
    await page.goto('/')
    await expect(
      page.getByRole('button', {
        name: `Practise MORE! 2 Unit ${fixture.unit}`,
        exact: true,
      }),
    ).toBeEnabled()
    await page.getByRole('radio', { name: 'MORE! 2', exact: true }).check()
    await expect(page.locator('.unit-card')).toHaveCount(16)
    await page
      .getByRole('button', { name: 'Parent space', exact: true })
      .click()
    await page
      .getByRole('button', {
        name: `Review MORE! 2 Unit ${fixture.unit}`,
        exact: true,
      })
      .click()
    await expect(page.locator('.vocabulary-row')).toHaveCount(
      fixture.entries.length,
    )
    const suggested = fixture.entries.filter(
      (entry) => entry.origin === 'word-file',
    ).length
    await expect(
      page.getByText('Suggested translation', { exact: true }),
    ).toHaveCount(suggested)
    await page.evaluate(() => document.fonts.ready)
    const clipped = await page
      .locator('.entry-field textarea')
      .evaluateAll((fields) =>
        fields
          .filter((field) => field.scrollHeight > field.clientHeight + 1)
          .map((field) => field.getAttribute('aria-label')),
      )
    expect(clipped).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: `/tmp/ourlingo-more-2-unit-${fixture.unit}-phone.png`,
    })
    const wordFileIndex = fixture.entries.findIndex(
      (entry) => entry.origin === 'word-file',
    )
    if (wordFileIndex >= 0) {
      await page
        .getByLabel(`German entry ${wordFileIndex + 1}`, { exact: true })
        .fill(fixture.entries[wordFileIndex].german.toUpperCase())
      await expect(
        page.getByText('Parent translation', { exact: true }),
      ).toHaveCount(1)
    }
    await page
      .getByRole('button', {
        name: wordFileIndex >= 0 ? 'Save & approve' : 'Save vocabulary',
      })
      .click()
    const active: VocabularyUnit = await page.evaluate(
      (number) =>
        JSON.parse(localStorage.getItem('ourlingo.library.v1')!).units.find(
          (item: VocabularyUnit) =>
            item.book === 'MORE! 2' && item.unit === number,
        ),
      fixture.unit,
    )
    expect(active.entries).toHaveLength(fixture.entries.length)
    expect(
      active.entries.filter((entry) => entry.origin === 'word-file'),
    ).toHaveLength(suggested)
    if (wordFileIndex >= 0)
      expect(active.entries[wordFileIndex].translationSource).toBe('parent')
    await page.getByRole('button', { name: 'Kid space', exact: true }).click()
    await page
      .getByRole('button', {
        name: `Practise MORE! 2 Unit ${fixture.unit}`,
        exact: true,
      })
      .click()
    await page.getByText('Multiple choice', { exact: true }).click()
    await page.getByLabel('Words per round').selectOption('5')
    await page.getByRole('button', { name: 'Start practice' }).click()
    for (let question = 0; question < 5; question++) {
      const prompt = await page.locator('.question-word').innerText()
      const labels = await page.locator('.answer-choice span').allTextContents()
      const correct = labels.filter((text) =>
        active.entries.some(
          (entry) => entry.german === prompt && entry.english === text,
        ),
      )
      expect(correct).toHaveLength(1)
      expect(
        labels.every((text) =>
          active.entries.some((entry) => entry.english === text),
        ),
      ).toBe(true)
      await page.getByRole('radio', { name: correct[0], exact: true }).check()
      await page.getByRole('button', { name: 'Check answer' }).click()
      await expect(page.getByRole('status')).toContainText("That's right!")
      await page
        .getByRole('button', {
          name: question === 4 ? 'See results' : 'Next word',
        })
        .click()
    }
    await expect(page.locator('.score')).toHaveText('5 / 5')
    await page.reload()
    await expect(
      page.getByRole('button', {
        name: `Practise MORE! 2 Unit ${fixture.unit}`,
        exact: true,
      }),
    ).toBeEnabled()
  })
}

test('MORE! 2 additions preserve edited vocabulary and approval in an existing library', async ({
  page,
}) => {
  const edited = {
    ...moreTwoFixtures[0],
    reviewStatus: 'approved',
    entries: [
      {
        english: 'already saved',
        german: 'bereits gespeichert',
        example: null,
      },
    ],
  }
  await page.addInitScript(
    (data) =>
      localStorage.setItem(
        'ourlingo.library.v1',
        JSON.stringify({ schemaVersion: 1, units: data }),
      ),
    [unit, edited],
  )
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 2 Unit 1', exact: true }),
  ).toBeEnabled()
  await expect(page.locator('.unit-card')).toHaveCount(59)
  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 2 Unit 1', exact: true })
    .click()
  await expect(page.locator('.vocabulary-row')).toHaveCount(1)
  await expect(page.getByLabel('English entry 1', { exact: true })).toHaveValue(
    'already saved',
  )
})

test('matching pairs supports either-side selection, mismatch recovery, stable positions, scores and retries', async ({
  page,
}) => {
  await openReview(page)
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByText('Matching pairs', { exact: true }).click()
  await expect(page.getByLabel('Words per round')).toHaveCount(0)
  await page.getByRole('button', { name: 'Start practice' }).click()
  const englishGroup = page.getByRole('group', {
    name: 'English matching words',
  })
  const germanGroup = page.getByRole('group', { name: 'German matching words' })
  await expect(englishGroup.getByRole('button')).toHaveCount(5)
  await expect(germanGroup.getByRole('button')).toHaveCount(5)
  await expect(englishGroup.getByRole('button').first()).toBeFocused()
  const english = await englishGroup
    .locator('.matching-tile > span:first-child')
    .allTextContents()
  const german = await germanGroup
    .locator('.matching-tile > span:first-child')
    .allTextContents()
  const words = english.map((text) =>
    unit.entries.find((entry) => entry.english === text)!,
  )
  expect(german).not.toEqual(words.map((entry) => entry.german))
  const first = page.getByRole('button', {
    name: `English: ${words[0].english}`,
    exact: true,
  })
  await first.press('Enter')
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await first.click()
  await expect(page.locator('.matching-tile.selected')).toHaveCount(0)
  await first.click()
  await page
    .getByRole('button', { name: `English: ${words[1].english}`, exact: true })
    .click()
  await expect(page.locator('.matching-tile.selected')).toHaveCount(1)
  await first.click()
  await page
    .getByRole('button', { name: `Deutsch: ${words[1].german}`, exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Not a match')
  await expect(page.locator('.matching-tile.incorrect')).toHaveCount(2)
  await expect(page.locator('.matching-tile:disabled')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Next board', exact: true }),
  ).toBeDisabled()
  expect(
    await englishGroup
      .locator('.matching-tile > span:first-child')
      .allTextContents(),
  ).toEqual(english)
  expect(
    await germanGroup
      .locator('.matching-tile > span:first-child')
      .allTextContents(),
  ).toEqual(german)
  await page
    .getByRole('button', { name: `Deutsch: ${words[0].german}`, exact: true })
    .click()
  await first.click()
  await expect(
    page.getByRole('button', {
      name: `English: ${words[0].english} (matched)`,
      exact: true,
    }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', {
      name: `Deutsch: ${words[0].german} (matched)`,
      exact: true,
    }),
  ).toBeDisabled()
  await expect(
    page.getByRole('progressbar', { name: 'Matching progress' }),
  ).toHaveAttribute('value', '1')
  for (const entry of words.slice(1)) {
    await page
      .getByRole('button', { name: `English: ${entry.english}`, exact: true })
      .click()
    await page
      .getByRole('button', { name: `Deutsch: ${entry.german}`, exact: true })
      .click()
  }
  await expect(page.getByRole('status')).toContainText('Board complete')
  await expect(page.locator('.matching-tile:disabled')).toHaveCount(10)
  const seen = new Set(english)
  for (const board of [2, 3]) {
    await page.getByRole('button', { name: 'Next board', exact: true }).click()
    await expect(
      page.getByText(`Matching pairs - Board ${board} of 3`, { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('progressbar', { name: 'Matching progress' }),
    ).toHaveAttribute('value', String((board - 1) * 5))
    const boardWords = await englishGroup
      .locator('.matching-tile > span:first-child')
      .allTextContents()
    expect(boardWords).toHaveLength(5)
    for (const text of boardWords) {
      expect(seen.has(text)).toBe(false)
      seen.add(text)
    }
    await completeMatchingBoard(page, unit.entries)
  }
  await expect(page.getByRole('status')).toContainText('All boards complete')
  await page.getByRole('button', { name: 'See results', exact: true }).click()
  await expect(page.locator('.score')).toHaveText('14 / 15')
  await expect(
    page.getByText('first-try matches', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Retry missed words' }).click()
  await expect(
    page.getByRole('button', {
      name: `English: ${words[0].english}`,
      exact: true,
    }),
  ).toBeVisible()
  const retryWords = await englishGroup
    .locator('.matching-tile > span:first-child')
    .allTextContents()
  expect(retryWords).toHaveLength(5)
  await expect(
    page.getByText('Matching pairs - Board 1 of 1', { exact: true }),
  ).toBeVisible()
  await completeMatchingBoard(page, unit.entries)
  await page.getByRole('button', { name: 'See results', exact: true }).click()
  await expect(page.locator('.score')).toHaveText('5 / 5')
})

test('small matching units use fewer pairs and ambiguous translations do not appear together', async ({
  page,
}) => {
  const pairs = [
    { english: 'she', german: 'sie', example: null },
    { english: 'they', german: 'sie', example: null },
    { english: 'book', german: 'Buch', example: null },
  ]
  await page.addInitScript(
    (data) =>
      localStorage.setItem('ourlingo.more-1-unit-1.v1', JSON.stringify(data)),
    { ...unit, reviewStatus: 'approved', entries: pairs },
  )
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  await page.getByText('Matching pairs', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.locator('.matching-tile')).toHaveCount(4)
  const english = await page
    .getByRole('group', { name: 'English matching words' })
    .locator('.matching-tile > span:first-child')
    .allTextContents()
  expect(
    english.filter((text) => text === 'she' || text === 'they'),
  ).toHaveLength(1)
  for (const text of english) {
    const entry = pairs.find((item) => item.english === text)!
    await page
      .getByRole('button', { name: `English: ${text}`, exact: true })
      .click()
    await page
      .getByRole('button', { name: `Deutsch: ${entry.german}`, exact: true })
      .click()
  }
  await expect(page.getByRole('status')).toContainText('All boards complete')
  await expect(
    page.getByText('Matching pairs - Board 1 of 1', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'See results', exact: true }).click()
  await expect(page.locator('.score')).toHaveText('2 / 2')
})

test('a single pair cannot start matching but typed answers remain available', async ({
  page,
}) => {
  await page.addInitScript(
    (data) =>
      localStorage.setItem('ourlingo.more-1-unit-1.v1', JSON.stringify(data)),
    { ...unit, reviewStatus: 'approved', entries: unit.entries.slice(0, 1) },
  )
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  await page.getByText('Matching pairs', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'at least two distinct translations',
  )
  await expect(page.locator('.matching-board')).toHaveCount(0)
  await page.getByText('Type answer', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByLabel('In English', { exact: true })).toBeVisible()
})

test('five short matching pairs are visible together on a phone without shrinking the text', async ({
  page,
}) => {
  const pairs = [
    { english: 'book', german: 'Buch', example: null },
    { english: 'pen', german: 'Stift', example: null },
    { english: 'house', german: 'Haus', example: null },
    { english: 'tree', german: 'Baum', example: null },
    { english: 'sun', german: 'Sonne', example: null },
  ]
  await page.addInitScript(
    (data) =>
      localStorage.setItem('ourlingo.more-1-unit-1.v1', JSON.stringify(data)),
    { ...unit, reviewStatus: 'approved', entries: pairs },
  )
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  await page.getByText('Matching pairs', { exact: true }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.locator('.matching-tile')).toHaveCount(10)
  await expect(page.locator('.matching-tile').first()).toHaveCSS(
    'font-size',
    '16px',
  )
  const lastTile = await page.locator('.matching-tile').last().boundingBox()
  expect(lastTile).toBeTruthy()
  expect(lastTile!.y + lastTile!.height).toBeLessThanOrEqual(844)
  await page.screenshot({
    path: '/tmp/ourlingo-matching-five-visible-phone.png',
  })
})

for (const width of [1440, 768, 390, 320]) {
  test(`review and practice fit the ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(
      page.getByRole('region', { name: 'Kid space', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({ path: `/tmp/ourlingo-kid-library-${width}.png` })
    await page
      .getByRole('button', { name: 'Parent space', exact: true })
      .click()
    await page.getByRole('button', { name: 'Add unit', exact: true }).click()
    await expect(page.getByLabel('Unit number', { exact: true })).toBeVisible()
    const cardBounds = await page.locator('.unit-card').first().boundingBox()
    const deleteBounds = await page
      .getByRole('button', { name: 'Delete MORE! 1 Unit 1', exact: true })
      .boundingBox()
    expect(cardBounds).toBeTruthy()
    expect(deleteBounds).toBeTruthy()
    expect(deleteBounds!.x).toBeGreaterThanOrEqual(cardBounds!.x)
    expect(deleteBounds!.y).toBeGreaterThanOrEqual(cardBounds!.y)
    expect(deleteBounds!.x + deleteBounds!.width).toBeLessThanOrEqual(
      cardBounds!.x + cardBounds!.width,
    )
    expect(deleteBounds!.y + deleteBounds!.height).toBeLessThanOrEqual(
      cardBounds!.y + cardBounds!.height,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({ path: `/tmp/ourlingo-parent-library-${width}.png` })
    await page
      .getByRole('button', { name: 'Cancel new unit', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Review MORE! 1 Unit 1', exact: true })
      .click()
    await expect(page.locator('.vocabulary-row')).toHaveCount(42)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.getByLabel('English entry 1', { exact: true })).toHaveCSS(
      'font-size',
      '16px',
    )
    await expect(page.getByLabel('German entry 1', { exact: true })).toHaveCSS(
      'font-size',
      '16px',
    )
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
    await page.getByRole('button', { name: 'Save vocabulary' }).click()
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByRole('button', { name: 'Start practice' }).click()
    await expect(page.getByLabel('In English', { exact: true })).toBeVisible()
    await expect(page.getByLabel('In English', { exact: true })).toHaveCSS(
      'font-size',
      '20px',
    )
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
    await expect(page.locator('.answer-choice').first()).toHaveCSS(
      'font-size',
      '18px',
    )
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
    page.once('dialog', (dialog) => dialog.accept())
    await page
      .getByRole('button', { name: 'Back to practice', exact: true })
      .click()
    await page.getByText('Matching pairs', { exact: true }).click()
    await page.getByRole('button', { name: 'Start practice' }).click()
    await expect(page.locator('.matching-tile')).toHaveCount(10)
    await expect(
      page
        .getByRole('group', { name: 'English matching words' })
        .getByRole('button'),
    ).toHaveCount(5)
    await expect(
      page
        .getByRole('group', { name: 'German matching words' })
        .getByRole('button'),
    ).toHaveCount(5)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    expect(
      await page
        .locator('.matching-tile')
        .evaluateAll((tiles) =>
          tiles.every(
            (tile) =>
              tile.scrollWidth <= tile.clientWidth &&
              tile.scrollHeight <= tile.clientHeight,
          ),
        ),
    ).toBe(true)
    await page.screenshot({ path: `/tmp/ourlingo-matching-${width}.png` })
  })
}

test('follows the system dark theme without clipping the phone layout', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('region', { name: 'Kid space', exact: true }),
  ).toBeVisible()
  const colors = await page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    page: getComputedStyle(document.documentElement).backgroundColor,
    card: getComputedStyle(document.querySelector('.unit-card')!).backgroundColor,
    text: getComputedStyle(document.querySelector('.unit-card h2')!).color,
  }))
  expect(colors.scheme).toContain('dark')
  expect(colors.page).toBe('rgb(20, 26, 22)')
  expect(colors.card).toBe('rgb(29, 41, 35)')
  expect(colors.text).toBe('rgb(227, 236, 230)')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('settings choose a theme and preferred books that persist after reload', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const unitCards = page.locator('.unit-card')
  await expect(unitCards).toHaveCount(59)
  const theme = () =>
    page.evaluate(() => ({
      name: document.documentElement.dataset.theme,
      page: getComputedStyle(document.documentElement).backgroundColor,
    }))
  expect(await theme()).toEqual({ name: 'light', page: 'rgb(247, 249, 248)' })

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('radio', { name: 'Dark', exact: true }).check()
  expect(await theme()).toEqual({ name: 'dark', page: 'rgb(20, 26, 22)' })

  const moreOne = page.getByRole('checkbox', { name: 'MORE! 1' })
  const moreTwo = page.getByRole('checkbox', { name: 'MORE! 2' })
  await moreOne.uncheck()
  await page.getByRole('checkbox', { name: 'MORE! 3' }).uncheck()
  await page.getByRole('checkbox', { name: 'MORE! 4' }).uncheck()
  await expect(moreTwo).toBeChecked()
  await expect(moreTwo).toBeDisabled()

  await page.reload()
  expect(await theme()).toEqual({ name: 'dark', page: 'rgb(20, 26, 22)' })
  await expect(page.getByText('MORE! 2 · English / Deutsch')).toBeVisible()
  await expect(unitCards).toHaveCount(16)
  await expect(page.getByRole('group', { name: 'Filter by book' })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await moreOne.check()
  await page.getByRole('radio', { name: 'System', exact: true }).check()
  expect(await theme()).toEqual({ name: 'light', page: 'rgb(247, 249, 248)' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect.poll(async () => (await theme()).name).toBe('dark')
  await page.getByRole('button', { name: 'My units', exact: false }).click()
  await expect(unitCards).toHaveCount(31)
})

test('completed + next shows finished units for revision and unlocks the next unit in kid space only', async ({
  page,
}) => {
  await page.addInitScript(
    ({ entries }) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(
        'ourlingo.settings.v1',
        JSON.stringify({
          schemaVersion: 1,
          theme: 'system',
          books: ['MORE! 1'],
          knownBooks: ['MORE! 1', 'MORE! 2', 'MORE! 3', 'MORE! 4'],
          progression: 'completed-and-next',
        }),
      )
      localStorage.setItem(
        'ourlingo.learning.v1',
        JSON.stringify({
          schemaVersion: 1,
          records: entries.map((entry) => ({
            book: 'MORE! 1',
            unit: 1,
            english: entry.english,
            german: entry.german,
            correctAttempts: 3,
            incorrectAttempts: 0,
            correctStreak: 3,
            lastPracticedAt: '2026-10-18T10:00:00.000Z',
          })),
        }),
      )
    },
    { entries: unit.entries },
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const unitCards = page.locator('.unit-card:not(.locked)')
  await expect(unitCards).toHaveCount(2)
  const unitOne = unitCards.filter({ hasText: 'Unit 1' })
  await expect(unitOne.getByText('Completed', { exact: true })).toBeVisible()
  await expect(
    unitCards.filter({ hasText: 'Unit 2' }).getByText('Up next', { exact: true }),
  ).toBeVisible()
  const locked = page.getByRole('article', { name: 'MORE! 1 Unit 3 locked' })
  await expect(locked).toContainText('Complete Unit 2 to unlock')
  await expect(page.locator('.unit-card.locked')).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 1 Unit 2', exact: true }),
  ).toBeEnabled()
  await expect(page.getByText('to complete it and unlock the next unit')).toBeVisible()

  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await expect(unitCards).toHaveCount(15)
  await page.getByRole('button', { name: 'Kid space', exact: true }).click()
  await expect(unitCards).toHaveCount(2)

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('radio', { name: 'All units', exact: true }).check()
  await page.getByRole('button', { name: 'My units', exact: false }).click()
  await expect(unitCards).toHaveCount(15)
  await expect(page.getByText('to complete it and unlock the next unit')).toHaveCount(0)
  await expect(page.locator('.unit-card.locked')).toHaveCount(0)
  await page.reload()
  await expect(unitCards).toHaveCount(15)
})

test('description practice asks for the English word in typed, multiple choice and matching modes', async ({
  page,
}) => {
  const unitThree = moreOneFixtures.find((fixture) => fixture.unit === 3)!
  const byDescription = new Map(
    unitThree.entries.map((entry) => [entry.description, entry]),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 3', exact: true })
    .click()

  await page.getByText('Type answer', { exact: true }).click()
  await page.getByRole('radio', { name: 'Description → English', exact: true }).check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByText('DESCRIPTION', { exact: true })).toBeVisible()
  const typed = byDescription.get(
    (await page.locator('.question-word').textContent())!,
  )!
  expect(typed).toBeTruthy()
  await page.getByLabel('In English', { exact: true }).fill(typed.english.split(/[;,]/)[0])
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText("That's right!")).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Back to practice' }).click()

  await page.getByText('Multiple choice', { exact: true }).click()
  await expect(
    page.getByRole('radio', { name: 'Description → English', exact: true }),
  ).toBeChecked()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const chosen = byDescription.get(
    (await page.locator('.question-word').textContent())!,
  )!
  const choices = page.getByRole('group', { name: 'Answer in English' })
  await expect(choices.getByRole('radio')).toHaveCount(4)
  await choices.getByText(chosen.english, { exact: true }).click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText("That's right!")).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Back to practice' }).click()

  await page.getByText('Matching pairs', { exact: true }).click()
  await page.getByRole('radio', { name: 'English + Description', exact: true }).check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const clues = page.getByRole('group', { name: 'Description matching clues' })
  await expect(clues.getByRole('button')).toHaveCount(5)
  const clue = clues.getByRole('button').first()
  const clueText = (await clue.locator('span').first().textContent())!
  const pair = byDescription.get(clueText)!
  await page
    .getByRole('group', { name: 'English matching words' })
    .getByRole('button', { name: `English: ${pair.english}`, exact: true })
    .click()
  await clue.click()
  await expect(page.getByText("That's a pair!")).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('saved libraries receive suggested descriptions without replacing cleared ones', async ({
  page,
}) => {
  await page.addInitScript(
    (data) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(
        'ourlingo.library.v1',
        JSON.stringify({
          schemaVersion: 1,
          bundledUnitKeys: ['MORE! 1:1'],
          units: [data],
        }),
      )
    },
    {
      ...unit,
      reviewStatus: 'approved',
      entries: unit.entries.map(
        ({ description: _description, descriptionSource: _source, ...entry }, index) =>
          index === 0
            ? { ...entry, description: '', descriptionSource: 'parent' }
            : entry,
      ),
    },
  )
  await page.goto('/')
  await expect(page.locator('.unit-card')).toHaveCount(59)
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('ourlingo.library.v1')!).units.find(
        (item: VocabularyUnit) => item.book === 'MORE! 1' && item.unit === 1,
      ) as VocabularyUnit,
  )
  expect(saved.entries[0].description).toBe('')
  expect(saved.entries[0].descriptionSource).toBe('parent')
  expect(saved.entries[1].description).toBe(unit.entries[1].description)
  expect(saved.entries[1].descriptionSource).toBe('suggested')

  await page.getByRole('button', { name: 'Parent space', exact: true }).click()
  await page
    .getByRole('button', { name: 'Review MORE! 1 Unit 1', exact: true })
    .click()
  await expect(
    page.getByText('Suggested description', { exact: true }),
  ).toHaveCount(unit.entries.length - 1)
  await page
    .getByLabel('Description entry 2', { exact: true })
    .fill('A clue written by a parent')
  await expect(
    page.getByText('Suggested description', { exact: true }),
  ).toHaveCount(unit.entries.length - 2)
  await page.getByRole('button', { name: 'Save & approve' }).click()
  await expect(page.getByRole('status')).toContainText('approved and saved')
  await page.reload()
  const edited = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('ourlingo.library.v1')!).units.find(
        (item: VocabularyUnit) => item.book === 'MORE! 1' && item.unit === 1,
      ) as VocabularyUnit,
  )
  expect(edited.entries[1].description).toBe('A clue written by a parent')
  expect(edited.entries[1].descriptionSource).toBe('parent')
})

test('practice setup shows unit progress, keeps Start visible on a phone and leads back to the units', async ({
  page,
}) => {
  await page.addInitScript(
    ({ entries }) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(
        'ourlingo.learning.v1',
        JSON.stringify({
          schemaVersion: 1,
          records: entries.map((entry, index) => ({
            book: 'MORE! 1',
            unit: 1,
            english: entry.english,
            german: entry.german,
            correctAttempts: index < 3 ? 3 : 1,
            incorrectAttempts: index < 3 ? 0 : 2,
            correctStreak: index < 3 ? 3 : 0,
            lastPracticedAt: new Date().toISOString(),
          })),
        }),
      )
    },
    { entries: unit.entries.slice(0, 5) },
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const card = page.locator('.unit-card').first()
  await expect(card.getByText(`3 of ${unit.entries.length} known`)).toBeVisible()
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  const stats = page.getByRole('group', { name: 'Your progress in this unit' })
  await expect(stats.locator('.known strong')).toHaveText('3')
  await expect(stats.locator('.learning strong')).toHaveText('2')
  await expect(stats.locator('.not-tried strong')).toHaveText(
    String(unit.entries.length - 5),
  )
  await expect(stats).toContainText('11 correct')
  await expect(stats).toContainText('4 wrong')
  await expect(stats).toContainText('Last practised today')
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeInViewport()
  await page.getByRole('button', { name: 'My units', exact: true }).last().click()
  await expect(page.locator('.unit-card')).toHaveCount(59)
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  await expect(page.getByRole('navigation', { name: 'Unit navigation' })).toBeHidden()
  await expect(page.locator('.topbar')).toBeHidden()
  const crumb = page.getByLabel('Current unit')
  await expect(crumb).toContainText('MORE! 1')
  await expect(crumb).toContainText('Unit 1')
  await crumb.getByRole('button', { name: 'MORE! 1' }).click()
  await expect(page.locator('.unit-card')).toHaveCount(59)
  await expect(page.getByRole('navigation', { name: 'Unit navigation' })).toBeVisible()
})

test('first start asks for the book, mentions Settings and defaults to completed + next', { tag: '@first-start' }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const welcome = page.getByRole('dialog', { name: 'Welcome to OurLingo!' })
  await expect(welcome).toBeVisible()
  await expect(welcome).toContainText('You can change this later in Settings.')
  const start = welcome.getByRole('button', { name: "Let's start" })
  await expect(start).toBeDisabled()
  await welcome.getByRole('checkbox', { name: 'MORE! 2' }).check()
  await expect(start).toBeEnabled()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await start.click()
  await expect(welcome).toHaveCount(0)
  await expect(page.getByText('MORE! 2 · English / Deutsch')).toBeVisible()
  await expect(page.locator('.unit-card:not(.locked)')).toHaveCount(2)
  await expect(
    page.getByRole('article', { name: 'MORE! 2 Unit 2 locked' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 2 Unit 1', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Practise MORE! 2 Irregular Verbs', exact: true }),
  ).toBeVisible()

  await page.reload()
  await expect(page.locator('.unit-card:not(.locked)')).toHaveCount(2)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(
    page.getByRole('radio', { name: 'Completed + next', exact: true }),
  ).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'MORE! 2' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'MORE! 1' })).not.toBeChecked()
})

test('the button to go on stays visible on a phone during long description boards', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 2 Unit 1', exact: true })
    .click()
  await page.getByText('Matching pairs', { exact: true }).click()
  await page
    .getByRole('radio', { name: 'English + Description', exact: true })
    .check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const next = page.getByRole('button', { name: 'Next board', exact: true })
  await expect(next).toBeInViewport()
  await expect(next).toHaveCSS('opacity', '1')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Back to practice' }).click()
  await page.getByText('Multiple choice', { exact: true }).click()
  await page
    .getByRole('radio', { name: 'Description → English', exact: true })
    .check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(
    page.getByRole('button', { name: 'Check answer', exact: true }),
  ).toBeInViewport()
})

test('the app only loads its own files and contacts no other servers', async ({
  page,
}) => {
  const external: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:')
      external.push(request.url())
  })
  await page.goto('/')
  await expect(page.locator('.unit-card')).toHaveCount(59)
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.locator('.question-word')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  expect(external).toEqual([])
  expect(
    await page.evaluate(() => document.fonts.check('16px "DM Sans Variable"')),
  ).toBe(true)
})

test('on a tablet held sideways the practice buttons stay visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Practise MORE! 2 Unit 1', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'A little practice' })).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeInViewport()
  await page.getByText('Matching pairs', { exact: true }).click()
  await page
    .getByRole('radio', { name: 'English + Description', exact: true })
    .check()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(
    page.getByRole('button', { name: 'Next board', exact: true }),
  ).toBeInViewport()
})

// All words of MORE! 1 Unit 1 are known except the last one, which needs one
// more correct answer.
async function seedAlmostCompletedUnit(page: Page) {
  await page.addInitScript(
    ({ entries }) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem(
        'ourlingo.settings.v1',
        JSON.stringify({
          schemaVersion: 1,
          theme: 'system',
          books: ['MORE! 1'],
          knownBooks: ['MORE! 1', 'MORE! 2', 'MORE! 3', 'MORE! 4'],
          progression: 'completed-and-next',
        }),
      )
      localStorage.setItem(
        'ourlingo.learning.v1',
        JSON.stringify({
          schemaVersion: 1,
          records: entries.map((entry, index) => ({
            book: 'MORE! 1',
            unit: 1,
            english: entry.english,
            german: entry.german,
            correctAttempts: 3,
            incorrectAttempts: 0,
            correctStreak: index === entries.length - 1 ? 2 : 3,
            lastPracticedAt: '2026-10-18T10:00:00.000Z',
          })),
        }),
      )
    },
    { entries: unit.entries },
  )
}

test('the last missing word comes first, completes the unit and unlocks the next one', async ({
  page,
}) => {
  await seedAlmostCompletedUnit(page)
  const lastWord = unit.entries[unit.entries.length - 1]
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/')
  await expect(page.locator('.trophy-strip')).toContainText('0 days')
  await page
    .getByRole('button', { name: 'Practise MORE! 1 Unit 1', exact: true })
    .click()
  await expect(page.locator('.unit-goal')).toContainText('1 word to go.')
  await expect(page.locator('.unit-goal')).toContainText('3 times in a row')
  await page.getByText('Type answer', { exact: true }).click()
  await page.getByRole('radio', { name: 'Deutsch → English', exact: true }).check()
  await page.getByLabel('Words per round').selectOption('5')
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.locator('.question-word')).toHaveText(lastWord.german)
  for (let question = 0; question < 5; question += 1) {
    const german = await page.locator('.question-word').textContent()
    const entry = unit.entries.find((item) => item.german === german)!
    await page
      .getByLabel('In English', { exact: true })
      .fill(entry.english.split(/[;,]/)[0].replace(/\([^)]*\)/g, '').trim())
    await page.getByRole('button', { name: 'Check answer' }).click()
    await page.getByRole('button', { name: /Next word|See results/ }).click()
  }
  await expect(page.getByText('Unit 1 completed!')).toBeVisible()
  await expect(page.getByText('MORE! 1 Unit 2 is unlocked.')).toBeVisible()
  await expect(page.getByLabel('Words you now know')).toContainText(
    lastWord.english,
  )
  // Badges reached earlier (10 known words) are saved without an announcement.
  await expect(page.locator('.new-badge')).toHaveText([
    /First steps/,
    /Perfect!/,
    /Unit done!/,
  ])
  const activity = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ourlingo.activity.v1')!),
  )
  expect(activity.rounds).toBe(1)
  expect(activity.days[0].learned.map((word: { english: string }) => word.english)).toEqual([
    lastWord.english,
  ])
  expect(Object.keys(activity.badges)).toEqual(
    expect.arrayContaining(['first-round', 'perfect-round', 'units-1', 'words-10']),
  )

  await page.getByRole('button', { name: 'Start Unit 2' }).click()
  await expect(page.getByText('MORE! 1 · Unit 2 · ', { exact: false })).toBeVisible()
  await expect(page.locator('.unit-goal')).toContainText(
    `${unitTwo.entries.length} words to go.`,
  )
  await page.getByRole('button', { name: 'My units', exact: true }).click()
  await expect(
    page.getByRole('article', { name: 'MORE! 1 Unit 3 locked' }),
  ).toContainText('Complete Unit 2 to unlock')
  await expect(page.locator('.trophy-strip')).toContainText('1 day')
})

test('trophies show the streak, recently learned words and badges', async ({
  page,
}) => {
  await seedAlmostCompletedUnit(page)
  await page.addInitScript(() => {
    const date = (daysAgo: number) => {
      const day = new Date()
      day.setDate(day.getDate() - daysAgo)
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    }
    if (localStorage.getItem('ourlingo.activity.v1')) return
    localStorage.setItem(
      'ourlingo.activity.v1',
      JSON.stringify({
        schemaVersion: 1,
        rounds: 4,
        perfectRounds: 0,
        modes: ['typed'],
        bestStreak: 3,
        badges: { 'first-round': date(3) },
        days: [3, 2, 1].map((daysAgo) => ({
          date: date(daysAgo),
          rounds: 1,
          answers: 10,
          correct: 7,
          learned:
            daysAgo === 1
              ? [{ book: 'MORE! 1', unit: 1, english: 'pencil case', german: 'Federpennal' }]
              : [],
        })),
      }),
    )
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('.trophy-strip').click()
  await expect(page.getByRole('heading', { name: 'My trophies' })).toBeVisible()
  await expect(page.locator('.streak-card')).toContainText('3 days in a row')
  await expect(page.locator('.streak-card')).toContainText(
    'Practise today to keep your streak going!',
  )
  await expect(page.getByRole('list', { name: 'Last 7 days' }).locator('.practised')).toHaveCount(3)
  const recent = page.getByRole('region', { name: 'Learned recently' })
  await expect(recent).toContainText('Yesterday')
  await expect(recent).toContainText('pencil case')
  const badgeList = page.getByRole('region', { name: 'Badges' })
  // Earned from saved progress: first round, 3-day streak and 10 known words.
  await expect(badgeList.locator('li.earned')).toHaveCount(3)
  await expect(badgeList.getByRole('listitem', { name: /^Word collector/ })).toHaveAccessibleName(
    /Not earned yet, \d+ of 50/,
  )
  await expect(badgeList.getByText('MORE! 1 master')).toBeVisible()
  await expect(badgeList.getByText('MORE! 2 master')).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Trophies', exact: true }).click()
  await expect(page.locator('.streak-card')).toContainText('3 days in a row')
})
