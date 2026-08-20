# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

SvelteKit 5 with Svelte 5 runes, TypeScript, shadcn-svelte, Tailwind CSS, Vitest, and the SvelteKit static adapter for GitHub Pages.

## Users

The primary users are people who enjoy short daily word-game-style challenges and want to reason about arithmetic expressions. This is inferred from the product brief and the current game flow.

## Product Purpose

Mazzie is a daily equation-guessing game. Players construct valid, balanced equations and use character-level clues to identify a shared daily target in up to six guesses. Practice mode provides unlimited additional puzzles. Success means the player can understand the rules quickly, make progress from each guess, and return for the next daily puzzle.

## Positioning

Mazzie combines the shared daily ritual of Wordle-like games with the stricter constraint that every submitted guess must itself be a mathematically correct equation. The daily target is deterministic for a given UTC date, equation length, and difficulty variant.

## Operating Context

The game runs in a browser with no account or server state. The daily puzzle is seeded from the UTC date, while practice puzzles use an unseeded generator. Daily guesses and per-variant streak data are saved in browser localStorage. Players can type with a physical keyboard or use the on-screen keyboard, switch between Daily and Practice, open help/settings/results dialogs, and copy a share-style result grid.

## Capabilities and Constraints

- Equation lengths are configurable, with eight characters as the daily default.
- Difficulty is represented by plain TypeScript configuration objects for whole numbers, negative numbers, fractions/decimals, and operator sets.
- Guesses must have the target length, parse correctly, contain one equals sign, and balance numerically using standard operator precedence.
- Feedback has Wordle-style correct, present, and absent states with duplicate-symbol accounting.
- Daily play has six guesses, win/lose states, streak tracking, and a local share summary. Practice mode has unlimited plays and no streak tracking.
- Equation text, board tiles, and share output remain plain monospace text so symbols align predictably. KaTeX is reserved for the explanatory example in How to play.
- The app is statically deployable and must work on narrow mobile screens as well as desktop layouts.

## Brand Commitments

- The product name is Mazzie.
- The interface uses flat colours, crisp cool whites in light mode, and a readable cool charcoal dark mode rather than sepia surfaces or near-black contrast traps.
- Depth comes from spacing, layering, and restrained shadows. Gradients and decorative visual effects are not part of the visual language.
- Equations and game feedback are the visual focus; controls should feel clear and purposeful rather than like unmodified component-library output.

## Evidence on Hand

The repository contains the working game implementation, pure equation engine and unit tests, responsive Svelte page, shadcn-svelte UI primitives, local persistence, and GitHub Pages workflow. There are no external brand assets, testimonials, or claims to fabricate.

## Product Principles

- Every guess earns its place by being a true equation.
- One shared daily puzzle makes progress comparable between players.
- Feedback should teach the next move without making the board noisy.
- Practice is an open laboratory, separate from the daily streak.
- The interface should make mathematical structure legible at a glance.

## Accessibility & Inclusion

The game supports physical and on-screen keyboard input, visible focus treatment through the component system, semantic labels for the board and controls, reduced-motion preferences, and colour feedback paired with textual labels. The interface should preserve readable contrast in both themes and avoid making colour the only way to understand feedback.
