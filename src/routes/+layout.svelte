<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Mazzie</title>
	<meta
		name="description"
		content="Mazzie is a daily equation guessing game for people who like their puzzles to balance."
	/>
</svelte:head>
<ModeWatcher defaultMode="light" />
<Toaster position="bottom-center" />
{@render children()}
