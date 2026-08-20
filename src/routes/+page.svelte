<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { mode, toggleMode } from 'mode-watcher';
	import Katex from 'svelte-katex';
	import { toast } from 'svelte-sonner';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Copy from '@lucide/svelte/icons/copy';
	import Delete from '@lucide/svelte/icons/delete';
	import Moon from '@lucide/svelte/icons/moon';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import Sun from '@lucide/svelte/icons/sun';

	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, type ButtonVariant } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { DIFFICULTIES, type FeedbackState } from '$lib/equation/engine';
	import { createGameState, type GameMode } from '$lib/state/game.svelte';
	import { createKeyboardState } from '$lib/state/keyboard.svelte';
	import {
		createSettingsState,
		DEFAULT_EQUATION_LENGTH,
		EQUATION_LENGTHS
	} from '$lib/state/settings.svelte';

	const game = createGameState({ difficultyId: 'classic', length: DEFAULT_EQUATION_LENGTH });
	const settings = createSettingsState();
	const keyboard = createKeyboardState();

	let selectedMode = $state<GameMode>('daily');
	let revealRow = $state(-1);
	let revealTimer: ReturnType<typeof setTimeout> | undefined;
	let dialogs = $state({ help: false, result: false, settings: false });
	let draftDifficulty = $state(settings.state.difficultyId);
	let draftLength = $state(String(settings.state.length));

	const keyboardRows = [
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		['+', '-', '*', '/', '^', '=']
	];

	const feedbackLabels: Record<FeedbackState, string> = {
		correct: 'correct position',
		present: 'wrong position',
		absent: 'not in the equation'
	};

	$effect(() => {
		keyboard.sync(game.state.guesses);
	});

	$effect(() => {
		if (selectedMode !== game.state.mode)
			game.switchMode(selectedMode, settings.state.difficultyId, settings.state.length);
	});

	onMount(() => {
		settings.hydrate();
		game.hydrate(settings.state.difficultyId, settings.state.length);
	});

	function handleKeydown(event: KeyboardEvent): void {
		if (dialogs.help || dialogs.settings || dialogs.result) return;
		if (/^[0-9+\-*/^=]$/.test(event.key)) {
			event.preventDefault();
			game.input(event.key);
		} else if (event.key === 'Backspace') {
			event.preventDefault();
			game.backspace();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			submitGuess();
		}
	}

	function submitGuess(): void {
		const result = game.submit();
		if (!result.accepted) return;
		revealRow = game.state.guesses.length - 1;
		if (revealTimer) clearTimeout(revealTimer);
		revealTimer = setTimeout(() => {
			revealRow = -1;
			if (result.completed) dialogs.result = true;
		}, 720);
	}

	function openSettings(): void {
		draftDifficulty = settings.state.difficultyId;
		draftLength = String(settings.state.length);
		dialogs.settings = true;
	}

	function applySettings(): void {
		settings.state.difficultyId = draftDifficulty;
		settings.state.length = Number(draftLength);
		settings.persist();
		game.start(game.state.mode, settings.state.difficultyId, settings.state.length);
		dialogs.settings = false;
		selectedMode = game.state.mode;
	}

	function startPractice(): void {
		selectedMode = 'practice';
		game.start('practice', settings.state.difficultyId, settings.state.length, true);
		dialogs.result = false;
	}

	function shareResult(): void {
		const text = game.shareText();
		if (!navigator.clipboard) {
			toast.error('Clipboard access is unavailable in this browser.');
			return;
		}
		navigator.clipboard
			.writeText(text)
			.then(() => toast.success('Result copied to clipboard.'))
			.catch(() => toast.error('Could not copy the result.'));
	}

	function keyboardVariant(symbol: string): ButtonVariant {
		const state = keyboard.get(symbol);
		if (state === 'correct') return 'default';
		if (state === 'present') return 'secondary';
		return 'outline';
	}

	function tileCharacter(rowIndex: number, tileIndex: number): string {
		if (rowIndex < game.state.guesses.length)
			return game.state.guesses[rowIndex].guess[tileIndex] ?? '';
		if (rowIndex === game.state.guesses.length) return game.state.currentGuess[tileIndex] ?? '';
		return '';
	}

	function tileFeedback(rowIndex: number, tileIndex: number): FeedbackState | undefined {
		return rowIndex < game.state.guesses.length
			? game.state.guesses[rowIndex].feedback[tileIndex]
			: undefined;
	}

	function rowLabel(rowIndex: number): string {
		if (rowIndex < game.state.guesses.length) return `Guess ${rowIndex + 1}`;
		if (rowIndex === game.state.guesses.length && game.state.status === 'playing')
			return 'Current guess';
		return `Unused guess ${rowIndex + 1}`;
	}

	function statWinPercent(): string {
		if (!game.state.stats.gamesPlayed) return '—';
		return `${Math.round((game.state.stats.wins / game.state.stats.gamesPlayed) * 100)}%`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell">
	<header class="app-header page-width">
		<a class="brand-lockup" href={resolve('/')} aria-label="Mazzie home">
			<span class="brand-mark" aria-hidden="true">=</span>
			<span>
				<span class="brand-kicker">Daily challenge</span>
				<span class="brand-name">Mazzie</span>
			</span>
		</a>
		<nav class="header-actions" aria-label="Game controls">
			<Button
				variant="ghost"
				size="icon"
				aria-label="How to play"
				onclick={() => (dialogs.help = true)}
			>
				<CircleHelp data-icon="inline-start" />
			</Button>
			<Button variant="ghost" size="icon" aria-label="Open settings" onclick={openSettings}>
				<Settings2 data-icon="inline-start" />
			</Button>
			<Button variant="outline" size="icon" aria-label="Toggle dark mode" onclick={toggleMode}>
				{#if mode.current === 'dark'}
					<Sun data-icon="inline-start" />
				{:else}
					<Moon data-icon="inline-start" />
				{/if}
			</Button>
		</nav>
	</header>

	<main class="page-width page-grid">
		<section class="play-column" aria-labelledby="game-title">
			<div class="intro-row">
				<div>
					<h1 id="game-title">Make it balance.</h1>
					<p class="intro-copy">
						Find the hidden {game.state.length}-character equation. Every guess must balance.
					</p>
				</div>
			</div>

			<Tabs.Root bind:value={selectedMode} class="mode-switcher">
				<Tabs.List variant="line" class="mode-switcher-list">
					<Tabs.Trigger value="daily">Daily puzzle</Tabs.Trigger>
					<Tabs.Trigger value="practice">Practice lab</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			<div class="board-wrap">
				<div class="board" aria-label="Equation board" aria-live="polite">
					{#each Array.from({ length: game.maxGuesses }, (_, rowIndex) => rowIndex) as rowIndex (rowIndex)}
						<div
							class="board-row"
							aria-label={rowLabel(rowIndex)}
							style={`--equation-length: ${game.state.length}`}
						>
							{#each Array.from({ length: game.state.length }, (_, tileIndex) => tileIndex) as tileIndex (tileIndex)}
								{@const feedback = tileFeedback(rowIndex, tileIndex)}
								{@const character = tileCharacter(rowIndex, tileIndex)}
								<div
									class:tile-filled={character.length > 0}
									class:tile-reveal={rowIndex === revealRow}
									class="equation-tile"
									data-state={feedback ?? 'empty'}
									style={`--tile-index: ${tileIndex}`}
									aria-label={feedback
										? `${character}, ${feedbackLabels[feedback]}`
										: character || 'empty'}
								>
									{character}
								</div>
							{/each}
						</div>
					{/each}
				</div>
				<div class="board-caption">
					<span
						><span class="caption-dot" aria-hidden="true"></span> A valid equation is your ticket in.</span
					>
					<span class="keyboard-hint">Type on your keyboard or tap below</span>
				</div>
			</div>

			{#if game.state.notice}
				<Alert.Root variant="destructive" class="game-alert" role="status">
					<Alert.Title>Try again</Alert.Title>
					<Alert.Description>{game.state.notice}</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="keyboard" aria-label="On-screen keyboard">
				{#each keyboardRows as row (row.join(''))}
					<div class="keyboard-row">
						{#each row as symbol (symbol)}
							<Button
								variant={keyboardVariant(symbol)}
								size="icon"
								class="key-button"
								aria-label={`Enter ${symbol}`}
								onclick={() => game.input(symbol)}
							>
								{symbol}
							</Button>
						{/each}
					</div>
				{/each}
				<div class="keyboard-row keyboard-actions">
					<Button variant="outline" size="lg" class="action-key" onclick={() => game.backspace()}>
						<Delete data-icon="inline-start" />
						<span>Backspace</span>
					</Button>
					<Button variant="outline" size="lg" class="action-key enter-key" onclick={submitGuess}>
						Enter guess
					</Button>
				</div>
			</div>
		</section>

		<aside class="side-column" aria-label="Daily information">
			<Card.Root class="stats-card">
				<Card.Header>
					<div class="card-heading-row">
						<div>
							<Card.Title>Daily record</Card.Title>
							<Card.Description>Your small wins, counted.</Card.Description>
						</div>
						<span class="record-mark" aria-hidden="true">✳</span>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="stats-grid">
						<div class="stat-cell">
							<strong>{game.state.stats.streak}</strong><span>streak</span>
						</div>
						<div class="stat-cell">
							<strong>{game.state.stats.maxStreak}</strong><span>max streak</span>
						</div>
						<div class="stat-cell">
							<strong>{game.state.stats.gamesPlayed}</strong><span>played</span>
						</div>
						<div class="stat-cell"><strong>{statWinPercent()}</strong><span>win rate</span></div>
					</div>
				</Card.Content>
				<Card.Footer>
					<p class="stats-footnote">Stats are saved to this browser, per puzzle variant.</p>
				</Card.Footer>
			</Card.Root>

			<Card.Root class="primer-card">
				<Card.Header>
					<Badge variant="outline" class="primer-label">A quick primer</Badge>
					<Card.Title>Think like a calculator.</Card.Title>
					<Card.Description>Order matters. Balance matters more.</Card.Description>
				</Card.Header>
				<Card.Content class="primer-content">
					<div class="primer-example"><span>valid</span><code>12+7=19</code></div>
					<div class="primer-example"><span>not valid</span><code>3+3=7</code></div>
					<Separator />
					<p>Green means exact. Amber means the symbol belongs somewhere else.</p>
				</Card.Content>
			</Card.Root>
		</aside>
	</main>

	<footer class="page-width app-footer">
		<span>One equation. Six tries. Zero guesswork.</span>
		<button type="button" class="footer-link" onclick={() => (dialogs.help = true)}
			>How it works</button
		>
	</footer>
</div>

<Dialog.Root bind:open={dialogs.help}>
	<Dialog.Content class="dialog-panel howto-dialog">
		<Dialog.Header>
			<Dialog.Title>How to play</Dialog.Title>
			<Dialog.Description
				>Build a real equation, then use the clues to balance the board.</Dialog.Description
			>
		</Dialog.Header>
		<div class="howto-body">
			<div class="howto-step">
				<span>01</span>
				<div>
					<strong>Fill the row</strong>
					<p>Use digits, operators, and one equals sign. Every symbol counts.</p>
				</div>
			</div>
			<div class="howto-step">
				<span>02</span>
				<div>
					<strong>Make it true</strong>
					<p>Order of operations applies. For example, this one balances:</p>
					<div class="math-example"><Katex displayMode>12 + 7 = 19</Katex></div>
				</div>
			</div>
			<div class="howto-step">
				<span>03</span>
				<div>
					<strong>Read the colours</strong>
					<p>Green is exact, amber is present elsewhere, and charcoal is absent.</p>
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button onclick={() => (dialogs.help = false)}>Got it</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={dialogs.result}>
	<Dialog.Content class="dialog-panel result-dialog">
		<Dialog.Header>
			<Dialog.Title
				>{game.state.status === 'won'
					? 'Balanced beautifully.'
					: 'The equation got away.'}</Dialog.Title
			>
			<Dialog.Description>
				{game.state.status === 'won'
					? `Solved in ${game.state.guesses.length} ${game.state.guesses.length === 1 ? 'guess' : 'guesses'}.`
					: `The answer was ${game.state.target}.`}
			</Dialog.Description>
		</Dialog.Header>
		<div class="share-result">
			<p class="share-result-label">Your result</p>
			<div class="share-grid" aria-label="Share result grid">
				{#each game.state.guesses as guess, guessIndex (guessIndex)}
					<p>
						{guess.feedback
							.map((tile) => (tile === 'correct' ? '🟩' : tile === 'present' ? '🟨' : '⬛'))
							.join('')}
					</p>
				{/each}
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={shareResult}
				><Copy data-icon="inline-start" />Copy result</Button
			>
			{#if game.state.mode === 'practice'}
				<Button onclick={startPractice}>New practice puzzle</Button>
			{:else}
				<Button onclick={() => (dialogs.result = false)}>Keep exploring</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={dialogs.settings}>
	<Dialog.Content class="dialog-panel settings-dialog">
		<Dialog.Header>
			<Dialog.Title>Shape your puzzle</Dialog.Title>
			<Dialog.Description
				>These settings change the puzzle family and start a fresh board.</Dialog.Description
			>
		</Dialog.Header>
		<div class="settings-form">
			<Field.FieldGroup>
				<Field.Field>
					<Field.FieldLabel>Difficulty</Field.FieldLabel>
					<ToggleGroup.Root
						type="single"
						bind:value={draftDifficulty}
						variant="outline"
						spacing={2}
						aria-label="Choose difficulty"
					>
						{#each Object.values(DIFFICULTIES) as difficulty (difficulty.id)}
							<ToggleGroup.Item value={difficulty.id}>{difficulty.label}</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
					<Field.FieldDescription
						>{DIFFICULTIES[draftDifficulty]?.description}</Field.FieldDescription
					>
				</Field.Field>
				<Field.Field>
					<Field.FieldLabel>Equation length</Field.FieldLabel>
					<ToggleGroup.Root
						type="single"
						bind:value={draftLength}
						variant="outline"
						spacing={2}
						aria-label="Choose equation length"
					>
						{#each EQUATION_LENGTHS as length (length)}
							<ToggleGroup.Item value={String(length)}>{length}</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
					<Field.FieldDescription>Eight characters is the daily default.</Field.FieldDescription>
				</Field.Field>
			</Field.FieldGroup>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (dialogs.settings = false)}>Cancel</Button>
			<Button onclick={applySettings}>Start with these settings</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(body) {
		font-family: var(--font-sans);
	}

	.app-shell {
		min-height: 100vh;
		background: var(--background);
	}

	.page-width {
		width: min(100% - 2rem, 1120px);
		margin-inline: auto;
	}

	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-block: 1.25rem;
		border-bottom: 1px solid var(--border);
	}

	.brand-lockup {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--foreground);
		text-decoration: none;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--foreground);
		border-radius: 0.65rem;
		background: var(--primary);
		color: var(--primary-foreground);
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		box-shadow: 0 4px 12px color-mix(in oklab, var(--foreground) 18%, transparent);
	}

	.brand-lockup > span:last-child {
		display: grid;
		gap: 0.08rem;
	}

	.brand-kicker,
	.board-caption,
	.stats-footnote,
	:global(.primer-label),
	.share-result-label {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.brand-kicker {
		color: var(--muted-foreground);
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 1.05rem;
		letter-spacing: -0.02em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.page-grid {
		display: grid;
		gap: 2.25rem;
		padding-block: 2.5rem 2rem;
	}

	.play-column,
	.side-column {
		min-width: 0;
	}

	.play-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.intro-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.intro-row h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(2.25rem, 7vw, 4.4rem);
		font-weight: 800;
		letter-spacing: -0.075em;
		line-height: 0.96;
	}

	.intro-copy {
		max-width: 34rem;
		margin: 0.9rem 0 0;
		color: var(--muted-foreground);
		font-size: 0.98rem;
		line-height: 1.55;
	}

	:global(.mode-switcher) {
		width: 100%;
	}

	:global(.mode-switcher-list) {
		width: 100%;
		justify-content: flex-start;
	}

	:global(.mode-switcher [data-slot='tabs-trigger']) {
		flex: 0 0 auto;
		padding-inline: 0;
		margin-right: 1.5rem;
	}

	.board-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.board {
		display: grid;
		gap: 0.5rem;
		width: min(100%, 35rem);
		margin-inline: auto;
	}

	.board-row {
		display: grid;
		grid-template-columns: repeat(var(--equation-length, 8), minmax(0, 1fr));
		gap: 0.5rem;
	}

	.equation-tile {
		display: grid;
		aspect-ratio: 1;
		place-items: center;
		border: 1px solid var(--border);
		border-radius: 0.45rem;
		background: var(--tile-empty);
		color: var(--foreground);
		font-family: var(--font-mono);
		font-size: clamp(1rem, 4.8vw, 1.45rem);
		font-weight: 700;
		line-height: 1;
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			color 160ms ease;
	}

	.equation-tile.tile-filled[data-state='empty'] {
		border-color: var(--foreground);
		background: var(--card);
	}

	.equation-tile[data-state='correct'],
	.equation-tile[data-state='present'],
	.equation-tile[data-state='absent'] {
		border-color: transparent;
		color: var(--primary-foreground);
	}

	.equation-tile[data-state='correct'] {
		background: var(--tile-correct);
		color: var(--tile-correct-foreground);
	}

	.equation-tile[data-state='present'] {
		background: var(--tile-present);
		color: var(--tile-present-foreground);
	}

	.equation-tile[data-state='absent'] {
		background: var(--tile-absent);
		color: var(--tile-absent-foreground);
	}

	.equation-tile.tile-reveal {
		animation: tile-flip 560ms both;
		animation-delay: calc(var(--tile-index) * 65ms);
	}

	.board-caption {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: var(--muted-foreground);
		letter-spacing: 0.04em;
		line-height: 1.4;
		text-transform: none;
	}

	.caption-dot {
		display: inline-block;
		width: 0.45rem;
		height: 0.45rem;
		margin-right: 0.3rem;
		border-radius: 999px;
		background: var(--tile-correct);
	}

	.keyboard-hint {
		text-align: right;
	}

	:global(.game-alert) {
		max-width: 35rem;
		margin-inline: auto;
	}

	.keyboard {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		width: min(100%, 35rem);
		margin-inline: auto;
	}

	.keyboard-row {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
	}

	:global(.key-button) {
		min-width: 2.35rem;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.keyboard-actions {
		gap: 0.6rem;
		padding-top: 0.25rem;
	}

	:global(.action-key) {
		flex: 1;
		font-size: 0.72rem;
		font-weight: 700;
	}

	.side-column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.side-column :global([data-slot='card']) {
		border-color: var(--border);
		box-shadow: 0 8px 22px color-mix(in oklab, var(--foreground) 10%, transparent);
	}

	:global(.dark) .side-column :global([data-slot='card']) {
		box-shadow: none;
	}

	.card-heading-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.record-mark {
		color: var(--primary);
		font-size: 1.35rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.85rem;
	}

	.stat-cell {
		display: grid;
		gap: 0.2rem;
		padding: 0.7rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--muted);
	}

	.stat-cell strong {
		font-family: var(--font-mono);
		font-size: 1.55rem;
		letter-spacing: -0.07em;
	}

	.stat-cell span {
		color: var(--muted-foreground);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.stats-footnote {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.62rem;
		letter-spacing: 0.04em;
		line-height: 1.5;
		text-transform: none;
	}

	:global(.primer-content) {
		display: grid;
		gap: 0.8rem;
	}

	:global(.primer-label) {
		width: fit-content;
		margin-bottom: 0.1rem;
	}

	.primer-example {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.65rem 0.75rem;
		border-radius: 0.45rem;
		background: var(--muted);
	}

	.primer-example span {
		color: var(--muted-foreground);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.primer-example code,
	.share-grid p {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 700;
	}

	:global(.primer-content p) {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.app-footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 1.25rem 2rem;
		border-top: 1px solid var(--border);
		color: var(--muted-foreground);
		font-size: 0.72rem;
	}

	.footer-link {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--primary);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}

	:global(.dark) .footer-link {
		color: var(--foreground);
	}

	:global(.dialog-panel) {
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
	}

	.howto-body,
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.howto-step {
		display: grid;
		grid-template-columns: 2rem 1fr;
		gap: 0.75rem;
	}

	.howto-step > span {
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
	}

	.howto-step strong {
		font-size: 0.92rem;
	}

	.howto-step p {
		margin: 0.35rem 0 0;
		color: var(--muted-foreground);
		font-size: 0.85rem;
		line-height: 1.5;
	}

	.math-example {
		margin-top: 0.8rem;
		padding: 0.8rem;
		border: 1px solid var(--border);
		border-radius: 0.45rem;
		background: var(--muted);
		text-align: center;
	}

	.math-example :global(.katex) {
		font-size: 1.3em;
	}

	.share-result {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--muted);
	}

	.share-result-label {
		margin: 0;
		color: var(--muted-foreground);
	}

	.share-grid {
		display: grid;
		gap: 0.2rem;
	}

	.share-grid p {
		margin: 0;
		letter-spacing: 0.08em;
	}

	@keyframes tile-flip {
		0% {
			transform: rotateX(0deg);
		}
		45% {
			transform: rotateX(90deg);
			background: var(--muted);
		}
		55% {
			transform: rotateX(90deg);
		}
		100% {
			transform: rotateX(0deg);
		}
	}

	@media (min-width: 700px) {
		.page-width {
			width: min(100% - 4rem, 1120px);
		}

		.app-header {
			padding-block: 1.5rem;
		}

		.page-grid {
			padding-block: 2rem 3rem;
		}

		.board,
		.keyboard,
		:global(.game-alert) {
			width: min(100%, 39rem);
		}

		.board-row {
			gap: 0.65rem;
		}

		.equation-tile {
			border-radius: 0.55rem;
		}

		.keyboard-row {
			gap: 0.5rem;
		}

		:global(.key-button) {
			min-width: 2.65rem;
		}
	}

	@media (min-width: 960px) {
		.page-grid {
			grid-template-columns: minmax(0, 1fr) 18rem;
			align-items: start;
			gap: 4.5rem;
		}

		.side-column {
			padding-top: 6.6rem;
		}
	}

	@media (max-width: 480px) {
		.page-width {
			width: min(100% - 1.25rem, 1120px);
		}

		.app-header {
			padding-block: 1rem;
		}

		.header-actions :global([data-slot='button']) {
			width: 2.25rem;
		}

		.page-grid {
			padding-block: 2rem 1.5rem;
		}

		.intro-row h1 {
			font-size: 2.55rem;
		}

		.board,
		.keyboard,
		:global(.game-alert) {
			width: 100%;
		}

		.board-row {
			gap: 0.3rem;
		}

		.equation-tile {
			font-size: 1rem;
		}

		.keyboard-row {
			gap: 0.25rem;
		}

		:global(.key-button) {
			min-width: 0;
			flex: 1;
		}

		:global(.action-key) {
			min-width: 0;
		}

		.board-caption,
		.app-footer {
			font-size: 0.61rem;
		}
	}
</style>
