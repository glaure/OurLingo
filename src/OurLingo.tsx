import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CloudOff,
  FileCheck2,
  GraduationCap,
  Languages,
  Keyboard,
  Link2,
  ListChecks,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  bookNumber,
  books,
  bundledUnitFiles,
  createAnswerChoices,
  createMatchingRound,
  createRound,
  isLearningProgress,
  isCorrectAnswer,
  isUnitCompleted,
  isVocabularyLibrary,
  isVocabularyUnit,
  knownStreak,
  learningProgressStorageKey,
  libraryStorageKey,
  mergeBundledUnits,
  progressionUnits,
  storageKey,
  unitKey,
  unitLabel,
  upsertUnit,
  updateLearningProgress,
  validateEntries,
} from './vocabulary'
import type {
  AnswerChoice,
  Book,
  Entry,
  LearningProgress,
  VocabularyLibrary,
  VocabularyUnit,
} from './vocabulary'
import {
  applyTheme,
  loadSettings,
  saveSettings,
  themePreferences,
  unitProgressions,
  watchSystemTheme,
} from './settings'
import type { Settings, ThemePreference, UnitProgression } from './settings'
import './OurLingo.css'

type View = 'library' | 'review' | 'practice' | 'report' | 'settings'
type Direction = 'english' | 'german'
type PracticeMode = 'typed' | 'multiple-choice' | 'matching'
type Result = { entry: Entry; answer: string; correct: boolean }
declare const __APP_VERSION__: string
const matchingPasses = 3
const themeLabels: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}
const progressionLabels: Record<UnitProgression, string> = {
  all: 'All units',
  'completed-and-next': 'Completed + next',
}

function loadLearningProgress(): LearningProgress {
  const empty: LearningProgress = { schemaVersion: 1, records: [] }
  try {
    const saved = localStorage.getItem(learningProgressStorageKey)
    if (!saved) return empty
    const parsed: unknown = JSON.parse(saved)
    return isLearningProgress(parsed) ? parsed : empty
  } catch {
    return empty
  }
}

