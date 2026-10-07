/** @type {import('tailwindcss').Config} */

// Colors are RGB-channel CSS variables defined per theme in src/index.css.
// Components never need `dark:` variants — the tokens swap with the theme class on <html>.
// The `<alpha-value>` placeholder keeps opacity modifiers like `bg-ink/5` working.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Interface palette — neutrals + one accent
        paper: token('paper'),
        raise: token('raise'),
        ink: token('ink'),
        mute: token('mute'),
        rule: token('rule'),
        signal: token('signal'),
        // Data colors — only ever used to encode timing meaning, never decoration
        best: token('best'),
        pb: token('pb'),
        warn: token('warn'),
        danger: token('danger'),
        // Mini-sector bar fills — brighter than the text tokens in light mode
        seg: {
          best: token('seg-best'),
          pb: token('seg-pb'),
          warn: token('seg-warn'),
        },
        // Track-status flag glyph + alert rule
        flag: {
          green: token('flag-green'),
          yellow: token('flag-yellow'),
          red: token('flag-red'),
          ink: token('flag-ink'),
        },
        compound: {
          soft: token('compound-soft'),
          medium: token('compound-medium'),
          hard: token('compound-hard'),
          inter: token('compound-inter'),
          wet: token('compound-wet'),
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        label: ['11px', { lineHeight: '16px', letterSpacing: '0.06em' }],
        data: ['13px', { lineHeight: '20px' }],
        ui: ['15px', { lineHeight: '22px' }],
        title: ['20px', { lineHeight: '28px' }],
        hero: ['40px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
      },
      keyframes: {
        'drawer-in': {
          from: { transform: 'translateX(24px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'drawer-in': 'drawer-in 180ms ease-out',
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
