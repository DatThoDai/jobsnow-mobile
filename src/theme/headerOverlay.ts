import { Platform, StyleSheet } from 'react-native';
import { spacing } from './spacing';
import { zIndex } from './zIndex';

export const HEADER_SAFE_TOP = Platform.OS === 'ios' ? 50 : 44;

export const headerOverlayStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    paddingTop: HEADER_SAFE_TOP,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
  },
  buttonOnLight: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
});
