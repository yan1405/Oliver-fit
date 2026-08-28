/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent', current: 'currentColor',
      background: 'var(--background)', foreground: 'var(--foreground)',
      card: 'var(--card)', 'card-foreground': 'var(--card-foreground)',
      muted: 'var(--muted)', 'muted-foreground': 'var(--muted-foreground)',
      primary: 'var(--primary)', 'primary-foreground': 'var(--primary-foreground)',
      success: 'var(--success)', warning: 'var(--warning)', error: 'var(--error)',
      border: 'var(--border)', glass: 'var(--glass)', 'glass-border': 'var(--glass-border)',
    },
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'sans-serif'],
      display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      mono: ['SF Mono', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      display: ['34px', { lineHeight: '41px', letterSpacing: '0.37px' }],
      'heading-1': ['28px', { lineHeight: '34px', letterSpacing: '0.36px' }],
      'heading-2': ['22px', { lineHeight: '28px', letterSpacing: '0.35px' }],
      'heading-3': ['20px', { lineHeight: '25px', letterSpacing: '0.38px' }],
      body: ['17px', { lineHeight: '22px', letterSpacing: '-0.43px' }],
      'body-small': ['15px', { lineHeight: '20px', letterSpacing: '-0.24px' }],
      caption: ['12px', { lineHeight: '16px' }],
      overline: ['11px', { lineHeight: '13px', letterSpacing: '0.06px' }],
    },
    spacing: { 0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px' },
    borderRadius: { none: '0px', small: '10px', medium: '16px', large: '20px', pill: '999px' },
    boxShadow: { low: '0 1px 2px rgba(0,0,0,.04)', medium: '0 4px 12px rgba(0,0,0,.08)', high: '0 12px 32px rgba(0,0,0,.16)' },
    maxWidth: { app: '428px' },
    extend: { letterSpacing: { heading: '0.36px' } },
  },
  plugins: [],
}
