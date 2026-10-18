import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultSettings, normalizeSettings } from './settings.ts'
import { books } from './vocabulary.ts'

test('settings default to the system theme and every book', () => {
  assert.deepEqual(defaultSettings(), {
    schemaVersion: 1,
    theme: 'system',
    books: [...books],
  })
  assert.deepEqual(normalizeSettings(null), defaultSettings())
  assert.deepEqual(normalizeSettings('broken'), defaultSettings())
})

test('settings keep a valid theme and preferred books in book order', () => {
  assert.deepEqual(
    normalizeSettings({ theme: 'dark', books: ['MORE! 2', 'MORE! 1'] }),
    { schemaVersion: 1, theme: 'dark', books: ['MORE! 1', 'MORE! 2'] },
  )
  assert.deepEqual(normalizeSettings({ theme: 'light', books: ['MORE! 2'] }), {
    schemaVersion: 1,
    theme: 'light',
    books: ['MORE! 2'],
  })
})

test('settings drop unknown values without hiding the library', () => {
  assert.deepEqual(
    normalizeSettings({ theme: 'sepia', books: ['MORE! 9', 2] }),
    defaultSettings(),
  )
  assert.deepEqual(normalizeSettings({ theme: 'dark', books: [] }).books, [
    ...books,
  ])
})
