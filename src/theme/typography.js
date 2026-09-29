import { Platform } from 'react-native';

const family = Platform.select({ ios: 'System', android: 'sans-serif' });
const familyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
});

export const typography = {
  display: {
    fontFamily: family,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: family,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: { fontFamily: family, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  h3: {
    fontFamily: familyMedium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: { fontFamily: family, fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyMedium: {
    fontFamily: familyMedium,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  caption: {
    fontFamily: family,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  captionMedium: {
    fontFamily: familyMedium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  small: {
    fontFamily: familyMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
};
