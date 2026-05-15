import React from 'react';
import { StatusBar } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from '../navigation/RootNavigator';
import { colors } from '../theme';

enableScreens();

export default function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <RootNavigator />
    </AppProviders>
  );
}
