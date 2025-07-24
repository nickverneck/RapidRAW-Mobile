<script lang="ts">
	import { Button, Input, Switch, Dropdown, CollapsibleSection } from '$lib/components/ui';
	import TouchSlider from '$lib/components/TouchSlider.svelte';
	import GlassPanel from '$lib/components/GlassPanel.svelte';

	let inputValue = $state('');
	let switchValue = $state(false);
	let dropdownValue = $state('');
	let sliderValue = $state(50);
	let isCollapsibleOpen = $state(false);

	const dropdownOptions = [
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' },
		{ value: 'option4', label: 'Disabled Option', disabled: true }
	];

	function handleButtonClick() {
		console.log('Button clicked!');
	}

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;
	}

	function handleSwitchChange(event: CustomEvent) {
		switchValue = event.detail.checked;
	}

	function handleDropdownChange(event: CustomEvent) {
		dropdownValue = event.detail.value;
	}

	function handleSliderChange(event: CustomEvent) {
		sliderValue = event.detail.value;
	}
</script>

<svelte:head>
	<title>UI Components Test</title>
</svelte:head>

<div class="container mx-auto p-8 space-y-8">
	<h1 class="text-3xl font-bold text-center mb-8">UI Components Test</h1>

	<!-- Button Tests -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Buttons</h2>
		<div class="flex flex-wrap gap-4">
			<Button onclick={handleButtonClick}>Primary Button</Button>
			<Button variant="secondary" onclick={handleButtonClick}>Secondary Button</Button>
			<Button variant="accent" onclick={handleButtonClick}>Accent Button</Button>
			<Button disabled onclick={handleButtonClick}>Disabled Button</Button>
			<Button loading onclick={handleButtonClick}>Loading Button</Button>
		</div>
	</section>

	<!-- Input Tests -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Inputs</h2>
		<div class="space-y-4 max-w-md">
			<Input 
				label="Text Input" 
				placeholder="Enter some text..." 
				bind:value={inputValue}
				onchange={handleInputChange}
			/>
			<Input 
				label="Email Input" 
				type="email" 
				placeholder="Enter your email..." 
			/>
			<Input 
				label="Password Input" 
				type="password" 
				placeholder="Enter password..." 
			/>
			<Input 
				label="Error Input" 
				error="This field is required" 
				placeholder="This has an error..." 
			/>
		</div>
		<p>Input value: {inputValue}</p>
	</section>

	<!-- Switch Tests -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Switches</h2>
		<div class="space-y-4 max-w-md">
			<Switch 
				label="Basic Switch" 
				bind:checked={switchValue}
				onchange={handleSwitchChange}
			/>
			<Switch 
				label="Switch with Description" 
				description="This switch has additional description text"
				bind:checked={switchValue}
			/>
			<Switch 
				label="Disabled Switch" 
				disabled={true}
			/>
			<Switch 
				label="Large Switch" 
				size="lg"
				variant="accent"
			/>
		</div>
		<p>Switch value: {switchValue}</p>
	</section>

	<!-- Dropdown Tests -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Dropdowns</h2>
		<div class="max-w-md">
			<Dropdown 
				options={dropdownOptions}
				bind:value={dropdownValue}
				placeholder="Select an option..."
				onchange={handleDropdownChange}
			/>
		</div>
		<p>Dropdown value: {dropdownValue}</p>
	</section>

	<!-- Slider Tests -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Touch Sliders</h2>
		<div class="max-w-md space-y-4">
			<TouchSlider 
				label="Exposure"
				bind:value={sliderValue}
				min={-2}
				max={2}
				step={0.1}
				onchange={handleSliderChange}
			/>
			<TouchSlider 
				label="Contrast"
				value={0}
				min={-100}
				max={100}
				step={1}
				variant="accent"
			/>
		</div>
		<p>Slider value: {sliderValue}</p>
	</section>

	<!-- Collapsible Section Tests -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Collapsible Sections</h2>
		<div class="max-w-md">
			<CollapsibleSection 
				title="Basic Adjustments"
				bind:isOpen={isCollapsibleOpen}
			>
				{#snippet children()}
					<div class="space-y-4">
						<TouchSlider label="Exposure" value={0} min={-2} max={2} step={0.1} />
						<TouchSlider label="Contrast" value={0} min={-100} max={100} step={1} />
						<TouchSlider label="Highlights" value={0} min={-100} max={100} step={1} />
						<TouchSlider label="Shadows" value={0} min={-100} max={100} step={1} />
					</div>
				{/snippet}
			</CollapsibleSection>
		</div>
	</section>
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	:global(body) {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		background-attachment: fixed;
		color: white;
	}

	.container {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		min-height: 100vh;
		max-width: 1200px;
		margin: 0 auto;
		overflow-y: auto;
	}

	/* Ensure proper scrolling on mobile */
	@media (max-width: 768px) {
		.container {
			margin: 0;
			border-radius: 0;
			padding: 1rem;
		}
		
		:global(body) {
			background-attachment: scroll;
		}
	}

	/* Custom scrollbar styling */
	.container::-webkit-scrollbar {
		width: 8px;
	}

	.container::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	.container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.5);
	}
</style>