export interface Entry {
  english: string
  german: string
  example: string | null
  // An English clue for the description practice direction.
  description?: string
  descriptionSource?: 'suggested' | 'parent'
  origin?: 'word-file'
  translationSource?: 'suggested' | 'parent'
}

// Add new MORE! books here; settings, filters and unit creation follow this list.
export const books = ['MORE! 1', 'MORE! 2', 'MORE! 3', 'MORE! 4'] as const
export type Book = (typeof books)[number]

export function bookNumber(book: Book): string {
  return book.replace('MORE! ', '')
}

export interface VocabularyUnit {
  schemaVersion: 1
  book: Book
  unit: number | 'irregular-verbs'
  title: string
  source: string
  reviewStatus: 'pending' | 'approved'
  entries: Entry[]
}

export const storageKey = 'ourlingo.more-1-unit-1.v1'
export const libraryStorageKey = 'ourlingo.library.v1'
export const bundledUnitFiles = [
  { book: 'MORE! 1', unit: 1, file: 'more-1-unit-1.json' },
  { book: 'MORE! 1', unit: 2, file: 'more-1-unit-2.json' },
  { book: 'MORE! 1', unit: 3, file: 'more-1-unit-3.json' },
  { book: 'MORE! 1', unit: 4, file: 'more-1-unit-4.json' },
  { book: 'MORE! 1', unit: 5, file: 'more-1-unit-5.json' },
  { book: 'MORE! 1', unit: 6, file: 'more-1-unit-6.json' },
  { book: 'MORE! 1', unit: 7, file: 'more-1-unit-7.json' },
  { book: 'MORE! 1', unit: 8, file: 'more-1-unit-8.json' },
  { book: 'MORE! 1', unit: 9, file: 'more-1-unit-9.json' },
  { book: 'MORE! 1', unit: 10, file: 'more-1-unit-10.json' },
  { book: 'MORE! 1', unit: 11, file: 'more-1-unit-11.json' },
  { book: 'MORE! 1', unit: 12, file: 'more-1-unit-12.json' },
  { book: 'MORE! 1', unit: 13, file: 'more-1-unit-13.json' },
  { book: 'MORE! 1', unit: 14, file: 'more-1-unit-14.json' },
  { book: 'MORE! 1', unit: 15, file: 'more-1-unit-15.json' },
  { book: 'MORE! 2', unit: 1, file: 'more-2-unit-1.json' },
  { book: 'MORE! 2', unit: 2, file: 'more-2-unit-2.json' },
  { book: 'MORE! 2', unit: 3, file: 'more-2-unit-3.json' },
  { book: 'MORE! 2', unit: 4, file: 'more-2-unit-4.json' },
  { book: 'MORE! 2', unit: 5, file: 'more-2-unit-5.json' },
  { book: 'MORE! 2', unit: 6, file: 'more-2-unit-6.json' },
  { book: 'MORE! 2', unit: 7, file: 'more-2-unit-7.json' },
  { book: 'MORE! 2', unit: 8, file: 'more-2-unit-8.json' },
  { book: 'MORE! 2', unit: 9, file: 'more-2-unit-9.json' },
  { book: 'MORE! 2', unit: 10, file: 'more-2-unit-10.json' },
  { book: 'MORE! 2', unit: 11, file: 'more-2-unit-11.json' },
  { book: 'MORE! 2', unit: 12, file: 'more-2-unit-12.json' },
  { book: 'MORE! 2', unit: 13, file: 'more-2-unit-13.json' },
  { book: 'MORE! 2', unit: 14, file: 'more-2-unit-14.json' },
  { book: 'MORE! 2', unit: 15, file: 'more-2-unit-15.json' },
  { book: 'MORE! 2', unit: 'irregular-verbs', file: 'more-2-irregular-verbs.json' },
  { book: 'MORE! 3', unit: 1, file: 'more-3-unit-1.json' },
  { book: 'MORE! 3', unit: 2, file: 'more-3-unit-2.json' },
  { book: 'MORE! 3', unit: 3, file: 'more-3-unit-3.json' },
  { book: 'MORE! 3', unit: 4, file: 'more-3-unit-4.json' },
  { book: 'MORE! 3', unit: 5, file: 'more-3-unit-5.json' },
  { book: 'MORE! 3', unit: 6, file: 'more-3-unit-6.json' },
  { book: 'MORE! 3', unit: 7, file: 'more-3-unit-7.json' },
  { book: 'MORE! 3', unit: 8, file: 'more-3-unit-8.json' },
  { book: 'MORE! 3', unit: 9, file: 'more-3-unit-9.json' },
  { book: 'MORE! 3', unit: 10, file: 'more-3-unit-10.json' },
  { book: 'MORE! 3', unit: 11, file: 'more-3-unit-11.json' },
  { book: 'MORE! 3', unit: 12, file: 'more-3-unit-12.json' },
  { book: 'MORE! 3', unit: 13, file: 'more-3-unit-13.json' },
  { book: 'MORE! 3', unit: 14, file: 'more-3-unit-14.json' },
  { book: 'MORE! 4', unit: 1, file: 'more-4-unit-1.json' },
  { book: 'MORE! 4', unit: 2, file: 'more-4-unit-2.json' },
  { book: 'MORE! 4', unit: 3, file: 'more-4-unit-3.json' },
  { book: 'MORE! 4', unit: 4, file: 'more-4-unit-4.json' },
  { book: 'MORE! 4', unit: 5, file: 'more-4-unit-5.json' },
  { book: 'MORE! 4', unit: 6, file: 'more-4-unit-6.json' },
  { book: 'MORE! 4', unit: 7, file: 'more-4-unit-7.json' },
  { book: 'MORE! 4', unit: 8, file: 'more-4-unit-8.json' },
  { book: 'MORE! 4', unit: 9, file: 'more-4-unit-9.json' },
  { book: 'MORE! 4', unit: 10, file: 'more-4-unit-10.json' },
  { book: 'MORE! 4', unit: 11, file: 'more-4-unit-11.json' },
  { book: 'MORE! 4', unit: 12, file: 'more-4-unit-12.json' },
  { book: 'MORE! 4', unit: 13, file: 'more-4-unit-13.json' },
  { book: 'MORE! 4', unit: 14, file: 'more-4-unit-14.json' },
] as const

