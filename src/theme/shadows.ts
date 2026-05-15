import { Platform } from 'react-native';
import { colors } from './colors';

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 3 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 10 },
    default: {},
  }),
};
