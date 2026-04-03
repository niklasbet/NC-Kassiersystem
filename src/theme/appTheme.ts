import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const appDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 14,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#f6b351',
    onPrimary: '#2b1a00',
    secondary: '#6fd6b6',
    onSecondary: '#052018',
    tertiary: '#78a7ff',
    background: '#0f1318',
    surface: '#171d25',
    surfaceVariant: '#212a34',
    onSurface: '#ecf1f8',
    onSurfaceVariant: '#b3bfcd',
    outline: '#455364',
    error: '#ff7878',
  },
};

export const appLightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#d98a18',
    onPrimary: '#ffffff',
    secondary: '#198f6e',
    onSecondary: '#ffffff',
    tertiary: '#2f6fdd',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#e9eef5',
    onSurface: '#15202b',
    onSurfaceVariant: '#4a596b',
    outline: '#9cadc0',
    error: '#c62828',
  },
};

export const appTheme = appLightTheme;

export const palette = {
  danger: '#ef6a6a',
  success: '#56d68d',
  muted: '#2b3440',
  accentBlue: '#4f7ef2',
} as const;