export interface VocabularyLibrary {
  schemaVersion: 1
  units: VocabularyUnit[]
  bundledUnitKeys?: string[]
  // Bundled units whose suggested descriptions were offered to this library.
  describedUnitKeys?: string[]
}

export interface LearningProgressRecord {
  book: VocabularyUnit['book']
  unit: VocabularyUnit['unit']
  english: string
  german: string
  correctAttempts: number
  incorrectAttempts: number
  correctStreak: number
  lastPracticedAt: string
}

export interface LearningProgress {
  schemaVersion: 1
  records: LearningProgressRecord[]
}

export interface PracticeAttempt {
  english: string
  german: string
  correct: boolean
}

export function unitKey(unit: Pick<VocabularyUnit, 'book' | 'unit'>): string {
  return `${unit.book}:${unit.unit}`
}

export function unitLabel(unit: Pick<VocabularyUnit, 'unit'>): string {
  return unit.unit === 'irregular-verbs' ? 'Irregular Verbs' : `Unit ${unit.unit}`
}

function isUnitIdentity(book: unknown, unit: unknown): boolean {
  return (
    books.includes(book as Book) &&
    ((typeof unit === 'number' && Number.isInteger(unit) && unit > 0) ||
      (book === 'MORE! 2' && unit === 'irregular-verbs'))
  )
}

export const learningProgressStorageKey = 'ourlingo.learning.v1'

export function isLearningProgress(value: unknown): value is LearningProgress {
  if (!value || typeof value !== 'object') return false
  const progress = value as Partial<LearningProgress>
  return (
    progress.schemaVersion === 1 &&
    Array.isArray(progress.records) &&
    progress.records.every((record) => {
      if (!record || typeof record !== 'object') return false
      const item = record as Partial<LearningProgressRecord>
      return (
        isUnitIdentity(item.book, item.unit) &&
        typeof item.english === 'string' &&
        typeof item.german === 'string' &&
        Number.isInteger(item.correctAttempts) &&
        Number(item.correctAttempts) >= 0 &&
        Number.isInteger(item.incorrectAttempts) &&
        Number(item.incorrectAttempts) >= 0 &&
        Number.isInteger(item.correctStreak) &&
        Number(item.correctStreak) >= 0 &&
        typeof item.lastPracticedAt === 'string'
      )
    })
  )
}

