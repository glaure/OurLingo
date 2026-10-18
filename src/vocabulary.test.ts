import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  acceptedAnswers,
  answerSide,
  bundledUnitFiles,
  createAnswerChoices,
  createMatchingBoards,
  createMatchingRound,
  createRound,
  isCorrectAnswer,
  isCorrectPracticeAnswer,
  isLearningProgress,
  isUnitCompleted,
  isVocabularyLibrary,
  isVocabularyUnit,
  learningProgressStorageKey,
  mergeBundledUnits,
  practiceEntries,
  progressionUnits,
  promptText,
  unitKey,
  unitLabel,
  updateLearningProgress,
  upsertUnit,
  validateEntries,
  withSuggestedDescriptions,
} from './vocabulary.ts'
import type { Entry, LearningProgress, VocabularyUnit } from './vocabulary.ts'

const unit: unknown = JSON.parse(
  readFileSync(
    new URL('../public/data/more-1-unit-1.json', import.meta.url),
    'utf8',
  ),
)
assert.ok(isVocabularyUnit(unit))

const unitTwo: unknown = JSON.parse(
  readFileSync(
    new URL('../public/data/more-1-unit-2.json', import.meta.url),
    'utf8',
  ),
)
assert.ok(isVocabularyUnit(unitTwo))

test('MORE! 2 irregular verbs preserve forms and special identity across library and progress saves', () => {
  const verbs: unknown = JSON.parse(readFileSync(
    new URL('../public/data/more-2-irregular-verbs.json', import.meta.url), 'utf8',
  ))
  assert.ok(isVocabularyUnit(verbs))
  assert.equal(verbs.entries.length, 59)
  assert.equal(validateEntries(verbs.entries), null)
  assert.equal(unitKey(verbs), 'MORE! 2:irregular-verbs')
  assert.equal(unitLabel(verbs), 'Irregular Verbs')
  assert.equal(isVocabularyUnit({ ...verbs, book: 'MORE! 1' }), false)
  assert.equal(isVocabularyUnit({ ...verbs, unit: 'other' }), false)
  assert.ok(verbs.entries.every((entry) => entry.example === null && entry.english.split(' - ').length === 3))
  assert.deepEqual(verbs.entries[0], { english: 'be - was/were - been', german: 'sein', example: null })
  assert.ok(verbs.entries.some((entry) => entry.english === 'read - read - read' && entry.german === 'lesen'))
  const numeric = { ...unitTwo, book: 'MORE! 2' as const, unit: 16 }
  const merged = mergeBundledUnits({ schemaVersion: 1, units: [numeric] }, [verbs])
  assert.deepEqual(merged.units.map((item) => item.unit), [16, 'irregular-verbs'])
  assert.ok(isVocabularyLibrary(JSON.parse(JSON.stringify(merged))))
  const edited = { ...verbs, entries: [{ ...verbs.entries[0], german: 'parent edit' }] }
  assert.deepEqual(mergeBundledUnits(upsertUnit(merged, edited), [verbs]).units[1], edited)
  assert.equal(mergeBundledUnits({ ...merged, units: [numeric] }, [verbs]).units.length, 1)
  const progress = updateLearningProgress({ schemaVersion: 1, records: [] }, verbs,
    [{ ...verbs.entries[0], correct: true }], '2026-10-13T12:00:00Z')
  assert.ok(isLearningProgress(JSON.parse(JSON.stringify(progress))))
  assert.equal(isLearningProgress({ ...progress, records: [{ ...progress.records[0], book: 'MORE! 1' }] }), false)
})

const moreOneNewUnits = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((number) => {
  const data: unknown = JSON.parse(
    readFileSync(
      new URL(`../public/data/more-1-unit-${number}.json`, import.meta.url),
      'utf8',
    ),
  )
  assert.ok(isVocabularyUnit(data))
  return data
})

