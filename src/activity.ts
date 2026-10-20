import { books, isUnitCompleted, summarizeUnitProgress } from './vocabulary'
import type { Book, LearningProgress, VocabularyUnit } from './vocabulary'

// Practice history for the daily streak, recently learned words and badges.
// Days use the device's local calendar date (YYYY-MM-DD).

export interface LearnedWord {
  book: VocabularyUnit['book']
  unit: VocabularyUnit['unit']
  english: string
  german: string
}

export interface ActivityDay {
  date: string
  rounds: number
  answers: number
  correct: number
  learned: LearnedWord[]
}

export interface Activity {
  schemaVersion: 1
  days: ActivityDay[]
  rounds: number
  perfectRounds: number
  modes: string[]
  bestStreak: number
  // Badge id -> date it was earned.
  badges: Record<string, string>
}

export interface RoundSummary {
  date: string
  mode: string
  answers: number
  correct: number
  learned: LearnedWord[]
}

export const activityStorageKey = 'ourlingo.activity.v1'
const keptDays = 400

export function emptyActivity(): Activity {
  return {
    schemaVersion: 1,
    days: [],
    rounds: 0,
    perfectRounds: 0,
    modes: [],
    bestStreak: 0,
    badges: {},
  }
}

export function localDate(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return localDate(new Date(year, month - 1, day + days))
}

const isCount = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 0

export function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== 'object') return false
  const activity = value as Partial<Activity>
  return (
    activity.schemaVersion === 1 &&
    Array.isArray(activity.days) &&
    activity.days.every(
      (day) =>
        !!day &&
        typeof day.date === 'string' &&
        isCount(day.rounds) &&
        isCount(day.answers) &&
        isCount(day.correct) &&
        Array.isArray(day.learned) &&
        day.learned.every(
          (word) =>
            !!word &&
            typeof word.english === 'string' &&
            typeof word.german === 'string',
        ),
    ) &&
    isCount(activity.rounds) &&
    isCount(activity.perfectRounds) &&
    Array.isArray(activity.modes) &&
    isCount(activity.bestStreak) &&
    !!activity.badges &&
    typeof activity.badges === 'object'
  )
}

// Days in a row with practice, ending today. A streak that ended yesterday is
// still alive, so it only breaks after a whole day without practice.
export function dayStreak(activity: Activity, today: string): number {
  const practised = new Set(
    activity.days.filter((day) => day.rounds > 0).map((day) => day.date),
  )
  let date = practised.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (practised.has(date)) {
    streak += 1
    date = addDays(date, -1)
  }
  return streak
}

export function recordRound(activity: Activity, round: RoundSummary): Activity {
  const days = activity.days.filter((day) => day.date !== round.date)
  const previous = activity.days.find((day) => day.date === round.date)
  const learned = [...(previous?.learned ?? [])]
  for (const word of round.learned) {
    if (
      !learned.some(
        (other) =>
          other.book === word.book &&
          other.unit === word.unit &&
          other.english === word.english,
      )
    )
      learned.push(word)
  }
  days.push({
    date: round.date,
    rounds: (previous?.rounds ?? 0) + 1,
    answers: (previous?.answers ?? 0) + round.answers,
    correct: (previous?.correct ?? 0) + round.correct,
    learned,
  })
  days.sort((a, b) => a.date.localeCompare(b.date))
  const updated: Activity = {
    ...activity,
    days: days.slice(-keptDays),
    rounds: activity.rounds + 1,
    perfectRounds:
      activity.perfectRounds +
      Number(round.answers > 0 && round.correct === round.answers),
    modes: activity.modes.includes(round.mode)
      ? activity.modes
      : [...activity.modes, round.mode],
  }
  return {
    ...updated,
    bestStreak: Math.max(activity.bestStreak, dayStreak(updated, round.date)),
  }
}

// Practice of the last `count` days, oldest first, including empty days.
export function recentDays(
  activity: Activity,
  today: string,
  count = 7,
): ActivityDay[] {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index - count + 1)
    return (
      activity.days.find((day) => day.date === date) ?? {
        date,
        rounds: 0,
        answers: 0,
        correct: 0,
        learned: [],
      }
    )
  })
}

export interface AchievementStats {
  knownWords: number
  completedUnits: number
  completedBooks: Book[]
  streak: number
  bestStreak: number
  rounds: number
  perfectRounds: number
  modes: number
}

