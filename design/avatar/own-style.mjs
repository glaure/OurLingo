// Prototype of the OurLingo avatar style chosen in issue #3 (own style).
// Not used by the app yet; the avatar editor will build on these drawings.
// Parts: head shapes, expressions, mouths, hair, clothes, patterns, tattoos,
// jewellery and reward items. viewBox 0 0 120 120.
const skins = ['#f9d7b9', '#eebf98', '#d39b6f', '#a86f4a', '#76472d']
export const shirts = { green: '#26785e', red: '#c2413b', blue: '#2f6fb7', violet: '#7b4bb8' }
const shade = (hex, f) =>
  '#' +
  [1, 3, 5]
    .map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16)
      const out = f < 1 ? v * f : v + (255 - v) * (f - 1)
      return Math.round(Math.min(255, out)).toString(16).padStart(2, '0')
    })
    .join('')
const ink = '#2a2420'
const gold = '#f2b632'
const goldDark = '#c98d12'

export function ownAvatar2({
  skin = 1,
  head = 'round',
  hair = 'short',
  hairColor = '#6b3f22',
  shirt = 'green',
  clothes = 'tee',
  pattern = null,
  bg = '#e3f2df',
  eyes = 'round',
  eyeColor = '#5a3b1e',
  brows = 'soft',
  mouth = 'smile',
  lipColor = '#d0606a',
  glasses = false,
  earrings = null,
  necklace = null,
  hairAcc = null,
  crown = false,
  emblem = null,
  blush = true,
  freckles = false,
  faceTattoo = null,
  armTattoo = null,
}) {
  const s = skins[skin]
  const sDark = shade(s, 0.86)
  const shirtColor = shirts[shirt]
  const oval = head === 'oval'
  const scarf = hair === 'scarf'
  const cy = oval ? 55 : 54
  const rx = oval ? 22.5 : 26
  const ry = oval ? 28 : 26
  const eyeY = cy + 1
  const mouthY = cy + 13
  const earX = 60 - rx - 1
  // Hair shapes are drawn for the round head and narrowed for the oval one.
  const fit = (svg) =>
    oval ? `<g transform="translate(60 0) scale(${(rx + 2) / 28} 1) translate(-60 0)">${svg}</g>` : svg
  const p = []
  p.push(`<circle cx="60" cy="60" r="60" fill="${bg}"/>`)

  // Hair and headscarf behind the head
  if (hair === 'long')
    p.push(fit(`<path d="M31 52 C29 26 45 17 60 17 C76 17 92 26 89 52 L92 90 C86 95 78 93 76 86 L76 58 L44 58 L44 86 C42 93 34 95 28 90 Z" fill="${hairColor}"/>`))
  if (hair === 'ponytail')
    p.push(`<path d="M80 34 C98 34 102 56 96 76 C93 86 86 88 84 82 C90 66 88 48 78 42 Z" fill="${hairColor}"/>`)
  if (scarf)
    p.push(`<path d="M27 58 C27 29 42 19 60 19 C78 19 93 29 93 58 C93 76 89 88 99 106 L21 106 C31 88 27 76 27 58 Z" fill="${hairColor}"/>`)

  // Clothes
  const body = 'M18 120 C18 94 37 83 60 83 C83 83 102 94 102 120 Z'
  const light = shade(shirtColor, 1.75)
  const dark = shade(shirtColor, 0.72)
  const innerTop = ['dungarees', 'dress', 'cardigan', 'denim'].includes(clothes)
  const base = clothes === 'tank' ? s : innerTop ? light : clothes === 'blouse' ? shade(shirtColor, 1.6) : shirtColor
  p.push(`<path d="${body}" fill="${base}"/>`)
  // The part of the clothes a pattern is printed on.
  const tankPath = 'M37 120 L39 101 C40 95 41 90 43 85 L50 84.5 C52 95 68 95 70 84.5 L77 85 C79 90 80 95 81 101 L83 120 Z'
  const dressPath = 'M36 120 L39 100 Q40 93 44 90 L46 86 L50 86 Q60 97 70 86 L74 86 L76 90 Q80 93 81 100 L84 120 Z'
  const garment = clothes === 'tank' ? tankPath : clothes === 'dress' ? dressPath : body
  if (clothes === 'tee' || clothes === 'stripes' || clothes === 'dungarees')
    p.push(`<path d="M50 83 Q60 93 70 83" fill="none" stroke="${clothes === 'dungarees' ? shade(shirtColor, 1.4) : dark}" stroke-width="3" stroke-linecap="round"/><path d="M31 96 Q34 106 33 116 M89 96 Q86 106 87 116" fill="none" stroke="${clothes === 'dungarees' ? shade(shirtColor, 1.4) : dark}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>`)
  if (clothes === 'stripes')
    p.push(`<path d="M22 104 H98 V110 H20 Z M19 114 H101 V120 H19 Z" fill="${shade(shirtColor, 1.45)}"/>`)
  if (clothes === 'tank')
    p.push(`<path d="M37 120 L39 101 C40 95 41 90 43 85 L50 84.5 C52 95 68 95 70 84.5 L77 85 C79 90 80 95 81 101 L83 120 Z" fill="${shirtColor}"/><path d="M50 84.5 C52 95 68 95 70 84.5" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`)
  if (clothes === 'hoodie') {
    p.push(`<path d="M36 89 C40 80 50 78 60 84 C70 78 80 80 84 89 C76 86 68 88 60 95 C52 88 44 86 36 89 Z" fill="${shade(shirtColor, 0.8)}"/>`)
    p.push(`<path d="M54 92 V106 M66 92 V106" stroke="${shade(shirtColor, 1.6)}" stroke-width="2.5" stroke-linecap="round"/>`)
    p.push(`<path d="M46 110 H74 V118 H46 Z" fill="none" stroke="${shade(shirtColor, 0.8)}" stroke-width="1.6" stroke-linejoin="round"/>`)
  }
  if (clothes === 'shirt' || clothes === 'collar')
    p.push(`<path d="M60 92 V120" stroke="${dark}" stroke-width="1.2"/><path d="M50 83 L60 94 L50 98 L44 86 Z M70 83 L60 94 L70 98 L76 86 Z" fill="#fff" stroke="${shade('#ffffff', 0.85)}" stroke-width="0.8"/>${[102, 109, 116].map((y) => `<circle cx="62.5" cy="${y}" r="1.5" fill="${dark}"/>`).join('')}`)
  if (clothes === 'polo')
    p.push(`<path d="M51 83 L59 93 L53 97 L46 86 Z M69 83 L61 93 L67 97 L74 86 Z" fill="${shade(shirtColor, 0.85)}" stroke="${dark}" stroke-width="0.8"/><path d="M57 92 H63 V104 H57 Z" fill="${shade(shirtColor, 0.9)}" stroke="${dark}" stroke-width="0.8"/><circle cx="60" cy="96" r="1.3" fill="#fff"/><circle cx="60" cy="101" r="1.3" fill="#fff"/>`)
  if (clothes === 'jacket')
    p.push(`<path d="M48 84 Q60 92 72 84 L64 120 H56 Z" fill="${shade(shirtColor, 1.8)}"/><path d="M50 83 Q60 91 70 83" fill="none" stroke="${shade(shirtColor, 1.4)}" stroke-width="2.4" stroke-linecap="round"/><path d="M47 84 L56 120 M73 84 L64 120" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/><path d="M47 84 L52 97 L45 95 M73 84 L68 97 L75 95" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linejoin="round"/>`)
  if (clothes === 'sweater')
    p.push(`<path d="M49 84 Q60 95 71 84" fill="none" stroke="${dark}" stroke-width="4.5" stroke-linecap="round"/><path d="M22 104 L28 99 L34 104 L40 99 L46 104 L52 99 L58 104 L64 99 L70 104 L76 99 L82 104 L88 99 L94 104 L98 101" fill="none" stroke="${shade(shirtColor, 1.55)}" stroke-width="2.6" stroke-linejoin="round"/>${[28, 40, 52, 64, 76, 88].map((x) => `<circle cx="${x}" cy="110" r="1.6" fill="${shade(shirtColor, 1.55)}"/>`).join('')}`)
  if (clothes === 'dungarees')
    p.push(`<path d="M47 103 L41 87 M73 103 L79 87" stroke="${shirtColor}" stroke-width="5" stroke-linecap="round"/><path d="M43 103 Q43 100 46 100 H74 Q77 100 77 103 V120 H43 Z" fill="${shirtColor}"/><path d="M53 106 H67 V114 Q60 117 53 114 Z" fill="none" stroke="${dark}" stroke-width="1.4"/><circle cx="47" cy="103.5" r="2" fill="${gold}"/><circle cx="73" cy="103.5" r="2" fill="${gold}"/>`)
  if (clothes === 'puff')
    p.push(`<path d="M49 84 Q60 96 71 84" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>${[[27, -1], [93, 1]].map(([x, d]) => `<ellipse cx="${x}" cy="97" rx="11" ry="9" fill="${shade(shirtColor, 1.12)}"/><path d="M${x - 6 * d} 90 Q${x - 2 * d} 97 ${x - 6 * d} 104 M${x} 89 V105 M${x + 6 * d} 91 Q${x + 2 * d} 97 ${x + 6 * d} 103" fill="none" stroke="${dark}" stroke-width="1.1" opacity="0.6"/>`).join('')}`)
  if (clothes === 'blouse')
    p.push(`${[44, 48.5, 53, 57.5, 62.5, 67, 71.5, 76].map((x, i) => `<circle cx="${x}" cy="${86 + [0, 2.6, 4.4, 5.2, 5.2, 4.4, 2.6, 0][i]}" r="3.3" fill="#fff" stroke="${shade('#ffffff', 0.85)}" stroke-width="0.6"/>`).join('')}<path d="M60 92 l-6 -3.5 v7 Z M60 92 l6 -3.5 v7 Z" fill="${shirtColor}"/><circle cx="60" cy="92" r="1.8" fill="${dark}"/><path d="M58 94 l-3 8 M62 94 l3 8" stroke="${shirtColor}" stroke-width="1.8" stroke-linecap="round"/>`)
  if (clothes === 'dress')
    p.push(`<path d="M50 83 Q60 93 70 83" fill="none" stroke="${shade(shirtColor, 1.4)}" stroke-width="2.4" stroke-linecap="round"/><path d="${dressPath}" fill="${shirtColor}"/><path d="M50 86 Q60 97 70 86" fill="none" stroke="${dark}" stroke-width="1.6"/><circle cx="47.5" cy="89.5" r="1.6" fill="#fff"/><circle cx="72.5" cy="89.5" r="1.6" fill="#fff"/>`)
  if (clothes === 'cardigan')
    p.push(`<path d="M50 83 Q60 91 70 83" fill="none" stroke="${shade(shirtColor, 1.4)}" stroke-width="2.4" stroke-linecap="round"/><path d="M18 120 C18 94 37 83 52 83 L57 120 Z M102 120 C102 94 83 83 68 83 L63 120 Z" fill="${shirtColor}"/><path d="M52 83 L57 120 M68 83 L63 120" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>${[96, 104, 112].map((y) => `<circle cx="${54.6 + (y - 96) * 0.13}" cy="${y}" r="1.5" fill="#fff"/>`).join('')}`)
  if (clothes === 'sequin')
    p.push(`<path d="M49 84 Q60 94 71 84" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>${Array.from({ length: 34 }, (_, i) => { const x = 24 + ((i * 37) % 74); const y = 92 + ((i * 53) % 27); return `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.3 : 1.9}" fill="${i % 4 ? shade(shirtColor, 1.55) : '#fff'}"/>` }).join('')}<path d="M40 100 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1 Z M80 108 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1 Z" fill="#fff"/>`)
  if (clothes === 'denim')
    p.push(`<path d="M50 83 Q60 91 70 83" fill="none" stroke="${shirtColor}" stroke-width="3" stroke-linecap="round"/><path d="M48 84 Q60 92 72 84 L64 120 H56 Z" fill="${shirtColor}"/><path d="M18 120 C18 94 37 83 48 84 L56 120 Z M102 120 C102 94 83 83 72 84 L64 120 Z" fill="#5b86b8"/><path d="M48 84 L44 96 L52 96 Z M72 84 L76 96 L68 96 Z" fill="#4a72a1"/><path d="M48 84 L56 120 M72 84 L64 120" stroke="#f2b632" stroke-width="1" stroke-dasharray="2 2"/><path d="M33 106 l1.6 3.2 3.5 .5 -2.5 2.5 .6 3.5 -3.2 -1.7 -3.2 1.7 .6 -3.5 -2.5 -2.5 3.5 -.5 Z" fill="#f6c344"/><path d="M86 106 c-2.4 -3.6 -6.4 -.6 -4 2.4 l4 4 4 -4 c2.4 -3 -1.6 -6 -4 -2.4 Z" fill="#e35d7a"/>`)
  if (clothes === 'bomber')
    p.push(`<path d="M49 84 Q60 92 71 84" fill="none" stroke="${dark}" stroke-width="5" stroke-linecap="round"/><path d="M60 89 V120" stroke="#cfd6dc" stroke-width="1.8"/><path d="M60 89 V120" stroke="#8d989f" stroke-width="0.6" stroke-dasharray="1 1.2"/><path d="M40 104 H52 M68 104 H80" stroke="${dark}" stroke-width="1.4" stroke-linecap="round"/><circle cx="30" cy="104" r="4.5" fill="#f6c344" stroke="${dark}" stroke-width="1"/><path d="M28 104 l1.5 1.5 3 -3" fill="none" stroke="${dark}" stroke-width="1.2" stroke-linecap="round"/>`)
  if (clothes === 'graphic')
    p.push(`<path d="M50 83 Q60 93 70 83" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="107" r="9" fill="#f6c344"/><circle cx="57" cy="105" r="1.2" fill="${ink}"/><circle cx="63" cy="105" r="1.2" fill="${ink}"/><path d="M55.5 108.5 Q60 113 64.5 108.5" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>`)
  if (clothes === 'jersey')
    p.push(`<path d="M50 83 L60 95 L70 83" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M24 101 L36 93 M96 101 L84 93" stroke="#fff" stroke-width="3" stroke-linecap="round"/><text x="60" y="116" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="17" fill="#fff">7</text>`)
  // Patterns printed on the clothes.
  if (pattern) {
    const ink2 = shade(shirtColor, pattern === 'leopard' ? 0.55 : 1.6)
    const motif = (x, y, i) => ({
      dots: `<circle cx="${x}" cy="${y}" r="1.8" fill="${ink2}"/>`,
      hearts: `<path d="M${x} ${y + 0.8} c-1.6 -2.4 -4.2 -.4 -2.6 1.6 l2.6 2.6 2.6 -2.6 c1.6 -2 -1 -4 -2.6 -1.6 Z" fill="${i % 2 ? '#f6a5c0' : '#fff'}"/>`,
      flowers: `${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + 2.2 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" cy="${(y + 2.2 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" r="1.5" fill="${i % 2 ? '#fff' : '#f6c3dc'}"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.2" fill="#f6c344"/>`,
      stars: `<path d="M${x} ${y - 3} l.9 1.9 2.1 .3 -1.5 1.5 .3 2.1 -1.8 -1 -1.8 1 .3 -2.1 -1.5 -1.5 2.1 -.3 Z" fill="${i % 2 ? '#f6c344' : '#fff'}"/>`,
      leopard: `<path d="M${x - 2} ${y} q2 -3 4 0 q-2 3 -4 0 Z" fill="none" stroke="${ink2}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="0.8" fill="${ink2}"/>`,
    })[pattern]
    let motifs = ''
    if (pattern === 'plaid')
      motifs = [24, 38, 52, 66, 80, 94].map((x) => `<rect x="${x}" y="80" width="6" height="45" fill="${shade(shirtColor, 0.6)}" opacity="0.45"/><rect x="${x + 8}" y="80" width="1.2" height="45" fill="#fff" opacity="0.5"/>`).join('') + [88, 102, 116].map((y) => `<rect x="10" y="${y}" width="100" height="6" fill="${shade(shirtColor, 0.6)}" opacity="0.45"/><rect x="10" y="${y + 8}" width="100" height="1.2" fill="#fff" opacity="0.5"/>`).join('')
    else if (pattern === 'rainbow')
      motifs = ['#e35d7a', '#f08a24', '#f6c344', '#5fb98c', '#4a8fd9', '#9a6bd3'].map((c, i) => `<rect x="10" y="${98 + i * 4}" width="100" height="4" fill="${c}"/>`).join('')
    else
      for (let row = 0, i = 0; row < 5; row += 1)
        for (let col = 0; col < 10; col += 1, i += 1)
          motifs += motif(20 + col * 9 + (row % 2) * 4.5, 90 + row * 7.5, i)
    p.push(`<defs><clipPath id="garment"><path d="${garment}"/></clipPath></defs><g clip-path="url(#garment)">${motifs}</g>`)
  }
  // Tattoos on the shoulder show with a tank top.
  if (armTattoo && clothes === 'tank') {
    const t = { heart: `<path d="M0 3 c-4 -6 -11 -1 -7 4 l7 7 7 -7 c4 -5 -3 -10 -7 -4 Z" fill="#e35d7a" stroke="#2b4a7a" stroke-width="1.3" stroke-linejoin="round"/>`,
      anchor: `<g fill="none" stroke="#2b4a7a" stroke-width="1.8" stroke-linecap="round"><circle cy="-4" r="2"/><path d="M0 -2 V11 M-4 1 H4 M-7 6 Q-6 12 0 12 Q6 12 7 6"/></g>`,
      rocket: `<path d="M0 -8 C4 -4 4 3 3 7 H-3 C-4 3 -4 -4 0 -8 Z" fill="#f6f2ea" stroke="#2b4a7a" stroke-width="1.3"/><circle cy="-1" r="1.6" fill="#4a8fd9"/><path d="M-3 4 L-6 9 L-3 7 M3 4 L6 9 L3 7" fill="#e35d7a" stroke="#2b4a7a" stroke-width="1"/><path d="M-1.5 8 L0 12 L1.5 8" fill="#f08a24"/>` }[armTattoo]
    p.push(`<g transform="translate(31 101) rotate(-12) scale(0.85)">${t}</g>`)
  }
  if (emblem === 'star')
    p.push(`<path d="M60 99 l3.2 6.4 7 1 -5.1 5 1.2 7 -6.3 -3.3 -6.3 3.3 1.2 -7 -5.1 -5 7 -1 Z" fill="#f6c344"/>`)
  if (emblem === 'flame')
    p.push(`<path d="M60 96 C66 103 70 107 70 112 C70 117.5 65.5 120 60 120 C54.5 120 50 117.5 50 112 C50 107 54 104 56 100 C57 104 59 105 60 105 C61 102 61 99 60 96 Z" fill="#f08a24"/><path d="M60 107 C63 110 64 112 64 114 C64 117 62 119 60 119 C58 119 56 117 56 114 C56 112 58 110 60 107 Z" fill="#f6c344"/>`)

  // Neck and ears
  const afterNeck = []
  if (clothes === 'turtleneck')
    afterNeck.push(`<path d="M49 75 H71 V88 Q60 93 49 88 Z" fill="${shade(shirtColor, 0.9)}"/>${[53, 57, 61, 65, 69].map((x) => `<path d="M${x} 77 V89" stroke="${dark}" stroke-width="1" opacity="0.5"/>`).join('')}`)
  if (!scarf) {
    p.push(`<path d="M52 72 H68 V84 C64 88 56 88 52 84 Z" fill="${sDark}"/>`)
    p.push(`<circle cx="${earX}" cy="${eyeY + 1}" r="6" fill="${s}" stroke="${shade(s, 0.78)}" stroke-width="1.2"/>`)
    p.push(`<circle cx="${120 - earX}" cy="${eyeY + 1}" r="6" fill="${s}" stroke="${shade(s, 0.78)}" stroke-width="1.2"/>`)
  }
  if (hair === 'braids')
    for (const x of [35, 85])
      p.push([62, 69, 76, 83, 90].map((y) => `<ellipse cx="${x}" cy="${y}" rx="${y === 90 ? 3.8 : 4.6}" ry="4.4" fill="${hairColor}" stroke="${shade(hairColor, 0.75)}" stroke-width="0.8"/>`).join('') + `<path d="M${x - 3} 95 h6" stroke="#f28ab2" stroke-width="2.6" stroke-linecap="round"/>`)
  p.push(...afterNeck)
  // Necklace sits on the neckline
  if (necklace === 'pearls')
    p.push([46, 50, 55, 60, 65, 70, 74].map((x, i) => `<circle cx="${x}" cy="${86 + [0, 2.5, 4, 4.6, 4, 2.5, 0][i]}" r="2.2" fill="#fbf7ef" stroke="#d9cfbd" stroke-width="0.8"/>`).join(''))
  if (necklace === 'pendant')
    p.push(`<path d="M47 85 Q60 96 73 85" fill="none" stroke="${gold}" stroke-width="1.4"/><path d="M60 93 c-3 -4 -8 -1 -5 3 l5 5 5 -5 c3 -4 -2 -7 -5 -3 Z" fill="#e35d7a" stroke="${goldDark}" stroke-width="0.8"/>`)

  // Head
  p.push(`<ellipse cx="60" cy="${cy}" rx="${scarf ? 21 : rx}" ry="${scarf ? 24 : ry}" fill="${s}" stroke="${shade(s, 0.8)}" stroke-width="1.2"/>`)

  // Earrings below the ears
  if (!scarf && earrings) {
    for (const x of [earX, 120 - earX]) {
      if (earrings === 'studs') p.push(`<circle cx="${x}" cy="${eyeY + 6}" r="2.2" fill="${gold}" stroke="${goldDark}" stroke-width="0.8"/>`)
      if (earrings === 'hoops') p.push(`<circle cx="${x}" cy="${eyeY + 10}" r="4.5" fill="none" stroke="${gold}" stroke-width="1.8"/>`)
      if (earrings === 'drops') p.push(`<path d="M${x} ${eyeY + 6} v3" stroke="${goldDark}" stroke-width="1"/><path d="M${x} ${eyeY + 9} c3 3 3 7 0 7 c-3 0 -3 -4 0 -7 Z" fill="#4a8fd9" stroke="${goldDark}" stroke-width="0.8"/>`)
    }
  }

  // Hair in front
  const front = []
  if (hair === 'short' || hair === 'bun' || hair === 'ponytail' || hair === 'braids')
    front.push(`<path d="M33 52 C32 29 45 21 60 21 C76 21 88 30 87 52 C83 42 76 36 66 35 C60 41 48 41 40 40 C36 43 34 47 33 52 Z" fill="${hairColor}"/>`)
  if (hair === 'bun') front.push(`<circle cx="60" cy="19" r="10" fill="${hairColor}"/>`)
  if (hair === 'long')
    front.push(`<path d="M34 51 C34 29 47 22 60 22 C74 22 86 30 86 51 C78 46 70 38 64 32 C58 41 46 47 34 51 Z" fill="${hairColor}"/>`)
  if (hair === 'curly')
    for (const [x, y, r] of [[35, 45, 9], [41, 33, 10], [52, 25, 10], [66, 25, 10], [78, 31, 10], [86, 44, 9], [60, 32, 8], [46, 39, 7], [74, 39, 7], [33, 55, 6], [87, 55, 6]])
      front.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${hairColor}"/>`)
  if (hair === 'spiky')
    front.push(`<path d="M33 52 L29 33 L40 37 L41 21 L51 31 L58 14 L65 30 L75 18 L77 34 L90 30 L87 52 C80 42 70 38 60 39 C50 38 40 43 33 52 Z" fill="${hairColor}"/>`)
  if (hair !== 'scarf' && hair !== 'curly')
    front.push(`<path d="M44 29 Q54 24 64 26" fill="none" stroke="${shade(hairColor, 1.35)}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`)
  p.push(fit(front.join('')))
  if (scarf)
    p.push(`<path d="M38 47 C41 34 50 29 60 29 C70 29 79 34 82 47 C75 40 68 37 60 37 C52 37 45 40 38 47 Z" fill="${shade(hairColor, 0.85)}"/>`)
  if (hairAcc === 'bow')
    p.push(`<g transform="translate(77 27) rotate(18)"><path d="M0 0 L-9 -6 L-9 6 Z M0 0 L9 -6 L9 6 Z" fill="#f28ab2" stroke="#d65b8c" stroke-width="1" stroke-linejoin="round"/><circle r="2.6" fill="#d65b8c"/></g>`)
  if (hairAcc === 'clip')
    p.push(`<path d="M42 33 l1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6 Z" fill="#f6c344" stroke="${goldDark}" stroke-width="0.8"/>`)
  if (hairAcc === 'headband')
    p.push(fit(`<path d="M34 44 C38 28 48 23 60 23 C72 23 82 28 86 44" fill="none" stroke="#f28ab2" stroke-width="5" stroke-linecap="round"/>`))

  if (hairAcc === 'beanie')
    p.push(fit(`<path d="M32 46 C31 26 44 17 60 17 C76 17 89 26 88 46 Z" fill="${shirtColor}"/><path d="M30 41 H90 V50 H30 Z" rx="3" fill="${shade(shirtColor, 0.8)}"/>${[36, 44, 52, 60, 68, 76, 84].map((x) => `<path d="M${x} 42 V49" stroke="${shade(shirtColor, 0.62)}" stroke-width="1.2"/>`).join('')}<circle cx="60" cy="15" r="6" fill="${shade(shirtColor, 1.6)}"/>`))
  if (hairAcc === 'headphones')
    p.push(`<path d="M${earX - 1} ${eyeY} C${earX - 3} 18 ${121 - earX} 18 ${121 - earX} ${eyeY}" fill="none" stroke="#3a3a44" stroke-width="4" stroke-linecap="round"/><rect x="${earX - 6}" y="${eyeY - 7}" width="9" height="15" rx="4" fill="${shirtColor}" stroke="#3a3a44" stroke-width="1.6"/><rect x="${117 - earX}" y="${eyeY - 7}" width="9" height="15" rx="4" fill="${shirtColor}" stroke="#3a3a44" stroke-width="1.6"/>`)
  // Eyebrows
  const browColor = scarf ? '#3b2a1e' : shade(hairColor === '#e2b04a' ? '#8a6420' : hairColor, 0.8)
  const brow = {
    soft: [`M44 ${eyeY - 9} q6 -4 12 -1`, `M64 ${eyeY - 10} q6 -3 12 1`],
    raised: [`M44 ${eyeY - 12} q6 -5 12 -2`, `M64 ${eyeY - 14} q6 -3 12 2`],
    cross: [`M44 ${eyeY - 11} l12 4`, `M76 ${eyeY - 11} l-12 4`],
    worried: [`M44 ${eyeY - 8} l12 -4`, `M76 ${eyeY - 8} l-12 -4`],
  }[brows]
  p.push(`<path d="${brow.join(' ')}" fill="none" stroke="${browColor}" stroke-width="2.6" stroke-linecap="round"/>`)

  // Eyes
  // dir is -1 for the left eye and 1 for the right eye, so lashes point outwards.
  const eye = (x, dir, kind = eyes) => {
    if (kind === 'happy') return `<path d="M${x - 5} ${eyeY + 1} q5 -6 10 0" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`
    if (kind === 'dots') return `<circle cx="${x}" cy="${eyeY}" r="3.4" fill="${ink}"/><circle cx="${x + 1.2}" cy="${eyeY - 1.2}" r="1" fill="#fff"/>`
    const lashes = kind === 'lashes'
      ? `<path d="M${x + dir * 4} ${eyeY - 4} l${dir * 3} -2.4 M${x + dir * 5.4} ${eyeY - 1.4} l${dir * 3.2} -1" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>`
      : ''
    return `<ellipse cx="${x}" cy="${eyeY}" rx="5.4" ry="6" fill="#fff" stroke="${shade(s, 0.7)}" stroke-width="0.8"/><circle cx="${x + 0.6}" cy="${eyeY + 0.8}" r="3.6" fill="${eyeColor}"/><circle cx="${x + 0.6}" cy="${eyeY + 0.8}" r="1.8" fill="${ink}"/><circle cx="${x + 1.8}" cy="${eyeY - 0.8}" r="1.1" fill="#fff"/><path d="M${x - 5.4} ${eyeY - 1.5} q5.4 -6 10.8 0" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>${lashes}`
  }
  p.push(
    eyes === 'wink'
      ? eye(50, -1, 'round') + eye(70, 1, 'happy')
      : eye(50, -1) + eye(70, 1),
  )
  if (glasses)
    p.push(`<g fill="${'#ffffff'}" fill-opacity="0.15" stroke="${ink}" stroke-width="2.4"><rect x="41" y="${eyeY - 8}" width="18" height="15" rx="6"/><rect x="61" y="${eyeY - 8}" width="18" height="15" rx="6"/><path d="M59 ${eyeY - 2} h2" fill="none"/></g>`)

  // Nose, cheeks, freckles
  p.push(`<path d="M58.5 ${eyeY + 6} q1.5 3 3 0" fill="none" stroke="${shade(s, 0.7)}" stroke-width="1.8" stroke-linecap="round"/>`)
  if (blush) p.push(`<ellipse cx="44" cy="${eyeY + 9}" rx="5" ry="3.4" fill="#ef7d57" opacity="0.3"/>${faceTattoo ? '' : `<ellipse cx="76" cy="${eyeY + 9}" rx="5" ry="3.4" fill="#ef7d57" opacity="0.3"/>`}`)
  // Sticker tattoos on the cheek, the kind children love.
  if (faceTattoo) {
    const t = { star: `<path d="M0 -4.5 l1.4 2.9 3.2 .5 -2.3 2.2 .5 3.2 -2.8 -1.5 -2.8 1.5 .5 -3.2 -2.3 -2.2 3.2 -.5 Z" fill="#f6c344" stroke="#d99a16" stroke-width="0.7"/>`,
      heart: `<path d="M0 1.6 c-2.4 -3.6 -6.4 -.6 -4 2.4 l4 4 4 -4 c2.4 -3 -1.6 -6 -4 -2.4 Z" transform="translate(0 -3.5)" fill="#e35d7a"/>`,
      bolt: `<path d="M1 -5 L-3 1 H0 L-1 5 L3 -1 H0 Z" fill="#4a8fd9" stroke="#2f6fb7" stroke-width="0.6" stroke-linejoin="round"/>`,
      flower: `${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(2.6 * Math.cos((a * Math.PI) / 180)).toFixed(2)}" cy="${(2.6 * Math.sin((a * Math.PI) / 180)).toFixed(2)}" r="1.9" fill="#b784e0"/>`).join('')}<circle r="1.5" fill="#f6c344"/>` }[faceTattoo]
    p.push(`<g transform="translate(77 ${eyeY + 9})">${t}</g>`)
  }
  if (freckles) p.push([[42, 7], [46, 9], [44, 11], [74, 7], [78, 9], [76, 11]].map(([x, dy]) => `<circle cx="${x}" cy="${eyeY + dy}" r="0.9" fill="${shade(s, 0.62)}"/>`).join(''))

  // Mouths
  const m = mouthY
  const mouths = {
    smile: `<path d="M52 ${m - 1} Q60 ${m + 6} 68 ${m - 1}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`,
    grin: `<path d="M50 ${m - 2} Q60 ${m - 1} 70 ${m - 2} Q69 ${m + 9} 60 ${m + 9} Q51 ${m + 9} 50 ${m - 2} Z" fill="#7a2f2f"/><path d="M51 ${m - 1.6} Q60 ${m - 0.6} 69 ${m - 1.6} L68.4 ${m + 1.8} Q60 ${m + 2.6} 51.6 ${m + 1.8} Z" fill="#fff"/>`,
    laugh: `<path d="M50 ${m - 2} Q60 ${m - 1} 70 ${m - 2} Q69 ${m + 11} 60 ${m + 11} Q51 ${m + 11} 50 ${m - 2} Z" fill="#7a2f2f"/><path d="M53 ${m + 6} Q60 ${m + 2} 67 ${m + 6} Q66 ${m + 10.5} 60 ${m + 10.5} Q54 ${m + 10.5} 53 ${m + 6} Z" fill="#ef7f8f"/>`,
    lips: `<path d="M51 ${m} Q55 ${m - 4} 60 ${m - 2} Q65 ${m - 4} 69 ${m} Q60 ${m + 1.5} 51 ${m} Z" fill="${lipColor}"/><path d="M51 ${m} Q60 ${m + 1.5} 69 ${m} Q65 ${m + 6} 60 ${m + 6} Q55 ${m + 6} 51 ${m} Z" fill="${shade(lipColor, 1.12)}"/><path d="M57 ${m + 3.5} q3 1 6 0" stroke="#fff" stroke-width="1" opacity="0.5" fill="none" stroke-linecap="round"/>`,
    smirk: `<path d="M53 ${m + 1} Q61 ${m + 4} 68 ${m - 3}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`,
    oh: `<ellipse cx="60" cy="${m + 1.5}" rx="3.6" ry="4.4" fill="#7a2f2f"/>`,
  }
  p.push(mouths[mouth])

  if (crown)
    p.push(`<path d="M42 29 L44 11 L52 21 L60 7 L68 21 L76 11 L78 29 Z" fill="#f6c344" stroke="#d99a16" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="21" r="2.6" fill="#c2413b"/><circle cx="48" cy="25" r="1.8" fill="#2f6fb7"/><circle cx="72" cy="25" r="1.8" fill="#26785e"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">${p.join('')}</svg>`
}
