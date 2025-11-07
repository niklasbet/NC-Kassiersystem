import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AntDesign, Entypo, FontAwesome6 } from '@expo/vector-icons';
import { DarkTheme, useTheme } from '@react-navigation/native';
import { Appearance, BackHandler } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

//marvin war hierrrr

Appearance.setColorScheme('dark');

  return (
    <Tabs
      tabBarActiveTintColor='#707070'
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#202020',
        }
      }}
      useTheme={DarkTheme}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kasse',
          tabBarIcon: ({ color, focused }) => (
            // <Entypo name="credit" size={24} color={color} />
            <FontAwesome6 name="cash-register" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Statistik',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign name="barschart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
