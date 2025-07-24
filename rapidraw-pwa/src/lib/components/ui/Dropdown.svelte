<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { clickOutside } from '$lib/actions/clickOutside';

	interface Option {
		value: string | number;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		options: Option[];
		value?: string | number;
		placeholder?: string;
		disabled?: boolean;
		variant?: 'primary' | 'secondary' | 'subtle';
		class?: string;
		maxHeight?: string;
	}

	let {
		options,
		value = $bindable(),
		placeholder = 'Select an option',
		disabled = false,
		variant = 'primary',
		class: className = '',
		maxHeight = '20rem'
	}: Props = $props();

	const dispatch = createEventDispatcher();

	let isOpen = $state(false);
	let dropdownElement: HTMLDivElement;
	let buttonElement: HTMLButtonElement;
	let selectedIndex = $state(-1);

	// Computed selected option
	let selectedOption = $derived(options.find(opt => opt.value === value) || null);

	// Computed classes following glassmorphism design
	let triggerClasses = $derived(`
		glass-dropdown-trigger
		glass-dropdown-trigger--${variant}
		${isOpen ? 'glass-dropdown-trigger--open' : ''}
		${disabled ? 'glass-dropdown-trigger--disabled' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	function handleToggle() {
		if (disabled) return;
		
		isOpen = !isOpen;
		selectedIndex = value ? options.findIndex(opt => opt.value === value) : -1;
		
		// Haptic feedback on mobile
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(25);
		}
		
		dispatch('toggle', { isOpen });
	}

	function handleSelect(option: Option) {
		if (option.disabled) return;
		
		value = option.value;
		isOpen = false;
		
		// Haptic feedback on mobile
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(50);
		}
		
		dispatch('change', { value: option.value, option });
		dispatch('select', { value: option.value, option });
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		switch (event.key) {
			case 'Enter':
			case ' ':
				if (!isOpen) {
					handleToggle();
				} else if (selectedIndex >= 0) {
					handleSelect(options[selectedIndex]);
				}
				event.preventDefault();
				break;
			case 'Escape':
				if (isOpen) {
					isOpen = false;
					buttonElement?.focus();
				}
				break;
			case 'ArrowDown':
				if (!isOpen) {
					handleToggle();
				} else {
					selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
					// Skip disabled options
					while (selectedIndex < options.length - 1 && options[selectedIndex]?.disabled) {
						selectedIndex++;
					}
				}
				event.preventDefault();
				break;
			case 'ArrowUp':
				if (isOpen) {
					selectedIndex = Math.max(selectedIndex - 1, 0);
					// Skip disabled options
					while (selectedIndex > 0 && options[selectedIndex]?.disabled) {
						selectedIndex--;
					}
					event.preventDefault();
				}
				break;
			case 'Home':
				if (isOpen) {
					selectedIndex = 0;
					while (selectedIndex < options.length - 1 && options[selectedIndex]?.disabled) {
						selectedIndex++;
					}
					event.preventDefault();
				}
				break;
			case 'End':
				if (isOpen) {
					selectedIndex = options.length - 1;
					while (selectedIndex > 0 && options[selectedIndex]?.disabled) {
						selectedIndex--;
					}
					event.preventDefault();
				}
				break;
		}
	}

	function handleClickOutside() {
		if (isOpen) {
			isOpen = false;
		}
	}

	// Touch handling for mobile
	function handleTouchStart(event: TouchEvent) {
		if (disabled) return;
		
		// Haptic feedback
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(25);
		}
	}

	// Icon components
	function ChevronDownIcon() {
		return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m6 9 6 6 6-6"/>
		</svg>`;
	}

	function CheckIcon() {
		return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 6 9 17l-5-5"/>
		</svg>`;
	}
</script>

<div class="glass-dropdown-container" bind:this={dropdownElement}>
	<button
		bind:this={buttonElement}
		type="button"
		class={triggerClasses}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-disabled={disabled}
		{disabled}
		onclick={handleToggle}
		onkeydown={handleKeydown}
		ontouchstart={handleTouchStart}
		use:clickOutside={handleClickOutside}
	>
		<span class="glass-dropdown-text">
			{selectedOption ? selectedOption.label : placeholder}
		</span>
		<div 
			class="glass-dropdown-chevron {isOpen ? 'glass-dropdown-chevron--open' : ''}"
		>
			{@html ChevronDownIcon()}
		</div>
	</button>

	{#if isOpen}
		<div
			class="glass-dropdown-menu"
			transition:fly={{ y: -10, duration: 200, easing: quintOut }}
		>
			<div
				class="glass-dropdown-content"
				style="max-height: {maxHeight}"
				role="listbox"
				aria-orientation="vertical"
			>
				{#each options as option, index}
					<button
						type="button"
						class="glass-dropdown-option {
							value === option.value 
								? 'glass-dropdown-option--selected' 
								: option.disabled 
									? 'glass-dropdown-option--disabled'
									: ''
						} {selectedIndex === index ? 'glass-dropdown-option--highlighted' : ''}"
						role="option"
						aria-selected={value === option.value}
						aria-disabled={option.disabled}
						disabled={option.disabled}
						onclick={() => handleSelect(option)}
						ontouchstart={(e) => {
							if (!option.disabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
								navigator.vibrate(25);
							}
						}}
					>
						<span class="glass-dropdown-option-text">{option.label}</span>
						{#if value === option.value}
							<div class="glass-dropdown-check">
								{@html CheckIcon()}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Glass Dropdown Container */
	.glass-dropdown-container {
		position: relative;
		width: 100%;
		isolation: isolate;
	}

	/* Glass Dropdown Trigger */
	.glass-dropdown-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		min-height: 44px;
		
		/* Glassmorphism base */
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		
		/* Text styling */
		color: var(--text-primary, white);
		font-size: 1rem;
		text-align: left;
		
		/* Touch optimization */
		touch-action: manipulation;
		user-select: none;
		
		/* Focus styles */
		outline: none;
	}

	.glass-dropdown-trigger:focus-visible {
		outline: 2px solid rgba(59, 130, 246, 0.5);
		outline-offset: 2px;
	}

	/* Variant Styles */
	.glass-dropdown-trigger--primary {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glass-dropdown-trigger--secondary {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.glass-dropdown-trigger--subtle {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	/* Hover States */
	.glass-dropdown-trigger:not(.glass-dropdown-trigger--disabled):hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	/* Open State */
	.glass-dropdown-trigger--open {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(59, 130, 246, 0.3);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	/* Disabled State */
	.glass-dropdown-trigger--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Dropdown Text */
	.glass-dropdown-text {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: inherit;
	}

	/* Dropdown Chevron */
	.glass-dropdown-chevron {
		flex-shrink: 0;
		margin-left: 0.5rem;
		color: var(--text-secondary, rgba(255, 255, 255, 0.6));
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.glass-dropdown-chevron--open {
		transform: rotate(180deg);
	}

	/* Dropdown Menu */
	.glass-dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
		z-index: 50;
		transform-origin: top;
	}

	/* Dropdown Content */
	.glass-dropdown-content {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 0.5rem;
		overflow-y: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	/* Dropdown Option */
	.glass-dropdown-option {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		min-height: 40px;
		
		/* Text styling */
		color: var(--text-primary, white);
		font-size: 0.875rem;
		text-align: left;
		
		/* Touch optimization */
		touch-action: manipulation;
		user-select: none;
		
		/* Focus styles */
		outline: none;
	}

	.glass-dropdown-option:focus-visible {
		outline: 2px solid rgba(59, 130, 246, 0.5);
		outline-offset: 2px;
	}

	/* Option States */
	.glass-dropdown-option:not(.glass-dropdown-option--disabled):hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateX(2px);
	}

	.glass-dropdown-option--highlighted {
		background: rgba(255, 255, 255, 0.05);
	}

	.glass-dropdown-option--selected {
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		font-weight: 500;
		color: #60a5fa;
	}

	.glass-dropdown-option--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Option Text */
	.glass-dropdown-option-text {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Check Icon */
	.glass-dropdown-check {
		flex-shrink: 0;
		margin-left: 0.5rem;
		color: #60a5fa;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.glass-dropdown-trigger {
			min-height: 48px; /* Larger touch target on mobile */
			padding: 1rem;
		}
		
		.glass-dropdown-option {
			min-height: 44px; /* Larger touch target on mobile */
			padding: 1rem;
		}
		
		.glass-dropdown-menu {
			/* Full width on mobile */
			left: 0;
			right: 0;
		}
		
		/* Disable hover effects on touch devices */
		.glass-dropdown-trigger:hover {
			transform: none;
		}
		
		.glass-dropdown-option:hover {
			transform: none;
		}
		
		/* Enhanced active state for touch feedback */
		.glass-dropdown-trigger:active:not(.glass-dropdown-trigger--disabled) {
			transform: scale(0.98);
		}
		
		.glass-dropdown-option:active:not(.glass-dropdown-option--disabled) {
			background: rgba(255, 255, 255, 0.12);
			transform: scale(0.98);
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.glass-dropdown-trigger {
			border-width: 2px;
			background: rgba(255, 255, 255, 0.1);
		}
		
		.glass-dropdown-content {
			border-width: 2px;
			background: rgba(255, 255, 255, 0.1);
		}
		
		.glass-dropdown-option:hover {
			background: rgba(255, 255, 255, 0.2);
		}
		
		.glass-dropdown-option--selected {
			background: rgba(59, 130, 246, 0.2);
			border-width: 2px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.glass-dropdown-trigger,
		.glass-dropdown-chevron,
		.glass-dropdown-option {
			transition: none;
		}
		
		.glass-dropdown-trigger:hover,
		.glass-dropdown-option:hover {
			transform: none;
		}
	}

	/* Light Mode Adjustments */
	@media (prefers-color-scheme: light) {
		.glass-dropdown-trigger--primary {
			background: rgba(255, 255, 255, 0.7);
			border-color: rgba(0, 0, 0, 0.1);
			color: #1e293b;
		}
		
		.glass-dropdown-trigger--secondary {
			background: rgba(255, 255, 255, 0.5);
			border-color: rgba(0, 0, 0, 0.08);
			color: #1e293b;
		}
		
		.glass-dropdown-trigger--subtle {
			background: rgba(255, 255, 255, 0.3);
			border-color: rgba(0, 0, 0, 0.05);
			color: #1e293b;
		}
		
		.glass-dropdown-text {
			color: #1e293b;
		}
		
		.glass-dropdown-chevron {
			color: #6b7280;
		}
		
		.glass-dropdown-content {
			background: rgba(255, 255, 255, 0.9);
			border-color: rgba(0, 0, 0, 0.1);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		}
		
		.glass-dropdown-option {
			color: #1e293b;
		}
		
		.glass-dropdown-option:hover {
			background: rgba(0, 0, 0, 0.05);
		}
		
		.glass-dropdown-option--selected {
			background: rgba(59, 130, 246, 0.1);
			color: #2563eb;
		}
		
		.glass-dropdown-check {
			color: #2563eb;
		}
	}

	/* Fallback for browsers without backdrop-filter support */
	@supports not (backdrop-filter: blur(1px)) {
		.glass-dropdown-trigger--primary {
			background: rgba(30, 27, 75, 0.9);
		}
		
		.glass-dropdown-trigger--secondary {
			background: rgba(20, 20, 40, 0.9);
		}
		
		.glass-dropdown-trigger--subtle {
			background: rgba(255, 255, 255, 0.05);
		}
		
		.glass-dropdown-content {
			background: rgba(30, 27, 75, 0.95);
		}
	}
</style>