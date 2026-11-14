import { addDays, badges, dayStreak, localDate, recentDays } from './activity'
import type { Activity, LearnedWord } from './activity'
import {
  isUnitCompleted,
  knownStreak,
  summarizeUnitProgress,
  unitLabel,
} from './vocabulary'
import type { Book, LearningProgress, VocabularyUnit } from './vocabulary'

// The weekly learning report for parents. It is built on the device and handed
// to the device's email app; nothing is sent without someone tapping Send.

export type ReportDay = 'friday' | 'sunday'
export const reportDays: ReportDay[] = ['friday', 'sunday']
export const maxReportEmails = 2

export interface WeeklyReportSettings {
  enabled: boolean
  emails: string[]
  day: ReportDay
  // Report day (YYYY-MM-DD) of the last report that was sent or skipped.
  lastReport: string | null
}

export function defaultWeeklyReport(): WeeklyReportSettings {
  return { enabled: false, emails: [], day: 'sunday', lastReport: null }
}

export function isEmailAddress(value: string): boolean {
  return /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>".]+$/.test(value.trim())
}

// Keeps at most two distinct valid addresses, so the report cannot be used to
// send mail to many people.
export function normalizeWeeklyReport(value: unknown): WeeklyReportSettings {
  const defaults = defaultWeeklyReport()
  if (!value || typeof value !== 'object') return defaults
  const saved = value as Partial<Record<keyof WeeklyReportSettings, unknown>>
  const emails: string[] = []
  for (const email of Array.isArray(saved.emails) ? saved.emails : []) {
    if (typeof email !== 'string' || !isEmailAddress(email)) continue
    const trimmed = email.trim()
    if (!emails.some((other) => other.toLowerCase() === trimmed.toLowerCase()))
      emails.push(trimmed)
  }
  return {
    enabled: saved.enabled === true,
    emails: emails.slice(0, maxReportEmails),
    day: reportDays.includes(saved.day as ReportDay)
      ? (saved.day as ReportDay)
      : defaults.day,
    lastReport:
      typeof saved.lastReport === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(saved.lastReport)
        ? saved.lastReport
        : null,
  }
}

// The most recent report day on or before `today`.
export function reportDate(today: string, day: ReportDay): string {
  const [year, month, date] = today.split('-').map(Number)
  const weekday = new Date(year, month - 1, date).getDay()
  const target = day === 'friday' ? 5 : 0
  return addDays(today, -((weekday - target + 7) % 7))
}

export function reportDue(settings: WeeklyReportSettings, today: string): boolean {
  return (
    settings.enabled &&
    settings.emails.length > 0 &&
    settings.lastReport !== reportDate(today, settings.day)
  )
}

export interface UnitInProgress {
  book: Book
  unit: VocabularyUnit['unit']
  known: number
  total: number
}

export interface MissedWord {
  book: Book
  unit: VocabularyUnit['unit']
  english: string
  german: string
  missed: number
}

export interface WeeklyReport {
  from: string
  to: string
  daysPractised: number
  streak: number
  rounds: number
  answers: number
  correct: number
  learned: LearnedWord[]
  inProgress: UnitInProgress[]
  completedUnits: number
  newBadges: string[]
  missed: MissedWord[]
}

