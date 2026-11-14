import { useState } from 'react'
import { Check, Lock, Shuffle } from 'lucide-react'
import {
  avatarChoices,
  avatarImage,
  avatarReward,
  isUnlocked,
  plainClothes,
  randomAvatar,
  skinTones,
} from './avatar'
import type { Avatar } from './avatar'

// The avatar editor: every choice is shown as a small preview of the child's
// own avatar, so they can see what it changes before picking it.

type Tab = 'face' | 'hair' | 'clothes' | 'extras'
type Group = {
  part: keyof Avatar
  title: string
  swatches?: boolean
  zoom?: boolean
  note?: string
  // Parts changed in the choice previews so the choice is visible.
  preview?: Partial<Avatar>
  hidden?: (avatar: Avatar) => boolean
  disabled?: (avatar: Avatar) => string | null
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'clothes', label: 'Clothes' },
  { id: 'extras', label: 'Extras' },
]

const groups: Record<Tab, Group[]> = {
  face: [
    { part: 'skin', title: 'Skin', swatches: true },
    { part: 'head', title: 'Face shape', zoom: true },
    { part: 'eyes', title: 'Eyes', zoom: true },
    {
      part: 'eyeColor',
      title: 'Eye colour',
      swatches: true,
      hidden: (avatar) => avatar.eyes === 'dots' || avatar.eyes === 'happy',
    },
    { part: 'brows', title: 'Eyebrows', zoom: true },
    { part: 'mouth', title: 'Mouth', zoom: true },
    {
      part: 'lipColor',
      title: 'Lip colour',
      swatches: true,
      hidden: (avatar) => avatar.mouth !== 'lips',
    },
    { part: 'cheeks', title: 'Cheeks', zoom: true },
  ],
  hair: [
    { part: 'hair', title: 'Hair style' },
    { part: 'hairColor', title: 'Hair colour', swatches: true },
  ],
  clothes: [
    { part: 'clothes', title: 'Top' },
    { part: 'clothesColor', title: 'Colour', swatches: true },
    {
      part: 'pattern',
      title: 'Print',
      disabled: (avatar) =>
        plainClothes.includes(avatar.clothes) ? 'This top has no prints.' : null,
    },
    { part: 'emblem', title: 'Badge on the top' },
  ],
  extras: [
    { part: 'glasses', title: 'Glasses', zoom: true },
    { part: 'earrings', title: 'Earrings', zoom: true },
    { part: 'necklace', title: 'Necklace' },
    { part: 'hairAccessory', title: 'Hair and head' },
    { part: 'faceTattoo', title: 'Cheek sticker', zoom: true },
    {
      part: 'armTattoo',
      title: 'Arm tattoo',
      note: 'Shows with a tank top.',
      preview: { clothes: 'tank' },
    },
    { part: 'crown', title: 'Crown' },
    { part: 'background', title: 'Background', swatches: true },
  ],
}

const names: Record<string, string> = {
  none: 'None',
  no: 'No',
  yes: 'Yes',
  tee: 'T-shirt',
  tank: 'Tank top',
  puff: 'Puff sleeves',
  dress: 'Pinafore',
  sequin: 'Sequins',
  denim: 'Denim jacket',
  graphic: 'Smiley tee',
  scarf: 'Headscarf',
  hairAccessory: 'Hair and head',
  cross: 'Determined',
  oh: 'Surprised',
  lashes: 'Lashes',
  both: 'Blush + freckles',
}

function choiceName(value: unknown): string {
  const text = String(value)
  return names[text] ?? text.charAt(0).toUpperCase() + text.slice(1)
}

