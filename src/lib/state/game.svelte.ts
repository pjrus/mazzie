import { browser } from '$app/environment';
import {
	compareGuessToTarget,
	difficultySignature,
	equationConfig,
	generateDailyEquation,
	generatePracticeEquation,
	getDifficulty,
	utcDateString,
	validateEquation,
	type DifficultyConfig,
	type FeedbackState
} from '$lib/equation/engine';

export type GameMode = 'daily' | 'practice';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface GuessRecord {
	guess: string;
	feedback: FeedbackState[];
}

export interface DailyStats {
	gamesPlayed: number;
	wins: number;
	streak: number;
	maxStreak: number;
	lastPlayedDate: string | null;
}

interface StoredDailyGame {
	date: string;
	guesses: GuessRecord[];
	status: GameStatus;
	stats: DailyStats;
}

const MAX_GUESSES = 6;
const STORAGE_PREFIX = 'equation-daily:game:v1';

const emptyStats = (): DailyStats => ({
	gamesPlayed: 0,
	wins: 0,
	streak: 0,
	maxStreak: 0,
	lastPlayedDate: null
});

function yesterday(date: string): string {
	return utcDateString(new Date(Date.parse(`${date}T00:00:00.000Z`) - 86_400_000));
}

function storageKey(difficulty: DifficultyConfig, length: number): string {
	return `${STORAGE_PREFIX}:${difficultySignature(difficulty)}:${length}`;
}

export function createGameState(initial = { difficultyId: 'classic', length: 8 }) {
	const initialDifficulty = getDifficulty(initial.difficultyId);
	const initialTarget = generateDailyEquation(initial.length, initialDifficulty);
	const state = $state({
		mode: 'daily' as GameMode,
		difficultyId: initial.difficultyId,
		length: initial.length,
		target: initialTarget,
		guesses: [] as GuessRecord[],
		currentGuess: '',
		status: 'playing' as GameStatus,
		notice: '',
		stats: emptyStats(),
		isHydrated: false,
		puzzleDate: utcDateString()
	});

	function readStoredDaily(key: string, date: string): StoredDailyGame | null {
		if (!browser) return null;
		try {
			const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as StoredDailyGame | null;
			if (!saved || saved.date !== date || !Array.isArray(saved.guesses)) return null;
			return saved;
		} catch {
			return null;
		}
	}

	function persist(): void {
		if (!browser || state.mode !== 'daily') return;
		const difficulty = getDifficulty(state.difficultyId);
		const snapshot: StoredDailyGame = {
			date: state.puzzleDate,
			guesses: state.guesses,
			status: state.status,
			stats: state.stats
		};
		localStorage.setItem(storageKey(difficulty, state.length), JSON.stringify(snapshot));
	}

	function start(mode: GameMode, difficultyId: string, length: number, forceNew = false): void {
		const difficulty = getDifficulty(difficultyId);
		const date = utcDateString();
		const target =
			mode === 'daily'
				? generateDailyEquation(length, difficulty, date)
				: generatePracticeEquation(length, difficulty);
		state.mode = mode;
		state.difficultyId = difficultyId;
		state.length = length;
		state.target = target;
		state.guesses = [];
		state.currentGuess = '';
		state.status = 'playing';
		state.notice = '';
		state.puzzleDate = date;

		if (mode === 'daily') {
			const saved = forceNew ? null : readStoredDaily(storageKey(difficulty, length), date);
			if (saved) {
				state.guesses = saved.guesses;
				state.status = saved.status;
				state.stats = saved.stats;
			} else {
				state.stats = readStats(difficulty, length);
				persist();
			}
		} else {
			state.stats = emptyStats();
		}
	}

	function readStats(difficulty: DifficultyConfig, length: number): DailyStats {
		if (!browser) return emptyStats();
		try {
			const saved = JSON.parse(
				localStorage.getItem(storageKey(difficulty, length)) ?? 'null'
			) as StoredDailyGame | null;
			return saved?.stats ?? emptyStats();
		} catch {
			return emptyStats();
		}
	}

	function hydrate(difficultyId = state.difficultyId, length = state.length): void {
		start('daily', difficultyId, length);
		state.isHydrated = true;
	}

	function switchMode(
		mode: GameMode,
		difficultyId = state.difficultyId,
		length = state.length
	): void {
		if (mode === state.mode && state.status === 'playing') return;
		start(mode, difficultyId, length);
	}

	function updateNotice(message: string): void {
		state.notice = message;
	}

	function input(symbol: string): void {
		if (state.status !== 'playing' || state.currentGuess.length >= state.length) return;
		state.currentGuess += symbol;
		state.notice = '';
	}

	function backspace(): void {
		if (state.status !== 'playing') return;
		state.currentGuess = state.currentGuess.slice(0, -1);
		state.notice = '';
	}

	function completeDaily(won: boolean): void {
		if (state.mode !== 'daily') return;
		if (won) {
			const continued = state.stats.lastPlayedDate === yesterday(state.puzzleDate);
			state.stats.streak = continued ? state.stats.streak + 1 : 1;
			state.stats.wins += 1;
			state.stats.maxStreak = Math.max(state.stats.maxStreak, state.stats.streak);
		} else {
			state.stats.streak = 0;
		}
		state.stats.gamesPlayed += 1;
		state.stats.lastPlayedDate = state.puzzleDate;
	}

	function submit(): { accepted: boolean; completed: boolean } {
		if (state.status !== 'playing') return { accepted: false, completed: false };
		const guess = state.currentGuess;
		const validation = validateEquation(
			guess,
			equationConfig(state.difficultyId, state.length),
			state.length
		);
		if (!validation.valid) {
			state.notice = validation.reason ?? 'That equation is not valid.';
			return { accepted: false, completed: false };
		}

		const feedback = compareGuessToTarget(guess, state.target);
		state.guesses.push({ guess, feedback });
		state.currentGuess = '';
		state.notice = '';
		const won = guess === state.target;
		const lost = !won && state.guesses.length >= MAX_GUESSES;
		if (won || lost) {
			state.status = won ? 'won' : 'lost';
			completeDaily(won);
		}
		persist();
		return { accepted: true, completed: won || lost };
	}

	function shareText(): string {
		const score = state.status === 'lost' ? 'X' : String(state.guesses.length);
		const grid = state.guesses
			.map(({ feedback }) =>
				feedback
					.map((tile) => (tile === 'correct' ? '🟩' : tile === 'present' ? '🟨' : '⬛'))
					.join('')
			)
			.join('\n');
		return `Equation Daily ${state.puzzleDate} ${score}/${MAX_GUESSES}\n${grid}`;
	}

	return {
		state,
		start,
		hydrate,
		switchMode,
		input,
		backspace,
		submit,
		updateNotice,
		persist,
		shareText,
		maxGuesses: MAX_GUESSES
	};
}
