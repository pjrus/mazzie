import { describe, expect, it } from 'vitest';
import {
	compareGuessToTarget,
	equationConfig,
	generateDailyEquation,
	generateEquation,
	getDifficulty,
	validateEquation
} from './engine';

describe('equation generation', () => {
	it('generates a balanced equation of the requested length', () => {
		const config = getDifficulty('classic');
		const equation = generateEquation(8, config, () => 0.25);

		expect(equation).toHaveLength(8);
		expect(validateEquation(equation, config, 8).valid).toBe(true);
	});

	it('keeps the daily equation stable for the same UTC date and variant', () => {
		const config = getDifficulty('classic');
		const first = generateDailyEquation(8, config, '2026-08-20');
		const second = generateDailyEquation(8, config, '2026-08-20');

		expect(first).toBe(second);
	});

	it('rejects equations that do not balance', () => {
		const config = equationConfig('classic', 5);

		expect(validateEquation('3+3=7', config, 5)).toMatchObject({ valid: false });
		expect(validateEquation('2+2=4', config, 5)).toMatchObject({ valid: true, value: 4 });
	});
});

describe('Wordle-style comparison', () => {
	it('does not over-mark duplicate symbols as present', () => {
		const feedback = compareGuessToTarget('111=111', '112=112');

		expect(feedback).toEqual([
			'correct',
			'correct',
			'absent',
			'correct',
			'correct',
			'correct',
			'absent'
		]);
	});

	it('uses a remaining-symbol count for present matches', () => {
		const feedback = compareGuessToTarget('1+2=1', '1+1=2');

		expect(feedback).toEqual(['correct', 'correct', 'present', 'correct', 'present']);
	});
});