test('Unit 2 transcription has 41 entries, 37 examples, and the correct book and review status', () => {
  assert.equal(unitTwo.book, 'MORE! 1')
  assert.equal(unitTwo.unit, 2)
  assert.equal(unitTwo.reviewStatus, 'approved')
  assert.equal(unitTwo.entries.length, 41)
  assert.equal(unitTwo.entries.filter((entry) => entry.example).length, 37)
  assert.equal(validateEntries(unitTwo.entries), null)
  for (const direction of ['english', 'german'] as const) {
    for (const entry of unitTwo.entries) {
      const choices = createAnswerChoices(entry, unitTwo.entries, direction)
      assert.equal(choices.length, 4)
      assert.equal(choices.filter((choice) => choice.correct).length, 1)
    }
  }
})

test('Unit 2 shorthand accepts contractions, gender forms and context-specific translations', () => {
  const there = unitTwo.entries.find(
    (entry) => entry.english === "there is (there's)",
  )!
  assert.equal(isCorrectAnswer(there, "there's", 'english'), true)
  assert.equal(isCorrectAnswer(there, 'there is', 'english'), true)
  const adult = unitTwo.entries.find((entry) => entry.english === 'adult')!
  assert.equal(isCorrectAnswer(adult, 'Erwachsene', 'german'), true)
  assert.equal(isCorrectAnswer(adult, 'Erwachsener', 'german'), true)
  assert.equal(isCorrectAnswer(adult, 'r', 'german'), false)
  const guide = unitTwo.entries.find((entry) => entry.english === 'guide')!
  for (const answer of ['Führer', 'Führerin', 'Reiseführer', 'Reiseführerin'])
    assert.equal(isCorrectAnswer(guide, answer, 'german'), true)
  assert.equal(isCorrectAnswer(guide, 'in', 'german'), false)
  const at = unitTwo.entries.find((entry) => entry.english === 'at')!
  assert.equal(isCorrectAnswer(at, 'in', 'german'), true)
})

test('new bundled units preserve edits and approvals and do not return after deletion', () => {
  const saved = {
    ...unit,
    reviewStatus: 'approved' as const,
    entries: [{ ...unit.entries[0], german: 'geben; schenken' }],
  }
  const merged = mergeBundledUnits({ schemaVersion: 1, units: [saved] }, [
    unitTwo,
  ])
  assert.ok(isVocabularyLibrary(merged))
  assert.equal(merged.units.length, 2)
  assert.equal(merged.units[0], saved)
  assert.equal(merged.units[1].entries.length, 41)
  const deleted = { ...merged, units: [saved] }
  assert.equal(mergeBundledUnits(deleted, [unitTwo]).units.length, 1)
  assert.deepEqual(
    upsertUnit(merged, saved).bundledUnitKeys,
    merged.bundledUnitKeys,
  )
})

test('empty drafts get the transcription but populated Unit 2 is never overwritten', () => {
  const draft = {
    ...unitTwo,
    title: 'My zoo words',
    reviewStatus: 'pending' as const,
    entries: [],
  }
  const installed = mergeBundledUnits({ schemaVersion: 1, units: [draft] }, [
    unitTwo,
  ])
  assert.equal(installed.units[0].title, 'My zoo words')
  assert.equal(installed.units[0].entries.length, 41)
  assert.equal(installed.units[0].reviewStatus, 'approved')
  const edited = {
    ...unitTwo,
    reviewStatus: 'approved' as const,
    entries: [{ english: 'hello', german: 'hallo', example: null }],
  }
  const kept = mergeBundledUnits({ schemaVersion: 1, units: [edited] }, [
    unitTwo,
  ])
  assert.equal(kept.units[0], edited)
  assert.equal(isVocabularyLibrary({ ...kept, bundledUnitKeys: [null] }), false)
})

const moreTwoUnits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((number) => {
  const data: unknown = JSON.parse(
    readFileSync(
      new URL(`../public/data/more-2-unit-${number}.json`, import.meta.url),
      'utf8',
    ),
  )
  assert.ok(isVocabularyUnit(data))
  return data
})

