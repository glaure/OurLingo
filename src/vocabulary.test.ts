import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  acceptedAnswers,
  createAnswerChoices,
  createRound,
  isCorrectAnswer,
  isVocabularyUnit,
  validateEntries,
} from './vocabulary.ts'

const unit: unknown = JSON.parse(
  readFileSync(
    new URL('../public/data/more-1-unit-1.json', import.meta.url),
    'utf8',
  ),
)
assert.ok(isVocabularyUnit(unit))

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
