import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Flame,
  Play,
  RotateCcw,
  Timer,
  Trophy,
} from 'lucide-react'
import {
  nextGameBoard,
  practiceEntries,
  promptText,
  unitLabel,
} from './vocabulary'
import type { Entry, VocabularyUnit } from './vocabulary'
import type { Badge } from './activity'
import { BadgeMedal, Confetti } from './Rewards'

// Matching pairs against the clock, unlocked by completing a unit. Just for
// fun: the answers do not change learning progress.

type Phase = 'setup' | 'countdown' | 'playing' | 'done'
type PairType = 'english' | 'description'

const gameLengths = [30, 60, 90]
const penaltyMs = 2000
const comboEvery = 5
const comboBonusMs = 2000
const boardSize = 5

export interface GameResult {
  seconds: number
  pairs: number
  bestCombo: number
}

function shuffled(count: number): number[] {
  const order = Array.from({ length: count }, (_, index) => index)
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[order[index], order[other]] = [order[other], order[index]]
  }
  return order
}

function clock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function WordGame({
  unit,
  entries,
  record,
  onFinish,
  onExit,
  onPlayingChange,
}: {
  unit: VocabularyUnit
  entries: Entry[]
  record: (seconds: number) => number
  // Saves the game and returns the badges it earned.
  onFinish: (result: GameResult) => Badge[]
  onExit: () => void
  onPlayingChange: (playing: boolean) => void
}) {
  const definitionsAvailable =
    nextGameBoard(practiceEntries(entries, 'description'), [], 'description')
      .length >= 2
  const [phase, setPhase] = useState<Phase>('setup')
  const [seconds, setSeconds] = useState(60)
  const [pairType, setPairType] = useState<PairType>('english')
  const [count, setCount] = useState(3)
  const [deadline, setDeadline] = useState(0)
  const [now, setNow] = useState(0)
  const [board, setBoard] = useState<Entry[]>([])
  const [englishOrder, setEnglishOrder] = useState<number[]>([])
  const [otherOrder, setOtherOrder] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [selection, setSelection] = useState<{
    side: 'english' | 'other'
    index: number
  } | null>(null)
  const [error, setError] = useState<{ english: number; other: number } | null>(
    null,
  )
  const [pairs, setPairs] = useState(0)
  const [combo, setCombo] = useState(0)
  const [flash, setFlash] = useState<{ text: string; kind: string; id: number } | null>(
    null,
  )
  const [result, setResult] = useState<{
    pairs: number
    bestCombo: number
    previous: number
    badges: Badge[]
  } | null>(null)
  // The clock and the score are read by timers, so they also live in refs.
  const deadlineRef = useRef(0)
  const scoreRef = useRef({ pairs: 0, combo: 0, bestCombo: 0 })
  const boardTimer = useRef<number | undefined>(undefined)
  const definitions = pairType === 'description'
  const words = definitions ? practiceEntries(entries, 'description') : entries

  function dealBoard(previous: Entry[]) {
    const next = nextGameBoard(words, previous, pairType, boardSize)
    setBoard(next)
    setEnglishOrder(shuffled(next.length))
    setOtherOrder(shuffled(next.length))
    setMatched([])
    setSelection(null)
    setError(null)
  }

  function start() {
    clearTimeout(boardTimer.current)
    scoreRef.current = { pairs: 0, combo: 0, bestCombo: 0 }
    setPairs(0)
    setCombo(0)
    setFlash(null)
    setResult(null)
    setCount(3)
    dealBoard([])
    setPhase('countdown')
    onPlayingChange(true)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function finish() {
    clearTimeout(boardTimer.current)
    const { pairs: total, bestCombo } = scoreRef.current
    const previous = record(seconds)
    const badges = onFinish({ seconds, pairs: total, bestCombo })
    setResult({ pairs: total, bestCombo, previous, badges })
    setPhase('done')
    onPlayingChange(false)
  }

  function moveDeadline(ms: number, text: string, kind: string) {
    deadlineRef.current += ms
    setDeadline(deadlineRef.current)
    setFlash({ text, kind, id: Date.now() })
  }

  // 3-2-1, then the clock starts.
  useEffect(() => {
    if (phase !== 'countdown') return
    const timer = window.setTimeout(() => {
      if (count > 1) {
        setCount(count - 1)
        return
      }
      deadlineRef.current = Date.now() + seconds * 1000
      setDeadline(deadlineRef.current)
      setNow(Date.now())
      setPhase('playing')
    }, 800)
    return () => clearTimeout(timer)
  }, [phase, count, seconds])

  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      const time = Date.now()
      setNow(time)
      if (time >= deadlineRef.current) finish()
    }, 100)
    return () => clearInterval(timer)
    // finish only reads refs and the chosen length, which cannot change
    // while the clock runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => () => clearTimeout(boardTimer.current), [])

  function select(side: 'english' | 'other', index: number) {
    if (phase !== 'playing' || matched.includes(index)) return
    setError(null)
    if (!selection || selection.side === side) {
      setSelection(selection?.index === index ? null : { side, index })
      return
    }
    const english = side === 'english' ? index : selection.index
    const other = side === 'other' ? index : selection.index
    setSelection(null)
    const score = scoreRef.current
    if (english !== other) {
      score.combo = 0
      setCombo(0)
      setError({ english, other })
      moveDeadline(-penaltyMs, `-${penaltyMs / 1000}s`, 'penalty')
      return
    }
    score.pairs += 1
    score.combo += 1
    score.bestCombo = Math.max(score.bestCombo, score.combo)
    setPairs(score.pairs)
    setCombo(score.combo)
    if (score.combo % comboEvery === 0)
      moveDeadline(comboBonusMs, `+${comboBonusMs / 1000}s`, 'bonus')
    const nextMatched = [...matched, english]
    setMatched(nextMatched)
    if (nextMatched.length === board.length)
      boardTimer.current = window.setTimeout(() => dealBoard(board), 300)
  }

  const remaining = Math.max(0, deadline - now)
  const otherText = (entry: Entry) =>
    definitions ? promptText(entry, 'description') : entry.german

  if (phase === 'setup')
    return (
      <div className="word-game game-setup">
        <button type="button" className="button text-button back-to-units" onClick={onExit}>
          <ArrowLeft size={16} />
          Back to practice
        </button>
        <span className="practice-emblem">
          <Timer size={32} />
        </span>
        <div className="eyebrow">WORD GAME</div>
        <h2>Beat the clock!</h2>
        <p>
          {unit.book} · {unitLabel(unit)}. Match as many pairs as you can before
          the time runs out. A wrong match costs {penaltyMs / 1000} seconds,{' '}
          {comboEvery} in a row give you {comboBonusMs / 1000} more.
        </p>
        <fieldset className="direction-field game-lengths">
          <legend>Time</legend>
          <div className="segmented">
            {gameLengths.map((length) => (
              <label key={length} className={seconds === length ? 'selected' : ''}>
                <input
                  type="radio"
                  name="game-length"
                  value={length}
                  checked={seconds === length}
                  onChange={() => setSeconds(length)}
                />
                {length} seconds
              </label>
            ))}
          </div>
        </fieldset>
        {definitionsAvailable && (
          <fieldset className="direction-field">
            <legend>Pairs</legend>
            <div className="segmented">
              {(['english', 'description'] as const).map((type) => (
                <label key={type} className={pairType === type ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="game-pairs"
                    value={type}
                    checked={pairType === type}
                    onChange={() => setPairType(type)}
                  />
                  {type === 'english' ? 'English + Deutsch' : 'English + Definition'}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <p className="game-record">
          <Trophy size={17} />
          {record(seconds)
            ? `Your record: ${record(seconds)} pairs in ${seconds} seconds`
            : 'No record yet. Set the first one!'}
        </p>
        <button className="button primary start-button" onClick={start}>
          <Play size={18} />
          Start the game
        </button>
      </div>
    )

  if (phase === 'done' && result) {
    const newRecord = result.pairs > result.previous
    return (
      <div className="word-game practice-results game-result">
        {newRecord && result.pairs > 0 && <Confetti />}
        <span className="practice-emblem">
          <Trophy size={32} />
        </span>
        <div className="eyebrow">TIME'S UP!</div>
        <h2>{newRecord && result.pairs > 0 ? 'New record!' : 'Well played!'}</h2>
        <div className="score">{result.pairs}</div>
        <p>pairs in {seconds} seconds</p>
        <div className="game-stats">
          <span>
            <Flame size={16} />
            Best combo: {result.bestCombo}
          </span>
          <span>
            <Trophy size={16} />
            Record: {Math.max(result.pairs, result.previous)}
          </span>
        </div>
        {result.badges.map((badge) => (
          <div className="new-badge" key={badge.id} role="status">
            <BadgeMedal badge={badge} />
            <span>
              <small>New badge!</small>
              <strong>{badge.title}</strong>
              {badge.description}
            </span>
          </div>
        ))}
        <div className="result-actions">
          <button className="button primary" onClick={start}>
            <RotateCcw size={17} />
            Play again
          </button>
          <button className="button secondary" onClick={() => setPhase('setup')}>
            <Timer size={17} />
            Change time
          </button>
        </div>
        <button className="button text-button" onClick={onExit}>
          <ArrowLeft size={16} />
          Back to practice
        </button>
      </div>
    )
  }

  return (
    <div className="word-game matching-container">
      <div className="game-bar">
        <span
          className={`game-timer ${phase === 'playing' && remaining <= 10_000 ? 'warn' : ''}`}
          aria-label={`Time left: ${clock(phase === 'playing' ? remaining : seconds * 1000)}`}
        >
          <Timer size={20} />
          {clock(phase === 'playing' ? remaining : seconds * 1000)}
          {flash && (
            <span key={flash.id} className={`game-flash ${flash.kind}`} aria-hidden="true">
              {flash.text}
            </span>
          )}
        </span>
        <span className="game-pairs" aria-label={`${pairs} pairs`}>
          <strong>{pairs}</strong> pairs
        </span>
        <span className={`game-combo ${combo >= 3 ? 'hot' : ''}`} aria-label={`Combo ${combo}`}>
          <Flame size={18} />x{combo}
        </span>
      </div>
      {phase === 'countdown' && (
        <div className="game-count" role="status" key={count}>
          {count}
        </div>
      )}
      <div
        className={`matching-board ${definitions ? 'with-descriptions' : ''} ${phase === 'countdown' ? 'waiting' : ''}`}
      >
        {(['english', 'other'] as const).map((side) => (
          <section
            className="matching-column"
            role="group"
            aria-label={
              side === 'english'
                ? 'English game words'
                : definitions
                  ? 'Definition game clues'
                  : 'German game words'
            }
            key={side}
          >
            <h2>{side === 'english' ? 'English' : definitions ? 'Definition' : 'Deutsch'}</h2>
            <div className="matching-tiles">
              {(side === 'english' ? englishOrder : otherOrder).map((index) => {
                const entry = board[index]
                if (!entry) return null
                const done = matched.includes(index)
                const selected = selection?.side === side && selection.index === index
                const wrong = error?.[side] === index
                const text = side === 'english' ? entry.english : otherText(entry)
                return (
                  <button
                    key={`${entry.english}-${index}`}
                    type="button"
                    className={`matching-tile ${done ? 'matched' : ''} ${selected ? 'selected' : ''} ${wrong ? 'incorrect' : ''} ${side === 'other' && definitions ? 'description-tile' : ''}`}
                    disabled={done || phase !== 'playing'}
                    aria-pressed={selected}
                    aria-label={`${side === 'english' ? 'English' : definitions ? 'Definition' : 'Deutsch'}: ${text}${done ? ' (matched)' : ''}`}
                    lang={side === 'other' && !definitions ? 'de' : 'en'}
                    onClick={() => select(side, index)}
                  >
                    <span>{text}</span>
                    <span className="matching-symbol" aria-hidden="true">
                      {done && <CheckCircle2 size={18} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <button
        className="button text-button"
        onClick={() => {
          if (window.confirm('Stop the game? This game will not be saved.')) {
            clearTimeout(boardTimer.current)
            onPlayingChange(false)
            setPhase('setup')
          }
        }}
      >
        <ArrowLeft size={16} />
        Stop the game
      </button>
    </div>
  )
}