test('bundled units are approved without overwriting edits, drafts, or deletions', () => {
  const bundledUnits = [unit, unitTwo, ...moreOneNewUnits, ...moreTwoUnits]
  const editedUnit = {
    ...unit,
    reviewStatus: 'pending' as const,
    entries: [{ ...unit.entries[0], german: 'geben; aushändigen' }],
  }
  const parentDraft = {
    ...unit,
    unit: 16,
    title: 'Parent draft',
    reviewStatus: 'pending' as const,
    entries: [unit.entries[0]],
  }
  const library = {
    schemaVersion: 1 as const,
    units: [
      editedUnit,
      ...bundledUnits.slice(1).map((bundled) => ({
        ...bundled,
        reviewStatus: 'pending' as const,
      })),
      parentDraft,
    ],
    bundledUnitKeys: bundledUnits.map(unitKey),
  }

  const approved = mergeBundledUnits(library, bundledUnits)
  for (const bundled of bundledUnits) {
    const saved = approved.units.find(
      (candidate) => unitKey(candidate) === unitKey(bundled),
    )
    assert.equal(saved?.reviewStatus, 'approved')
  }
  assert.equal(
    approved.units.find((candidate) => candidate.unit === 1)?.entries[0].german,
    'geben; aushändigen',
  )
  assert.equal(
    approved.units.find((candidate) => candidate.unit === 16)?.reviewStatus,
    'pending',
  )

  const deleted = {
    ...approved,
    units: approved.units.filter(
      (candidate) => unitKey(candidate) !== unitKey(unitTwo),
    ),
  }
  const reloaded = mergeBundledUnits(deleted, bundledUnits)
  assert.equal(
    reloaded.units.some((candidate) => unitKey(candidate) === unitKey(unitTwo)),
    false,
  )
})

test('MORE! 2 photo transcriptions preserve table examples and mark suggested Word File translations', () => {
  const counts = [
    [45, 34, 11],
    [39, 39, 0],
    [33, 27, 6],
    [35, 35, 0],
    [37, 28, 9],
    [35, 25, 10],
    [30, 21, 8],
    [33, 26, 7],
    [31, 26, 5],
    [26, 22, 4],
    [29, 23, 6],
    [33, 24, 8],
    [33, 32, 0],
    [38, 25, 13],
    [24, 14, 10],
  ]
  for (const [index, data] of moreTwoUnits.entries()) {
    assert.equal(data.book, 'MORE! 2')
    assert.equal(data.unit, index + 1)
    assert.equal(data.reviewStatus, 'approved')
    assert.equal(data.entries.length, counts[index][0])
    assert.equal(
      data.entries.filter((entry) => entry.example).length,
      counts[index][1],
    )
    const wordFile = data.entries.filter(
      (entry) => entry.origin === 'word-file',
    )
    assert.equal(wordFile.length, counts[index][2])
    assert.ok(
      wordFile.every(
        (entry) =>
          entry.translationSource === 'suggested' && entry.example === null,
      ),
    )
    assert.equal(validateEntries(data.entries), null)
    for (const direction of ['english', 'german'] as const) {
      for (const entry of data.entries) {
        const choices = createAnswerChoices(entry, data.entries, direction)
        assert.equal(choices.length, 4)
        assert.equal(choices.filter((choice) => choice.correct).length, 1)
      }
    }
  }
})

test('MORE! 1 Units 3-15 photo transcriptions preserve visible examples and suggested illustrated translations', () => {
  const counts = [
    [31, 24, 5],
    [42, 32, 0],
    [43, 31, 8],
    [38, 33, 0],
    [28, 23, 2],
    [27, 14, 12],
    [40, 36, 4],
    [44, 24, 10],
    [38, 30, 0],
    [65, 30, 27],
    [41, 39, 0],
    [44, 44, 0],
    [23, 14, 9],
  ]
  for (const [index, data] of moreOneNewUnits.entries()) {
    assert.equal(data.book, 'MORE! 1')
    assert.equal(data.unit, index + 3)
    assert.equal(data.reviewStatus, 'approved')
    assert.equal(data.entries.length, counts[index][0])
    assert.equal(
      data.entries.filter((entry) => entry.example).length,
      counts[index][1],
    )
    const wordFile = data.entries.filter(
      (entry) => entry.origin === 'word-file',
    )
    assert.equal(wordFile.length, counts[index][2])
    assert.ok(
      wordFile.every(
        (entry) =>
          entry.translationSource === 'suggested' && entry.example === null,
      ),
    )
    assert.equal(validateEntries(data.entries), null)
  }
})

