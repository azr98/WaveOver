// ButtonScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ButtonScreen = ({ navigation }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    // TODO: Integrate with AWS backend to notify the other user
    navigation.navigate('SharedScreen');
  };

  return (
    <View style={styles.container}>
      <Text>Press the button to notify your partner</Text>
      <Button
        title="Press Me"
        onPress={handlePress}
        disabled={isPressed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ButtonScreen;

