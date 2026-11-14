import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultSettings, normalizeSettings } from './settings.ts'
import { books } from './vocabulary.ts'

test('settings default to the system theme and every book', () => {
  assert.deepEqual(defaultSettings(), {
    schemaVersion: 1,
    theme: 'system',
    books: [...books],
    progression: 'completed-and-next',
    startUnits: {},
    weeklyReport: { enabled: false, emails: [], day: 'sunday', lastReport: null },
  })
  assert.deepEqual(normalizeSettings(null), defaultSettings())
  assert.deepEqual(normalizeSettings('broken'), defaultSettings())
})

test('settings keep a valid theme and preferred books in book order', () => {
  assert.deepEqual(
    normalizeSettings({
      theme: 'dark',
      books: ['MORE! 2', 'MORE! 1'],
      knownBooks: [...books],
    }),
    {
      schemaVersion: 1,
      theme: 'dark',
      books: ['MORE! 1', 'MORE! 2'],
      progression: 'completed-and-next',
      startUnits: {},
      weeklyReport: { enabled: false, emails: [], day: 'sunday', lastReport: null },
    },
  )
  assert.deepEqual(
    normalizeSettings({
      theme: 'light',
      books: ['MORE! 2'],
      knownBooks: [...books],
      progression: 'completed-and-next',
    }),
    {
      schemaVersion: 1,
      theme: 'light',
      books: ['MORE! 2'],
      progression: 'completed-and-next',
      startUnits: {},
      weeklyReport: { enabled: false, emails: [], day: 'sunday', lastReport: null },
    },
  )
})

test('start units keep valid unit numbers for known books', () => {
  assert.deepEqual(
    normalizeSettings({
      books: [...books],
      knownBooks: [...books],
      startUnits: { 'MORE! 2': 5, 'MORE! 3': 1, 'MORE! 4': 2.5, 'MORE! 9': 3 },
    }).startUnits,
    { 'MORE! 2': 5 },
  )
  assert.deepEqual(normalizeSettings({ startUnits: 'x' }).startUnits, {})
})

test('settings drop unknown values without hiding the library', () => {
  assert.deepEqual(
    normalizeSettings({
      theme: 'sepia',
      books: ['MORE! 9', 2],
      progression: 'some',
    }),
    defaultSettings(),
  )
  assert.deepEqual(normalizeSettings({ theme: 'dark', books: [] }).books, [
    ...books,
  ])
})

test('books added after the settings were saved start out selected', () => {
  assert.deepEqual(
    normalizeSettings({ theme: 'system', books: ['MORE! 2'] }).books,
    ['MORE! 2', 'MORE! 3', 'MORE! 4'],
  )
  assert.deepEqual(
    normalizeSettings({
      theme: 'system',
      books: ['MORE! 2'],
      knownBooks: ['MORE! 1', 'MORE! 2', 'MORE! 3'],
    }).books,
    ['MORE! 2', 'MORE! 4'],
  )
})
