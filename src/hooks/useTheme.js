import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import { buildTheme } from '@/theme';
import { selectThemePreference } from '@/store/slices/settingsSlice';

// Resolves 'system' | 'light' | 'dark' preference into a full theme object
export const useTheme = () => {
  const preference = useSelector(selectThemePreference);
  const system = useColorScheme();
  const mode =
    preference === 'system'
      ? system === 'dark'
        ? 'dark'
        : 'light'
      : preference;
  return useMemo(() => buildTheme(mode), [mode]);
};

// Memoized StyleSheet factory: const styles = useStyles(makeStyles)
export const useStyles = factory => {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
};
