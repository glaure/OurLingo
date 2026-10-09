import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  acceptedAnswers,
  createAnswerChoices,
  createRound,
  isCorrectAnswer,
  isVocabularyLibrary,
  isVocabularyUnit,
  mergeBundledUnits,
  unitKey,
  upsertUnit,
  validateEntries,
} from './vocabulary.ts'

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

test('Unit 2 transcription has 41 entries, 37 examples, and the correct book and review status', () => {
  assert.equal(unitTwo.book, 'MORE! 1')
  assert.equal(unitTwo.unit, 2)
  assert.equal(unitTwo.reviewStatus, 'pending')
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
  const draft = { ...unitTwo, title: 'My zoo words', entries: [] }
  const installed = mergeBundledUnits({ schemaVersion: 1, units: [draft] }, [
    unitTwo,
  ])
  assert.equal(installed.units[0].title, 'My zoo words')
  assert.equal(installed.units[0].entries.length, 41)
  assert.equal(installed.units[0].reviewStatus, 'pending')
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

const moreTwoUnits = [1, 2, 3].map((number) => {
  const data: unknown = JSON.parse(
    readFileSync(
      new URL(`../public/data/more-2-unit-${number}.json`, import.meta.url),
      'utf8',
    ),
  )
  assert.ok(isVocabularyUnit(data))
  return data
})

test('MORE! 2 photo transcriptions preserve table examples and mark suggested Word File translations', () => {
  const counts = [
    [45, 34, 11],
    [39, 39, 0],
    [33, 27, 6],
  ]
  for (const [index, data] of moreTwoUnits.entries()) {
    assert.equal(data.book, 'MORE! 2')
    assert.equal(data.unit, index + 1)
    assert.equal(data.reviewStatus, 'pending')
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
