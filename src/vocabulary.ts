export interface Entry {
  english: string
  german: string
  example: string | null
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
    unit.entries.length > 0 &&
    unit.entries.every((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Partial<Entry>
      return (
        typeof item.english === 'string' &&
        !!item.english.trim() &&
        typeof item.german === 'string' &&
        !!item.german.trim() &&
        (item.example === null || typeof item.example === 'string')
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

export function acceptedAnswers(
  entry: Entry,
  direction: 'english' | 'german',
): string[] {
  const text = direction === 'english' ? entry.english : entry.german
  const variants = text
    .split(/[;,]/)
    .map((part) => part.trim())
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
    const optional = variant.match(/^(.*?)\(([^=)]*)\)(.*)$/)
    if (optional) {
      const prefix = /^[a-zäöüß]+-$/u.test(optional[2])
        ? optional[2].slice(0, -1)
        : optional[2]
      answers.push(`${optional[1]}${prefix}${optional[3]}`.trim())
    }
    const contraction = variant.match(/^(.*?)\s*\(=\s*(.*?)\)(.*)$/)
    if (contraction) {
      answers.push(`${contraction[2]}${contraction[3]}`.trim())
    }
    if (direction === 'english' && variant.startsWith('to '))
      answers.push(variant.slice(3))
    if (direction === 'german') {
      const slash = variant.match(/[\p{L}]+(?:\/[\p{L}]+)+/u)
      if (slash) {
        const [base, ...alternatives] = slash[0].split('/')
        for (const alternative of [
          base,
          ...alternatives.map((part) => (part === 'e' ? `${base}e` : part)),
        ]) {
          answers.push(variant.replace(slash[0], alternative))
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
