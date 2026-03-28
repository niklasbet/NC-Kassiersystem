import { AntDesign, FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { appTheme } from '@/app/theme/appTheme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: appTheme.colors.surface,
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
          tabBarIcon: ({ color }) => <AntDesign name="barschart" size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}