test('MORE! 2 typed answers accept optional prefixes, plural forms and abbreviations', () => {
  const prepare = moreTwoUnits[0].entries.find(
    (entry) => entry.english === 'to prepare',
  )!
  for (const answer of ['vorbereiten', 'zubereiten'])
    assert.equal(isCorrectAnswer(prepare, answer, 'german'), true)
  const fear = moreTwoUnits[2].entries.find(
    (entry) => entry.english === 'to fear',
  )!
  for (const answer of ['fürchten', 'sich fürchten', 'sich fürchten vor'])
    assert.equal(isCorrectAnswer(fear, answer, 'german'), true)
  const could = moreTwoUnits[2].entries.find(
    (entry) => entry.english === "couldn't",
  )!
  for (const answer of ['konnte nicht', 'konnten nicht'])
    assert.equal(isCorrectAnswer(could, answer, 'german'), true)
  assert.equal(isCorrectAnswer(could, 'n nicht', 'german'), false)
  const proud = moreTwoUnits[2].entries.find(
    (entry) => entry.english === 'to be proud (of)',
  )!
  for (const answer of ['be proud', 'be proud of'])
    assert.equal(isCorrectAnswer(proud, answer, 'english'), true)
  const knife = moreTwoUnits[2].entries.find((entry) =>
    entry.english.startsWith('knife'),
  )!
  for (const answer of ['knife', 'knives'])
    assert.equal(isCorrectAnswer(knife, answer, 'english'), true)
  for (const [english, abbreviation] of [
    ['physical education (PE)', 'PE'],
    ['information technology (IT)', 'IT'],
  ]) {
    const entry = moreTwoUnits[0].entries.find(
      (item) => item.english === english,
    )!
    assert.equal(isCorrectAnswer(entry, abbreviation, 'english'), true)
  }
})

test('the transcribed unit has 42 valid entries and 40 examples', () => {
  assert.equal(unit.book, 'MORE! 1')
  assert.equal(unit.unit, 1)
  assert.equal(unit.entries.length, 42)
  assert.equal(unit.entries.filter((entry) => entry.example).length, 40)
  assert.equal(validateEntries(unit.entries), null)
})

test('incomplete, duplicate and invalid saved data are rejected', () => {
  assert.ok(validateEntries([]))
  assert.ok(validateEntries([{ english: 'hello', german: ' ', example: null }]))
  assert.ok(
    validateEntries([
      { english: 'Hello', german: 'Hallo', example: null },
      { english: ' hello ', german: 'Hallo', example: null },
    ]),
  )
  assert.equal(isVocabularyUnit({ ...unit, entries: [null] }), false)
  assert.equal(isVocabularyUnit({ ...unit, reviewStatus: 'unknown' }), false)
})

test('answers accept punctuation, verb forms and listed translation alternatives', () => {
  const meet = unit.entries.find((entry) => entry.english === 'to meet')!
  assert.equal(isCorrectAnswer(meet, ' Meet! ', 'english'), true)
  assert.equal(isCorrectAnswer(meet, 'sich treffen', 'german'), true)
  assert.equal(isCorrectAnswer(meet, 'kennenlernen', 'german'), true)
  assert.equal(isCorrectAnswer(meet, '', 'german'), false)
  assert.equal(isCorrectAnswer(meet, 'gehen', 'german'), false)
})

