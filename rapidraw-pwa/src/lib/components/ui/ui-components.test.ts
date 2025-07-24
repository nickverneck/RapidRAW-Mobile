import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from './Button.svelte';
import Input from './Input.svelte';
import Switch from './Switch.svelte';
import Dropdown from './Dropdown.svelte';
import CollapsibleSection from './CollapsibleSection.svelte';

describe('UI Components', () => {
	describe('Button', () => {
		it('should render with default props', () => {
			const { getByRole } = render(Button, {
				props: {
					children: () => 'Test Button'
				}
			});
			
			const button = getByRole('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toBe('Test Button');
		});

		it('should handle disabled state', () => {
			const { getByRole } = render(Button, {
				props: {
					disabled: true,
					children: () => 'Disabled Button'
				}
			});
			
			const button = getByRole('button');
			expect(button).toHaveProperty('disabled', true);
		});
	});

	describe('Input', () => {
		it('should render with label', () => {
			const { getByLabelText } = render(Input, {
				props: {
					label: 'Test Input',
					id: 'test-input'
				}
			});
			
			const input = getByLabelText('Test Input');
			expect(input).toBeTruthy();
		});

		it('should handle error state', () => {
			const { getByRole } = render(Input, {
				props: {
					error: 'This field is required',
					id: 'error-input'
				}
			});
			
			const input = getByRole('textbox');
			expect(input).toHaveAttribute('aria-invalid', 'true');
		});
	});

	describe('Switch', () => {
		it('should render with label', () => {
			const { getByLabelText } = render(Switch, {
				props: {
					label: 'Test Switch'
				}
			});
			
			const switchElement = getByLabelText('Test Switch');
			expect(switchElement).toBeTruthy();
			expect(switchElement.type).toBe('checkbox');
		});

		it('should handle checked state', () => {
			const { getByRole } = render(Switch, {
				props: {
					label: 'Test Switch',
					checked: true
				}
			});
			
			const switchElement = getByRole('checkbox');
			expect(switchElement).toHaveProperty('checked', true);
		});
	});

	describe('Dropdown', () => {
		const options = [
			{ value: 'option1', label: 'Option 1' },
			{ value: 'option2', label: 'Option 2' }
		];

		it('should render with options', () => {
			const { getByRole } = render(Dropdown, {
				props: {
					options,
					placeholder: 'Select option'
				}
			});
			
			const button = getByRole('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toContain('Select option');
		});

		it('should show selected value', () => {
			const { getByRole } = render(Dropdown, {
				props: {
					options,
					value: 'option1'
				}
			});
			
			const button = getByRole('button');
			expect(button.textContent).toContain('Option 1');
		});
	});

	describe('CollapsibleSection', () => {
		it('should render with title', () => {
			const { getByRole } = render(CollapsibleSection, {
				props: {
					title: 'Test Section',
					children: () => 'Content'
				}
			});
			
			const button = getByRole('button');
			expect(button.textContent).toContain('Test Section');
		});

		it('should handle open state', () => {
			const { getByRole } = render(CollapsibleSection, {
				props: {
					title: 'Test Section',
					isOpen: true,
					children: () => 'Content'
				}
			});
			
			const button = getByRole('button');
			expect(button).toHaveAttribute('aria-expanded', 'true');
		});
	});
});