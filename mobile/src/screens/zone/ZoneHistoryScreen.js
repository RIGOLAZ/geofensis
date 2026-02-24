import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'

export default function ZoneHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text>Historique des entrées/sorties</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
