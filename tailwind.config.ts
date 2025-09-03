import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'grotesk': ['Space Grotesk', 'sans-serif'],
				'mono': ['JetBrains Mono', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--focus-ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Brutalist Color Palette
				'neon-pink': 'hsl(var(--neon-pink))',
				'toxic-green': 'hsl(var(--toxic-green))',
				'electric-blue': 'hsl(var(--electric-blue))',
				'pure-black': 'hsl(var(--pure-black))',
				'pure-white': 'hsl(var(--pure-white))',
			},
			borderRadius: {
				none: '0px', // Force no radius for brutalist design
			},
			borderWidth: {
				'3': '3px',
				'4': '4px',
				'harsh': 'var(--border-harsh)',
				'brutal': 'var(--border-brutal)',
			},
			spacing: {
				'brutal': 'var(--spacing-brutal)',
			},
			fontSize: {
				'brutal-xl': 'var(--text-brutal-xl)',
				'brutal-lg': 'var(--text-brutal-lg)', 
				'brutal-md': 'var(--text-brutal-md)',
				'brutal-sm': 'var(--text-brutal-sm)',
			},
			keyframes: {
				'brutal-shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-4px)' },
					'75%': { transform: 'translateX(4px)' }
				},
				'brutal-pulse': {
					'0%, 100%': { 
						backgroundColor: 'hsl(var(--pure-white))',
						color: 'hsl(var(--pure-black))'
					},
					'50%': { 
						backgroundColor: 'hsl(var(--pure-black))',
						color: 'hsl(var(--pure-white))'
					}
				}
			},
			animation: {
				'brutal-shake': 'brutal-shake 0.5s ease-in-out',
				'brutal-pulse': 'brutal-pulse 1s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
