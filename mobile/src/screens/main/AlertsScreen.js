import React from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { List, Divider, Text } from 'react-native-paper'
import { useGeofence } from '../../context/GeofenceContext'

export default function AlertsScreen() {
  const { activeAlerts } = useGeofence()

  if (activeAlerts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text>Aucune alerte active</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activeAlerts}
        renderItem={({ item }) => (
          <List.Item
            title={item.zoneName}
            description={`Type: ${item.type} | ${item.timestamp?.toLocaleTimeString() || 'Now'}`}
            left={(props) => (
              <List.Icon
                {...props}
                icon="alert"
                color={item.type === 'inside' ? 'red' : 'orange'}
              />
            )}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={Divider}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
