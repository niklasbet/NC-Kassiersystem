import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { AppDataProvider, useAppData } from '@/src/store/AppDataContext';
import { appDarkTheme, appLightTheme } from '@/src/theme/appTheme';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { isReady, themeMode } = useAppData();
  const activeTheme = themeMode === 'dark' ? appDarkTheme : appLightTheme;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: activeTheme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={activeTheme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={activeTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="buttonView" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="historyView" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <AppDataProvider>
      <RootStack />
    </AppDataProvider>
  );
}
