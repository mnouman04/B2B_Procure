/** Design tokens lifted directly from the PROCURIO / توريد mockups. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F1F4FA', 100: '#E2E8F4', 200: '#C3CEE6', 300: '#93A6CE',
          400: '#5C74AC', 500: '#33497F', 600: '#1E3160', 700: '#152449',
          800: '#0F1D3D', 900: '#0B1B3A', 950: '#071429',
        },
        gold: {
          50: '#FDF9EF', 100: '#FAF0D6', 200: '#F5E1AC', 300: '#EFCE7B',
          400: '#E9C46A', 500: '#DFAE4E', 600: '#C9963C', 700: '#A67733',
          800: '#875F30', 900: '#704F2B',
        },
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E6EAF1',
        canvas: '#F5F7FA',
        success: { DEFAULT: '#16A34A', soft: '#ECFDF3', ring: '#A7E3BE' },
        danger: { DEFAULT: '#DC2626', soft: '#FEF2F2' },
        warn: { DEFAULT: '#D97706', soft: '#FFFBEB' },
        info: { DEFAULT: '#2563EB', soft: '#EFF6FF' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'Tajawal', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        card: '12px',
        panel: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        lift: '0 4px 12px rgba(15, 23, 42, 0.08)',
        panel: '0 12px 32px rgba(11, 27, 58, 0.14)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out',
        'slide-up': 'slide-up .25s ease-out',
      },
    },
  },
  plugins: [],
};