export function updateLearningProgress(
  progress: LearningProgress,
  unit: Pick<VocabularyUnit, 'book' | 'unit'>,
  attempts: PracticeAttempt[],
  lastPracticedAt: string,
): LearningProgress {
  const records = [...progress.records]
  for (const attempt of attempts) {
    const index = records.findIndex(
      (record) =>
        record.book === unit.book &&
        record.unit === unit.unit &&
        record.english === attempt.english,
    )
    const previous = index === -1 ? null : records[index]
    const record: LearningProgressRecord = {
      book: unit.book,
      unit: unit.unit,
      english: attempt.english,
      german: attempt.german,
      correctAttempts:
        (previous?.correctAttempts ?? 0) + Number(attempt.correct),
      incorrectAttempts:
        (previous?.incorrectAttempts ?? 0) + Number(!attempt.correct),
      correctStreak: attempt.correct ? (previous?.correctStreak ?? 0) + 1 : 0,
      lastPracticedAt,
    }
    if (index === -1) records.push(record)
    else records[index] = record
  }
  return { schemaVersion: 1, records }
}

// A word is known after this many correct first attempts in a row.
export const knownStreak = 3

export function isUnitCompleted(
  unit: VocabularyUnit,
  progress: LearningProgress,
): boolean {
  if (!unit.entries.length) return false
  const streaks = new Map(
    progress.records
      .filter((record) => record.book === unit.book && record.unit === unit.unit)
      .map((record) => [record.english, record.correctStreak]),
  )
  return unit.entries.every(
    (entry) => (streaks.get(entry.english) ?? 0) >= knownStreak,
  )
}

export interface UnitProgressSummary {
  known: Entry[]
  learning: Entry[]
  notTried: Entry[]
  records: Map<string, LearningProgressRecord>
  correctAttempts: number
  incorrectAttempts: number
  lastPracticedAt: string | null
}

export function summarizeUnitProgress(
  unit: VocabularyUnit,
  progress: LearningProgress,
): UnitProgressSummary {
  const records = new Map(
    progress.records
      .filter((record) => record.book === unit.book && record.unit === unit.unit)
      .map((record) => [record.english, record]),
  )
  const summary: UnitProgressSummary = {
    known: [],
    learning: [],
    notTried: [],
    records,
    correctAttempts: 0,
    incorrectAttempts: 0,
    lastPracticedAt: null,
  }
  for (const entry of unit.entries) {
    const record = records.get(entry.english)
    if (!record) {
      summary.notTried.push(entry)
      continue
    }
    if (record.correctStreak >= knownStreak) summary.known.push(entry)
    else if (record.correctAttempts + record.incorrectAttempts > 0)
      summary.learning.push(entry)
    summary.correctAttempts += record.correctAttempts
    summary.incorrectAttempts += record.incorrectAttempts
    if (!summary.lastPracticedAt || record.lastPracticedAt > summary.lastPracticedAt)
      summary.lastPracticedAt = record.lastPracticedAt
  }
  return summary
}

// Completed units stay available for revision, and each book also offers its
// first unfinished approved unit. Irregular Verbs is a reference list used
// alongside every unit, so it is always offered.
export function progressionUnits(
  units: VocabularyUnit[],
  progress: LearningProgress,
): VocabularyUnit[] {
  const upcoming = new Set<string>()
  for (const book of books) {
    const next = units
      .filter(
        (unit) =>
          unit.book === book &&
          typeof unit.unit === 'number' &&
          unit.reviewStatus === 'approved' &&
          !isUnitCompleted(unit, progress),
      )
      .sort((a, b) => Number(a.unit) - Number(b.unit))[0]
    if (next) upcoming.add(unitKey(next))
  }
  return units.filter(
    (unit) =>
      unit.unit === 'irregular-verbs' ||
      upcoming.has(unitKey(unit)) ||
      isUnitCompleted(unit, progress),
  )
}

