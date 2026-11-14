import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptyActivity, recordRound } from './activity.ts'
import type { LearningProgress, VocabularyUnit } from './vocabulary.ts'
import {
  buildWeeklyReport,
  isEmailAddress,
  mailtoLink,
  normalizeWeeklyReport,
  reportDate,
  reportDue,
  reportSubject,
  reportText,
} from './weeklyReport.ts'

test('report settings keep at most two distinct valid addresses', () => {
  assert.equal(isEmailAddress('mum@example.com'), true)
  assert.equal(isEmailAddress('mum@example'), false)
  assert.equal(isEmailAddress('a@b.com, c@d.com'), false)
  assert.deepEqual(
    normalizeWeeklyReport({
      enabled: true,
      emails: ['mum@example.com', 'MUM@example.com', 'nope', 'dad@example.org', 'third@example.net'],
      day: 'friday',
      lastReport: '2026-11-13',
    }),
    {
      enabled: true,
      emails: ['mum@example.com', 'dad@example.org'],
      day: 'friday',
      lastReport: '2026-11-13',
    },
  )
  assert.deepEqual(normalizeWeeklyReport({ day: 'monday', lastReport: 'x' }), {
    enabled: false,
    emails: [],
    day: 'sunday',
    lastReport: null,
  })
})

test('the report is due from its day until it is sent or skipped', () => {
  // 15 Nov 2026 is a Sunday, 13 Nov a Friday.
  assert.equal(reportDate('2026-11-15', 'sunday'), '2026-11-15')
  assert.equal(reportDate('2026-11-14', 'sunday'), '2026-11-08')
  assert.equal(reportDate('2026-11-14', 'friday'), '2026-11-13')
  const settings = { enabled: true, emails: ['mum@example.com'], day: 'sunday' as const, lastReport: '2026-11-08' }
  assert.equal(reportDue(settings, '2026-11-14'), false)
  assert.equal(reportDue(settings, '2026-11-15'), true)
  assert.equal(reportDue({ ...settings, lastReport: '2026-11-15' }, '2026-11-17'), false)
  assert.equal(reportDue({ ...settings, emails: [] }, '2026-11-15'), false)
  assert.equal(reportDue({ ...settings, enabled: false }, '2026-11-15'), false)
})

test('the report sums the last seven days and lists learned and missed words', () => {
  const unit: VocabularyUnit = {
    schemaVersion: 1,
    book: 'MORE! 1',
    unit: 2,
    title: 'Unit 2',
    source: 'test',
    reviewStatus: 'approved',
    entries: [
      { english: 'cat', german: 'Katze' },
      { english: 'dog', german: 'Hund' },
      { english: 'bird', german: 'Vogel' },
    ],
  }
  const record = (english: string, german: string, streak: number, wrong: number) => ({
    book: 'MORE! 1' as const,
    unit: 2,
    english,
    german,
    correctAttempts: 3,
    incorrectAttempts: wrong,
    correctStreak: streak,
    lastPracticedAt: new Date(2026, 10, 14, 10).toISOString(),
  })
  const progress: LearningProgress = {
    schemaVersion: 1,
    records: [record('cat', 'Katze', 3, 0), record('dog', 'Hund', 1, 4)],
  }
  let activity = recordRound(emptyActivity(), {
    date: '2026-11-07',
    mode: 'typed',
    answers: 10,
    correct: 5,
    learned: [],
  })
  activity = recordRound(activity, {
    date: '2026-11-12',
    mode: 'typed',
    answers: 10,
    correct: 8,
    learned: [{ book: 'MORE! 1', unit: 2, english: 'cat', german: 'Katze' }],
  })
  activity = recordRound(activity, { date: '2026-11-14', mode: 'matching', answers: 15, correct: 15, learned: [] })
  activity = { ...activity, badges: { 'first-round': '2026-11-07', 'perfect-round': '2026-11-14' } }
  const report = buildWeeklyReport([unit], progress, activity, '2026-11-14', ['MORE! 1'])
  assert.equal(report.from, '2026-11-08')
  assert.equal(report.daysPractised, 2)
  assert.equal(report.rounds, 2)
  assert.equal(report.correct, 23)
  assert.equal(report.answers, 25)
  assert.equal(report.streak, 1)
  assert.deepEqual(report.learned.map((word) => word.english), ['cat'])
  assert.deepEqual(report.inProgress, [{ book: 'MORE! 1', unit: 2, known: 1, total: 3 }])
  assert.deepEqual(report.missed.map((word) => [word.english, word.missed]), [['dog', 4]])
  assert.deepEqual(report.newBadges, ['Perfect!'])

  const text = reportText(report)
  assert.match(text, /Days practised: 2 of 7/)
  assert.match(text, /MORE! 1 Unit 2:\n- cat = Katze/)
  assert.match(text, /MORE! 1 Unit 2: 1 of 3 words known, 2 to go/)
  assert.match(text, /- dog = Hund \(missed 4 times\)/)
  assert.equal(reportSubject(report), 'OurLingo weekly report: 8 Nov 2026 to 14 Nov 2026')
  assert.equal(
    mailtoLink(['mum@example.com', 'dad@example.org'], 'Hi there', 'a & b'),
    'mailto:mum@example.com,dad@example.org?subject=Hi%20there&body=a%20%26%20b',
  )
})
