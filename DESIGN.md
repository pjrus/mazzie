---
name: Mazzie
description: A compact daily equation puzzle with a precise, editorial game-board interface.
colors:
  primary: oklch(0.55 0.17 28)
  primary-dark: oklch(0.69 0.16 35)
  cool-white: oklch(0.985 0.006 255)
  cool-night: oklch(0.205 0.014 255)
  surface: oklch(1 0 0)
  surface-dark: oklch(0.255 0.016 255)
  ink: oklch(0.22 0.025 255)
  ink-dark: oklch(0.97 0.006 255)
  secondary: oklch(0.94 0.025 190)
  secondary-dark: oklch(0.32 0.022 255)
  muted: oklch(0.96 0.008 255)
  muted-dark: oklch(0.29 0.016 255)
  border: oklch(0.89 0.02 255)
  border-dark: oklch(0.4 0.02 255)
  correct: oklch(0.48 0.11 175)
  correct-dark: oklch(0.67 0.12 175)
  present: oklch(0.69 0.14 76)
  present-dark: oklch(0.76 0.14 78)
  absent: oklch(0.38 0.035 255)
  absent-dark: oklch(0.38 0.022 255)
typography:
  display:
    fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'
    fontSize: 'clamp(2.25rem, 7vw, 4.4rem)'
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: '-0.075em'
  body:
    fontFamily: 'Inter Variable, sans-serif'
    fontSize: '0.98rem'
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: 'Inter Variable, sans-serif'
    fontSize: '0.68rem'
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: '0.1em'
  mono:
    fontFamily: 'SFMono-Regular, Cascadia Code, Roboto Mono, monospace'
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: '0.45rem'
  md: '0.5rem'
  lg: '0.625rem'
  tile: '0.55rem'
spacing:
  xs: '0.25rem'
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.5rem'
  2xl: '2.25rem'
  3xl: '4.5rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.cool-white}'
    rounded: '{rounded.md}'
    padding: '0.625rem 0.75rem'
  button-primary-dark:
    backgroundColor: '{colors.primary-dark}'
    textColor: '{colors.cool-white}'
    rounded: '{rounded.md}'
    padding: '0.625rem 0.75rem'
  board-tile-empty:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.ink}'
    rounded: '{rounded.tile}'
    size: '1fr'
  board-tile-correct:
    backgroundColor: '{colors.correct}'
    textColor: '{colors.cool-white}'
    rounded: '{rounded.tile}'
    size: '1fr'
  side-card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '1.5rem'
---

# Design System: Mazzie

## Overview

**Creative North Star: “The Pocket Calculator Desk”**

Mazzie is a focused puzzle instrument: a clean sheet, a small set of marks, and just enough colour to tell the player what changed. The visual language is editorial and mathematical without becoming sterile. Large rounded display type gives the game a friendly voice, while monospace equations keep the puzzle mechanics exact.

The interface is intentionally flat and high-contrast. Light mode is a crisp cool white; dark mode is a readable cool charcoal with lifted surfaces, never sepia and never near-black. shadcn-svelte provides the accessible primitives, but the page composition, typography, board, and colour states carry the product identity.

**Key Characteristics:**

- Cool, high-contrast surfaces with semantic accent colour.
- Monospace equations and compact uppercase labels.
- Editorial asymmetry: the play board leads, supporting cards sit in a quiet side rail.
- Flat fills, restrained borders, and shadows only where they clarify lift.
- Feedback colours are paired with labels and descriptions.

## Colors

The palette uses a warm coral action colour against cool blue-neutral surfaces. The light theme is paper-white rather than cream; the dark theme lifts content into charcoal layers for readability.

### Primary

- **Coral action** (`oklch(0.55 0.17 28)`): Primary actions, brand mark, active accents, and the exact feedback hue in the light theme.
- **Readable night coral** (`oklch(0.69 0.16 35)`): The dark-theme primary action. It is always paired with a cool-white label for clear button contrast.

### Secondary

- **Cool mint wash** (`oklch(0.94 0.025 190)`): Light-theme secondary controls and non-primary emphasis.
- **Charcoal control** (`oklch(0.32 0.022 255)`): Dark-theme secondary controls.

### Tertiary

- **Amber present** (`oklch(0.69 0.14 76)` / `oklch(0.76 0.14 78)` in dark mode): Indicates that a symbol belongs in the target but at another position.
- **Teal exact** (`oklch(0.48 0.11 175)` / `oklch(0.67 0.12 175)` in dark mode): Indicates a symbol is exact.

### Neutral

- **Cool white** (`oklch(0.985 0.006 255)`): Light page background.
- **Cool night** (`oklch(0.205 0.014 255)`): Dark page background.
- **Surface white / charcoal** (`oklch(1 0 0)` / `oklch(0.255 0.016 255)`): Cards and dialog surfaces.
- **Ink** (`oklch(0.22 0.025 255)` / `oklch(0.97 0.006 255)`): Primary text in light and dark themes.
- **Border** (`oklch(0.89 0.02 255)` / `oklch(0.4 0.02 255)`): Quiet structural divisions and control outlines.
- **Absent charcoal** (`oklch(0.38 0.035 255)` / `oklch(0.38 0.022 255)`): Symbols ruled out by feedback.

### Named Rules

**The Cool White Rule.** Light surfaces stay crisp and blue-neutral. No sepia paper, beige canvas, or warm night background.

**The One Action Colour Rule.** Coral is reserved for the primary action, the brand mark, and the most important positive emphasis. Feedback colours remain semantically distinct.

## Typography

**Display Font:** Arial Rounded MT Bold (with Trebuchet MS fallback)

