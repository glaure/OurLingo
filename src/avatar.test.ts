import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  avatarChoices,
  avatarRewards,
  cheering,
  defaultAvatar,
  drawAvatar,
  isUnlocked,
  normalizeAvatar,
  plainClothes,
  randomAvatar,
} from './avatar.ts'
import { badges } from './activity.ts'

test('saved avatars keep known choices and fall back for anything else', () => {
  assert.deepEqual(normalizeAvatar(null), defaultAvatar())
  assert.deepEqual(normalizeAvatar('broken'), defaultAvatar())
  const avatar = normalizeAvatar({
    hair: 'curly',
    hairColor: '#e0709a',
    clothes: 'tank',
    skin: 4,
    mouth: 'shout',
    eyeColor: '#123456',
    crown: 'yes',
  })
  assert.equal(avatar.hair, 'curly')
  assert.equal(avatar.hairColor, '#e0709a')
  assert.equal(avatar.clothes, 'tank')
  assert.equal(avatar.skin, 4)
  assert.equal(avatar.mouth, defaultAvatar().mouth)
  assert.equal(avatar.eyeColor, defaultAvatar().eyeColor)
  assert.equal(avatar.crown, 'yes')
})

test('every reward is a real choice unlocked by a real badge', () => {
  const badgeIds = new Set(badges.map((badge) => badge.id))
  for (const reward of avatarRewards) {
    assert.ok((avatarChoices[reward.part] as readonly unknown[]).includes(reward.value), reward.value)
    assert.equal(reward.unlocked(new Set()), false)
    assert.equal(reward.unlocked(badgeIds), true, reward.value)
  }
  assert.equal(isUnlocked('crown', 'yes', new Set(['book-MORE! 2'])), true)
  assert.equal(isUnlocked('hair', 'curly', new Set()), true)
})

test('locked rewards are left out of the drawing', () => {
  const avatar = { ...defaultAvatar(), crown: 'yes' as const, emblem: 'star' as const }
  const crown = '#d99a16" stroke-width="2"'
  assert.ok(drawAvatar(avatar).includes(crown))
  assert.ok(!drawAvatar(avatar, new Set()).includes(crown))
  assert.ok(drawAvatar(avatar, new Set(['book-MORE! 1'])).includes(crown))
})

test('prints are only drawn on tops that can carry them', () => {
  const printed = drawAvatar({ ...defaultAvatar(), clothes: 'tee', pattern: 'hearts' })
  assert.ok(printed.includes('clip-path="url(#garment)"'))
  for (const clothes of plainClothes)
    assert.ok(!drawAvatar({ ...defaultAvatar(), clothes, pattern: 'hearts' }).includes('clipPath'))
})

test('random avatars only use unlocked parts and fitting combinations', () => {
  let seed = 7
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let index = 0; index < 300; index += 1) {
    const avatar = randomAvatar(new Set(), random)
    for (const reward of avatarRewards) assert.notEqual(avatar[reward.part], reward.value)
    if (plainClothes.includes(avatar.clothes)) assert.equal(avatar.pattern, 'none')
    if (avatar.clothes !== 'tank') assert.equal(avatar.armTattoo, 'none')
    assert.deepEqual(normalizeAvatar(avatar), avatar)
  }
})

test('the cheering avatar laughs', () => {
  assert.deepEqual(
    { ...cheering(defaultAvatar()) },
    { ...defaultAvatar(), eyes: 'happy', brows: 'raised', mouth: 'laugh' },
  )
})
