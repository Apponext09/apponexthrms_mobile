import { lightColors, darkColors, statusTone } from './colors';
import { typography } from './typography';
import { spacing, radius, shadow } from './spacing';

export const buildTheme = mode => ({
  mode,
  isDark: mode === 'dark',
  colors: mode === 'dark' ? darkColors : lightColors,
  typography,
  spacing,
  radius,
  shadow,
});

export {
  lightColors,
  darkColors,
  statusTone,
  typography,
  spacing,
  radius,
  shadow,
};