test('parenthetical forms, contractions and workbook shorthand are accepted', () => {
  const fine = unit.entries.find((entry) => entry.english.startsWith('I am'))!
  assert.equal(isCorrectAnswer(fine, "I'm fine.", 'english'), true)
  assert.equal(isCorrectAnswer(fine, 'I am fine', 'english'), true)
  const address = unit.entries.find(
    (entry) => entry.english === '(email) address',
  )!
  assert.equal(isCorrectAnswer(address, 'address', 'english'), true)
  assert.equal(isCorrectAnswer(address, 'email address', 'english'), true)
  assert.equal(isCorrectAnswer(address, 'Adresse', 'german'), true)
  assert.equal(isCorrectAnswer(address, 'E-Mail-Adresse', 'german'), true)
  const your = unit.entries.find((entry) => entry.english === 'your')!
  for (const answer of ['dein', 'deine', 'Ihr', 'Ihre', 'euer', 'eure']) {
    assert.ok(acceptedAnswers(your, 'german').includes(answer.toLowerCase()))
  }
  const question = unit.entries.find(
    (entry) => entry.english === 'How are you?',
  )!
  for (const answer of [
    'Wie geht es dir?',
    'Wie geht es Ihnen?',
    'Wie geht es euch?',
  ]) {
    assert.equal(isCorrectAnswer(question, answer, 'german'), true)
  }
  const sit = unit.entries.find((entry) => entry.english === 'to sit down')!
  assert.equal(isCorrectAnswer(sit, 'sich hinsetzen', 'german'), true)
})

test('rounds contain unique entries and leave the original order unchanged', () => {
  const original = [...unit.entries]
  const round = createRound(unit.entries)
  assert.equal(round.length, 10)
  assert.equal(new Set(round).size, 10)
  assert.deepEqual(unit.entries, original)
  assert.equal(createRound(unit.entries.slice(0, 3)).length, 3)
})

test('multiple choice has four distinct options with exactly one correct in both languages', () => {
  for (const direction of ['english', 'german'] as const) {
    for (const entry of unit.entries) {
      const options = createAnswerChoices(entry, unit.entries, direction)
      assert.equal(options.length, 4)
      assert.equal(options.filter((option) => option.correct).length, 1)
      assert.equal(new Set(options.map((option) => option.text)).size, 4)
      assert.equal(
        options.find((option) => option.correct)!.text,
        entry[direction],
      )
    }
  }
})

test('multiple choice excludes equivalent answers and ambiguous prompts', () => {
  const entries = [
    { english: 'to go', german: 'gehen', example: null },
    { english: 'to walk', german: 'gehen; laufen', example: null },
    { english: 'go', german: 'losgehen', example: null },
    { english: 'to read', german: 'lesen', example: null },
    { english: 'to write', german: 'lesen', example: null },
  ]
  for (const direction of ['english', 'german'] as const) {
    const options = createAnswerChoices(entries[0], entries, direction)
    assert.equal(options.filter((option) => option.correct).length, 1)
    assert.ok(!options.some((option) => option.text === entries[1][direction]))
    assert.ok(!options.some((option) => option.text === entries[2][direction]))
    assert.equal(
      new Set(options.map((option) => option.text)).size,
      options.length,
    )
  }
})

test('multiple choice uses fewer options in small units and rejects single-answer pools', () => {
  const entries = unit.entries.slice(0, 2)
  assert.equal(createAnswerChoices(entries[0], entries, 'english').length, 2)
  assert.deepEqual(
    createAnswerChoices(entries[0], entries.slice(0, 1), 'english'),
    [],
  )
  assert.deepEqual(
    createAnswerChoices(entries[0], [entries[0], { ...entries[0] }], 'german'),
    [],
  )
})

test('matching boards select five distinct pairs without overlapping answers in either language', () => {
  for (const entries of [
    unit.entries,
    unitTwo.entries,
    ...moreTwoUnits.map((item) => item.entries),
  ]) {
    const original = [...entries]
    const board = createMatchingRound(entries)
    assert.equal(board.length, 5)
    assert.deepEqual(entries, original)
    for (let first = 0; first < board.length; first++) {
      for (let second = first + 1; second < board.length; second++) {
        for (const direction of ['english', 'german'] as const) {
          assert.equal(
            acceptedAnswers(board[first], direction).some((answer) =>
              acceptedAnswers(board[second], direction).includes(answer),
            ),
            false,
          )
        }
      }
    }
  }
})

