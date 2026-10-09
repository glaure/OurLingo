export interface Entry {
  english: string
  german: string
  example: string | null
  origin?: 'word-file'
  translationSource?: 'suggested' | 'parent'
}

export interface VocabularyUnit {
  schemaVersion: 1
  book: 'MORE! 1' | 'MORE! 2'
  unit: number
  title: string
  source: string
  reviewStatus: 'pending' | 'approved'
  entries: Entry[]
}

export const storageKey = 'ourlingo.more-1-unit-1.v1'
export const libraryStorageKey = 'ourlingo.library.v1'
export const bundledUnitFiles = [
  { book: 'MORE! 1', unit: 2, file: 'more-1-unit-2.json' },
  { book: 'MORE! 2', unit: 1, file: 'more-2-unit-1.json' },
  { book: 'MORE! 2', unit: 2, file: 'more-2-unit-2.json' },
  { book: 'MORE! 2', unit: 3, file: 'more-2-unit-3.json' },
] as const

export interface VocabularyLibrary {
  schemaVersion: 1
  units: VocabularyUnit[]
  bundledUnitKeys?: string[]
}

export function unitKey(unit: Pick<VocabularyUnit, 'book' | 'unit'>): string {
  return `${unit.book}:${unit.unit}`
}

export function isVocabularyLibrary(
  value: unknown,
): value is VocabularyLibrary {
  if (!value || typeof value !== 'object') return false
  const library = value as Partial<VocabularyLibrary>
  if (library.schemaVersion !== 1 || !Array.isArray(library.units)) return false
  if (
    library.bundledUnitKeys !== undefined &&
    (!Array.isArray(library.bundledUnitKeys) ||
      !library.bundledUnitKeys.every((key) => typeof key === 'string') ||
      new Set(library.bundledUnitKeys).size !== library.bundledUnitKeys.length)
  )
    return false
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
        first.book.localeCompare(second.book) || first.unit - second.unit,
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
  let merged: VocabularyLibrary = {
    ...library,
    bundledUnitKeys: [...installed],
  }
  for (const unit of bundled) {
    const key = unitKey(unit)
    if (installed.has(key)) continue
    const existing = merged.units.find((item) => unitKey(item) === key)
    if (!existing) merged = upsertUnit(merged, unit)
    else if (existing.reviewStatus === 'pending' && !existing.entries.length) {
      merged = upsertUnit(merged, { ...unit, title: existing.title })
    }
    installed.add(key)
  }
  return { ...merged, bundledUnitKeys: [...installed] }
}

export function isVocabularyUnit(value: unknown): value is VocabularyUnit {
  if (!value || typeof value !== 'object') return false
  const unit = value as Partial<VocabularyUnit>
  return (
    unit.schemaVersion === 1 &&
    (unit.book === 'MORE! 1' || unit.book === 'MORE! 2') &&
    Number.isInteger(unit.unit) &&
    Number(unit.unit) > 0 &&
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

export interface AnswerChoice {
  text: string
  correct: boolean
}

export function createAnswerChoices(
  entry: Entry,
  entries: Entry[],
  direction: 'english' | 'german',
  limit = 4,
): AnswerChoice[] {
  const opposite = direction === 'english' ? 'german' : 'english'
  const answers = new Set(acceptedAnswers(entry, direction))
  const prompts = new Set(acceptedAnswers(entry, opposite))
  const seen = new Set([normalizeAnswer(entry[direction])])
  const distractors = entries.filter((candidate) => {
    const label = normalizeAnswer(candidate[direction])
    if (seen.has(label)) return false
    if (
      acceptedAnswers(candidate, direction).some((answer) =>
        answers.has(answer),
      )
    )
      return false
    if (
      acceptedAnswers(candidate, opposite).some((prompt) => prompts.has(prompt))
    )
      return false
    seen.add(label)
    return true
  })
  if (!distractors.length || limit < 2) return []
  return createRound(
    [entry, ...createRound(distractors, limit - 1)],
    limit,
  ).map((candidate) => ({
    text: candidate[direction],
    correct: candidate === entry,
  }))
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
