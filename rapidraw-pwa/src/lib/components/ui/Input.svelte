<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		value?: string | number;
		type?: string;
		disabled?: boolean;
		readonly?: boolean;
		error?: string;
		label?: string;
		placeholder?: string;
		autocomplete?: string;
		inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
		enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
		variant?: 'primary' | 'secondary' | 'subtle';
		class?: string;
	}

	let {
		value = $bindable(''),
		type = 'text',
		disabled = false,
		readonly = false,
		error = '',
		label = '',
		placeholder = '',
		autocomplete = 'off',
		inputmode,
		enterkeyhint,
		variant = 'primary',
		class: className = '',
		...restProps
	}: Props = $props();

	const dispatch = createEventDispatcher();

	let inputElement: HTMLInputElement;
	let isFocused = $state(false);

	// Computed classes following glassmorphism design
	let inputClasses = $derived(`
		glass-input
		glass-input--${variant}
		${isFocused ? 'glass-input--focused' : ''}
		${error ? 'glass-input--error' : ''}
		${disabled ? 'glass-input--disabled' : ''}
		${readonly ? 'glass-input--readonly' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	// Mobile keyboard optimization
	let mobileInputMode = $derived(() => {
		if (inputmode) return inputmode;
		
		switch (type) {
			case 'email':
				return 'email';
			case 'tel':
				return 'tel';
			case 'url':
				return 'url';
			case 'number':
				return 'numeric';
			case 'search':
				return 'search';
			default:
				return 'text';
		}
	});

	let mobileEnterKeyHint = $derived(() => {
		if (enterkeyhint) return enterkeyhint;
		
		switch (type) {
			case 'search':
				return 'search';
			case 'email':
			case 'url':
				return 'go';
			default:
				return 'done';
		}
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('input', event);
	}

	function handleChange(event: Event) {
		dispatch('change', event);
	}

	function handleFocus(event: FocusEvent) {
		isFocused = true;
		dispatch('focus', event);
		
		// Haptic feedback on mobile
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(25);
		}
	}

	function handleBlur(event: FocusEvent) {
		isFocused = false;
		dispatch('blur', event);
	}

	function handleKeydown(event: KeyboardEvent) {
		dispatch('keydown', event);
		
		// Handle Enter key
		if (event.key === 'Enter') {
			dispatch('enter', event);
		}
		
		// Handle Escape key
		if (event.key === 'Escape') {
			inputElement.blur();
			dispatch('escape', event);
		}
	}

	// Auto-focus functionality
	export function focus() {
		inputElement?.focus();
	}

	export function blur() {
		inputElement?.blur();
	}

	export function select() {
		inputElement?.select();
	}
</script>

<div class="glass-input-container">
	{#if label}
		<label 
			for={restProps.id} 
			class="glass-input-label"
		>
			{label}
		</label>
	{/if}
	
	<input
		bind:this={inputElement}
		bind:value
		{type}
		{disabled}
		{readonly}
		{placeholder}
		{autocomplete}
		inputmode={mobileInputMode}
		enterkeyhint={mobileEnterKeyHint}
		class={inputClasses}
		aria-invalid={error ? 'true' : 'false'}
		aria-describedby={error ? `${restProps.id}-error` : undefined}
		oninput={handleInput}
		onchange={handleChange}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeydown}
		{...restProps}
	/>
	
	{#if error}
		<div 
			id="{restProps.id}-error" 
			class="glass-input-error"
			role="alert"
		>
			{error}
		</div>
	{/if}
</div>

<style>
	/* Glass Input Container */
	.glass-input-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Glass Input Label */
	.glass-input-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, rgba(255, 255, 255, 0.8));
		margin-bottom: 0.25rem;
	}

	/* Glass Input Base Styles */
	.glass-input {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		outline: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		
		/* Glassmorphism base */
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		
		/* Text styling */
		color: var(--text-primary, white);
		
		/* Placeholder styling */
		&::placeholder {
			color: var(--text-secondary, rgba(255, 255, 255, 0.5));
		}
		
		/* File input styling */
		&[type="file"] {
			padding: 0.5rem;
		}
		
		&[type="file"]::file-selector-button {
			background: rgba(255, 255, 255, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 8px;
			padding: 0.5rem 1rem;
			margin-right: 1rem;
			color: var(--text-primary, white);
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		
		&[type="file"]::file-selector-button:hover {
			background: rgba(255, 255, 255, 0.15);
		}
	}

	/* Variant Styles */
	.glass-input--primary {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glass-input--secondary {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.glass-input--subtle {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	/* Focus State */
	.glass-input--focused {
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
		background: rgba(255, 255, 255, 0.08);
	}

	.glass-input:focus {
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
		background: rgba(255, 255, 255, 0.08);
	}

	/* Error State */
	.glass-input--error {
		border-color: rgba(239, 68, 68, 0.5);
		background: rgba(239, 68, 68, 0.05);
	}

	.glass-input--error:focus {
		border-color: rgba(239, 68, 68, 0.7);
		box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
	}

	/* Disabled State */
	.glass-input--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Readonly State */
	.glass-input--readonly {
		background: rgba(255, 255, 255, 0.02);
		cursor: default;
	}

	/* Error Message */
	.glass-input-error {
		font-size: 0.875rem;
		color: #ef4444;
		margin-top: 0.25rem;
		animation: shake 0.3s ease-in-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-4px); }
		75% { transform: translateX(4px); }
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.glass-input {
			min-height: 48px; /* Larger touch target on mobile */
			font-size: 16px; /* Prevent zoom on iOS */
			padding: 1rem;
		}
		
		.glass-input-label {
			font-size: 1rem;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.glass-input {
			border-width: 2px;
			background: rgba(255, 255, 255, 0.1);
		}
		
		.glass-input:focus {
			outline: 3px solid rgba(59, 130, 246, 0.8);
			outline-offset: 2px;
		}
		
		.glass-input--error {
			border-color: #ef4444;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.glass-input {
			transition: none;
		}
		
		.glass-input-error {
			animation: none;
		}
	}

	/* Light Mode Adjustments */
	@media (prefers-color-scheme: light) {
		.glass-input-label {
			color: #374151;
		}
		
		.glass-input--primary {
			background: rgba(255, 255, 255, 0.7);
			border-color: rgba(0, 0, 0, 0.1);
			color: #1e293b;
		}
		
		.glass-input--secondary {
			background: rgba(255, 255, 255, 0.5);
			border-color: rgba(0, 0, 0, 0.08);
			color: #1e293b;
		}
		
		.glass-input--subtle {
			background: rgba(255, 255, 255, 0.3);
			border-color: rgba(0, 0, 0, 0.05);
			color: #1e293b;
		}
		
		.glass-input::placeholder {
			color: #6b7280;
		}
		
		.glass-input:focus {
			border-color: #3b82f6;
			box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
		}
		
		.glass-input--error {
			border-color: #ef4444;
			background: rgba(239, 68, 68, 0.05);
		}
	}

	/* Fallback for browsers without backdrop-filter support */
	@supports not (backdrop-filter: blur(1px)) {
		.glass-input--primary {
			background: rgba(30, 27, 75, 0.9);
		}
		
		.glass-input--secondary {
			background: rgba(20, 20, 40, 0.9);
		}
		
		.glass-input--subtle {
			background: rgba(255, 255, 255, 0.05);
		}
	}

	/* Dark mode specific adjustments */
	@media (prefers-color-scheme: dark) {
		.glass-input::placeholder {
			color: rgba(255, 255, 255, 0.4);
		}
	}
</style>