test('matching filters duplicate translations, supports small units and prioritises retries', () => {
  const pairs = [
    { english: 'she', german: 'sie', example: null },
    { english: 'they', german: 'sie', example: null },
    { english: 'happy', german: 'froh; glücklich', example: null },
    { english: 'glad', german: 'froh', example: null },
    { english: 'book', german: 'Buch', example: null },
  ]
  const board = createMatchingRound(pairs)
  assert.equal(board.length, 3)
  assert.ok(board.includes(pairs[4]))
  assert.deepEqual(createMatchingRound(pairs.slice(0, 2)), [])
  assert.equal(createMatchingRound([pairs[0], pairs[4]]).length, 2)
  const retry = createMatchingRound(unit.entries, 5, [
    unit.entries[0],
    unit.entries[1],
  ])
  assert.equal(retry.length, 5)
  assert.ok(retry.includes(unit.entries[0]))
  assert.ok(retry.includes(unit.entries[1]))
})

test('libraries keep books and units distinct and update only the selected unit', () => {
  const second = { ...unit, unit: 2, entries: unit.entries.slice(0, 2) }
  const otherBook = { ...unit, book: 'MORE! 2' as const }
  const library = upsertUnit(
    upsertUnit(upsertUnit({ schemaVersion: 1, units: [] }, unit), second),
    otherBook,
  )
  assert.ok(isVocabularyLibrary(library))
  assert.equal(library.units.length, 3)
  assert.notEqual(unitKey(unit), unitKey(otherBook))
  const changed = { ...second, title: 'My new words' }
  const saved = upsertUnit(library, changed)
  assert.equal(saved.units.length, 3)
  assert.equal(
    saved.units.find((item) => unitKey(item) === unitKey(changed))!.title,
    'My new words',
  )
  assert.equal(
    saved.units.find((item) => unitKey(item) === unitKey(unit)),
    unit,
  )
  assert.equal(
    library.units.find((item) => unitKey(item) === unitKey(second))!.title,
    second.title,
  )
})

test('empty units are valid drafts but cannot be approved; duplicate identities are rejected', () => {
  const draft = {
    ...unit,
    unit: 2,
    entries: [],
    reviewStatus: 'pending' as const,
  }
  assert.ok(isVocabularyUnit(draft))
  assert.ok(isVocabularyLibrary({ schemaVersion: 1, units: [draft] }))
  assert.equal(isVocabularyUnit({ ...draft, reviewStatus: 'approved' }), false)
  assert.equal(
    isVocabularyLibrary({ schemaVersion: 1, units: [unit, { ...unit }] }),
    false,
  )
  assert.equal(isVocabularyLibrary({ schemaVersion: 1, units: [null] }), false)
  assert.equal(isVocabularyLibrary({ schemaVersion: 2, units: [] }), false)
})

test('learning progress tracks first attempts and resets mastery streaks after a miss', () => {
  const empty = { schemaVersion: 1 as const, records: [] }
  const entry = unit.entries[0]
  const attempt = {
    english: entry.english,
    german: entry.german,
    correct: true,
  }
  const firstRound = updateLearningProgress(empty, unit, [attempt], '2026-10-10T12:00:00.000Z')
  const secondRound = updateLearningProgress(firstRound, unit, [attempt], '2026-10-11T12:00:00.000Z')
  const thirdRound = updateLearningProgress(secondRound, unit, [attempt], '2026-10-12T12:00:00.000Z')
  assert.equal(thirdRound.records[0].correctStreak, 3)
  assert.equal(thirdRound.records[0].correctAttempts, 3)
  assert.equal(thirdRound.records[0].incorrectAttempts, 0)
  assert.equal(thirdRound.records[0].lastPracticedAt, '2026-10-12T12:00:00.000Z')

  const missedRound = updateLearningProgress(
    thirdRound,
    unit,
    [{ ...attempt, correct: false }],
    '2026-10-13T12:00:00.000Z',
  )
  assert.equal(missedRound.records[0].correctStreak, 0)
  assert.equal(missedRound.records[0].correctAttempts, 3)
  assert.equal(missedRound.records[0].incorrectAttempts, 1)
  assert.equal(isLearningProgress(missedRound), true)
  assert.equal(isLearningProgress({ schemaVersion: 1, records: [{ ...attempt }] }), false)
  assert.equal(learningProgressStorageKey, 'ourlingo.learning.v1')
})

