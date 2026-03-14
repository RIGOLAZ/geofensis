import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MainNavigator from './MainNavigator'
import ZoneDetailsScreen from '../screens/zone/ZoneDetailsScreen'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ZoneDetails" 
        component={ZoneDetailsScreen} 
        options={{ title: 'Détails Zone' }} 
      />
    </Stack.Navigator>
  )
}
