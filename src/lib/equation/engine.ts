export const OPERATORS = ['+', '-', '*', '/', '^'] as const;

export type Operator = (typeof OPERATORS)[number];
export type FeedbackState = 'correct' | 'present' | 'absent';

export interface DifficultyConfig {
	id: string;
	label: string;
	description: string;
	allowFraction: boolean;
	allowNegative: boolean;
	operators: readonly Operator[];
	maxFractionalNumbers?: number;
}

export interface EquationConfig extends DifficultyConfig {
	length: number;
}

export interface ValidationResult {
	valid: boolean;
	reason?: string;
	value?: number;
}

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
	classic: {
		id: 'classic',
		label: 'Classic',
		description: 'Whole numbers with the four familiar operators.',
		allowFraction: false,
		allowNegative: false,
		operators: ['+', '-', '*', '/']
	},
	negative: {
		id: 'negative',
		label: 'Negative numbers',
		description: 'Whole numbers with negative values in the mix.',
		allowFraction: false,
		allowNegative: true,
		operators: ['+', '-', '*', '/']
	},
	wild: {
		id: 'wild',
		label: 'Wild card',
		description: 'Fractions, negative numbers, and powers are all in play.',
		allowFraction: true,
		allowNegative: true,
		operators: ['+', '-', '*', '/', '^'],
		maxFractionalNumbers: 1
	}
};

const EPSILON = 1e-9;
const MAX_ABSOLUTE_VALUE = 1e12;

function normaliseConfig(config: DifficultyConfig): Required<DifficultyConfig> {
	return {
		...config,
		operators: [...config.operators],
		maxFractionalNumbers: config.maxFractionalNumbers ?? 1
	};
}

export function getDifficulty(id: string): DifficultyConfig {
	return DIFFICULTIES[id] ?? DIFFICULTIES.classic;
}

export function equationConfig(difficultyId: string, length: number): EquationConfig {
	return { ...getDifficulty(difficultyId), length };
}

