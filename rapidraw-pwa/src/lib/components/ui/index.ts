// Core UI Components
export { default as Button } from './Button.svelte';
export { default as Input } from './Input.svelte';
export { default as Switch } from './Switch.svelte';
export { default as Dropdown } from './Dropdown.svelte';
export { default as CollapsibleSection } from './CollapsibleSection.svelte';

// Touch-optimized components
export { default as TouchSlider } from '../TouchSlider.svelte';

// Types
export interface Option {
	value: string | number;
	label: string;
	disabled?: boolean;
}

export interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'accent' | 'surface';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
}

export interface InputProps {
	type?: string;
	disabled?: boolean;
	readonly?: boolean;
	error?: string;
	label?: string;
	placeholder?: string;
	autocomplete?: string;
	inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
	enterkeyhint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}

export interface SwitchProps {
	checked?: boolean;
	disabled?: boolean;
	label?: string;
	description?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
	hapticFeedback?: boolean;
}

export interface DropdownProps {
	options: Option[];
	value?: string | number;
	placeholder?: string;
	disabled?: boolean;
	maxHeight?: string;
}

export interface CollapsibleSectionProps {
	title: string;
	isOpen?: boolean;
	isContentVisible?: boolean;
	canToggleVisibility?: boolean;
}

export interface TouchSliderProps {
	value?: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	label?: string;
	hapticFeedback?: boolean;
	showValue?: boolean;
	variant?: 'primary' | 'secondary' | 'accent';
	size?: 'sm' | 'md' | 'lg';
}