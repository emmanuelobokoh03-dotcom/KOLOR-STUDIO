/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Purple Scale (Brand Identity)
        purple: {
          50: '#F3E8FF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },

        // Dark Neutrals (Purple undertone)
        dark: {
          950: '#0A0A0F',
          900: '#1A1A2E',
          800: '#252540',
          700: '#3A3A5C',
          600: '#4B4B6B',
        },

        // Light Neutrals (Sophisticated)
        light: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
        },

        // Semantic Colors
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
        },

        // Workflow Status (Pipeline progression)
        status: {
          quote: '#F59E0B',
          contract: '#6366F1',
          deposit: '#3B82F6',
          progress: '#06B6D4',
          complete: '#10B981',
        },

        // Text Hierarchy
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },

        // Brand colors (kept for BrandThemeContext compatibility)
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

      // Gradients (Strategic storytelling)
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #C084FC 100%)',
        'gradient-creative': 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 50%, #10B981 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1A1A2E 0%, #7C3AED 100%)',
      },

      // Elevation System (Surface hierarchy)
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'elevation-3': '0 10px 25px rgba(0, 0, 0, 0.12)',
      },

      fontFamily: {
        sans: ['var(--font-brand, Inter)', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        brand: ['var(--font-brand, Inter)', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-up-full': 'slideUpFull 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
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
          '0%': { transform: 'translateY(20px)', opacity: '0' },
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