export function isVocabularyLibrary(
  value: unknown,
): value is VocabularyLibrary {
  if (!value || typeof value !== 'object') return false
  const library = value as Partial<VocabularyLibrary>
  if (library.schemaVersion !== 1 || !Array.isArray(library.units)) return false
  for (const keys of [library.bundledUnitKeys, library.describedUnitKeys]) {
    if (
      keys !== undefined &&
      (!Array.isArray(keys) ||
        !keys.every((key) => typeof key === 'string') ||
        new Set(keys).size !== keys.length)
    )
      return false
  }
  if (!library.units.every(isVocabularyUnit)) return false
  if (
    library.units.some(
      (unit) =>
        unit.reviewStatus === 'approved' && validateEntries(unit.entries),
    )
  )
    return false
  return new Set(library.units.map(unitKey)).size === library.units.length
}

export function upsertUnit(
  library: VocabularyLibrary,
  unit: VocabularyUnit,
): VocabularyLibrary {
  const units = library.units.filter(
    (existing) => unitKey(existing) !== unitKey(unit),
  )
  return {
    ...library,
    schemaVersion: 1,
    units: [...units, unit].sort(
      (first, second) =>
        first.book.localeCompare(second.book) ||
        (typeof first.unit === 'number' ? first.unit : Infinity) -
          (typeof second.unit === 'number' ? second.unit : Infinity),
    ),
  }
}

export function mergeBundledUnits(
  library: VocabularyLibrary,
  bundled: VocabularyUnit[],
): VocabularyLibrary {
  const installed = new Set(
    library.bundledUnitKeys ?? [unitKey({ book: 'MORE! 1', unit: 1 })],
  )
  const described = new Set(library.describedUnitKeys ?? [])
  let merged: VocabularyLibrary = {
    ...library,
    bundledUnitKeys: [...installed],
  }
  for (const unit of bundled) {
    const key = unitKey(unit)
    const existing = merged.units.find((item) => unitKey(item) === key)
    const approvedUnit = { ...unit, reviewStatus: 'approved' as const }
    if (installed.has(key)) {
      if (existing && existing.reviewStatus !== 'approved')
        merged = upsertUnit(merged, { ...existing, reviewStatus: 'approved' })
    } else {
      if (!existing) merged = upsertUnit(merged, approvedUnit)
      else if (existing.reviewStatus === 'pending' && !existing.entries.length) {
        merged = upsertUnit(merged, { ...approvedUnit, title: existing.title })
      }
      installed.add(key)
    }
    if (!described.has(key)) {
      const current = merged.units.find((item) => unitKey(item) === key)
      if (current)
        merged = upsertUnit(merged, withSuggestedDescriptions(current, unit))
      described.add(key)
    }
  }
  return {
    ...merged,
    bundledUnitKeys: [...installed],
    describedUnitKeys: [...described],
  }
}

// Adds bundled descriptions to saved words that never had one. Descriptions
// a parent edited or cleared are kept.
export function withSuggestedDescriptions(
  unit: VocabularyUnit,
  bundled: VocabularyUnit,
): VocabularyUnit {
  const suggestions = new Map(
    bundled.entries
      .filter((entry) => entry.description?.trim())
      .map((entry) => [normalizeAnswer(entry.english), entry.description!]),
  )
  const entries = unit.entries.map((entry) => {
    const description = suggestions.get(normalizeAnswer(entry.english))
    return entry.description !== undefined || !description
      ? entry
      : { ...entry, description, descriptionSource: 'suggested' as const }
  })
  return entries.some((entry, index) => entry !== unit.entries[index])
    ? { ...unit, entries }
    : unit
}

