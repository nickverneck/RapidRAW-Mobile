<script lang="ts">
	import { onMount } from 'svelte';
	import { testLibrawIntegration } from '$lib/test-libraw';

	let testResult = $state<boolean | null>(null);
	let isRunning = $state(false);

	async function runTest() {
		isRunning = true;
		testResult = null;
		
		try {
			const result = await testLibrawIntegration();
			testResult = result;
		} catch (error) {
			console.error('Test failed:', error);
			testResult = false;
		} finally {
			isRunning = false;
		}
	}

	onMount(() => {
		// Auto-run test on mount
		runTest();
	});
</script>

<div class="libraw-test glass-panel">
	<h3>libraw-wasm Integration Test</h3>
	
	<div class="test-controls">
		<button 
			class="test-button glass-button" 
			onclick={runTest}
			disabled={isRunning}
		>
			{isRunning ? 'Running Test...' : 'Run Test'}
		</button>
	</div>

	{#if testResult !== null}
		<div class="test-result" class:success={testResult} class:failure={!testResult}>
			{#if testResult}
				<div class="result-icon">✅</div>
				<div class="result-text">
					<strong>Success!</strong> libraw-wasm is working correctly.
				</div>
			{:else}
				<div class="result-icon">❌</div>
				<div class="result-text">
					<strong>Failed!</strong> Check console for details.
				</div>
			{/if}
		</div>
	{/if}

	<div class="test-info">
		<p>This test verifies that:</p>
		<ul>
			<li>libraw-wasm can be initialized</li>
			<li>Supported RAW formats are detected</li>
			<li>File format detection works</li>
			<li>The processor is ready for use</li>
		</ul>
	</div>
</div>

<style>
	.libraw-test {
		padding: 1.5rem;
		margin: 1rem;
		max-width: 500px;
	}

	h3 {
		margin: 0 0 1rem 0;
		color: white;
		font-size: 1.2rem;
	}

	.test-controls {
		margin-bottom: 1rem;
	}

	.test-button {
		padding: 0.75rem 1.5rem;
		border: none;
		color: white;
		background: rgba(59, 130, 246, 0.8);
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
	}

	.test-button:hover:not(:disabled) {
		background: rgba(59, 130, 246, 1);
	}

	.test-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.test-result {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.test-result.success {
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.4);
	}

	.test-result.failure {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
	}

	.result-icon {
		font-size: 1.5rem;
	}

	.result-text {
		color: white;
	}

	.test-info {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.test-info ul {
		margin: 0.5rem 0 0 1rem;
		padding: 0;
	}

	.test-info li {
		margin-bottom: 0.25rem;
	}
</style>