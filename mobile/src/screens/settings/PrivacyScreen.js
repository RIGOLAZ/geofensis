import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Button } from 'react-native-paper'

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Confidentialité et données
      </Text>
      <Text style={styles.text}>
        Vos données de localisation sont stockées de manière sécurisée et ne sont partagées qu'avec les administrateurs autorisés.
      </Text>
      
      <Button mode="outlined" style={styles.button}>
        Exporter mes données
      </Button>
      <Button mode="outlined" color="red" style={styles.button}>
        Supprimer mon compte
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  text: {
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    marginVertical: 8,
  },
})
