// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ButtonScreen from './screens/buttonScreen.js';
import SharedScreen from './screens/sharedScreen.js';
import Amplify from 'aws-amplify';
import config from './aws-exports';
Amplify.configure(config);

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ButtonScreen">
        <Stack.Screen name="ButtonScreen" component={ButtonScreen} />
        <Stack.Screen name="SharedScreen" component={SharedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
//comment hehe