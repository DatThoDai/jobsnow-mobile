import { Platform } from 'react-native';

const displayFont = Platform.select({
  ios: 'Baskerville',
  android: 'serif',
  default: 'serif',
});

const bodyFont = Platform.select({
  ios: 'AvenirNext-Regular',
  android: 'sans-serif-condensed',
  default: 'sans-serif-condensed',
});

const bodyMedium = Platform.select({
  ios: 'AvenirNext-Medium',
  android: 'sans-serif-medium',
  default: 'sans-serif-medium',
});

const bodyBold = Platform.select({
  ios: 'AvenirNext-DemiBold',
  android: 'sans-serif',
  default: 'sans-serif',
});

export const typography = {
  h1: { fontFamily: displayFont, fontSize: 32, lineHeight: 38, letterSpacing: 0.2 },
  h2: { fontFamily: displayFont, fontSize: 26, lineHeight: 32, letterSpacing: 0.2 },
  h3: { fontFamily: displayFont, fontSize: 22, lineHeight: 28, letterSpacing: 0.2 },
  body: { fontFamily: bodyFont, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: bodyMedium, fontSize: 16, lineHeight: 22 },
  bodySm: { fontFamily: bodyFont, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: bodyFont, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: bodyBold, fontSize: 13, lineHeight: 16, letterSpacing: 0.6 },
};

export const fontFamilies = {
  display: displayFont,
  body: bodyFont,
  bodyMedium,
  bodyBold,
};