test('a unit is completed when every word is known and progression offers the next unit', () => {
  const makeUnit = (
    book: VocabularyUnit['book'],
    number: VocabularyUnit['unit'],
    reviewStatus: VocabularyUnit['reviewStatus'] = 'approved',
  ): VocabularyUnit => ({
    schemaVersion: 1,
    book,
    unit: number,
    title: `Unit ${number}`,
    source: 'Test',
    reviewStatus,
    entries: [
      { english: `${book} ${number} a`, german: 'a', example: null },
      { english: `${book} ${number} b`, german: 'b', example: null },
    ],
  })
  const know = (
    progress: LearningProgress,
    unit: VocabularyUnit,
    rounds = 3,
  ): LearningProgress => {
    let next = progress
    for (let round = 0; round < rounds; round += 1)
      next = updateLearningProgress(
        next,
        unit,
        unit.entries.map((entry) => ({ ...entry, correct: true })),
        '2026-10-18T10:00:00.000Z',
      )
    return next
  }
  const one = makeUnit('MORE! 1', 1)
  const two = makeUnit('MORE! 1', 2)
  const three = makeUnit('MORE! 1', 3)
  const pending = makeUnit('MORE! 1', 4, 'pending')
  const five = makeUnit('MORE! 1', 5)
  const otherBook = makeUnit('MORE! 2', 1)
  const verbs = makeUnit('MORE! 2', 'irregular-verbs')
  const units = [three, five, pending, two, one, otherBook, verbs]
  const empty: LearningProgress = { schemaVersion: 1, records: [] }
  const keys = (progress: LearningProgress) =>
    progressionUnits(units, progress).map(unitKey)

  assert.deepEqual(keys(empty), ['MORE! 1:1', 'MORE! 2:1', 'MORE! 2:irregular-verbs'])

  const almost = know(empty, one, 2)
  assert.equal(isUnitCompleted(one, almost), false)
  assert.deepEqual(keys(almost), ['MORE! 1:1', 'MORE! 2:1', 'MORE! 2:irregular-verbs'])

  const firstDone = know(empty, one)
  assert.equal(isUnitCompleted(one, firstDone), true)
  assert.deepEqual(keys(firstDone), [
    'MORE! 1:2',
    'MORE! 1:1',
    'MORE! 2:1',
    'MORE! 2:irregular-verbs',
  ])

  const missed = updateLearningProgress(
    firstDone,
    one,
    [{ ...one.entries[0], correct: false }],
    '2026-10-18T11:00:00.000Z',
  )
  assert.equal(isUnitCompleted(one, missed), false)

  const throughThree = know(know(firstDone, two), three)
  assert.deepEqual(keys(throughThree), [
    'MORE! 1:3',
    'MORE! 1:5',
    'MORE! 1:2',
    'MORE! 1:1',
    'MORE! 2:1',
    'MORE! 2:irregular-verbs',
  ])
  assert.equal(isUnitCompleted({ ...one, entries: [] }, throughThree), false)
})

