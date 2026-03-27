/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Colors (Deeper Purple — #6C2EDB primary) ──────
        brand: {
          50: '#F8F5FF',
          100: '#EDE5FF',
          200: '#DBC8FF',
          300: '#C5A3FE',
          400: '#AB79FC',
          500: '#9250F5',
          600: '#6C2EDB',
          700: '#5B22C4',
          800: '#4A1BA3',
          900: '#3D1584',
          DEFAULT: '#6C2EDB',
        },

        // Purple Scale (backwards compat — mirrors brand)
        purple: {
          50: '#F8F5FF',
          100: '#EDE5FF',
          200: '#DBC8FF',
          300: '#C5A3FE',
          400: '#AB79FC',
          500: '#9250F5',
          600: '#6C2EDB',
          700: '#5B22C4',
          800: '#4A1BA3',
          900: '#3D1584',
        },

        // ── Accent Warm (Amber — #E8891A primary) ───────────────
        accent: {
          50: '#FFF6E8',
          100: '#FFECC6',
          200: '#FDDFA0',
          300: '#F8C960',
          400: '#F0AD30',
          500: '#E8891A',
          600: '#C46E0E',
          700: '#A05408',
          800: '#7D3F05',
          900: '#5A2C03',
          DEFAULT: '#E8891A',
          hover: '#C46E0E',
          light: '#FFF6E8',
          tint: '#FDDFA0',
        },

        // Dark Neutrals (Purple undertone)
        dark: {
          950: '#0A0A0F',
          900: '#1A1A2E',
          800: '#252540',
          700: '#3A3A5C',
          600: '#4B4B6B',
        },

        // Light Neutrals — warm-tinted
        light: {
          0: '#FDFCFF',
          50: '#F9F7FE',
          100: '#F4F1FA',
          200: '#EDE8F5',
          300: '#DDD6EA',
        },

        // ── Surface Colors (warm purple-tinted) ─────────────────
        surface: {
          base: '#FDFCFF',
          white: '#FDFCFF',
          background: '#F9F7FE',
          card: '#FDFCFF',
          hover: '#F4F1FA',
          elevated: '#FDFCFF',
        },

        // ── Border Colors (warm purple-tinted) ──────────────────
        border: {
          light: '#F2EEF8',
          DEFAULT: '#EDE8F5',
          strong: '#DDD6EA',
          dark: '#DDD6EA',
          brand: '#DBC8FF',
        },

        // ── Text Colors ─────────────────────────────────────────
        text: {
          primary: '#1A1A2E',
          secondary: '#4B5563',
          tertiary: '#6B7280',
          disabled: '#9CA3AF',
          inverse: '#FFFFFF',
          brand: '#6C2EDB',
        },

        // ── Semantic Colors ─────────────────────────────────────
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
          DEFAULT: 'rgb(var(--color-brand-primary-rgb, 108 46 219) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-primary-dark-rgb, 91 34 196) / <alpha-value>)',
          light: 'rgb(var(--color-brand-primary-light-rgb, 171 121 252) / <alpha-value>)',
        },
        'brand-accent': {
          DEFAULT: 'rgb(var(--color-brand-accent-rgb, 232 137 26) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-accent-dark-rgb, 196 110 14) / <alpha-value>)',
          light: 'rgb(var(--color-brand-accent-light-rgb, 253 223 160) / <alpha-value>)',
        },
      },

      // ── Typography ────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        brand: ['var(--font-brand, "Inter")', 'system-ui', 'sans-serif'],
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
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
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

      // ── Gradients (updated to deeper purple) ──────────
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6C2EDB 0%, #9250F5 50%, #AB79FC 100%)',
        'gradient-creative': 'linear-gradient(135deg, #6C2EDB 0%, #06B6D4 50%, #10B981 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1A1A2E 0%, #6C2EDB 100%)',
      },

      // ── Elevation / Shadows ───────────────────────────
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'modal': '0 20px 40px rgba(0, 0, 0, 0.15)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 3px rgba(108, 46, 219, 0.1)',
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