// The last seven days up to `today`.
export function buildWeeklyReport(
  units: VocabularyUnit[],
  progress: LearningProgress,
  activity: Activity,
  today: string,
  preferredBooks: Book[],
): WeeklyReport {
  const days = recentDays(activity, today, 7)
  const from = days[0].date
  const learned: LearnedWord[] = []
  for (const day of days)
    for (const word of day.learned)
      if (
        !learned.some(
          (other) =>
            other.book === word.book &&
            other.unit === word.unit &&
            other.english === word.english,
        )
      )
        learned.push(word)
  const bookUnits = units.filter((unit) => preferredBooks.includes(unit.book))
  const inProgress = bookUnits
    .filter(
      (unit) =>
        typeof unit.unit === 'number' && !isUnitCompleted(unit, progress),
    )
    .map((unit) => ({
      unit,
      summary: summarizeUnitProgress(unit, progress),
    }))
    .filter(
      ({ summary }) =>
        summary.lastPracticedAt &&
        localDate(new Date(summary.lastPracticedAt)) >= from,
    )
    .map(({ unit, summary }) => ({
      book: unit.book,
      unit: unit.unit,
      known: summary.known.length,
      total: unit.entries.length,
    }))
  const missed = progress.records
    .filter(
      (record) =>
        preferredBooks.includes(record.book) &&
        record.incorrectAttempts >= 2 &&
        record.correctStreak < knownStreak &&
        localDate(new Date(record.lastPracticedAt)) >= from,
    )
    .sort((a, b) => b.incorrectAttempts - a.incorrectAttempts)
    .slice(0, 8)
    .map((record) => ({
      book: record.book,
      unit: record.unit,
      english: record.english,
      german: record.german,
      missed: record.incorrectAttempts,
    }))
  return {
    from,
    to: today,
    daysPractised: days.filter((day) => day.rounds > 0).length,
    streak: dayStreak(activity, today),
    rounds: days.reduce((total, day) => total + day.rounds, 0),
    answers: days.reduce((total, day) => total + day.answers, 0),
    correct: days.reduce((total, day) => total + day.correct, 0),
    learned,
    inProgress,
    completedUnits: bookUnits.filter((unit) => isUnitCompleted(unit, progress))
      .length,
    newBadges: badges
      .filter((badge) => {
        const earned = activity.badges[badge.id]
        return earned && earned >= from && earned <= today
      })
      .map((badge) => badge.title),
    missed,
  }
}

function longDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function reportSubject(report: WeeklyReport): string {
  return `OurLingo weekly report: ${longDate(report.from)} to ${longDate(report.to)}`
}

// Plain text, because email apps opened with a prepared message only take text.
// Long word lists are shortened to keep the message short enough for mail links.
export function reportText(report: WeeklyReport, maxWords = 40): string {
  const lines = [
    reportSubject(report),
    '',
    `Days practised: ${report.daysPractised} of 7`,
    `Daily streak: ${report.streak} ${report.streak === 1 ? 'day' : 'days'}`,
    `Rounds: ${report.rounds}, correct answers: ${report.correct} of ${report.answers}`,
    `Units completed so far: ${report.completedUnits}`,
  ]
  if (report.newBadges.length)
    lines.push(`New badges: ${report.newBadges.join(', ')}`)
  lines.push('', `Words learned this week: ${report.learned.length}`)
  let shown = 0
  const groups = new Map<string, LearnedWord[]>()
  for (const word of report.learned) {
    const key = `${word.book} ${unitLabel(word)}`
    groups.set(key, [...(groups.get(key) ?? []), word])
  }
  for (const [unit, words] of groups) {
    if (shown >= maxWords) break
    lines.push(`${unit}:`)
    for (const word of words.slice(0, maxWords - shown))
      lines.push(`- ${word.english} = ${word.german}`)
    shown += Math.min(words.length, maxWords - shown)
  }
  if (report.learned.length > shown)
    lines.push(`... and ${report.learned.length - shown} more`)
  if (report.inProgress.length) {
    lines.push('', 'Units in progress:')
    for (const unit of report.inProgress)
      lines.push(
        `- ${unit.book} ${unitLabel(unit)}: ${unit.known} of ${unit.total} words known, ${unit.total - unit.known} to go`,
      )
  }
  if (report.missed.length) {
    lines.push('', 'Words to practise:')
    for (const word of report.missed)
      lines.push(`- ${word.english} = ${word.german} (missed ${word.missed} times)`)
  }
  lines.push('', 'Sent from OurLingo. The report was created on the device.')
  return lines.join('\n')
}

export function mailtoLink(emails: string[], subject: string, body: string): string {
  return `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