test('description practice uses English answers, shared descriptions and bundled suggestions', () => {
  const entries: Entry[] = [
    { english: "What's the time?", german: 'Wie spät ist es?', example: null, description: 'You ask this to know how late it is' },
    { english: 'What time is it?', german: 'Wie spät ist es?', example: null, description: 'You ask this to know how late it is' },
    { english: 'silence', german: 'Stille', example: null, description: 'When nobody speaks and you hear nothing' },
    { english: 'basket', german: 'Korb', example: null, description: 'You put things you buy in there' },
    { english: 'mess', german: 'Unordnung', example: null },
  ]
  assert.equal(answerSide('description'), 'english')
  assert.equal(promptText(entries[2], 'description'), 'When nobody speaks and you hear nothing')
  assert.deepEqual(practiceEntries(entries, 'description').map((entry) => entry.english), [
    "What's the time?",
    'What time is it?',
    'silence',
    'basket',
  ])
  assert.ok(isCorrectPracticeAnswer(entries[2], entries, 'Silence', 'description'))
  assert.ok(isCorrectPracticeAnswer(entries[0], entries, 'What time is it?', 'description'))
  assert.equal(isCorrectPracticeAnswer(entries[0], entries, 'What time is it?', 'english'), false)
  assert.equal(isCorrectPracticeAnswer(entries[2], entries, 'basket', 'description'), false)

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const choices = createAnswerChoices(entries[0], entries, 'description')
    assert.ok(choices.some((choice) => choice.correct && choice.text === "What's the time?"))
    assert.ok(!choices.some((choice) => choice.text === 'What time is it?'))
    const board = createMatchingRound(entries, 5, [], 'description')
    assert.ok(!board.some((entry) => entry.english === 'mess'))
    assert.ok(
      board.filter((entry) => entry.english.startsWith('What')).length <= 1,
    )
  }

  const saved: VocabularyUnit = {
    schemaVersion: 1,
    book: 'MORE! 1',
    unit: 9,
    title: 'Unit 9',
    source: 'Test',
    reviewStatus: 'approved',
    entries: [
      { english: 'silence', german: 'Stille', example: null },
      { english: 'basket', german: 'Korb', example: null, description: '', descriptionSource: 'parent' },
      { english: 'mess', german: 'Unordnung', example: null },
    ],
  }
  const bundled = { ...saved, entries: entries.slice(2, 4).map((entry) => ({ ...entry, descriptionSource: 'suggested' as const })) }
  const described = withSuggestedDescriptions(saved, bundled)
  assert.equal(described.entries[0].description, 'When nobody speaks and you hear nothing')
  assert.equal(described.entries[0].descriptionSource, 'suggested')
  assert.equal(described.entries[1].description, '')
  assert.equal(described.entries[2], saved.entries[2])
  assert.equal(withSuggestedDescriptions(described, bundled), described)

  const merged = mergeBundledUnits(
    { schemaVersion: 1, units: [saved], bundledUnitKeys: ['MORE! 1:9'] },
    [bundled],
  )
  assert.deepEqual(merged.describedUnitKeys, ['MORE! 1:9'])
  assert.equal(merged.units[0].entries[0].descriptionSource, 'suggested')
  const again = mergeBundledUnits(
    { ...merged, units: [{ ...merged.units[0], entries: saved.entries }] },
    [bundled],
  )
  assert.equal(again.units[0].entries[0].description, undefined)
  assert.equal(isVocabularyLibrary({ ...merged, describedUnitKeys: [1] }), false)
})

test('every bundled unit is valid and every word except Irregular Verbs has a suggested description', () => {
  for (const { file } of bundledUnitFiles) {
    const data = JSON.parse(
      readFileSync(new URL(`../public/data/${file}`, import.meta.url), 'utf8'),
    ) as VocabularyUnit
    assert.ok(isVocabularyUnit(data), file)
    assert.equal(validateEntries(data.entries), null, file)
    for (const entry of data.entries) {
      if (data.unit === 'irregular-verbs') {
        assert.equal(entry.description, undefined, file)
        continue
      }
      assert.ok(entry.description?.trim(), `${file}: ${entry.english}`)
      assert.equal(entry.descriptionSource, 'suggested', `${file}: ${entry.english}`)
    }
  }
})

test('matching rounds use up to three boards of different words', () => {
  const words: Entry[] = Array.from({ length: 12 }, (_, index) => ({
    english: `word ${index}`,
    german: `Wort ${index}`,
    example: null,
    description: `Clue number ${index}`,
  }))
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const boards = createMatchingBoards(words)
    assert.deepEqual(boards.map((board) => board.length), [5, 5, 2])
    assert.equal(new Set(boards.flat()).size, 12)
  }
  const priority = [words[7], words[9]]
  const retry = createMatchingBoards(words, 1, 5, priority)
  assert.equal(retry.length, 1)
  assert.ok(priority.every((entry) => retry[0].includes(entry)))
  assert.deepEqual(createMatchingBoards(words.slice(0, 3)).map((board) => board.length), [3])
  const described = words.map((entry, index) =>
    index < 4 ? entry : { ...entry, description: undefined },
  )
  assert.deepEqual(
    createMatchingBoards(described, 3, 5, [], 'description').map((board) => board.length),
    [4],
  )
})
