import type { Config } from 'tailwindcss';

export const abrainoPreset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        brand: {
          base: 'var(--color-bg-base)',
          surface1: 'var(--color-surface-1)',
          surface2: 'var(--color-surface-2)',
          surface3: 'var(--color-surface-3)',
          border: 'var(--color-border)',
          accent: 'var(--color-accent)',
          accentHover: 'var(--color-accent-hover)',
          accentDark: 'var(--color-accent-dark)',
          accentSubtle: 'var(--color-accent-subtle)',
          title: 'var(--color-text-title)',
          body: 'var(--color-text-body)',
          muted: 'var(--color-text-muted)'
        },
        paper: {
          bg: 'var(--color-paper-bg)',
          card: 'var(--color-paper-card)',
          border: 'var(--color-paper-border)',
          text: 'var(--color-paper-text)',
          muted: 'var(--color-paper-muted)'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Silvana', '"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        ambient: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        lift: '0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 135, 31, 0.15)',
        glow: '0 0 24px -2px rgba(245, 135, 31, 0.35)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  }
};

export default abrainoPreset;

