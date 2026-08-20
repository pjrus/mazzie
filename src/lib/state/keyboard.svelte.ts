import type { FeedbackState } from '$lib/equation/engine';

const priority: Record<FeedbackState, number> = { absent: 0, present: 1, correct: 2 };

export function createKeyboardState() {
	let states = $state<Record<string, FeedbackState>>({});

	function sync(guesses: { guess: string; feedback: FeedbackState[] }[]): void {
		const next: Record<string, FeedbackState> = {};
		for (const { guess, feedback } of guesses) {
			for (let index = 0; index < guess.length; index += 1) {
				const symbol = guess[index];
				const nextState = feedback[index];
				if (!nextState || priority[nextState] <= priority[next[symbol] ?? 'absent']) continue;
				next[symbol] = nextState;
			}
		}
		states = next;
	}

	function get(symbol: string): FeedbackState | undefined {
		return states[symbol];
	}

	return {
		get states() {
			return states;
		},
		sync,
		get
	};
}
