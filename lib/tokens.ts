export const tokens = {
  colors: {
    primary: '#2E7D32',
    secondary: '#1976D2',
    accent: '#FFB300',
    neutral: {
      50: '#F8FAFC',
      100: '#E5E9EC',
      200: '#CBD2D9',
      300: '#A1A9B1',
      400: '#7A828B',
      500: '#555D64',
      600: '#3B4248',
      700: '#23292E',
      800: '#14191D',
      900: '#0B0F12',
    },
  },
  fonts: {
    heading: 'Outfit',
    body: 'Inter',
  },
  radius: '16px',
  focus: 'oklch(0.7 0.2 150)',
};

export type Tokens = typeof tokens;
