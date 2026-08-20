# Mazzie

Mazzie is a daily equation-guessing game built with SvelteKit, Svelte 5 runes, TypeScript, Tailwind CSS, and shadcn-svelte. It plays like a compact Nerdle: every guess is a real, balanced equation and each symbol receives Wordle-style feedback.

## Run it locally

The project uses npm in this workspace and also supports the requested pnpm workflow.

```sh
npm install
npm run dev
```

Or:

```sh
pnpm install
pnpm dev
```

Useful commands:

```sh
npm run check       # Svelte and TypeScript diagnostics
npm test            # Vitest unit tests
npm run lint        # Prettier and ESLint
npm run build       # Production build
```

## How the daily puzzle works

The default daily puzzle is an 8-character equation in the `classic` difficulty: whole numbers only, no negative numbers, and `+`, `-`, `*`, and `/` operators.

The target is generated in `src/lib/equation/engine.ts`. A small date-seeded PRNG receives the UTC date (`YYYY-MM-DD`) plus the difficulty signature, so every player receives the same equation for the same day, length, and variant. Practice mode uses the same generator with `Math.random`, so each new practice puzzle is different.

The generator enumerates valid expression candidates, pairs equal values on either side of `=`, validates the result with the same parser used for guesses, and throws when no equation exists for a requested combination. That check happens before a target is selected, so an impossible configuration cannot silently create an invalid puzzle.

Guesses must:

- have exactly the target length;
- contain one `=` and valid enabled operators;
- parse using standard precedence (`^`, unary negative, `*`/`/`, then `+`/`-`); and
- balance numerically.

Daily guesses and record data are stored in `localStorage` under a versioned key scoped to the difficulty signature and equation length. Practice mode is unlimited and does not change the daily streak.

## Adjusting difficulty

Difficulty variants are plain configuration objects in `src/lib/equation/engine.ts`:

```ts
{
  id: 'classic',
  label: 'Classic',
  description: 'Whole numbers with the four familiar operators.',
  allowFraction: false,
  allowNegative: false,
  operators: ['+', '-', '*', '/']
}
```

To add a variant, add another object to `DIFFICULTIES`. The settings dialog reads that object automatically. Set `allowFraction: true` to allow one decimal number, `allowNegative: true` to allow unary negative values, and add `^` to the operator list when powers are wanted. Equation lengths offered in the settings dialog live in `src/lib/state/settings.svelte.ts`.

## Project map

- `src/lib/equation/engine.ts` — framework-agnostic parser, validator, generator, seeded PRNG, and feedback comparison.
- `src/lib/state/game.svelte.ts` — Svelte 5 game state, local persistence, streaks, and share text.
- `src/lib/state/keyboard.svelte.ts` — best-known keyboard feedback state.
- `src/lib/state/settings.svelte.ts` — difficulty and equation length settings.
- `src/routes/+page.svelte` — responsive board, keyboard, dialogs, stats card, and interaction flow.
- `src/lib/equation/engine.test.ts` — generator and duplicate-symbol comparison tests.

The UI primitives are installed and composed through the project-aware shadcn-svelte skill. The visual system keeps the shadcn neutral base tokens but applies an editorial puzzle palette, flat fills, shallow offset shadows, monospace equations, and reduced-motion-safe tile reveals.