export function isVocabularyUnit(value: unknown): value is VocabularyUnit {
  if (!value || typeof value !== 'object') return false
  const unit = value as Partial<VocabularyUnit>
  return (
    unit.schemaVersion === 1 &&
    isUnitIdentity(unit.book, unit.unit) &&
    typeof unit.title === 'string' &&
    typeof unit.source === 'string' &&
    (unit.reviewStatus === 'pending' || unit.reviewStatus === 'approved') &&
    Array.isArray(unit.entries) &&
    (unit.entries.length > 0 || unit.reviewStatus === 'pending') &&
    unit.entries.every((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Partial<Entry>
      return (
        typeof item.english === 'string' &&
        !!item.english.trim() &&
        typeof item.german === 'string' &&
        !!item.german.trim() &&
        (item.example === null || typeof item.example === 'string') &&
        (item.description === undefined ||
          typeof item.description === 'string') &&
        (item.descriptionSource === undefined ||
          item.descriptionSource === 'suggested' ||
          item.descriptionSource === 'parent') &&
        (item.origin === undefined || item.origin === 'word-file') &&
        (item.translationSource === undefined ||
          item.translationSource === 'suggested' ||
          item.translationSource === 'parent')
      )
    })
  )
}

export function validateEntries(entries: Entry[]): string | null {
  if (!entries.length) return 'Add at least one word or phrase before saving.'
  const incomplete = entries.findIndex(
    (entry) => !entry.english.trim() || !entry.german.trim(),
  )
  if (incomplete !== -1)
    return `Entry ${incomplete + 1} needs both English and German.`
  const words = entries.map((entry) => normalizeAnswer(entry.english))
  if (new Set(words).size !== words.length)
    return 'Two entries have the same English text. Please check them.'
  return null
}

export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLocaleLowerCase('de')
    .normalize('NFC')
    .replace(/[’‘]/g, "'")
    .replace(/[.!?…]+$/g, '')
    .replace(/\s+/g, ' ')
}

function optionalAnswerForms(text: string): string[] {
  const group = text.match(/\(([^()]*)\)/)
  if (!group || group[1].startsWith('=') || /^pl\.?\s+/i.test(group[1]))
    return [text]
  const parts = group[1].split('/').map((part) => {
    const prefix = part.trim()
    return /^[\p{L}]+-$/u.test(prefix) ? prefix.slice(0, -1) : prefix
  })
  return ['', ...parts].flatMap((part) =>
    optionalAnswerForms(text.replace(group[0], part)),
  )
}

export function acceptedAnswers(
  entry: Entry,
  direction: 'english' | 'german',
): string[] {
  const text = direction === 'english' ? entry.english : entry.german
  const variants = text
    .split(/[;,]/)
    .map((part) => part.trim())
    .map((part) =>
      direction === 'german' ? part.replace(/^hier:\s*/i, '') : part,
    )
    .filter(Boolean)
  const answers: string[] = []
  for (const variant of variants) {
    answers.push(variant)
    const withoutParentheses = variant
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (withoutParentheses && withoutParentheses !== variant)
      answers.push(withoutParentheses)
    answers.push(...optionalAnswerForms(variant))
    const alias = variant.match(/\(([^()]+)\)/)?.[1]
    if (direction === 'english' && alias && !alias.startsWith('=')) {
      if (alias.includes("'") || /^[A-Z]{2,5}$/.test(alias)) answers.push(alias)
      if (/^pl\.?\s+/i.test(alias))
        answers.push(alias.replace(/^pl\.?\s+/i, ''))
    }
    const contraction = variant.match(/^(.*?)\s*\(=\s*(.*?)\)(.*)$/)
    if (contraction) {
      answers.push(`${contraction[2]}${contraction[3]}`.trim())
    }
    if (direction === 'english' && variant.startsWith('to '))
      answers.push(variant.slice(3))
  }
  if (direction === 'english')
    answers.push(
      ...answers
        .filter((answer) => answer.startsWith('to '))
        .map((answer) => answer.slice(3)),
    )
  if (direction === 'german') {
    for (const answer of [...answers]) {
      const slash = answer.match(/[\p{L}]+(?:\/[\p{L}]+)+/u)
      if (slash) {
        const [base, ...alternatives] = slash[0].split('/')
        for (const alternative of [
          base,
          ...alternatives.map((part) =>
            ['e', 'r', 'in', 'n'].includes(part) ? `${base}${part}` : part,
          ),
        ]) {
          answers.push(answer.replace(slash[0], alternative))
        }
      }
    }
  }
  return [...new Set(answers.map(normalizeAnswer))]
}

