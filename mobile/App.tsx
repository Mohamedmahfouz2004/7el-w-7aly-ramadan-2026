import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import TournamentSetupScreen from './src/screens/TournamentSetupScreen';
import TournamentListScreen from './src/screens/TournamentListScreen';
import TournamentDashboardScreen from './src/screens/TournamentDashboardScreen';
import GameScreen from './src/screens/GameScreen';
import MatchResultsScreen from './src/screens/MatchResultsScreen';
import QuestionBankScreen from './src/screens/QuestionBankScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#1a0533" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: '#1a0533' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TournamentSetup" component={TournamentSetupScreen} />
        <Stack.Screen name="TournamentList" component={TournamentListScreen} />
        <Stack.Screen name="TournamentDashboard" component={TournamentDashboardScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="MatchResults" component={MatchResultsScreen} />
        <Stack.Screen name="QuestionBank" component={QuestionBankScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
