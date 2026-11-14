import { useState } from 'react'
import {
  BookOpen,
  Crown,
  Flame,
  Footprints,
  Gamepad2,
  Gem,
  Rocket,
  Shapes,
  Star,
  Trophy,
  Zap,
} from 'lucide-react'
import { bookNumber } from './vocabulary'
import type { Badge, BadgeIcon } from './activity'

// Celebrations shared by the results screen, the trophies and the word game.

const confettiColours = ['#f6c344', '#ef7d57', '#5fb98c', '#5aa9e6', '#b784e0', '#f28ab2']

export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 48 }, (_, index) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.4,
      size: 6 + Math.random() * 7,
      rotate: Math.random() * 360,
      drift: Math.random() * 80 - 40,
      colour: confettiColours[index % confettiColours.length],
      round: index % 3 === 0,
    })),
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 0.45,
            background: piece.colour,
            borderRadius: piece.round ? '50%' : 2,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ['--rotate' as string]: `${piece.rotate}deg`,
            ['--drift' as string]: `${piece.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

const badgeIcons: Record<BadgeIcon, typeof Star> = {
  footprints: Footprints,
  star: Star,
  gem: Gem,
  book: BookOpen,
  trophy: Trophy,
  crown: Crown,
  flame: Flame,
  shapes: Shapes,
  rocket: Rocket,
  zap: Zap,
  gamepad: Gamepad2,
}

export function BadgeMedal({ badge }: { badge: Badge }) {
  const Icon = badgeIcons[badge.icon]
  return (
    <span
      className={`badge-medal ${badge.book ? `book-${bookNumber(badge.book)}` : `badge-${badge.icon}`}`}
      aria-hidden="true"
    >
      <Icon size={24} strokeWidth={2.2} />
    </span>
  )
}
