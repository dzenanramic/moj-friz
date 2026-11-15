import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The palette is checked here, not by eye. Every pair a component may put together must reach
 * WCAG 2.2 AA: 4.5:1 for text, 3:1 for a control boundary or an icon that carries meaning.
 *
 * The values are read from index.css itself, so a token edit cannot pass with stale numbers in
 * this file. Rules that the palette review established:
 * - `accent` (copper) is a fill, never text; `accent-ui` is the one warm tone that may be text
 *   (pending, a no-show, a warning): a darkened copper that reads and also works as a 3:1 bar.
 * - `brick` is a fill and a border; `brick-ink` is brick as text.
 * - `muted` never sits inside a hairdresser card; that text is `ink` or `--staff-ink`.
 * - `line` is a border, never text.
 *
 * The first-paint copy of the tokens (public/theme-boot.css) is checked against these same values
 * below, so the boot stylesheet cannot drift from the palette the app actually uses.
 */
// Vitest runs from frontend/; read the source files, not bundled copies.
const css = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8')
const bootCss = readFileSync(resolve(process.cwd(), 'public/theme-boot.css'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Missing ${selector} block in index.css`)
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  throw new Error(`Unclosed ${selector} block`)
}

function tokens(source: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const match of source.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    out[match[1]!.slice(2)] = match[2]!.toLowerCase()
  }
  return out
}

const light = tokens(block(':root'))
// The second `.dark` block is the shadow override; the first carries the colours.
const dark = tokens(block('.dark'))

function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ]
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Every pairing the components actually build, with the threshold that applies. */
function pairs(): Array<[string, string, number]> {
  const list: Array<[string, string, number]> = []
  const text = (fg: string, bg: string, min = 4.5) => list.push([fg, bg, min])
  for (const bg of ['paper', 'surface', 'line']) {
    text('ink', bg)
    text('muted', bg)
  }
  for (const tint of ['primary-tint', 'accent-tint', 'brick-tint']) {
    text('ink', tint)
    text('muted', tint)
  }
  text('on-primary', 'primary')
  text('on-primary', 'primary-hover')
  text('on-accent', 'accent')
  /* The one call to action: a solid ink fill with paper text, no border. */
  text('surface', 'ink')
  /* `accent-ui` as a 3:1 mark on the page: the nav's active rule and the no-show pill.
     It is not a button border. */
  text('accent-ui', 'paper', 3)
  text('primary', 'paper')
  text('primary', 'surface')
  text('primary', 'primary-tint')
  text('primary-hover', 'primary-tint')
  text('primary-hover', 'surface')
  text('brick-ink', 'paper')
  text('brick-ink', 'brick-tint')
  text('danger', 'paper')
  text('danger', 'surface')
  text('danger', 'brick-tint')
  text('accent-ui', 'paper')
  text('accent-ui', 'surface')
  text('accent-ui', 'accent-tint')
  text('on-danger', 'danger')
  for (const bg of ['paper', 'surface']) {
    for (const fg of ['primary', 'accent-ui', 'danger', 'brick']) text(fg, bg, 3)
  }
  text('primary', 'primary-tint', 3)
  text('brick-ink', 'brick-tint', 3)
  text('line', 'paper', 1.2)
  text('line', 'surface', 1.2)
  return list
}

for (const [mode, theme] of [
  ['light', light],
  ['dark', dark],
] as const) {
  describe(`${mode} palette`, () => {
    it.each(pairs())('%s on %s reaches %d:1', (fg, bg, min) => {
      const fgValue = theme[fg]
      const bgValue = theme[bg]
      expect(fgValue, `--${fg} is missing from index.css`).toBeDefined()
      expect(bgValue, `--${bg} is missing from index.css`).toBeDefined()
      const ratio = contrast(fgValue!, bgValue!)
      expect(
        ratio,
        `${fgValue} on ${bgValue}: ${ratio.toFixed(2)}, needs ${min}:1`,
      ).toBeGreaterThanOrEqual(min)
      // Keep the token names in the failure even when only one side is renamed.
      expect(Object.keys(theme), `unknown token ${fg}`).toContain(fg)
      expect(Object.keys(theme), `unknown token ${bg}`).toContain(bg)
    })

    it('status text on its own tint', () => {
      const statuses: Array<[string, string]> = [
        ['primary', 'primary-tint'],
        ['accent-ui', 'accent-tint'],
        ['danger', 'brick-tint'],
        ['muted', 'line'],
      ]
      for (const [fg, bg] of statuses) {
        expect(contrast(theme[fg]!, theme[bg]!), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  })
}

describe('hairdresser cards', () => {
  for (const [mode, theme] of [
    ['light', light],
    ['dark', dark],
  ] as const) {
    it(`${mode}: every card carries ink and its bar`, () => {
      for (let seat = 1; seat <= 6; seat += 1) {
        const card = theme[`staff-${seat}-soft`]!
        const bar = theme[`staff-${seat}-bar`]!
        const ink = theme[`staff-${seat}-ink`]!
        expect(card, `--staff-${seat}-soft`).toBeDefined()
        expect(contrast(theme.ink!, card), `ink on staff ${seat} card`).toBeGreaterThanOrEqual(4.5)
        expect(contrast(ink, card), `staff-${seat}-ink on its card`).toBeGreaterThanOrEqual(4.5)
        expect(contrast(bar, card), `staff ${seat} bar on its card`).toBeGreaterThanOrEqual(3)
        expect(contrast(bar, theme.paper!), `staff ${seat} bar on paper`).toBeGreaterThanOrEqual(3)
      }
    })
  }
})

describe('first-paint tokens', () => {
  it('theme-boot.css repeats the light values the app uses', () => {
    const start = bootCss.indexOf(':root.stored-light')
    const boot = tokens(bootCss.slice(start, bootCss.indexOf(':root.stored-dark')))
    for (const name of ['paper', 'surface', 'line', 'ink', 'muted', 'accent-ui', 'danger']) {
      expect(boot[name], `--${name} in public/theme-boot.css`).toBe(light[name])
    }
  })

  it('theme-boot.css repeats the dark family the app uses', () => {
    const boot = tokens(bootCss.slice(bootCss.indexOf(':root.stored-dark')))
    for (const name of ['primary', 'primary-tint', 'on-primary', 'accent', 'on-accent']) {
      expect(boot[name], `--${name} in public/theme-boot.css`).toBe(dark[name])
    }
  })
})
