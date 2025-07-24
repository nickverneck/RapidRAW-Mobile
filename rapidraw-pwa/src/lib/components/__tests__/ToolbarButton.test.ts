import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ToolbarButton from '../ui/ToolbarButton.svelte';

describe('ToolbarButton', () => {
	const mockTool = {
		id: 'metadata',
		name: 'Metadata',
		icon: 'metadata',
		description: 'View image metadata'
	};

	it('renders tool button with icon and name when not collapsed', () => {
		render(ToolbarButton, {
			props: {
				tool: mockTool,
				collapsed: false
			}
		});

		expect(screen.getByText('Metadata')).toBeInTheDocument();
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('renders only icon when collapsed', () => {
		render(ToolbarButton, {
			props: {
				tool: mockTool,
				collapsed: true
			}
		});

		// Should not show text when collapsed
		expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
		// Should still have the button
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('shows correct tooltip when collapsed', () => {
		render(ToolbarButton, {
			props: {
				tool: mockTool,
				collapsed: true
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('title', 'Metadata');
	});

	it('applies active class when active', () => {
		render(ToolbarButton, {
			props: {
				tool: mockTool,
				active: true
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('active');
	});

	it('applies disabled state when disabled', () => {
		render(ToolbarButton, {
			props: {
				tool: mockTool,
				disabled: true
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveClass('disabled');
	});
});
