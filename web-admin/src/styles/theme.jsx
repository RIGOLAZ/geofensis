const pxToRem = (px, base = 16) => `${px / base}rem`;

const theme = {
  colors: {
    primary: '#1F7AEA',
    primaryDark: '#155EB8',
    primaryLight: '#6EA8FF',
    secondary: '#00BFA6',
    background: '#F6F7FB',
    surface: '#FFFFFF',
    textPrimary: '#0F1724',
    textSecondary: '#556774',
    muted: '#9AA7B2',
    border: '#E6EDF3',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#0284C7',
  },

  spacing: (factor = 1) => `${4 * factor}px`, // usage: theme.spacing(2) -> "8px"

  shape: {
    borderRadius: 8,
    pill: 9999,
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    lineHeight: 1.4,
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
    sizes: {
      xs: pxToRem(12),
      sm: pxToRem(14),
      md: pxToRem(16),
      lg: pxToRem(20),
      xl: pxToRem(24),
    },
  },

  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
    up(key) {
      return `@media (min-width:${this[key]}px)`;
    },
    down(key) {
      return `@media (max-width:${this[key]}px)`;
    },
  },

  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(12, 24, 33, 0.08)',
    md: '0 4px 12px rgba(12, 24, 33, 0.12)',
    lg: '0 10px 30px rgba(12, 24, 33, 0.14)',
  },

  zIndex: {
    mobileStepper: 1000,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    tooltip: 1500,
  },

  transitions: {
    short: '200ms ease-in-out',
    standard: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  utils: {
    pxToRem,
  },
};

export default theme;