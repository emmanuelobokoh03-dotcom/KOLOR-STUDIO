/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Colors (Purple) ─────────────────────────
        brand: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          DEFAULT: '#7C3AED',
        },

        // Purple Scale (backwards compat — used by 267+ existing refs)
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },

        // Dark Neutrals (Purple undertone) — backwards compat
        dark: {
          950: '#0A0A0F',
          900: '#1A1A2E',
          800: '#252540',
          700: '#3A3A5C',
          600: '#4B4B6B',
        },

        // Light Neutrals — backwards compat
        light: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
        },

        // ── Surface Colors ────────────────────────────────
        surface: {
          white: '#FFFFFF',
          background: '#FAFAFA',
          card: '#FFFFFF',
          hover: '#F9FAFB',
          elevated: '#FFFFFF',
        },

        // ── Border Colors ─────────────────────────────────
        border: {
          light: '#F3F4F6',
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
          brand: '#E9D5FF',
        },

        // ── Text Colors ───────────────────────────────────
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          disabled: '#D1D5DB',
          inverse: '#FFFFFF',
          brand: '#7C3AED',
        },

        // ── Semantic Colors ───────────────────────────────
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#D1FAE5',
          dark: '#059669',
          border: '#6EE7B7',
          text: '#047857',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FEF3C7',
          border: '#FCD34D',
          text: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: '#FEE2E2',
          border: '#FCA5A5',
          text: '#B91C1C',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        info: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#DBEAFE',
          border: '#93C5FD',
          text: '#1E40AF',
        },

        // Workflow Status (Pipeline)
        status: {
          quote: '#F59E0B',
          contract: '#6366F1',
          deposit: '#3B82F6',
          progress: '#06B6D4',
          complete: '#10B981',
        },

        // Brand Theme (CSS variable-driven for BrandThemeContext)
        'brand-primary': {
          DEFAULT: 'rgb(var(--color-brand-primary-rgb, 124 58 237) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-primary-dark-rgb, 109 40 217) / <alpha-value>)',
          light: 'rgb(var(--color-brand-primary-light-rgb, 192 132 252) / <alpha-value>)',
        },
        'brand-accent': {
          DEFAULT: 'rgb(var(--color-brand-accent-rgb, 236 72 153) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-accent-dark-rgb, 219 39 119) / <alpha-value>)',
          light: 'rgb(var(--color-brand-accent-light-rgb, 244 114 182) / <alpha-value>)',
        },
      },

      // ── Typography ────────────────────────────────────
      fontFamily: {
        heading: ['Bricolage Grotesque', 'Inter', 'sans-serif'],
        body: ['Instrument Sans', 'Inter', 'sans-serif'],
        sans: ['var(--font-brand, "Instrument Sans")', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Inter', 'sans-serif'],
        brand: ['var(--font-brand, "Instrument Sans")', 'sans-serif'],
      },
      fontSize: {
        'h1': ['48px', { lineHeight: '56px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h2': ['36px', { lineHeight: '44px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'h4': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h5': ['18px', { lineHeight: '26px', fontWeight: '500' }],
        'h6': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '16px', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'button': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'overline': ['11px', { lineHeight: '16px', fontWeight: '700', letterSpacing: '0.1em' }],
      },

      // ── Spacing ───────────────────────────────────────
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },

      // ── Gradients ─────────────────────────────────────
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #C084FC 100%)',
        'gradient-creative': 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 50%, #10B981 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1A1A2E 0%, #7C3AED 100%)',
      },

      // ── Elevation / Shadows ───────────────────────────
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 3px rgba(124, 58, 237, 0.1)',
        'input-error': '0 0 0 3px rgba(239, 68, 68, 0.1)',
      },

      // ── Border Radius ─────────────────────────────────
      borderRadius: {
        'button': '8px',
        'input': '8px',
        'card': '12px',
        'modal': '16px',
        'badge': '9999px',
      },

      // ── Transitions ───────────────────────────────────
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ── Animations ────────────────────────────────────
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 250ms ease-in-out',
        'slide-up': 'slideUp 250ms ease-out',
        'slide-down': 'slideDown 250ms ease-out',
        'slide-up-full': 'slideUpFull 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'scale-in': 'scaleIn 150ms ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUpFull: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
