// Single source of truth for the app's palette.
// Dark espresso theme matching the "Brew" UI design.
export const colors = {
  // Backgrounds
  bg: '#1a0a04',
  surface: '#2d1507',
  surfaceAlt: '#4a2010',
  surfaceHi: '#6b3520',

  // Brand accents
  accent: '#d4802a',
  accentLight: '#f0a940',

  // Text
  text: '#f5ede0',
  textInverse: '#1a0a04',
  cream: '#e8c99a',
  creamMuted: 'rgba(232,201,154,0.6)',
  creamFaint: 'rgba(232,201,154,0.4)',
  creamGhost: 'rgba(232,201,154,0.15)',

  // Status
  success: '#4caf7d',
  successDark: '#3a9e68',
  danger: '#e05252',
  warning: '#d4802a',

  // Borders
  border: 'rgba(232,201,154,0.08)',
  borderStrong: 'rgba(232,201,154,0.2)',
};

export const radius = { sm: 8, md: 14, lg: 18, xl: 22, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Font helpers — keep all serif headlines consistent.
export const fonts = {
  serifWeight: '700',
  bodyWeight: '500',
};
