import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  achievementStats,
  addDays,
  awardBadges,
  dayStreak,
  emptyActivity,
  isActivity,
  recentDays,
  recordRound,
} from './activity.ts'
import type { RoundSummary } from './activity.ts'
import type { LearningProgress, VocabularyUnit } from './vocabulary.ts'

const round = (date: string, extra: Partial<RoundSummary> = {}): RoundSummary => ({
  date,
  mode: 'typed',
  answers: 10,
  correct: 8,
  learned: [],
  ...extra,
})

test('dates move across month and year ends in the local calendar', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01')
  assert.equal(addDays('2027-01-01', -1), '2026-12-31')
  assert.equal(addDays('2028-02-28', 1), '2028-02-29')
})

test('rounds are summed per day and learned words are listed once', () => {
  const word = { book: 'MORE! 1' as const, unit: 1, english: 'cat', german: 'Katze' }
  let activity = recordRound(emptyActivity(), round('2026-10-20', { learned: [word] }))
  activity = recordRound(activity, round('2026-10-20', { learned: [word], mode: 'matching' }))
  assert.equal(activity.days.length, 1)
  assert.deepEqual(activity.days[0], {
    date: '2026-10-20',
    rounds: 2,
    answers: 20,
    correct: 16,
    learned: [word],
  })
  assert.equal(activity.rounds, 2)
  assert.deepEqual(activity.modes, ['typed', 'matching'])
  assert.equal(isActivity(activity), true)
  assert.equal(isActivity({ schemaVersion: 1, days: 'x' }), false)
})

test('perfect rounds are counted', () => {
  const activity = recordRound(
    recordRound(emptyActivity(), round('2026-10-20', { correct: 10 })),
    round('2026-10-20'),
  )
  assert.equal(activity.perfectRounds, 1)
})

test('the streak counts days in a row and survives until a whole day is missed', () => {
  let activity = emptyActivity()
  for (const date of ['2026-10-14', '2026-10-17', '2026-10-18', '2026-10-19'])
    activity = recordRound(activity, round(date))
  assert.equal(dayStreak(activity, '2026-10-19'), 3)
  assert.equal(dayStreak(activity, '2026-10-20'), 3)
  assert.equal(dayStreak(activity, '2026-10-21'), 0)
  assert.equal(activity.bestStreak, 3)
  activity = recordRound(activity, round('2026-10-25'))
  assert.equal(dayStreak(activity, '2026-10-25'), 1)
  assert.equal(activity.bestStreak, 3)
})

test('recent days include days without practice', () => {
  const activity = recordRound(emptyActivity(), round('2026-10-18'))
  const days = recentDays(activity, '2026-10-20', 7)
  assert.deepEqual(
    days.map((day) => [day.date, day.rounds]),
    [
      ['2026-10-14', 0],
      ['2026-10-15', 0],
      ['2026-10-16', 0],
      ['2026-10-17', 0],
      ['2026-10-18', 1],
      ['2026-10-19', 0],
      ['2026-10-20', 0],
    ],
  )
})

test('badges are awarded once from words, units and books', () => {
  const entries = [
    { english: 'cat', german: 'Katze' },
    { english: 'dog', german: 'Hund' },
  ]
  const unit = (number: number): VocabularyUnit => ({
    schemaVersion: 1,
    book: 'MORE! 1',
    unit: number,
    title: `Unit ${number}`,
    source: 'test',
    reviewStatus: 'approved',
    entries,
  })
  const progress: LearningProgress = {
    schemaVersion: 1,
    records: entries.map((entry) => ({
      book: 'MORE! 1',
      unit: 1,
      ...entry,
      correctAttempts: 3,
      incorrectAttempts: 0,
      correctStreak: 3,
      lastPracticedAt: '2026-10-20T10:00:00.000Z',
    })),
  }
  const activity = recordRound(emptyActivity(), round('2026-10-20', { correct: 10 }))
  const stats = achievementStats([unit(1), unit(2)], progress, activity, '2026-10-20')
  assert.equal(stats.knownWords, 2)
  assert.equal(stats.completedUnits, 1)
  assert.deepEqual(stats.completedBooks, [])
  const first = awardBadges(activity, stats, '2026-10-20')
  assert.deepEqual(
    first.earned.map((badge) => badge.id),
    ['first-round', 'perfect-round', 'units-1'],
  )
  assert.equal(first.activity.badges['units-1'], '2026-10-20')
  assert.deepEqual(awardBadges(first.activity, stats, '2026-10-21').earned, [])
  const allDone = achievementStats([unit(1)], progress, activity, '2026-10-20')
  assert.deepEqual(allDone.completedBooks, ['MORE! 1'])
})
