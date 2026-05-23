import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { handleDeepLink } from '../../utils/deepLinks';
import { useAuthStore } from '../../stores/useAuthStore';
import { ENABLE_SOCIAL_OAUTH, getLinkedInRedirectUri } from '../../config/env';

interface AppProvidersProps {
  children: React.ReactNode;
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
};

const linking = {
  prefixes: [Linking.createURL('/'), 'jobsnowapp://'],
  config: {
    screens: {
      PaymentResult: 'payment-result',
    },
  },
};

export function AppProviders({ children }: AppProvidersProps) {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const loginWithLinkedIn = useAuthStore((s) => s.loginWithLinkedIn);

  useEffect(() => {
    const onUrl = async (event: { url: string }) => {
      const handled = await handleDeepLink(
        event.url,
        navigationRef,
        async (code) => {
          if (!ENABLE_SOCIAL_OAUTH) return;
          await loginWithLinkedIn(code, getLinkedInRedirectUri());
          WebBrowser.dismissAuthSession();
        }
      );
      if (handled && event.url.includes('linkedin-callback')) {
        WebBrowser.dismissAuthSession();
      }
    };

    const sub = Linking.addEventListener('url', onUrl);
    Linking.getInitialURL().then((url) => {
      if (url) onUrl({ url });
    });

    return () => sub.remove();
  }, [loginWithLinkedIn]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
          {children}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