export default function OurLingo() {
  const [library, setLibrary] = useState<VocabularyLibrary | null>(null)
  const [learningProgress, setLearningProgress] =
    useState<LearningProgress>(loadLearningProgress)
  const [unit, setUnit] = useState<VocabularyUnit | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [warning, setWarning] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [space, setSpace] = useState<'kid' | 'parent'>('kid')
  const [view, setView] = useState<View>('library')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [bookFilter, setBookFilter] = useState<'all' | Book>('all')
  const [showCreator, setShowCreator] = useState(false)
  const [newBook, setNewBook] = useState<Book>('MORE! 1')
  const [newNumber, setNewNumber] = useState('2')
  const [newTitle, setNewTitle] = useState('')
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState<Direction>('english')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('typed')
  const [roundSize, setRoundSize] = useState(10)
  const [round, setRound] = useState<Entry[]>([])
  const [roundChoices, setRoundChoices] = useState<AnswerChoice[][]>([])
  const [results, setResults] = useState<Result[]>([])
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Result | null>(null)
  const [matchingEnglish, setMatchingEnglish] = useState<number[]>([])
  const [matchingGerman, setMatchingGerman] = useState<number[]>([])
  const [matchingSelection, setMatchingSelection] = useState<{
    side: Direction
    index: number
  } | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [matchingMistakes, setMatchingMistakes] = useState<number[]>([])
  const [matchingFirstPassMistakes, setMatchingFirstPassMistakes] = useState<
    number[]
  >([])
  const [matchingPass, setMatchingPass] = useState(1)
  const [matchingFeedback, setMatchingFeedback] = useState<
    'idle' | 'correct' | 'incorrect'
  >('idle')
  const [matchingError, setMatchingError] = useState<{
    english: number
    german: number
  } | null>(null)
  const answerInput = useRef<HTMLInputElement>(null)
  const choiceInput = useRef<HTMLInputElement>(null)
  const matchingInput = useRef<HTMLButtonElement>(null)
  const dirty =
    !!unit && JSON.stringify(unit.entries) !== JSON.stringify(entries)
  const approved = unit?.reviewStatus === 'approved' && !dirty
  const current = round[results.length]
  const choices = roundChoices[results.length] || []
  const complete = round.length > 0 && results.length === round.length
  const preferredBooks = settings.books
  const activeBookFilter =
    bookFilter !== 'all' && preferredBooks.includes(bookFilter)
      ? bookFilter
      : 'all'
  const preferredUnits =
    library?.units.filter((item) => preferredBooks.includes(item.book)) || []
  const progressionActive =
    space === 'kid' && settings.progression === 'completed-and-next'
  const spaceUnits = progressionActive
    ? progressionUnits(preferredUnits, learningProgress)
    : preferredUnits
  const libraryUnits = spaceUnits.filter(
    (item) => activeBookFilter === 'all' || item.book === activeBookFilter,
  )
  const unitView = view === 'review' || view === 'practice'

  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme !== 'system') return
    return watchSystemTheme(() => applyTheme('system'))
  }, [settings.theme])
  const missed = results
    .filter((result) => !result.correct)
    .map((result) => result.entry)

  useEffect(() => {
    const controller = new AbortController()
    async function installBundledUnits(
      currentLibrary: VocabularyLibrary,
    ): Promise<VocabularyLibrary> {
      let updated = currentLibrary
      const failed: string[] = []
      for (const bundled of bundledUnitFiles) {
        const key = unitKey(bundled)
        const installed = updated.bundledUnitKeys?.includes(key)
        const existing = updated.units.find((unit) => unitKey(unit) === key)
        if (installed && (!existing || existing.reviewStatus === 'approved'))
          continue
        if (controller.signal.aborted) return updated
        try {
          const response = await fetch(
            `${import.meta.env.BASE_URL}data/${bundled.file}`,
            { signal: controller.signal },
          )
          if (!response.ok) throw new Error('Unit unavailable')
          const data: unknown = await response.json()
          if (
            !isVocabularyUnit(data) ||
            data.book !== bundled.book ||
            data.unit !== bundled.unit ||
            validateEntries(data.entries)
          )
            throw new Error('Invalid unit')
          if (controller.signal.aborted) return updated
          const merged = mergeBundledUnits(updated, [data])
          localStorage.setItem(libraryStorageKey, JSON.stringify(merged))
          updated = merged
        } catch {
          if (controller.signal.aborted) return updated
          failed.push(`${bundled.book} ${unitLabel(bundled)}`)
        }
      }
      if (failed.length)
        setWarning(
          `${failed.join(', ')} could not be added. Your existing vocabulary remains available. Refresh to try again.`,
        )
      return updated
    }
    async function load() {
      setLoadError('')
      try {
        const stored = localStorage.getItem(libraryStorageKey)
        if (stored) {
          const parsed: unknown = JSON.parse(stored)
          if (!isVocabularyLibrary(parsed))
            throw new Error('Invalid saved library')
          const refreshed = await installBundledUnits(parsed)
          if (controller.signal.aborted) return
          setLibrary(refreshed)
          setUnit(refreshed.units[0] || null)
          setEntries(refreshed.units[0]?.entries || [])
          return
        }
      } catch {
        setWarning(
          'The saved library could not be loaded. Recovering the original unit instead.',
        )
      }
      let initialUnit: VocabularyUnit | null = null
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed: unknown = JSON.parse(stored)
          if (
            !isVocabularyUnit(parsed) ||
            parsed.book !== 'MORE! 1' ||
            parsed.unit !== 1 ||
            validateEntries(parsed.entries)
          )
            throw new Error('Invalid saved unit')
          initialUnit = parsed
        }
      } catch {
        setWarning(
          'Saved vocabulary could not be loaded. The original transcription is shown instead.',
        )
      }
      try {
        if (!initialUnit) {
          const response = await fetch(
            `${import.meta.env.BASE_URL}data/more-1-unit-1.json`,
            { signal: controller.signal },
          )
          if (!response.ok) throw new Error('Unit unavailable')
          const data: unknown = await response.json()
          if (!isVocabularyUnit(data)) throw new Error('Invalid unit')
          initialUnit = data
        }
        const initialLibrary = upsertUnit(
          {
            schemaVersion: 1,
            units: [],
            bundledUnitKeys: [unitKey(initialUnit)],
          },
          initialUnit,
        )
        const refreshed = await installBundledUnits(initialLibrary)
        if (controller.signal.aborted) return
        try {
          localStorage.setItem(libraryStorageKey, JSON.stringify(refreshed))
        } catch {
          setWarning(
            'This browser could not save the library. Vocabulary is available for this visit only.',
          )
        }
        setLibrary(refreshed)
        setUnit(initialUnit)
        setEntries(initialUnit.entries)
      } catch {
        if (!controller.signal.aborted)
          setLoadError('The vocabulary could not be loaded. Please try again.')
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (!dirty) return
    function preventLoss(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [dirty])

  useEffect(() => {
    if (view === 'practice' && current && !feedback) {
      if (practiceMode === 'typed') answerInput.current?.focus()
      else if (practiceMode === 'matching')
        matchingInput.current?.focus({ preventScroll: true })
      else choiceInput.current?.focus()
    }
  }, [view, current, feedback, practiceMode])

  useLayoutEffect(() => {
    if (view !== 'review') return
    let active = true
    function fitReviewFields() {
      if (!active) return
      const fields = Array.from(
        document.querySelectorAll<HTMLTextAreaElement>('.entry-field textarea'),
      )
      fields.forEach((field) => {
        field.style.height = 'auto'
      })
      const heights = fields.map((field) => field.scrollHeight + 2)
      fields.forEach((field, index) => {
        field.style.height = `${heights[index]}px`
      })
    }
    fitReviewFields()
    void document.fonts.ready.then(fitReviewFields)
    window.addEventListener('resize', fitReviewFields)
    return () => {
      active = false
      window.removeEventListener('resize', fitReviewFields)
    }
  }, [entries, view, query])

  function updateEntry(index: number, field: keyof Entry, value: string) {
    setEntries((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: field === 'example' && !value.trim() ? null : value,
              ...(entry.origin === 'word-file' && field === 'german'
                ? { translationSource: 'parent' as const }
                : {}),
            }
          : entry,
      ),
    )
    setMessage('')
  }

  function save() {
    if (!unit || !library || space !== 'parent') return
    const error = validateEntries(entries)
    if (error) {
      setWarning(error)
      return
    }
    const cleaned = entries.map((entry) => ({
      ...entry,
      english: entry.english.trim(),
      german: entry.german.trim(),
      example: entry.example?.trim() || null,
    }))
    const saved: VocabularyUnit = {
      ...unit,
      entries: cleaned,
      reviewStatus: 'approved',
    }
    try {
      const savedLibrary = upsertUnit(library, saved)
      localStorage.setItem(libraryStorageKey, JSON.stringify(savedLibrary))
      setLibrary(savedLibrary)
      setUnit(saved)
      setEntries(cleaned)
      setWarning('')
      setMessage('Vocabulary approved and saved on this device.')
    } catch {
      setWarning(
        'This browser could not save your vocabulary. Download a backup before closing this page.',
      )
    }
  }

  function download() {
    if (!unit) return
    const data = {
      ...unit,
      entries,
      reviewStatus: dirty ? 'pending' : unit.reviewStatus,
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `ourlingo-more-${bookNumber(unit.book)}-unit-${unit.unit}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function mayLeave(): boolean {
    if (dirty && !window.confirm('Discard the unsaved vocabulary changes?'))
      return false
    if (
      round.length &&
      !complete &&
      !window.confirm(
        'Leave this practice round? Your vocabulary will stay saved.',
      )
    )
      return false
    return true
  }

  function switchSpace() {
    if (!mayLeave()) return
    setSpace(space === 'kid' ? 'parent' : 'kid')
    setView('library')
    setEntries(unit?.entries || [])
    setShowCreator(false)
    setQuery('')
    setMessage('')
    setWarning('')
    resetRound()
  }

  function selectUnit(selected: VocabularyUnit) {
    if (space === 'kid' && selected.reviewStatus !== 'approved') return
    if (!mayLeave()) return
    setUnit(selected)
    setEntries(selected.entries)
    setView(space === 'kid' ? 'practice' : 'review')
    setQuery('')
    setMessage('')
    setWarning('')
    setShowCreator(false)
    resetRound()
  }

  function nextNumber(book: Book): string {
    return String(
      Math.max(
        0,
        ...(library?.units
          .filter((item) => item.book === book)
          .flatMap((item) => typeof item.unit === 'number' ? [item.unit] : []) || []),
      ) + 1,
    )
  }

  function beginUnit() {
    const book =
      activeBookFilter !== 'all'
        ? activeBookFilter
        : unit && preferredBooks.includes(unit.book)
          ? unit.book
          : preferredBooks[0]
    setNewBook(book)
    setNewNumber(nextNumber(book))
    setNewTitle('')
    setShowCreator(true)
    setWarning('')
  }

  function addUnit() {
    if (!library || space !== 'parent') return
    const number = Number(newNumber)
    if (!Number.isSafeInteger(number) || number < 1) {
      setWarning('Enter a positive whole unit number.')
      return
    }
    const created: VocabularyUnit = {
      schemaVersion: 1,
      book: newBook,
      unit: number,
      title: newTitle.trim() || `Unit ${number}`,
      source: 'Manually entered vocabulary',
      reviewStatus: 'pending',
      entries: [],
    }
    if (library.units.some((item) => unitKey(item) === unitKey(created))) {
      setWarning(
        `${newBook} Unit ${number} already exists. Open it to add vocabulary.`,
      )
      return
    }
    const next = upsertUnit(library, created)
    try {
      localStorage.setItem(libraryStorageKey, JSON.stringify(next))
      setLibrary(next)
      selectUnit(created)
    } catch {
      setWarning(
        'This browser could not save the new unit. No existing vocabulary was changed.',
      )
    }
  }

  function deleteUnit(selected: VocabularyUnit) {
    if (!library || space !== 'parent') return
    if (
      !window.confirm(
        `Delete ${selected.book} ${unitLabel(selected)} and all of its vocabulary?`,
      )
    )
      return
    const next: VocabularyLibrary = {
      ...library,
      units: library.units.filter(
        (item) => unitKey(item) !== unitKey(selected),
      ),
    }
    try {
      localStorage.setItem(libraryStorageKey, JSON.stringify(next))
      setLibrary(next)
      if (unit && unitKey(unit) === unitKey(selected)) {
        setUnit(next.units[0] || null)
        setEntries(next.units[0]?.entries || [])
      }
      setWarning('')
    } catch {
      setWarning(
        'This browser could not save the deletion. The unit has been kept.',
      )
    }
  }

  function updateSettings(next: Settings) {
    setSettings(next)
    if (!saveSettings(next))
      setWarning(
        'This browser could not save your settings. They apply until the app is closed.',
      )
  }

  function togglePreferredBook(book: Book) {
    const selected = preferredBooks.includes(book)
    if (selected && preferredBooks.length === 1) return
    updateSettings({
      ...settings,
      books: books.filter((item) =>
        item === book ? !selected : preferredBooks.includes(item),
      ),
    })
  }

  function goTo(next: View) {
    if (next === 'practice' && !approved) return
    if ((next === 'review' || next === 'report') && space !== 'parent') return
    if (next === view || !mayLeave()) return
    setView(next)
    setMessage('')
    setEntries(unit?.entries || [])
    setShowCreator(false)
    resetRound()
  }

  function resetRound() {
    setRound([])
    setRoundChoices([])
    setResults([])
    setAnswer('')
    setFeedback(null)
    setMatchingEnglish([])
    setMatchingGerman([])
    setMatchingSelection(null)
    setMatchedPairs([])
    setMatchingMistakes([])
    setMatchingFirstPassMistakes([])
    setMatchingPass(1)
    setMatchingFeedback('idle')
    setMatchingError(null)
  }
  function startRound(words = entries) {
    if (practiceMode === 'matching') {
      const nextRound = createMatchingRound(
        entries,
        5,
        words === entries ? [] : words,
      )
      if (!nextRound.length) {
        setWarning(
          'Matching pairs needs at least two distinct translations. You can still use typed answers.',
        )
        return
      }
      const english = createRound(nextRound, nextRound.length).map((entry) =>
        nextRound.indexOf(entry),
      )
      const german = createRound(nextRound, nextRound.length).map((entry) =>
        nextRound.indexOf(entry),
      )
      if (english.every((index, position) => index === german[position]))
        german.push(german.shift()!)
      resetRound()
      setRound(nextRound)
      setMatchingEnglish(english)
      setMatchingGerman(german)
      window.scrollTo({ top: 0, behavior: 'instant' })
      setWarning('')
      return
    }
    const options = new Map(
      words.map((entry) => [
        entry,
        practiceMode === 'multiple-choice'
          ? createAnswerChoices(entry, entries, direction)
          : [],
      ]),
    )
    const eligible =
      practiceMode === 'multiple-choice'
        ? words.filter((entry) => options.get(entry)!.length > 1)
        : words
    if (!eligible.length) {
      setWarning(
        'Multiple choice needs at least two distinct word-and-translation pairs. You can still use typed answers.',
      )
      return
    }
    const nextRound = createRound(eligible, roundSize)
    setRound(nextRound)
    setRoundChoices(nextRound.map((entry) => options.get(entry)!))
    setWarning('')
    setResults([])
    setAnswer('')
    setFeedback(null)
  }
  function checkAnswer() {
    if (!current || !answer.trim() || feedback) return
    setFeedback({
      entry: current,
      answer: answer.trim(),
      correct:
        practiceMode === 'typed'
          ? isCorrectAnswer(current, answer, direction)
          : choices.find((choice) => choice.text === answer)?.correct === true,
    })
  }
  function saveLearningResults(completedResults: Result[]) {
    if (!unit || !completedResults.length) return
    try {
      const updated = updateLearningProgress(
        learningProgress,
        unit,
        completedResults.map(({ entry, correct }) => ({
          english: entry.english,
          german: entry.german,
          correct,
        })),
        new Date().toISOString(),
      )
      localStorage.setItem(learningProgressStorageKey, JSON.stringify(updated))
      setLearningProgress(updated)
    } catch {
      setWarning('Practice finished, but progress could not be saved on this device.')
    }
  }
  function nextQuestion() {
    if (!feedback) return
    const completedResults = [...results, feedback]
    if (completedResults.length === round.length)
      saveLearningResults(completedResults)
    setResults(completedResults)
    setFeedback(null)
    setAnswer('')
  }

  function selectMatchingWord(side: Direction, index: number) {
    if (matchedPairs.includes(index)) return
    setMatchingFeedback('idle')
    setMatchingError(null)
    if (!matchingSelection || matchingSelection.side === side) {
      setMatchingSelection(
        matchingSelection?.index === index ? null : { side, index },
      )
      return
    }
    const english = side === 'english' ? index : matchingSelection.index
    const german = side === 'german' ? index : matchingSelection.index
    setMatchingSelection(null)
    if (english === german) {
      setMatchedPairs((previous) => [...previous, english])
      setMatchingFeedback('correct')
    } else {
      setMatchingMistakes((previous) =>
        previous.includes(english) ? previous : [...previous, english],
      )
      setMatchingError({ english, german })
      setMatchingFeedback('incorrect')
    }
  }

  function finishMatchingPass() {
    if (matchedPairs.length !== round.length) return
    if (matchingPass === 1) setMatchingFirstPassMistakes(matchingMistakes)
    if (matchingPass < matchingPasses) {
      setMatchingPass((previous) => previous + 1)
      const english = createRound(round, round.length).map((entry) =>
        round.indexOf(entry),
      )
      const german = createRound(round, round.length).map((entry) =>
        round.indexOf(entry),
      )
      if (english.every((index, position) => index === german[position]))
        german.push(german.shift()!)
      setMatchingEnglish(english)
      setMatchingGerman(german)
      setMatchedPairs([])
      setMatchingMistakes([])
      setMatchingSelection(null)
      setMatchingError(null)
      setMatchingFeedback('idle')
      return
    }
    const firstPassMistakes =
      matchingPass === 1 ? matchingMistakes : matchingFirstPassMistakes
    const completedResults = round.map((entry, index) => ({
      entry,
      answer: entry.german,
      correct: !firstPassMistakes.includes(index),
    }))
    saveLearningResults(completedResults)
    setResults(completedResults)
  }

  const visibleEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      [entry.english, entry.german, entry.example || ''].some((text) =>
        text.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()),
      ),
    )

  return (
    <div
      className={`app-shell ${practiceMode === 'matching' && round.length > 0 && !complete ? 'matching-active' : ''}`}
    >
      <aside className="sidebar">
        <a
          className="brand"
          href={import.meta.env.BASE_URL}
          aria-label="OurLingo home"
        >
          <span className="brand-mark">
            <BookOpen size={25} strokeWidth={2.2} />
          </span>
          Our<span>Lingo</span>
          <span className="brand-dot" />
        </a>
        <div className="library-label">YOUR LIBRARY</div>
        <div className="unit-label">
          <div className="book-spine">{bookNumber(unit?.book || preferredBooks[0])}</div>
          <div>
            <strong>{unit?.book || 'OurLingo'}</strong>
            <span>{unit ? unitLabel(unit) : 'Your units'}</span>
          </div>
          <span className="unit-dot" />
        </div>
        <nav aria-label="Unit navigation">
          <button
            className={view === 'library' ? 'nav-link active' : 'nav-link'}
            onClick={() => goTo('library')}
          >
            <BookOpen size={19} />
            My units
            <span className="nav-count">{spaceUnits.length}</span>
          </button>
          {space === 'parent' && unit && (
            <>
              <button
                className={view === 'review' ? 'nav-link active' : 'nav-link'}
                onClick={() => goTo('review')}
              >
                <ClipboardCheck size={19} />
                Review vocabulary
                <span className="nav-count">{entries.length || '-'}</span>
              </button>
            </>
          )}
          {space === 'parent' && (
            <button
              className={view === 'report' ? 'nav-link active' : 'nav-link'}
              onClick={() => goTo('report')}
            >
              <ListChecks size={19} />
              Learning report
            </button>
          )}
          <button
            className={view === 'practice' ? 'nav-link active' : 'nav-link'}
            disabled={!approved}
            title={
              !approved
                ? 'Save and approve your vocabulary first'
                : 'Practise this unit'
            }
            onClick={() => goTo('practice')}
          >
            <Sparkles size={19} />
            Practice
            <ChevronRight size={16} />
          </button>
          <button
            className={view === 'settings' ? 'nav-link active' : 'nav-link'}
            onClick={() => goTo('settings')}
          >
            <SettingsIcon size={19} />
            Settings
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="study-image">
            <img
              src={`${import.meta.env.BASE_URL}study-desk.jpg`}
              alt="An open notebook and a pen on a study desk"
            />
            <span>Chapter one.</span>
          </div>
          <div className="device-note">
            <CloudOff size={16} />
            <span>Local to this browser</span>
          </div>
          <span className="sidebar-foot">
            English <span>+</span> Deutsch
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <BookOpen size={17} />
            <span>
              {unitView ? unit?.book : 'OurLingo'}
            </span>
            <ChevronRight size={14} />
            <strong>
              {view === 'library'
                ? 'My units'
                : view === 'report'
                  ? 'Learning report'
                  : view === 'settings'
                    ? 'Settings'
                    : unit ? unitLabel(unit) : 'Your units'}
            </strong>
          </div>
          <div className="topbar-actions">
            {space === 'parent' && unit && unitView && (
              <>
                <button
                  className="icon-button"
                  title="Download vocabulary backup"
                  aria-label="Download vocabulary backup"
                  onClick={download}
                  disabled={!unit}
                >
                  <ArrowDownToLine size={19} />
                </button>
              </>
            )}
            <button
              className="button secondary space-switch"
              onClick={switchSpace}
            >
              {space === 'kid' ? (
                <Users size={17} />
              ) : (
                <GraduationCap size={17} />
              )}
              {space === 'kid' ? 'Parent space' : 'Kid space'}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">MORE WORDS AND PHRASES</div>
              <h1>
                {view === 'library'
                  ? space === 'kid'
                    ? "Let's learn"
                    : 'Your unit library'
                  : view === 'review'
                    ? `${unit ? unitLabel(unit) : 'Your unit'} vocabulary`
                    : view === 'report'
                      ? 'Learning report'
                      : view === 'settings'
                        ? 'Settings'
                        : 'A little practice'}
              </h1>
              <p>
                {view === 'library'
                  ? `${preferredBooks.join(' + ')} · English / Deutsch`
                  : view === 'report'
                    ? 'Progress saved on this device'
                    : view === 'settings'
                      ? 'Saved on this device'
                      : `${unit?.book} · ${unit ? unitLabel(unit) : 'Your unit'}`}
              </p>
            </div>
            {unitView && (
              <>
                <span className={`status-badge ${approved ? 'approved' : ''}`}>
                  <span />
                  {dirty
                    ? 'Unsaved changes'
                    : approved
                      ? 'Reviewed'
                      : 'Awaiting review'}
                </span>
              </>
            )}
          </div>
          {warning && (
            <div className="notice warning" role="alert">
              <span>{warning}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => setWarning('')}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {message && (
            <div className="notice success" role="status">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}
          {!library && !loadError && (
            <div className="empty-state">
              <LoaderCircle className="spin" size={28} />
              <h2>Opening your vocabulary...</h2>
            </div>
          )}
          {loadError && (
            <div className="empty-state" role="alert">
              <BookOpen size={32} />
              <h2>{loadError}</h2>
              <button
                className="button primary"
                onClick={() => setAttempt((previous) => previous + 1)}
              >
                <RotateCcw size={17} />
                Try again
              </button>
            </div>
          )}
          {library && view === 'library' && (
            <section
              className="library-section"
              aria-label={space === 'kid' ? 'Kid space' : 'Parent unit library'}
            >
              <div className="library-toolbar">
                {preferredBooks.length > 1 && (
                  <fieldset className="book-filter">
                    <legend className="visually-hidden">Filter by book</legend>
                    <div className="segmented">
                      {(['all', ...preferredBooks] as const).map((book) => (
                        <label
                          key={book}
                          className={activeBookFilter === book ? 'selected' : ''}
                        >
                          <input
                            type="radio"
                            name="book-filter"
                            value={book}
                            checked={activeBookFilter === book}
                            onChange={() => setBookFilter(book)}
                          />
                          {book === 'all' ? 'All books' : book}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                {space === 'parent' && (
                  <button className="button primary" onClick={beginUnit}>
                    <Plus size={18} />
                    Add unit
                  </button>
                )}
              </div>
              {space === 'parent' && showCreator && (
                <form
                  className="unit-creator"
                  aria-label="New unit"
                  onSubmit={(event) => {
                    event.preventDefault()
                    addUnit()
                  }}
                >
                  <div className="creator-heading">
                    <h2>New unit</h2>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Cancel new unit"
                      onClick={() => {
                        setShowCreator(false)
                        setWarning('')
                      }}
                    >
                      <X size={19} />
                    </button>
                  </div>
                  <div className="creator-fields">
                    <label>
                      Book
                      <select
                        value={newBook}
                        onChange={(event) => {
                          const book = event.target.value as Book
                          setNewBook(book)
                          setNewNumber(nextNumber(book))
                        }}
                      >
                        {preferredBooks.map((book) => (
                          <option key={book}>{book}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Unit number
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newNumber}
                        onChange={(event) => setNewNumber(event.target.value)}
                      />
                    </label>
                    <label>
                      Title (optional)
                      <input
                        value={newTitle}
                        placeholder="At school"
                        maxLength={120}
                        onChange={(event) => setNewTitle(event.target.value)}
                      />
                    </label>
                  </div>
                  <button type="submit" className="button primary">
                    <Plus size={17} />
                    Create unit
                  </button>
                </form>
              )}
              {progressionActive && (
                <p className="library-note">
                  Completed units stay here to practise again. Know every word
                  of a unit to unlock the next one.
                </p>
              )}
              <div className="unit-grid">
                {libraryUnits.map((item) => (
                  <article
                    className={`unit-card ${item.book === 'MORE! 2' ? 'second-book' : ''}`}
                    key={unitKey(item)}
                  >
                    <div className="unit-card-top">
                      <span className="unit-book-label">{item.book}</span>
                      {space === 'parent' && (
                        <button
                          className="icon-button delete-button"
                          aria-label={`Delete ${item.book} ${unitLabel(item)}`}
                          title={`Delete ${item.book} ${unitLabel(item)}`}
                          onClick={() => deleteUnit(item)}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                    <div className="unit-card-heading">
                      <span className="unit-number">{typeof item.unit === 'number' ? item.unit : <BookOpen size={24} />}</span>
                      <div>
                        <h2>{unitLabel(item)}</h2>
                        <p>
                          {item.title === unitLabel(item)
                            ? item.book
                            : item.title}
                        </p>
                      </div>
                    </div>
                    <div className="unit-card-details">
                      <span>{item.entries.length} words & phrases</span>
                      <span
                        className={`status-badge ${item.reviewStatus === 'approved' ? 'approved' : ''}`}
                      >
                        <span />
                        {item.reviewStatus !== 'approved'
                          ? 'Awaiting review'
                          : space === 'kid' &&
                              isUnitCompleted(item, learningProgress)
                            ? 'Completed'
                            : 'Ready'}
                      </span>
                    </div>
                    <button
                      className={`button ${space === 'kid' ? 'primary' : 'secondary'} unit-action`}
                      disabled={
                        space === 'kid' && item.reviewStatus !== 'approved'
                      }
                      aria-label={`${space === 'kid' ? 'Practise' : 'Review'} ${item.book} ${unitLabel(item)}`}
                      onClick={() => selectUnit(item)}
                    >
                      {space === 'kid' ? (
                        <Sparkles size={17} />
                      ) : (
                        <ClipboardCheck size={17} />
                      )}
                      {space === 'kid' ? 'Practise' : 'Review vocabulary'}
                      <ArrowRight size={17} />
                    </button>
                  </article>
                ))}
              </div>
              {!libraryUnits.length && (
                <div className="empty-state">
                  <BookOpen size={30} />
                  <h2>No units here yet.</h2>
                </div>
              )}
            </section>
          )}
          {view === 'settings' && (
            <section className="settings" aria-label="Settings">
              <fieldset className="settings-group">
                <legend>Appearance</legend>
                <p>Follow this device, or always use a light or dark theme.</p>
                <div className="segmented theme-choice">
                  {themePreferences.map((theme) => (
                    <label
                      key={theme}
                      className={settings.theme === theme ? 'selected' : ''}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        checked={settings.theme === theme}
                        onChange={() => updateSettings({ ...settings, theme })}
                      />
                      {themeLabels[theme]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="settings-group">
                <legend>Books</legend>
                <p>
                  Show units from these books. At least one book stays
                  selected.
                </p>
                <div className="book-choices">
                  {books.map((book) => {
                    const checked = preferredBooks.includes(book)
                    return (
                      <label
                        key={book}
                        className={checked ? 'book-choice selected' : 'book-choice'}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={checked && preferredBooks.length === 1}
                          onChange={() => togglePreferredBook(book)}
                        />
                        <span className="book-spine">{bookNumber(book)}</span>
                        {book}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <fieldset className="settings-group">
                <legend>Units</legend>
                <p>
                  Choose which units kid space shows. With "Completed + next",
                  finished units stay available to practise again, and the next
                  unit of each book unlocks when every word of a unit is known
                  ({knownStreak} correct first tries in a row). Parent space
                  always shows every unit.
                </p>
                <div className="segmented progression-choice">
                  {unitProgressions.map((progression) => (
                    <label
                      key={progression}
                      className={
                        settings.progression === progression ? 'selected' : ''
                      }
                    >
                      <input
                        type="radio"
                        name="progression"
                        value={progression}
                        checked={settings.progression === progression}
                        onChange={() =>
                          updateSettings({ ...settings, progression })
                        }
                      />
                      {progressionLabels[progression]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          )}
          {library && space === 'parent' && view === 'report' && (
            <section className="learning-report" aria-label="Learning report">
              <p className="report-note">
                Progress is private to this device. A word is known after three
                correct first attempts in a row; any miss resets its streak.
              </p>
              {preferredUnits.map((reportUnit) => {
                const records = new Map(
                  learningProgress.records
                    .filter(
                      (record) =>
                        record.book === reportUnit.book &&
                        record.unit === reportUnit.unit,
                    )
                    .map((record) => [record.english, record]),
                )
                const known = reportUnit.entries.filter(
                  (entry) => (records.get(entry.english)?.correctStreak ?? 0) >= knownStreak,
                )
                const inProgress = reportUnit.entries.filter((entry) => {
                  const record = records.get(entry.english)
                  return (
                    !!record &&
                    record.correctStreak < knownStreak &&
                    record.correctAttempts + record.incorrectAttempts > 0
                  )
                })
                const notTried = reportUnit.entries.filter(
                  (entry) => !records.has(entry.english),
                )
                return (
                  <section
                    className="report-unit"
                    aria-label={`${reportUnit.book} ${unitLabel(reportUnit)} progress`}
                    key={unitKey(reportUnit)}
                  >
                    <div className="report-unit-heading">
                      <div>
                        <span>{reportUnit.book}</span>
                        <h2>{unitLabel(reportUnit)}</h2>
                        <p>
                          {reportUnit.title === unitLabel(reportUnit)
                            ? reportUnit.book
                            : reportUnit.title}
                        </p>
                      </div>
                      <strong>
                        {known.length} <span>/ {reportUnit.entries.length} known</span>
                      </strong>
                    </div>
                    <progress
                      max={reportUnit.entries.length || 1}
                      value={known.length}
                      aria-label={`${reportUnit.book} ${unitLabel(reportUnit)} known words`}
                    />
                    <div className="report-word-groups">
                      <details>
                        <summary>Known ({known.length})</summary>
                        {known.length ? (
                          <ul>
                            {known.map((entry) => (
                              <li key={entry.english}>
                                <strong>{entry.english}</strong>
                                <span>{entry.german}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No words are known yet.</p>
                        )}
                      </details>
                      <details>
                        <summary>Still learning ({inProgress.length})</summary>
                        {inProgress.length ? (
                          <ul>
                            {inProgress.map((entry) => {
                              const record = records.get(entry.english)!
                              return (
                                <li key={entry.english}>
                                  <strong>{entry.english}</strong>
                                  <span>{entry.german}</span>
                                  <small>
                                    {record.correctAttempts} correct, {record.incorrectAttempts} missed; streak {record.correctStreak}/3
                                  </small>
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <p>No words in progress.</p>
                        )}
                      </details>
                      <details>
                        <summary>Not tried ({notTried.length})</summary>
                        {notTried.length ? (
                          <ul>
                            {notTried.map((entry) => (
                              <li key={entry.english}>
                                <strong>{entry.english}</strong>
                                <span>{entry.german}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Every word has been tried.</p>
                        )}
                      </details>
                    </div>
                  </section>
                )
              })}
            </section>
          )}
          {unit && space === 'parent' && view === 'review' && (
            <>
              <section className="unit-summary" aria-label="Unit summary">
                <div className="summary-item">
                  <span className="summary-icon mint">
                    <Languages size={22} />
                  </span>
                  <div>
                    <strong>{entries.length}</strong>
                    <span>Words & phrases</span>
                  </div>
                </div>
                <div className="summary-item">
                  <span className="summary-icon peach">
                    <BookOpen size={22} />
                  </span>
                  <div>
                    <strong>
                      {entries.filter((entry) => entry.example).length}
                    </strong>
                    <span>Example sentences</span>
                  </div>
                </div>
                <div className="summary-item">
                  <span className="summary-icon yellow">
                    <FileCheck2 size={22} />
                  </span>
                  <div>
                    <strong>{approved ? 'Ready' : 'To review'}</strong>
                    <span>
                      {approved
                        ? 'For your next practice'
                        : unit.source.includes('photo')
                          ? 'From your workbook photo'
                          : 'Your added vocabulary'}
                    </span>
                  </div>
                </div>
              </section>
              <section
                className="review-section"
                aria-label="Vocabulary review"
              >
                <div className="review-toolbar">
                  <div className="section-title">
                    <h2>Your vocabulary</h2>
                    <span>{visibleEntries.length} entries</span>
                  </div>
                  <div className="review-tools">
                    <label className="search-field">
                      <Search size={17} />
                      <input
                        aria-label="Search vocabulary"
                        placeholder="Find a word..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                      {query && (
                        <button
                          className="icon-button"
                          aria-label="Clear search"
                          onClick={() => setQuery('')}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </label>
                    <button className="button primary" onClick={save}>
                      <Check size={17} />
                      {approved ? 'Save vocabulary' : 'Save & approve'}
                    </button>
                  </div>
                </div>
                <div className="vocabulary-table">
                  <div className="table-heading" aria-hidden="true">
                    <span>#</span>
                    <span>ENGLISH</span>
                    <span>DEUTSCH</span>
                    <span>EXAMPLE SENTENCE</span>
                    <span />
                  </div>
                  {visibleEntries.map(({ entry, index }) => (
                    <div className="vocabulary-row" key={index}>
                      <span className="row-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <label className="entry-field english-field">
                        <span className="mobile-label">English</span>
                        <textarea
                          rows={2}
                          aria-label={`English entry ${index + 1}`}
                          value={entry.english}
                          onChange={(event) =>
                            updateEntry(index, 'english', event.target.value)
                          }
                        />
                        {entry.origin === 'word-file' && (
                          <span className="entry-origin">Word file</span>
                        )}
                      </label>
                      <label className="entry-field german-field">
                        <span className="mobile-label">Deutsch</span>
                        <textarea
                          rows={2}
                          aria-label={`German entry ${index + 1}`}
                          value={entry.german}
                          onChange={(event) =>
                            updateEntry(index, 'german', event.target.value)
                          }
                        />
                        {entry.origin === 'word-file' && (
                          <span className="entry-origin">
                            {entry.translationSource === 'parent'
                              ? 'Parent translation'
                              : 'Suggested translation'}
                          </span>
                        )}
                      </label>
                      <label className="entry-field example-field">
                        <span className="mobile-label">Example</span>
                        <textarea
                          rows={2}
                          aria-label={`Example entry ${index + 1}`}
                          placeholder="No example sentence"
                          value={entry.example || ''}
                          onChange={(event) =>
                            updateEntry(index, 'example', event.target.value)
                          }
                        />
                      </label>
                      <button
                        className="icon-button delete-button"
                        title={`Remove ${entry.english || 'entry'}`}
                        aria-label={`Remove entry ${index + 1}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove "${entry.english || 'this entry'}"?`,
                            )
                          ) {
                            setEntries((previous) =>
                              previous.filter(
                                (_, entryIndex) => entryIndex !== index,
                              ),
                            )
                            setMessage('')
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {!visibleEntries.length && (
                    <div className="no-results">
                      <Search size={23} />
                      <p>
                        {entries.length
                          ? 'No words match your search.'
                          : 'This unit has no entries yet.'}
                      </p>
                      {query && (
                        <button
                          className="button secondary"
                          onClick={() => setQuery('')}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="table-footer">
                  <button
                    className="button add-button"
                    onClick={() => {
                      setEntries((previous) => [
                        ...previous,
                        { english: '', german: '', example: null },
                      ])
                      setQuery('')
                      setMessage('')
                      requestAnimationFrame(() =>
                        document
                          .querySelector<HTMLTextAreaElement>(
                            `[aria-label="English entry ${entries.length + 1}"]`,
                          )
                          ?.focus(),
                      )
                    }}
                  >
                    <Plus size={18} />
                    Add a word or phrase
                  </button>
                  <span>
                    {unit.book} · {unitLabel(unit)}
                  </span>
                </div>
              </section>
              <div className="review-bottom">
                <span>
                  <span className="small-dot" />
                  {dirty
                    ? 'Changes not saved yet'
                    : approved
                      ? 'Approved vocabulary saved locally'
                      : 'Awaiting your review'}
                </span>
                <button
                  className="button primary"
                  disabled={!approved}
                  onClick={() => goTo('practice')}
                >
                  Let's practise
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
          {unit && view === 'practice' && (
            <section className="practice-section">
              {!round.length && (
                <div className="practice-setup">
                  <span className="practice-emblem">
                    <Sparkles size={32} />
                  </span>
                  <div className="eyebrow">YOUR NEXT SMALL WIN</div>
                  <h2>Ready when you are.</h2>
                  <p>
                    {unit.book} · {unitLabel(unit)} · {entries.length} words &
                    phrases
                  </p>
                  <fieldset className="direction-field mode-field">
                    <legend>Practice mode</legend>
                    <div className="segmented">
                      <label
                        className={practiceMode === 'typed' ? 'selected' : ''}
                      >
                        <input
                          type="radio"
                          name="practice-mode"
                          value="typed"
                          checked={practiceMode === 'typed'}
                          onChange={() => setPracticeMode('typed')}
                        />
                        <Keyboard size={17} />
                        Type answer
                      </label>
                      <label
                        className={
                          practiceMode === 'multiple-choice' ? 'selected' : ''
                        }
                      >
                        <input
                          type="radio"
                          name="practice-mode"
                          value="multiple-choice"
                          checked={practiceMode === 'multiple-choice'}
                          onChange={() => setPracticeMode('multiple-choice')}
                        />
                        <ListChecks size={17} />
                        Multiple choice
                      </label>
                      <label
                        className={
                          practiceMode === 'matching' ? 'selected' : ''
                        }
                      >
                        <input
                          type="radio"
                          name="practice-mode"
                          value="matching"
                          checked={practiceMode === 'matching'}
                          onChange={() => setPracticeMode('matching')}
                        />
                        <Link2 size={17} />
                        Matching pairs
                      </label>
                    </div>
                  </fieldset>
                  {practiceMode !== 'matching' && (
                    <>
                      <fieldset className="direction-field">
                        <legend>Answer in</legend>
                        <div className="segmented">
                          <label
                            className={
                              direction === 'english' ? 'selected' : ''
                            }
                          >
                            <input
                              type="radio"
                              name="direction"
                              value="english"
                              checked={direction === 'english'}
                              onChange={() => setDirection('english')}
                            />
                            English
                          </label>
                          <label
                            className={direction === 'german' ? 'selected' : ''}
                          >
                            <input
                              type="radio"
                              name="direction"
                              value="german"
                              checked={direction === 'german'}
                              onChange={() => setDirection('german')}
                            />
                            Deutsch
                          </label>
                        </div>
                      </fieldset>
                      <label className="round-size">
                        Words per round
                        <select
                          value={roundSize}
                          onChange={(event) =>
                            setRoundSize(Number(event.target.value))
                          }
                        >
                          <option value={5}>5 words</option>
                          <option value={10}>10 words</option>
                          <option value={entries.length}>
                            All {entries.length} words
                          </option>
                        </select>
                      </label>
                    </>
                  )}
                  <button
                    className="button primary start-button"
                    onClick={() => startRound()}
                  >
                    Start practice
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              {round.length > 0 && practiceMode === 'matching' && !complete && (
                <div className="matching-container">
                  <div className="round-top">
                    <span>
                      Matching pairs - Pass {matchingPass} of {matchingPasses}
                    </span>
                    <span>
                      {matchedPairs.length} of {round.length} matched
                    </span>
                  </div>
                  <progress
                    max={round.length}
                    value={matchedPairs.length}
                    aria-label="Matching progress"
                  />
                  <div className="matching-board">
                    {(['english', 'german'] as const).map((side) => (
                      <section
                        className="matching-column"
                        role="group"
                        aria-label={
                          side === 'english'
                            ? 'English matching words'
                            : 'German matching words'
                        }
                        key={side}
                      >
                        <h2>{side === 'english' ? 'English' : 'Deutsch'}</h2>
                        <div className="matching-tiles">
                          {(side === 'english'
                            ? matchingEnglish
                            : matchingGerman
                          ).map((index) => {
                            const matched = matchedPairs.includes(index)
                            const selected =
                              matchingSelection?.side === side &&
                              matchingSelection.index === index
                            const incorrect = matchingError?.[side] === index
                            return (
                              <button
                                ref={
                                  side === 'english' &&
                                  index === matchingEnglish[0]
                                    ? matchingInput
                                    : undefined
                                }
                                key={index}
                                type="button"
                                className={`matching-tile ${matched ? 'matched' : ''} ${selected ? 'selected' : ''} ${incorrect ? 'incorrect' : ''}`}
                                disabled={matched}
                                aria-pressed={selected}
                                aria-label={`${side === 'english' ? 'English' : 'Deutsch'}: ${round[index][side]}${matched ? ' (matched)' : ''}`}
                                lang={side === 'english' ? 'en' : 'de'}
                                onClick={() => selectMatchingWord(side, index)}
                              >
                                <span>{round[index][side]}</span>
                                <span
                                  className="matching-symbol"
                                  aria-hidden="true"
                                >
                                  {matched && <CheckCircle2 size={18} />}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div
                    className={`matching-feedback ${matchingFeedback}`}
                    role="status"
                  >
                    {matchedPairs.length === round.length
                      ? matchingPass < matchingPasses
                        ? 'Pass complete. Get ready for the next pass!'
                        : 'All three passes complete!'
                      : matchingFeedback === 'correct'
                        ? "That's a pair!"
                        : matchingFeedback === 'incorrect'
                          ? 'Not a match. Try again.'
                          : ''}
                  </div>
                  <button
                    className="button primary answer-button"
                    disabled={matchedPairs.length !== round.length}
                    onClick={finishMatchingPass}
                  >
                    {matchingPass < matchingPasses ? 'Next pass' : 'See results'}
                    <ArrowRight size={17} />
                  </button>
                  <button
                    className="button text-button"
                    onClick={() => {
                      if (
                        window.confirm('End this round and choose a new one?')
                      )
                        resetRound()
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to practice
                  </button>
                </div>
              )}
              {current && practiceMode !== 'matching' && (
                <div className="round-container">
                  <div className="round-top">
                    <span>
                      Question {results.length + 1} of {round.length}
                    </span>
                    <span>
                      {results.filter((result) => result.correct).length}{' '}
                      correct
                    </span>
                  </div>
                  <progress
                    max={round.length}
                    value={results.length}
                    aria-label="Practice progress"
                  />
                  <form
                    className="practice-card"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (feedback) nextQuestion()
                      else checkAnswer()
                    }}
                  >
                    <span className="question-label">
                      {direction === 'english' ? 'DEUTSCH' : 'ENGLISH'}
                    </span>
                    <h2
                      className="question-word"
                      lang={direction === 'english' ? 'de' : 'en'}
                    >
                      {direction === 'english'
                        ? current.german
                        : current.english}
                    </h2>
                    <label
                      className="answer-label"
                      htmlFor={
                        practiceMode === 'typed' ? 'practice-answer' : undefined
                      }
                    >
                      {direction === 'english' ? 'In English' : 'Auf Deutsch'}
                    </label>
                    {practiceMode === 'typed' ? (
                      <input
                        id="practice-answer"
                        ref={answerInput}
                        className={`answer-input ${feedback ? (feedback.correct ? 'correct' : 'incorrect') : ''}`}
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        placeholder={
                          direction === 'english'
                            ? 'Your answer...'
                            : 'Deine Antwort...'
                        }
                        readOnly={!!feedback}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        autoCapitalize="none"
                      />
                    ) : (
                      <fieldset
                        className="answer-choices"
                        disabled={!!feedback}
                        aria-label={
                          direction === 'english'
                            ? 'Answer in English'
                            : 'Answer in German'
                        }
                      >
                        {choices.map((choice, index) => (
                          <label
                            key={choice.text}
                            className={`answer-choice ${answer === choice.text ? 'selected' : ''} ${feedback ? (choice.correct ? 'correct' : answer === choice.text ? 'incorrect' : '') : ''}`}
                          >
                            <input
                              ref={index === 0 ? choiceInput : undefined}
                              type="radio"
                              name="answer-choice"
                              value={choice.text}
                              checked={answer === choice.text}
                              onChange={() => setAnswer(choice.text)}
                            />
                            <span lang={direction === 'english' ? 'en' : 'de'}>
                              {choice.text}
                            </span>
                            {feedback && choice.correct && (
                              <CheckCircle2
                                size={19}
                                aria-label="Correct answer"
                              />
                            )}
                            {feedback &&
                              !choice.correct &&
                              answer === choice.text && (
                                <X size={19} aria-label="Incorrect answer" />
                              )}
                          </label>
                        ))}
                      </fieldset>
                    )}
                    {feedback && (
                      <div
                        className={`answer-feedback ${feedback.correct ? 'correct' : 'incorrect'}`}
                        role="status"
                      >
                        <strong>
                          {feedback.correct ? (
                            <>
                              <CheckCircle2 size={19} />
                              That's right!
                            </>
                          ) : (
                            <>One to practise again</>
                          )}
                        </strong>
                        <p>
                          {direction === 'english'
                            ? current.english
                            : current.german}
                        </p>
                        {current.example && (
                          <blockquote lang="en">{current.example}</blockquote>
                        )}
                      </div>
                    )}
                    <button
                      className="button primary answer-button"
                      type="submit"
                      disabled={!answer.trim()}
                    >
                      {feedback
                        ? results.length + 1 === round.length
                          ? 'See results'
                          : 'Next word'
                        : 'Check answer'}
                      <ArrowRight size={17} />
                    </button>
                  </form>
                  <button
                    className="button text-button"
                    onClick={() => {
                      if (
                        window.confirm('End this round and choose a new one?')
                      )
                        resetRound()
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to practice
                  </button>
                </div>
              )}
              {complete && (
                <div className="practice-results">
                  <span className="practice-emblem">
                    <CheckCircle2 size={34} />
                  </span>
                  <div className="eyebrow">ROUND COMPLETE</div>
                  <h2>Another step forward.</h2>
                  <div className="score">
                    {results.length - missed.length}
                    <span> / {round.length}</span>
                  </div>
                  <p>
                    {practiceMode === 'matching'
                      ? 'first-try matches'
                      : 'correct answers'}
                  </p>
                  {missed.length > 0 ? (
                    <div className="missed-words">
                      <h3>Words to revisit</h3>
                      {results
                        .filter((result) => !result.correct)
                        .map((result, index) => (
                          <div key={index}>
                            <strong>{result.entry.english}</strong>
                            <span>{result.entry.german}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="perfect-round">
                      <Sparkles size={20} />
                      Every word, well done!
                    </div>
                  )}
                  <div className="result-actions">
                    {missed.length > 0 && (
                      <button
                        className="button primary"
                        onClick={() => startRound(missed)}
                      >
                        <RotateCcw size={17} />
                        Retry missed words
                      </button>
                    )}
                    <button
                      className={`button ${missed.length ? 'secondary' : 'primary'}`}
                      onClick={() => startRound()}
                    >
                      Another round
                      <ArrowRight size={17} />
                    </button>
                  </div>
                  <button className="button text-button" onClick={resetRound}>
                    <ArrowLeft size={16} />
                    Practice settings
                  </button>
                </div>
              )}
            </section>
          )}
          <footer className="page-footer">
            <span>
              OurLingo{' '}
              <small aria-label={`App version ${__APP_VERSION__}`}>
                v{__APP_VERSION__}
              </small>
            </span>
            <span>A word at a time.</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
