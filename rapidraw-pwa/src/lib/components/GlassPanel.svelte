<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'accent' | 'subtle';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		blur?: 'light' | 'medium' | 'heavy';
		border?: boolean;
		shadow?: boolean;
		interactive?: boolean;
		rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		class?: string;
		children?: any;
	}

	let {
		variant = 'primary',
		size = 'md',
		blur = 'medium',
		border = true,
		shadow = true,
		interactive = false,
		rounded = 'lg',
		class: className = '',
		children
	}: Props = $props();

	// Reactive classes based on props
	let panelClasses = $derived(`
		glass-panel
		glass-panel--${variant}
		glass-panel--${size}
		glass-panel--blur-${blur}
		glass-panel--rounded-${rounded}
		${border ? 'glass-panel--border' : ''}
		${shadow ? 'glass-panel--shadow' : ''}
		${interactive ? 'glass-panel--interactive' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	// Support for reduced motion
	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;
		
		const handleChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};
		
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});
</script>

<div 
	class={panelClasses}
	class:reduced-motion={prefersReducedMotion}
	data-testid="glass-panel"
	role={interactive ? 'button' : undefined}
	tabindex={interactive ? 0 : undefined}
>
	{@render children?.()}
</div>

<style>
	/* CSS Custom Properties for Glassmorphism */
	:global(:root) {
		/* Background Colors */
		--bg-primary: #0f0f23;
		--bg-secondary: #1a1a2e;
		--bg-tertiary: #16213e;
		
		/* Text Colors */
		--text-primary: #ffffff;
		--text-secondary: rgba(255, 255, 255, 0.8);
		--text-tertiary: rgba(255, 255, 255, 0.6);
		
		/* Glass Colors */
		--glass-background-primary: rgba(255, 255, 255, 0.1);
		--glass-background-secondary: rgba(255, 255, 255, 0.05);
		--glass-background-accent: rgba(59, 130, 246, 0.15);
		--glass-background-subtle: rgba(255, 255, 255, 0.03);
		
		/* Glass Borders */
		--glass-border-primary: rgba(255, 255, 255, 0.2);
		--glass-border-secondary: rgba(255, 255, 255, 0.1);
		--glass-border-accent: rgba(59, 130, 246, 0.3);
		
		/* Blur Levels */
		--blur-light: blur(8px);
		--blur-medium: blur(16px);
		--blur-heavy: blur(24px);
		
		/* Shadows */
		--glass-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
		--glass-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
		--glass-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
		
		/* Border Radius */
		--radius-sm: 8px;
		--radius-md: 12px;
		--radius-lg: 16px;
		--radius-xl: 24px;
		--radius-full: 9999px;
		
		/* Spacing */
		--spacing-sm: 1rem;
		--spacing-md: 1.5rem;
		--spacing-lg: 2rem;
		--spacing-xl: 3rem;
	}

	/* Base Glass Panel Styles */
	.glass-panel {
		position: relative;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-sizing: border-box;
	}

	/* Variant Styles */
	.glass-panel--primary {
		background: var(--glass-background-primary);
		backdrop-filter: var(--blur-medium);
		-webkit-backdrop-filter: var(--blur-medium);
	}

	.glass-panel--secondary {
		background: var(--glass-background-secondary);
		backdrop-filter: var(--blur-medium);
		-webkit-backdrop-filter: var(--blur-medium);
	}

	.glass-panel--accent {
		background: var(--glass-background-accent);
		backdrop-filter: var(--blur-medium);
		-webkit-backdrop-filter: var(--blur-medium);
	}

	.glass-panel--subtle {
		background: var(--glass-background-subtle);
		backdrop-filter: var(--blur-light);
		-webkit-backdrop-filter: var(--blur-light);
	}

	/* Size Styles */
	.glass-panel--sm {
		padding: var(--spacing-sm);
	}

	.glass-panel--md {
		padding: var(--spacing-md);
	}

	.glass-panel--lg {
		padding: var(--spacing-lg);
	}

	.glass-panel--xl {
		padding: var(--spacing-xl);
	}

	/* Blur Levels */
	.glass-panel--blur-light {
		backdrop-filter: var(--blur-light);
		-webkit-backdrop-filter: var(--blur-light);
	}

	.glass-panel--blur-medium {
		backdrop-filter: var(--blur-medium);
		-webkit-backdrop-filter: var(--blur-medium);
	}

	.glass-panel--blur-heavy {
		backdrop-filter: var(--blur-heavy);
		-webkit-backdrop-filter: var(--blur-heavy);
	}

	/* Border Styles */
	.glass-panel--border.glass-panel--primary {
		border: 1px solid var(--glass-border-primary);
	}

	.glass-panel--border.glass-panel--secondary {
		border: 1px solid var(--glass-border-secondary);
	}

	.glass-panel--border.glass-panel--accent {
		border: 1px solid var(--glass-border-accent);
	}

	.glass-panel--border.glass-panel--subtle {
		border: 1px solid var(--glass-border-secondary);
	}

	/* Shadow Styles */
	.glass-panel--shadow.glass-panel--sm {
		box-shadow: var(--glass-shadow-sm);
	}

	.glass-panel--shadow.glass-panel--md {
		box-shadow: var(--glass-shadow-md);
	}

	.glass-panel--shadow.glass-panel--lg,
	.glass-panel--shadow.glass-panel--xl {
		box-shadow: var(--glass-shadow-lg);
	}

	/* Border Radius */
	.glass-panel--rounded-sm {
		border-radius: var(--radius-sm);
	}

	.glass-panel--rounded-md {
		border-radius: var(--radius-md);
	}

	.glass-panel--rounded-lg {
		border-radius: var(--radius-lg);
	}

	.glass-panel--rounded-xl {
		border-radius: var(--radius-xl);
	}

	.glass-panel--rounded-full {
		border-radius: var(--radius-full);
	}

	/* Interactive States */
	.glass-panel--interactive {
		cursor: pointer;
		user-select: none;
	}

	.glass-panel--interactive:hover {
		transform: translateY(-2px);
		background: var(--glass-background-primary);
		border-color: var(--glass-border-primary);
		box-shadow: var(--glass-shadow-lg);
	}

	.glass-panel--interactive:active {
		transform: translateY(0) scale(0.98);
		background: var(--glass-background-secondary);
	}

	.glass-panel--interactive:focus {
		outline: 2px solid var(--glass-border-accent);
		outline-offset: 2px;
	}

	/* Accent variant interactive states */
	.glass-panel--accent.glass-panel--interactive:hover {
		background: rgba(59, 130, 246, 0.2);
		border-color: var(--glass-border-accent);
	}

	/* Reduced Motion Support */
	.glass-panel.reduced-motion,
	.glass-panel.reduced-motion * {
		transition: none !important;
		animation: none !important;
	}

	.glass-panel.reduced-motion.glass-panel--interactive:hover {
		transform: none;
	}

	.glass-panel.reduced-motion.glass-panel--interactive:active {
		transform: none;
	}

	/* High Contrast Mode Support */
	@media (prefers-contrast: high) {
		.glass-panel--border {
			border-width: 2px;
		}
		
		.glass-panel--interactive:focus {
			outline-width: 3px;
		}
		
		.glass-panel {
			background: rgba(255, 255, 255, 0.15);
		}
	}

	/* Dark Mode Adjustments */
	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--glass-background-primary: rgba(255, 255, 255, 0.08);
			--glass-background-secondary: rgba(255, 255, 255, 0.04);
			--glass-background-accent: rgba(59, 130, 246, 0.12);
			--glass-background-subtle: rgba(255, 255, 255, 0.02);
		}
	}

	/* Light Mode Adjustments */
	@media (prefers-color-scheme: light) {
		:global(:root) {
			--bg-primary: #f8fafc;
			--bg-secondary: #f1f5f9;
			--bg-tertiary: #e2e8f0;
			
			--text-primary: #1e293b;
			--text-secondary: rgba(30, 41, 59, 0.8);
			--text-tertiary: rgba(30, 41, 59, 0.6);
			
			--glass-background-primary: rgba(255, 255, 255, 0.7);
			--glass-background-secondary: rgba(255, 255, 255, 0.5);
			--glass-background-accent: rgba(59, 130, 246, 0.1);
			--glass-background-subtle: rgba(255, 255, 255, 0.3);
			
			--glass-border-primary: rgba(0, 0, 0, 0.1);
			--glass-border-secondary: rgba(0, 0, 0, 0.05);
			--glass-border-accent: rgba(59, 130, 246, 0.2);
		}
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.glass-panel--interactive {
			/* Larger touch targets on mobile */
			min-height: 44px;
			min-width: 44px;
		}
		
		.glass-panel--interactive:hover {
			/* Disable hover effects on touch devices */
			transform: none;
		}
		
		.glass-panel--interactive:active {
			/* Enhanced active state for touch feedback */
			background: var(--glass-background-accent);
			transform: scale(0.95);
		}
	}

	/* Print Styles */
	@media print {
		.glass-panel {
			background: white !important;
			backdrop-filter: none !important;
			-webkit-backdrop-filter: none !important;
			border: 1px solid #ccc !important;
			box-shadow: none !important;
		}
	}

	/* Fallback for browsers without backdrop-filter support */
	@supports not (backdrop-filter: blur(1px)) {
		.glass-panel--primary {
			background: rgba(30, 27, 75, 0.9);
		}
		
		.glass-panel--secondary {
			background: rgba(20, 20, 40, 0.9);
		}
		
		.glass-panel--accent {
			background: rgba(59, 130, 246, 0.2);
		}
		
		.glass-panel--subtle {
			background: rgba(255, 255, 255, 0.05);
		}
	}
</style>