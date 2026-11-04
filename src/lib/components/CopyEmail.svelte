<script lang="ts">
	// The V2 "Copy email" button: copies the address, confirms in a live
	// region, and falls back to the mail app when the clipboard is refused.
	let { email }: { email: string } = $props();
	let message = $state('');
	let timer = 0;

	async function copy() {
		clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(email);
			message = 'Copied!';
			timer = window.setTimeout(() => (message = ''), 1800);
		} catch {
			message = 'Could not copy. Opening your email app.';
			window.location.href = `mailto:${email}`;
		}
	}
</script>

<button data-email={email} onclick={copy} type="button">
	Copy email<span aria-live="polite" class="tooltip" role="status">{message}</span>
</button>
