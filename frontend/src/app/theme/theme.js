import { createTheme } from '@mui/material/styles';

/**
 * Design system tokens based on user requirements.
 */
export const designTokens = {
  light: {
    primary: '#1976D2',
    background: '#F5F7FA',
    backgroundAlt: '#D0E3F2',
    surface: '#FFFFFF',
    textPrimary: '#1D1D1D',
    secondary1: '#E3F2FD',
    secondary2: '#F3E5F5',
    action: '#BA68C8',
  },
  dark: {
    primary: '#58A6FF',
    background: '#0D1117',
    surface: '#161B22',
    textPrimary: '#C9D1D9',
    secondary1: '#1F2937',
    secondary2: '#2D1B36',
    action: '#BF7AF0',
  }
};

/**
 * Common typography settings for both themes.
 */
const typography = {
  fontFamily: 'Roboto, sans-serif',
  h1: { fontWeight: 600 },
  h2: { fontWeight: 600 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 500 },
  h5: { fontWeight: 500 },
  h6: { fontWeight: 500 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500 },
  body1: { fontWeight: 400 },
  body2: { fontWeight: 400 },
  button: { fontWeight: 500, textTransform: 'none' },
};

/**
 * Creates an MUI theme based on the mode.
 */
export const createAppTheme = (mode = 'light') => {
  const tokens = designTokens[mode];
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
      },
      secondary: {
        main: tokens.action,
      },
      background: {
        default: tokens.background,
        paper: tokens.surface,
        alt: tokens.backgroundAlt ?? tokens.surface,
      },
      text: {
        primary: tokens.textPrimary,
      },
      // Status-specific colors mapped to secondary tokens
      info: {
        main: tokens.secondary1,
      },
      warning: {
        main: tokens.secondary2,
      }
    },
    typography,
    layout: {
      sidebarWidth: 320,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none', // Remove MUI dark mode overlay
          },
        },
      },
      /**
       * Neutralises the browser's built-in autofill highlight.
       * The browser ignores background-color overrides directly,
       * so we use the box-shadow inset trick to paint over it.
       */
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            '&:-webkit-autofill': {
              // Paint over the autofill yellow/blue background
              WebkitBoxShadow: `0 0 0 1000px ${designTokens.light.surface} inset`,
              WebkitTextFillColor: designTokens.light.textPrimary,
            },
            '&:-webkit-autofill:focus': {
              WebkitBoxShadow: `0 0 0 1000px ${designTokens.light.surface} inset`,
              WebkitTextFillColor: designTokens.light.textPrimary,
            },
          },
        },
      },
    },
  });
};

// Default export is the light theme for now
const theme = createAppTheme('light');
export default theme;
