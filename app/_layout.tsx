import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { AppDataProvider, useAppData } from '@/app/store/AppDataContext';
import { appTheme } from '@/app/theme/appTheme';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { isReady } = useAppData();

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
          backgroundColor: appTheme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="buttonView" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="historyView" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={appTheme}>
      <AppDataProvider>
        <RootStack />
      </AppDataProvider>
    </PaperProvider>
  );
}
