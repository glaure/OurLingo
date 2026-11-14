import { writeFileSync } from 'node:fs'
import { ownAvatar2 } from './own-style.mjs'
const base = { skin: 1, hair: 'short', hairColor: '#6b3f22', shirt: 'blue', bg: '#e1edfb' }
const out = {
  own: [
    { label: 'Oval face, lips, hoops', svg: ownAvatar2({ skin: 2, head: 'oval', hair: 'long', hairColor: '#2d2219', shirt: 'red', clothes: 'collar', bg: '#fde4e2', eyes: 'lashes', brows: 'soft', mouth: 'lips', earrings: 'hoops', necklace: 'pendant' }) },
    { label: 'Big laugh, dungarees, cheek star', svg: ownAvatar2({ skin: 0, hair: 'curly', hairColor: '#b5452f', shirt: 'green', clothes: 'dungarees', faceTattoo: 'star', bg: '#e3f2df', eyes: 'happy', brows: 'raised', mouth: 'laugh', freckles: true }) },
    { label: 'Crown, pearls (MORE! 3 master)', svg: ownAvatar2({ skin: 3, head: 'oval', hair: 'bun', hairColor: '#2d2219', shirt: 'blue', clothes: 'tee', bg: '#e1edfb', eyes: 'round', eyeColor: '#3b2414', brows: 'soft', mouth: 'grin', necklace: 'pearls', earrings: 'studs', crown: true }) },
    { label: 'Headscarf, lips, star shirt', svg: ownAvatar2({ skin: 2, head: 'oval', hair: 'scarf', hairColor: '#9a6bd3', shirt: 'violet', clothes: 'tee', bg: '#efe6fa', eyes: 'lashes', brows: 'soft', mouth: 'lips', lipColor: '#c4566a', emblem: 'star' }) },
    { label: 'Wink, ponytail, bow, streak flame', svg: ownAvatar2({ skin: 1, hair: 'ponytail', hairColor: '#e2b04a', shirt: 'green', clothes: 'stripes', bg: '#fff1cc', eyes: 'wink', brows: 'raised', mouth: 'grin', hairAcc: 'bow', earrings: 'drops', emblem: 'flame' }) },
    { label: 'Tank top, rocket tattoo, glasses', svg: ownAvatar2({ skin: 4, hair: 'spiky', hairColor: '#7b4bb8', shirt: 'red', clothes: 'tank', armTattoo: 'rocket', faceTattoo: 'bolt', bg: '#dff1f6', eyes: 'round', eyeColor: '#2c1a0e', brows: 'cross', mouth: 'smirk', glasses: true, earrings: 'studs' }) },
  ],
  heads: [
    { label: 'round', svg: ownAvatar2({ ...base, head: 'round' }) },
    { label: 'oval', svg: ownAvatar2({ ...base, head: 'oval' }) },
  ],
  mouths: ['smile', 'grin', 'laugh', 'lips', 'smirk', 'oh'].map((mouth) => ({ label: mouth, svg: ownAvatar2({ ...base, mouth }) })),
  faces: [
    ['happy', { eyes: 'happy', brows: 'raised', mouth: 'laugh' }],
    ['cheeky', { eyes: 'wink', brows: 'soft', mouth: 'grin' }],
    ['surprised', { eyes: 'round', brows: 'raised', mouth: 'oh' }],
    ['determined', { eyes: 'round', brows: 'cross', mouth: 'smirk' }],
    ['worried', { eyes: 'round', brows: 'worried', mouth: 'oh' }],
    ['calm', { eyes: 'lashes', brows: 'soft', mouth: 'smile' }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, ...o }) })),
  hair: [
    ['short', { hair: 'short' }],
    ['long', { hair: 'long', head: 'oval' }],
    ['curly', { hair: 'curly', hairColor: '#2d2219', skin: 3 }],
    ['bun', { hair: 'bun', hairColor: '#b5452f' }],
    ['ponytail', { hair: 'ponytail', hairColor: '#e2b04a', skin: 0 }],
    ['spiky', { hair: 'spiky', hairColor: '#2d2219', skin: 4 }],
    ['headscarf', { hair: 'scarf', hairColor: '#4a8fd9', head: 'oval', skin: 2 }],
    ['fun colour', { hair: 'short', hairColor: '#2fa38c' }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, ...o }) })),
  clothes: ['tee', 'tank', 'shirt', 'polo', 'hoodie', 'jacket', 'sweater', 'dungarees'].map((clothes, i) => ({
    label: clothes === 'tee' ? 'T-shirt' : clothes === 'tank' ? 'tank top' : clothes,
    svg: ownAvatar2({ ...base, clothes, shirt: ['green', 'red', 'blue', 'violet'][i % 4] }),
  })),
  moreClothes: [
    ['puff sleeves', { clothes: 'puff', shirt: 'violet' }],
    ['blouse', { clothes: 'blouse', shirt: 'red' }],
    ['pinafore dress', { clothes: 'dress', shirt: 'green' }],
    ['cardigan', { clothes: 'cardigan', shirt: 'blue' }],
    ['sequin top', { clothes: 'sequin', shirt: 'violet' }],
    ['denim jacket', { clothes: 'denim', shirt: 'red' }],
    ['turtleneck', { clothes: 'turtleneck', shirt: 'green' }],
    ['sports jersey', { clothes: 'jersey', shirt: 'blue' }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, hair: 'long', head: 'oval', eyes: 'lashes', ...o }) })),
  teen: [
    ['plaid shirt', { clothes: 'shirt', pattern: 'plaid', shirt: 'red', hair: 'long', hairColor: '#2d2219' }],
    ['bomber jacket', { clothes: 'bomber', shirt: 'green', hair: 'short', hairColor: '#6b3f22' }],
    ['graphic tee', { clothes: 'graphic', shirt: 'violet', hair: 'braids', hairColor: '#2d2219', skin: 3 }],
    ['headphones', { clothes: 'hoodie', shirt: 'blue', hairAcc: 'headphones', hair: 'spiky', hairColor: '#e2b04a', skin: 0 }],
    ['beanie', { clothes: 'sweater', shirt: 'red', hairAcc: 'beanie', hair: 'long', hairColor: '#b5452f' }],
    ['braids', { clothes: 'denim', shirt: 'green', hair: 'braids', hairColor: '#6b3f22', faceTattoo: 'heart' }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, head: 'oval', ...o }) })),
  patterns: [
    ['dots', { clothes: 'tee', pattern: 'dots', shirt: 'blue' }],
    ['hearts', { clothes: 'dress', pattern: 'hearts', shirt: 'red' }],
    ['flowers', { clothes: 'puff', pattern: 'flowers', shirt: 'green' }],
    ['stars', { clothes: 'tee', pattern: 'stars', shirt: 'violet' }],
    ['rainbow', { clothes: 'tank', pattern: 'rainbow', shirt: 'blue' }],
    ['leopard', { clothes: 'tee', pattern: 'leopard', shirt: 'violet', skin: 2 }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, hair: 'ponytail', hairColor: '#2d2219', head: 'oval', ...o }) })),
  tattoos: [
    ['cheek star', { faceTattoo: 'star' }],
    ['cheek heart', { faceTattoo: 'heart' }],
    ['cheek bolt', { faceTattoo: 'bolt' }],
    ['cheek flower', { faceTattoo: 'flower' }],
    ['arm heart', { clothes: 'tank', armTattoo: 'heart' }],
    ['arm anchor', { clothes: 'tank', armTattoo: 'anchor' }],
    ['arm rocket', { clothes: 'tank', armTattoo: 'rocket' }],
    ['both', { clothes: 'tank', armTattoo: 'rocket', faceTattoo: 'star', shirt: 'red' }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, ...o }) })),
  jewellery: [
    ['studs', { earrings: 'studs' }],
    ['hoops', { earrings: 'hoops' }],
    ['drops', { earrings: 'drops' }],
    ['pearls', { necklace: 'pearls' }],
    ['pendant', { necklace: 'pendant' }],
    ['bow', { hairAcc: 'bow', hair: 'long' }],
  ].map(([label, o]) => ({ label, svg: ownAvatar2({ ...base, hair: 'long', head: 'oval', ...o }) })),
}
// Writes all sample avatars as SVG strings: node design/avatar/samples.mjs
writeFileSync(new URL('./samples.json', import.meta.url), JSON.stringify(out))
