import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const appTheme: MD3Theme = {
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

export const palette = {
  danger: '#ef6a6a',
  success: '#56d68d',
  muted: '#2b3440',
  accentBlue: '#4f7ef2',
} as const;
