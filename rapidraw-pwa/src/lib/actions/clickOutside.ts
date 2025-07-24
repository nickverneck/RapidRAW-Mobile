import type { ActionReturn } from 'svelte/action';

/**
 * Click outside action for Svelte components
 * Calls the provided callback when a click occurs outside the element
 */
export function clickOutside(
	node: HTMLElement,
	callback: () => void
): ActionReturn<() => void> {
	function handleClick(event: MouseEvent) {
		if (!node.contains(event.target as Node)) {
			callback();
		}
	}

	document.addEventListener('click', handleClick, true);

	return {
		update(newCallback: () => void) {
			callback = newCallback;
		},
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}