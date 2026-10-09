import { useEffect, useRef, useState } from 'react'
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
  Languages,
  Keyboard,
  ListChecks,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import {
  createAnswerChoices,
  createRound,
  isCorrectAnswer,
  isVocabularyUnit,
  storageKey,
  validateEntries,
} from './vocabulary'
import type { AnswerChoice, Entry, VocabularyUnit } from './vocabulary'
import './OurLingo.css'

type Direction = 'english' | 'german'
type PracticeMode = 'typed' | 'multiple-choice'
type Result = { entry: Entry; answer: string; correct: boolean }

export default function OurLingo() {
  const [unit, setUnit] = useState<VocabularyUnit | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [warning, setWarning] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [view, setView] = useState<'review' | 'practice'>('review')
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState<Direction>('english')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('typed')
  const [roundSize, setRoundSize] = useState(10)
  const [round, setRound] = useState<Entry[]>([])
  const [roundChoices, setRoundChoices] = useState<AnswerChoice[][]>([])
  const [results, setResults] = useState<Result[]>([])
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Result | null>(null)
  const answerInput = useRef<HTMLInputElement>(null)
  const choiceInput = useRef<HTMLInputElement>(null)
  const dirty =
    !!unit && JSON.stringify(unit.entries) !== JSON.stringify(entries)
  const approved = unit?.reviewStatus === 'approved' && !dirty
  const current = round[results.length]
  const choices = roundChoices[results.length] || []
  const complete = round.length > 0 && results.length === round.length
  const missed = results
    .filter((result) => !result.correct)
    .map((result) => result.entry)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoadError('')
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
          setUnit(parsed)
          setEntries(parsed.entries)
          return
        }
      } catch {
        setWarning(
          'Saved vocabulary could not be loaded. The original transcription is shown instead.',
        )
      }
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/more-1-unit-1.json`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Unit unavailable')
        const data: unknown = await response.json()
        if (!isVocabularyUnit(data)) throw new Error('Invalid unit')
        setUnit(data)
        setEntries(data.entries)
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
      else choiceInput.current?.focus()
    }
  }, [view, current, feedback, practiceMode])

  function updateEntry(index: number, field: keyof Entry, value: string) {
    setEntries((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: field === 'example' && !value.trim() ? null : value,
            }
          : entry,
      ),
    )
    setMessage('')
  }

  function save() {
    if (!unit) return
    const error = validateEntries(entries)
    if (error) {
      setWarning(error)
      return
    }
    const cleaned = entries.map((entry) => ({
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
      localStorage.setItem(storageKey, JSON.stringify(saved))
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
    link.download = 'ourlingo-more-1-unit-1.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function goTo(next: 'review' | 'practice') {
    if (next === 'practice' && !approved) return
    if (
      next === 'review' &&
      round.length &&
      !complete &&
      !window.confirm(
        'Leave this practice round? Your vocabulary will stay saved.',
      )
    )
      return
    setView(next)
    setMessage('')
    if (next === 'review') resetRound()
  }

  function resetRound() {
    setRound([])
    setRoundChoices([])
    setResults([])
    setAnswer('')
    setFeedback(null)
  }
  function startRound(words = entries) {
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
  function nextQuestion() {
    if (!feedback) return
    setResults((previous) => [...previous, feedback])
    setFeedback(null)
    setAnswer('')
  }

  const visibleEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      [entry.english, entry.german, entry.example || ''].some((text) =>
        text.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()),
      ),
    )

  return (
    <div className="app-shell">
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
          <div className="book-spine">1</div>
          <div>
            <strong>MORE! 1</strong>
            <span>Unit 1</span>
          </div>
          <span className="unit-dot" />
        </div>
        <nav aria-label="Unit navigation">
          <button
            className={view === 'review' ? 'nav-link active' : 'nav-link'}
            onClick={() => goTo('review')}
          >
            <ClipboardCheck size={19} />
            Review vocabulary
            <span className="nav-count">{entries.length || '-'}</span>
          </button>
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
            <span>MORE! 1</span>
            <ChevronRight size={14} />
            <strong>Unit 1</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              title="Download vocabulary backup"
              aria-label="Download vocabulary backup"
              onClick={download}
              disabled={!unit}
            >
              <ArrowDownToLine size={19} />
            </button>
            <div className="parent-avatar" aria-label="Parent review space">
              P
            </div>
            <span className="parent-text">Parent space</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">MORE WORDS AND PHRASES</div>
              <h1>
                {view === 'review' ? 'Unit 1 vocabulary' : 'A little practice'}
              </h1>
              <p>
                {view === 'review'
                  ? 'MORE! 1 · English / Deutsch'
                  : 'MORE! 1 · Unit 1'}
              </p>
            </div>
            <span className={`status-badge ${approved ? 'approved' : ''}`}>
              <span />
              {dirty
                ? 'Unsaved changes'
                : approved
                  ? 'Reviewed'
                  : 'Awaiting review'}
            </span>
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
          {!unit && !loadError && (
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
          {unit && view === 'review' && (
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
                        : 'From your workbook photo'}
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
                  <span>MORE! 1 · Unit 1</span>
                </div>
              </section>
              <div className="review-bottom">
                <span>
                  <span className="small-dot" />
                  {dirty
                    ? 'Changes not saved yet'
                    : approved
                      ? 'Approved vocabulary saved locally'
                      : 'Photo transcription · Awaiting your review'}
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
                  <p>Unit 1 · {entries.length} words & phrases</p>
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
                    </div>
                  </fieldset>
                  <fieldset className="direction-field">
                    <legend>Answer in</legend>
                    <div className="segmented">
                      <label
                        className={direction === 'english' ? 'selected' : ''}
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
                  <button
                    className="button primary start-button"
                    onClick={() => startRound()}
                  >
                    Start practice
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              {current && (
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
                  <p>correct answers</p>
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
            <span>OurLingo</span>
            <span>A word at a time.</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