**Body Font:** Inter Variable (with sans-serif fallback)

**Label/Mono Font:** SFMono-Regular, Cascadia Code, Roboto Mono

**Character:** Display type is compact, rounded, and confident. Inter keeps supporting copy neutral and highly legible; monospace makes equations, values, and feedback grids feel like a small instrument panel.

### Hierarchy

- **Display** (800, `clamp(2.25rem, 7vw, 4.4rem)`, `0.96`): The “Make it balance.” game title.
- **Title** (component default, compact): Card and dialog headings.
- **Body** (400, `0.98rem`, `1.55`): Instructions, descriptions, and explanatory copy.
- **Label** (700, `0.68rem`, `0.1em`, uppercase): Dates, mode labels, stat labels, and small UI metadata.
- **Equation** (700 monospace, `1rem`–`1.45rem`): Board tiles, keyboard symbols, values, and share output.

### Named Rules

**The Equation Alignment Rule.** Anything that represents equation characters or share feedback uses the mono stack. Never substitute proportional type where symbol positions carry meaning.

## Layout

The app uses a centred, fluid page width: `min(100% - 2rem, 1120px)` by default, widening to `min(100% - 4rem, 1120px)` from `700px` and tightening to `min(100% - 1.25rem, 1120px)` below `480px`.

The main area is a single-column game flow on small screens. From `960px`, it becomes a two-column composition: a flexible play column and an `18rem` side rail, separated by `4.5rem`. The side rail begins lower than the title to keep the board as the first visual anchor. The board and keyboard cap at `39rem` on larger screens and fill the available width on mobile.

Spacing follows a compact rhythm built from `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2.25rem`, and `4.5rem`. The board uses equal grid columns with `0.5rem` gaps, reducing to `0.3rem` on very narrow screens.

## Elevation & Depth

Mazzie uses tonal layering and spacing first. Light side cards have one shallow ambient shadow (`0 8px 22px` at 10% foreground colour), and the brand mark has a smaller `0 4px 12px` shadow. Dark side cards intentionally have no shadow: the cool charcoal surface and structural border provide depth without hazy halos. Dialogs receive the component library’s structural overlay treatment.

### Named Rules

**The Flat-by-Default Rule.** Do not add gradients, glow, blur, decorative effects, or diffuse dark-mode shadows. Use surface contrast, borders, spacing, and one restrained shadow where lift is useful.

## Shapes

The form language is rounded but controlled: tiles use `0.45rem` on mobile and `0.55rem` from `700px`; cards use the shadcn `0.625rem` radius; stat cells and share blocks use `0.5rem`; smaller examples use `0.45rem`. Structural borders are one pixel and follow the active theme’s border token.

Controls have clear silhouettes without pill-heavy styling. The board is a strict square grid, while cards and dialogs carry comfortable internal padding and clipped content where needed.

## Components

### Buttons

- **Shape:** Rounded control corners (`0.5rem` semantic radius) with compact internal padding.
- **Primary:** Coral background with a cool-white label in both themes; the dark theme uses the lighter coral token for readability.
- **Hover / Focus:** Use shadcn-svelte’s restrained tonal hover state and visible ring/border focus treatment. Avoid layout-shifting hover transforms.
- **Secondary / Ghost:** Neutral or transparent surfaces for supporting actions and icon controls; keep the primary action visually dominant.

### Cards / Containers

- **Corner Style:** `0.625rem` card radius and `1.5rem`-scale internal padding from the shadcn Card primitives.
- **Background:** White over cool white in light mode; charcoal surface over cool night in dark mode.
- **Shadow Strategy:** Shallow light-theme lift only; no card shadow in dark mode.
- **Border:** One-pixel border using the theme border token.
- **Internal Padding:** Follow shadcn Card spacing, with stat cells tightened to `0.7rem`.

### Inputs / Fields

Settings uses labelled Field and Toggle Group primitives. The selection state is structural and semantic; labels explain the difficulty and length choices. Avoid adding standalone form decoration when the field label and control already provide the needed hierarchy.

### Navigation

The header is a compact bar with the Mazzie brand lockup on the left and three icon controls on the right: help, settings, and theme. Daily/Practice is a line-style Tabs control directly above the board, not a separate navigation shell.

### Equation Board

The board is Mazzie’s signature component: six rows of equal square tiles, fixed-width monospace characters, and three semantic feedback states. Filled but unrevealed tiles use the card surface and foreground border; revealed tiles use teal, amber, or charcoal fills. Tile reveals stagger by character with reduced-motion support.

### Keyboard

The on-screen keyboard mirrors the same feedback hierarchy as the board. Digits and operators use compact mono labels; Backspace and Enter are full-width action keys on the final row. Button variants provide accessible focus and state affordances.

## Do's and Don'ts

### Do:

- **Do** keep light backgrounds cool white and dark backgrounds cool charcoal.
- **Do** use monospace for every equation, tile character, number, and share grid.
- **Do** use spacing and tonal surface changes before reaching for shadows.
- **Do** pair feedback colour with text labels, descriptions, or state names.
- **Do** preserve the board as the primary visual anchor on every breakpoint.
- **Do** retain visible focus states and reduced-motion behaviour.

### Don't:

- **Don't** reintroduce sepia whites, cream backgrounds, or warm night-mode surfaces.
- **Don't** use gradients, glow, blur, ornamental textures, or large diffuse shadows.
- **Don't** put dark text on the dark-theme coral primary action.
- **Don't** replace the equation grid with proportional typography or KaTeX.
- **Don't** make the supporting stats cards compete with the active board.
- **Don't** treat shadcn-svelte defaults as the finished visual design; compose them through Mazzie’s tokens and layout rules.
