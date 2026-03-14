import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Avatar, Button } from 'react-native-paper'

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Avatar.Text size={80} label="JD" style={styles.avatar} />
      <Text variant="headlineSmall">John Doe</Text>
      <Text variant="bodyMedium" style={styles.email}>john.doe@example.com</Text>
      
      <Button mode="contained" style={styles.button}>
        Modifier le profil
      </Button>
      <Button mode="outlined" style={styles.button}>
        Changer le mot de passe
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  email: {
    color: '#666',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    marginVertical: 8,
  },
})
