import { browser } from '$app/environment';

export const EQUATION_LENGTHS = [6, 7, 8, 9, 10] as const;
export const DEFAULT_EQUATION_LENGTH = 8;
export const DEFAULT_DIFFICULTY_ID = 'classic';

const STORAGE_KEY = 'equation-daily:settings:v1';

export function createSettingsState() {
	const state = $state({
		difficultyId: DEFAULT_DIFFICULTY_ID,
		length: DEFAULT_EQUATION_LENGTH
	});

	function hydrate(): void {
		if (!browser) return;
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<
				typeof state
			> | null;
			if (saved?.difficultyId) state.difficultyId = saved.difficultyId;
			if (
				saved?.length &&
				EQUATION_LENGTHS.includes(saved.length as (typeof EQUATION_LENGTHS)[number])
			) {
				state.length = saved.length;
			}
		} catch {
			// A malformed settings value should never prevent the game from loading.
		}
	}

	function persist(): void {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}

	return { state, hydrate, persist };
}