// A book counts as completed when all of its numbered units are completed.
export function achievementStats(
  units: VocabularyUnit[],
  progress: LearningProgress,
  activity: Activity,
  today: string,
): AchievementStats {
  const completed = units.filter((unit) => isUnitCompleted(unit, progress))
  return {
    knownWords: units.reduce(
      (total, unit) => total + summarizeUnitProgress(unit, progress).known.length,
      0,
    ),
    completedUnits: completed.length,
    completedBooks: books.filter((book) => {
      const bookUnits = units.filter(
        (unit) => unit.book === book && typeof unit.unit === 'number',
      )
      return (
        bookUnits.length > 0 &&
        bookUnits.every((unit) => completed.includes(unit))
      )
    }),
    streak: dayStreak(activity, today),
    bestStreak: activity.bestStreak,
    rounds: activity.rounds,
    perfectRounds: activity.perfectRounds,
    modes: activity.modes.length,
  }
}

export type BadgeIcon =
  | 'footprints'
  | 'star'
  | 'gem'
  | 'book'
  | 'trophy'
  | 'crown'
  | 'flame'
  | 'shapes'
  | 'rocket'

export interface Badge {
  id: string
  title: string
  description: string
  icon: BadgeIcon
  goal: number
  value: (stats: AchievementStats) => number
  book?: Book
}

const wordBadge = (goal: number, title: string): Badge => ({
  id: `words-${goal}`,
  title,
  description: `Know ${goal} words`,
  icon: 'gem',
  goal,
  value: (stats) => stats.knownWords,
})
const streakBadge = (goal: number, title: string): Badge => ({
  id: `streak-${goal}`,
  title,
  description: `Practise ${goal} days in a row`,
  icon: 'flame',
  goal,
  value: (stats) => stats.bestStreak,
})

export const badges: Badge[] = [
  {
    id: 'first-round',
    title: 'First steps',
    description: 'Finish your first round',
    icon: 'footprints',
    goal: 1,
    value: (stats) => stats.rounds,
  },
  {
    id: 'perfect-round',
    title: 'Perfect!',
    description: 'Get every word right in a round',
    icon: 'star',
    goal: 1,
    value: (stats) => stats.perfectRounds,
  },
  {
    id: 'perfect-10',
    title: 'Star collector',
    description: 'Play 10 perfect rounds',
    icon: 'star',
    goal: 10,
    value: (stats) => stats.perfectRounds,
  },
  {
    id: 'all-modes',
    title: 'All-rounder',
    description: 'Try all three practice modes',
    icon: 'shapes',
    goal: 3,
    value: (stats) => stats.modes,
  },
  {
    id: 'rounds-50',
    title: 'Busy bee',
    description: 'Finish 50 rounds',
    icon: 'rocket',
    goal: 50,
    value: (stats) => stats.rounds,
  },
  wordBadge(10, 'Word finder'),
  wordBadge(50, 'Word collector'),
  wordBadge(100, 'Word hoarder'),
  wordBadge(250, 'Word wizard'),
  wordBadge(500, 'Word champion'),
  wordBadge(1000, 'Word legend'),
  {
    id: 'units-1',
    title: 'Unit done!',
    description: 'Complete your first unit',
    icon: 'book',
    goal: 1,
    value: (stats) => stats.completedUnits,
  },
  {
    id: 'units-5',
    title: 'Unit explorer',
    description: 'Complete 5 units',
    icon: 'book',
    goal: 5,
    value: (stats) => stats.completedUnits,
  },
  {
    id: 'units-10',
    title: 'Unit master',
    description: 'Complete 10 units',
    icon: 'trophy',
    goal: 10,
    value: (stats) => stats.completedUnits,
  },
  streakBadge(3, 'Warming up'),
  streakBadge(7, 'One week'),
  streakBadge(14, 'Two weeks'),
  streakBadge(30, 'On fire'),
  ...books.map(
    (book): Badge => ({
      id: `book-${book}`,
      title: `${book} master`,
      description: `Complete every unit of ${book}`,
      icon: 'crown',
      goal: 1,
      value: (stats) => Number(stats.completedBooks.includes(book)),
      book,
    }),
  ),
]

// Adds every badge whose goal is reached; earned badges are kept for good.
export function awardBadges(
  activity: Activity,
  stats: AchievementStats,
  date: string,
): { activity: Activity; earned: Badge[] } {
  const earned = badges.filter(
    (badge) =>
      !activity.badges[badge.id] && badge.value(stats) >= badge.goal,
  )
  if (!earned.length) return { activity, earned }
  const awarded = { ...activity.badges }
  for (const badge of earned) awarded[badge.id] = date
  return { activity: { ...activity, badges: awarded }, earned }
}