export function utcDateString(date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

function hashSeed(seed: string): number {
	let hash = 2166136261;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function createSeededRandom(seed: string): () => number {
	let value = hashSeed(seed);
	return () => {
		value += 0x6d2b79f5;
		let result = value;
		result = Math.imul(result ^ (result >>> 15), result | 1);
		result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
		return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
	};
}

function valueKey(value: number): string {
	return String(Math.round(value / EPSILON));
}

function valuesMatch(left: number, right: number): boolean {
	return Math.abs(left - right) <= EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}

type Token = { kind: 'number' | 'operator'; value: string };

function tokenise(expression: string, config: Required<DifficultyConfig>): Token[] {
	const tokens: Token[] = [];
	let index = 0;

	while (index < expression.length) {
		const character = expression[index];
		if (/\d/.test(character)) {
			const start = index;
			while (index < expression.length && /\d/.test(expression[index])) index += 1;
			if (expression[index] === '.') {
				index += 1;
				const decimalStart = index;
				while (index < expression.length && /\d/.test(expression[index])) index += 1;
				if (decimalStart === index) throw new Error('A decimal point needs digits after it.');
			}

			const number = expression.slice(start, index);
			const [whole] = number.split('.');
			if (whole.length > 1 && whole.startsWith('0'))
				throw new Error('Numbers cannot start with zero.');
			if (number.includes('.') && !config.allowFraction)
				throw new Error('Fractions are not enabled.');
			tokens.push({ kind: 'number', value: number });
			continue;
		}

		if (OPERATORS.includes(character as Operator)) {
			tokens.push({ kind: 'operator', value: character });
			index += 1;
			continue;
		}

		throw new Error('Use digits and the enabled operators only.');
	}

	if (tokens.length === 0) throw new Error('Enter an equation on both sides of =.');
	const fractionalCount = tokens.filter(
		(token) => token.kind === 'number' && token.value.includes('.')
	).length;
	if (fractionalCount > config.maxFractionalNumbers)
		throw new Error('Only one fractional number is allowed.');

	return tokens;
}

class ExpressionParser {
	private index = 0;

	constructor(
		private readonly tokens: Token[],
		private readonly config: Required<DifficultyConfig>
	) {}

	parse(): number {
		const result = this.parseAdditive();
		if (this.index !== this.tokens.length)
			throw new Error('That expression is not syntactically valid.');
		if (!Number.isFinite(result) || Math.abs(result) > MAX_ABSOLUTE_VALUE) {
			throw new Error('That expression is outside the playable number range.');
		}
		return result;
	}

	private current(): Token | undefined {
		return this.tokens[this.index];
	}

	private consume(value: string): boolean {
		if (this.current()?.value !== value) return false;
		this.index += 1;
		return true;
	}

	private requireOperator(operator: Operator): void {
		if (!this.config.operators.includes(operator)) {
			throw new Error(`The ${operator} operator is not enabled.`);
		}
	}

	private parseAdditive(): number {
		let result = this.parseMultiplicative();
		while (this.current()?.value === '+' || this.current()?.value === '-') {
			const operator = this.current()?.value as '+' | '-';
			this.requireOperator(operator);
			this.index += 1;
			const right = this.parseMultiplicative();
			result = operator === '+' ? result + right : result - right;
		}
		return result;
	}

	private parseMultiplicative(): number {
		let result = this.parseUnary();
		while (this.current()?.value === '*' || this.current()?.value === '/') {
			const operator = this.current()?.value as '*' | '/';
			this.requireOperator(operator);
			this.index += 1;
			const right = this.parseUnary();
			if (operator === '/' && Math.abs(right) <= EPSILON)
				throw new Error('Division by zero is not allowed.');
			result = operator === '*' ? result * right : result / right;
		}
		return result;
	}

	private parseUnary(): number {
		if (this.consume('-')) {
			if (!this.config.allowNegative) throw new Error('Negative numbers are not enabled.');
			return -this.parseUnary();
		}
		return this.parsePower();
	}

	private parsePower(): number {
		const left = this.parsePrimary();
		if (!this.consume('^')) return left;
		this.requireOperator('^');
		const result = left ** this.parseUnary();
		if (!Number.isFinite(result))
			throw new Error('That power is outside the playable number range.');
		return result;
	}

	private parsePrimary(): number {
		const token = this.current();
		if (!token || token.kind !== 'number') throw new Error('An operator needs a number after it.');
		this.index += 1;
		return Number(token.value);
	}
}

function evaluateExpression(expression: string, config: Required<DifficultyConfig>): number {
	return new ExpressionParser(tokenise(expression, config), config).parse();
}

export function validateEquation(
	equation: string,
	config: DifficultyConfig,
	expectedLength?: number
): ValidationResult {
	const normalised = normaliseConfig(config);
	if (expectedLength !== undefined && equation.length !== expectedLength) {
		return { valid: false, reason: `Your equation needs ${expectedLength} characters.` };
	}
	if (!equation || equation.includes(' '))
		return { valid: false, reason: 'Use one continuous equation with no spaces.' };
	const equals = equation.indexOf('=');
	if (equals < 1 || equals !== equation.lastIndexOf('=') || equals === equation.length - 1) {
		return { valid: false, reason: 'An equation needs one = with an expression on each side.' };
	}

	try {
		const left = evaluateExpression(equation.slice(0, equals), normalised);
		const right = evaluateExpression(equation.slice(equals + 1), normalised);
		if (!valuesMatch(left, right))
			return { valid: false, reason: 'That equation does not balance.' };
		return { valid: true, value: left };
	} catch (error) {
		return {
			valid: false,
			reason: error instanceof Error ? error.message : 'That equation is not valid.'
		};
	}
}

type Expression = { text: string; value: number; fractionalCount: number };

function positiveNumberTokens(length: number, allowFraction: boolean): string[] {
	if (length <= 0) return [];
	const tokens = new Set<string>();
	if (length <= 3) {
		const start = length === 1 ? 0 : 10 ** (length - 1);
		const end = 10 ** length;
		for (let value = start; value < end; value += 1) tokens.add(String(value));
	} else {
		for (const token of [
			`1${'0'.repeat(length - 1)}`,
			'9'.repeat(length),
			'1'.repeat(length),
			`2${'0'.repeat(length - 1)}`
		]) {
			tokens.add(token);
		}
	}

	if (allowFraction && length >= 3) {
		const wholeLength = length - 2;
		const wholeValues = wholeLength <= 2 ? 10 ** wholeLength : 3;
		for (let whole = 0; whole < wholeValues; whole += 1) {
			for (let decimal = 1; decimal <= 9; decimal += 1) {
				const wholeText =
					wholeLength === 1 ? String(whole) : String(whole).padStart(wholeLength, '0');
				if (wholeLength > 1 && wholeText.startsWith('0')) continue;
				tokens.add(`${wholeText}.${decimal}`);
			}
		}
	}

	return [...tokens].filter((token) => token.length === length);
}

function numberTokensByLength(config: Required<DifficultyConfig>, maxLength: number): string[][] {
	const tokens = Array.from({ length: maxLength + 1 }, () => [] as string[]);
	for (let length = 1; length <= maxLength; length += 1) {
		const positive = positiveNumberTokens(length, config.allowFraction);
		tokens[length].push(...positive);
		if (config.allowNegative) {
			for (const token of positiveNumberTokens(length - 1, config.allowFraction)) {
				if (token !== '0') tokens[length].push(`-${token}`);
			}
		}
	}
	return tokens;
}

function buildExpressionPools(
	config: Required<DifficultyConfig>,
	maxLength: number
): Expression[][] {
	const operands = numberTokensByLength(config, maxLength);
	const pools = Array.from({ length: maxLength + 1 }, () => [] as Expression[]);
	const seen = Array.from({ length: maxLength + 1 }, () => new Set<string>());

	const addExpression = (text: string): void => {
		const length = text.length;
		if (length > maxLength || seen[length].has(text)) return;
		try {
			const value = evaluateExpression(text, config);
			const fractionalCount = (text.match(/\./g) ?? []).length;
			if (fractionalCount > config.maxFractionalNumbers) return;
			const key = `${fractionalCount}:${valueKey(value)}`;
			if (seen[length].has(key)) return;
			seen[length].add(text);
			seen[length].add(key);
			pools[length].push({ text, value, fractionalCount });
		} catch {
			// Invalid intermediate expressions are expected while enumerating candidates.
		}
	};

	for (let length = 1; length <= maxLength; length += 1) {
		for (const operand of operands[length]) addExpression(operand);
		for (let leftLength = 1; leftLength <= length - 2; leftLength += 1) {
			const rightLength = length - leftLength - 1;
			if (pools[leftLength].length === 0 || operands[rightLength].length === 0) continue;
			for (const left of pools[leftLength]) {
				for (const operator of config.operators) {
					for (const operand of operands[rightLength])
						addExpression(`${left.text}${operator}${operand}`);
				}
			}
		}
	}
	return pools;
}

export function generateEquation(
	length: number,
	config: DifficultyConfig,
	random: () => number = Math.random
): string {
	if (!Number.isInteger(length) || length < 3 || length > 12) {
		throw new Error('Equation length must be a whole number from 3 to 12.');
	}
	const normalised = normaliseConfig(config);
	const maxSideLength = length - 2;
	const pools = buildExpressionPools(normalised, maxSideLength);
	const candidates: string[] = [];

	for (let leftLength = 1; leftLength <= length - 2; leftLength += 1) {
		const rightLength = length - leftLength - 1;
		const rightByValue = new Map<string, Expression[]>();
		for (const right of pools[rightLength]) {
			const key = valueKey(right.value);
			rightByValue.set(key, [...(rightByValue.get(key) ?? []), right]);
		}

		for (const left of pools[leftLength]) {
			for (const right of rightByValue.get(valueKey(left.value)) ?? []) {
				if (left.fractionalCount + right.fractionalCount > normalised.maxFractionalNumbers)
					continue;
				const equation = `${left.text}=${right.text}`;
				if (validateEquation(equation, normalised, length).valid) candidates.push(equation);
			}
		}
	}

	if (candidates.length === 0) {
		throw new Error('No valid equation exists for this length and difficulty.');
	}
	return candidates[Math.floor(random() * candidates.length)];
}

export function generateDailyEquation(
	length: number,
	config: DifficultyConfig,
	date = utcDateString()
): string {
	const signature = `${date}:${config.id}:${config.allowFraction}:${config.allowNegative}:${config.operators.join('')}`;
	return generateEquation(length, config, createSeededRandom(signature));
}

export function generatePracticeEquation(length: number, config: DifficultyConfig): string {
	return generateEquation(length, config, Math.random);
}

export function compareGuessToTarget(guess: string, target: string): FeedbackState[] {
	const feedback = Array<FeedbackState>(guess.length).fill('absent');
	const remaining = new Map<string, number>();

	for (let index = 0; index < target.length; index += 1) {
		if (guess[index] === target[index]) {
			feedback[index] = 'correct';
		} else {
			remaining.set(target[index], (remaining.get(target[index]) ?? 0) + 1);
		}
	}

	for (let index = 0; index < guess.length; index += 1) {
		if (feedback[index] === 'correct') continue;
		const count = remaining.get(guess[index]) ?? 0;
		if (count > 0) {
			feedback[index] = 'present';
			remaining.set(guess[index], count - 1);
		}
	}

	return feedback;
}

export function difficultySignature(config: DifficultyConfig): string {
	return [
		config.id,
		config.allowFraction ? 'fraction' : 'integer',
		config.allowNegative ? 'negative' : 'positive',
		config.operators.join('')
	].join('-');
}