export function isCorrectAnswer(
  entry: Entry,
  answer: string,
  direction: 'english' | 'german',
): boolean {
  const normalized = normalizeAnswer(answer)
  return (
    normalized.length > 0 &&
    acceptedAnswers(entry, direction).includes(normalized)
  )
}

// 'english' and 'german' name the answer language; 'description' shows an
// English description and asks for the English word.
export type PracticeDirection = 'english' | 'german' | 'description'

export function answerSide(direction: PracticeDirection): 'english' | 'german' {
  return direction === 'german' ? 'german' : 'english'
}

export function promptText(entry: Entry, direction: PracticeDirection): string {
  if (direction === 'english') return entry.german
  if (direction === 'german') return entry.english
  return entry.description?.trim() ?? ''
}

export function practiceEntries(
  entries: Entry[],
  direction: PracticeDirection,
): Entry[] {
  return direction === 'description'
    ? entries.filter((entry) => promptText(entry, direction))
    : entries
}

function promptKeys(entry: Entry, direction: PracticeDirection): string[] {
  return direction === 'description'
    ? [normalizeAnswer(promptText(entry, direction))].filter(Boolean)
    : acceptedAnswers(entry, direction === 'english' ? 'german' : 'english')
}

// Descriptions can fit several words with the same meaning ("What's the
// time?" and "What time is it?"), so any word sharing the description counts.
export function isCorrectPracticeAnswer(
  entry: Entry,
  entries: Entry[],
  answer: string,
  direction: PracticeDirection,
): boolean {
  if (isCorrectAnswer(entry, answer, answerSide(direction))) return true
  if (direction !== 'description') return false
  const description = normalizeAnswer(promptText(entry, direction))
  return entries.some(
    (other) =>
      other !== entry &&
      normalizeAnswer(promptText(other, direction)) === description &&
      isCorrectAnswer(other, answer, 'english'),
  )
}

export interface AnswerChoice {
  text: string
  correct: boolean
}

export function createAnswerChoices(
  entry: Entry,
  entries: Entry[],
  direction: PracticeDirection,
  limit = 4,
): AnswerChoice[] {
  const side = answerSide(direction)
  const answers = new Set(acceptedAnswers(entry, side))
  const prompts = new Set(promptKeys(entry, direction))
  const seen = new Set([normalizeAnswer(entry[side])])
  const distractors = entries.filter((candidate) => {
    const label = normalizeAnswer(candidate[side])
    if (seen.has(label)) return false
    if (
      acceptedAnswers(candidate, side).some((answer) => answers.has(answer))
    )
      return false
    if (promptKeys(candidate, direction).some((prompt) => prompts.has(prompt)))
      return false
    seen.add(label)
    return true
  })
  if (!distractors.length || limit < 2) return []
  return createRound(
    [entry, ...createRound(distractors, limit - 1)],
    limit,
  ).map((candidate) => ({
    text: candidate[side],
    correct: candidate === entry,
  }))
}

// Pairs English with German, or with descriptions when the direction is
// 'description'. Entries whose answers overlap never share a board.
export function createMatchingRound(
  entries: Entry[],
  limit = 5,
  priority: Entry[] = [],
  direction: PracticeDirection = 'english',
): Entry[] {
  const pairDirection = direction === 'description' ? 'description' : 'english'
  const candidates = practiceEntries(entries, pairDirection)
  const selected: Entry[] = []
  const ordered = [
    ...priority.filter((entry) => candidates.includes(entry)),
    ...createRound(candidates, candidates.length),
  ]
  for (const entry of ordered) {
    const english = new Set(acceptedAnswers(entry, 'english'))
    const paired = new Set(promptKeys(entry, pairDirection))
    if (
      selected.some(
        (other) =>
          acceptedAnswers(other, 'english').some((answer) =>
            english.has(answer),
          ) ||
          promptKeys(other, pairDirection).some((key) => paired.has(key)),
      )
    )
      continue
    selected.push(entry)
    if (selected.length >= limit) break
  }
  return selected.length >= 2 && limit >= 2 ? selected : []
}

export function createRound(entries: Entry[], limit = 10): Entry[] {
  const shuffled = [...entries]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const otherIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[otherIndex]] = [
      shuffled[otherIndex],
      shuffled[index],
    ]
  }
  return shuffled.slice(0, limit)
}
