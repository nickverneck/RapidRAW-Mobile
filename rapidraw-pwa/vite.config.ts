import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		tailwindcss(), 
		sveltekit(),
		VitePWA({
			registerType: 'prompt',
			srcDir: 'src',
			filename: 'service-worker.ts',
			strategies: 'injectManifest',
			injectRegister: 'auto',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,wasm}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheKeyWillBeUsed: async ({ request }) => {
								return `${request.url}?${Date.now()}`;
							}
						}
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							}
						}
					}
				]
			},
			includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
			manifest: {
				name: 'RapiDraw PWA',
				short_name: 'RapiDraw',
				description: 'Professional RAW photo editing application with advanced color grading',
				theme_color: '#1e1b4b',
				background_color: '#0f0f23',
				display: 'standalone',
				orientation: 'any',
				scope: '/',
				start_url: '/',
				categories: ['photo', 'graphics', 'productivity'],
				screenshots: [
					{
						src: 'screenshot-wide.png',
						sizes: '1280x720',
						type: 'image/png',
						form_factor: 'wide'
					},
					{
						src: 'screenshot-narrow.png', 
						sizes: '750x1334',
						type: 'image/png',
						form_factor: 'narrow'
					}
				],
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				shortcuts: [
					{
						name: 'New Project',
						short_name: 'New',
						description: 'Start a new photo editing project',
						url: '/?action=new',
						icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
					},
					{
						name: 'Recent Projects',
						short_name: 'Recent',
						description: 'Open recent projects',
						url: '/?action=recent',
						icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@wasm': resolve(__dirname, './src/lib/wasm')
		}
	},
	optimizeDeps: {
		exclude: ['@rapidraw/image-processing', '@rapidraw/raw-processing', '@rapidraw/color-grading']
	},
	server: {
		fs: {
			allow: ['..']
		},
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			external: (id) => {
				// Don't bundle WASM files, let them be loaded dynamically
				return id.includes('.wasm');
			}
		}
	},
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
