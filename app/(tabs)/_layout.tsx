import { AntDesign, FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kasse',
          tabBarIcon: ({ color }) => <FontAwesome6 name="cash-register" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Statistik',
          tabBarIcon: ({ color }) => <AntDesign name="bar-chart" size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}