export default function AvatarEditor({
  avatar,
  earned,
  firstTime,
  onChange,
  onDone,
}: {
  avatar: Avatar
  earned: Set<string>
  // No avatar has been saved yet, e.g. right after the welcome dialog.
  firstTime: boolean
  onChange: (avatar: Avatar) => void
  onDone: () => void
}) {
  const [tab, setTab] = useState<Tab>('face')

  function choose<K extends keyof Avatar>(part: K, value: Avatar[K]) {
    const next = { ...avatar, [part]: value }
    if (part === 'clothes' && plainClothes.includes(value as Avatar['clothes']))
      next.pattern = 'none'
    onChange(next)
  }

  return (
    <section className="avatar-editor" aria-label="Avatar editor">
      <div className="avatar-stage">
        <img
          className="avatar-preview"
          src={avatarImage(avatar, earned)}
          alt="Your avatar"
        />
        <div className="avatar-stage-text">
          {firstTime && <h2>Create your avatar</h2>}
          <p>
            Pick a face, hair, clothes and extras. Some extras are rewards:
            earn badges to unlock them.
          </p>
          <div className="avatar-stage-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => onChange(randomAvatar(earned))}
            >
              <Shuffle size={17} />
              Surprise me
            </button>
            <button type="button" className="button primary" onClick={onDone}>
              <Check size={17} />
              {firstTime ? "That's me!" : 'Done'}
            </button>
          </div>
          {firstTime && (
            <button type="button" className="button text-button" onClick={onDone}>
              Skip for now
            </button>
          )}
        </div>
      </div>
      <div className="segmented avatar-tabs" role="tablist" aria-label="Avatar parts">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'selected' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="avatar-groups" role="tabpanel">
        {groups[tab]
          .filter((group) => !group.hidden?.(avatar))
          .map((group) => {
            const disabledReason = group.disabled?.(avatar) ?? null
            const choices = avatarChoices[group.part] as readonly Avatar[keyof Avatar][]
            const lockedHints = choices
              .filter((value) => !isUnlocked(group.part, value, earned))
              .map((value) => avatarReward(group.part, value)!)
            return (
              <fieldset className="avatar-group" key={group.part} disabled={!!disabledReason}>
                <legend>{group.title}</legend>
                {disabledReason && <p className="avatar-note">{disabledReason}</p>}
                <div className={group.swatches ? 'avatar-swatches' : 'avatar-tiles'}>
                  {choices.map((value) => {
                    const locked = !isUnlocked(group.part, value, earned)
                    const selected = avatar[group.part] === value
                    const label = group.swatches
                      ? `${group.title} ${choices.indexOf(value) + 1}`
                      : choiceName(value)
                    if (group.swatches)
                      return (
                        <button
                          key={String(value)}
                          type="button"
                          className={`avatar-swatch ${selected ? 'selected' : ''}`}
                          style={{
                            background:
                              group.part === 'skin'
                                ? skinTones[value as number]
                                : String(value),
                          }}
                          aria-label={label}
                          aria-pressed={selected}
                          onClick={() => choose(group.part, value)}
                        />
                      )
                    return (
                      <button
                        key={String(value)}
                        type="button"
                        className={`avatar-tile ${selected ? 'selected' : ''} ${locked ? 'locked' : ''} ${group.zoom ? 'zoom' : ''}`}
                        aria-pressed={selected}
                        aria-label={locked ? `${label}, locked` : label}
                        disabled={locked}
                        onClick={() => choose(group.part, value)}
                      >
                        <span className="avatar-tile-image">
                          <img
                            src={avatarImage({
                              ...avatar,
                              ...group.preview,
                              [group.part]: value,
                            })}
                            alt=""
                            loading="lazy"
                          />
                          {locked && (
                            <span className="avatar-lock" aria-hidden="true">
                              <Lock size={16} />
                            </span>
                          )}
                        </span>
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
                {group.note && <p className="avatar-note">{group.note}</p>}
                {lockedHints.map((reward) => (
                  <p className="avatar-note locked-hint" key={reward.value}>
                    <Lock size={13} />
                    {choiceName(reward.value === 'yes' ? group.title : reward.value)}:{' '}
                    {reward.hint}
                  </p>
                ))}
              </fieldset>
            )
          })}
      </div>
    </section>
  )
}
