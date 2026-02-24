import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { TextInput, Button, Text } from 'react-native-paper'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Mot de passe oublié
      </Text>
      
      <Text style={styles.description}>
        Entrez votre email pour recevoir les instructions de réinitialisation.
      </Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Button mode="contained" onPress={() => {}} style={styles.button}>
        Envoyer
      </Button>
      
      <Button mode="text" onPress={() => navigation.navigate('Login')}>
        Retour à la connexion
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
})
