// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface PageState {
			/** Set on history entries written by the explorer (shallow routing). */
			explore?: { opened: boolean };
		}
	}
}

export {};
