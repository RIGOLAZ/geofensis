import React from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { List, Divider, Chip } from 'react-native-paper'
import { useGeofence } from '../../context/GeofenceContext'

export default function ZonesScreen() {
  const { zones } = useGeofence()

  const renderItem = ({ item }) => (
    <List.Item
      title={item.name}
      description={item.description || 'Aucune description'}
      left={(props) => (
        <List.Icon
          {...props}
          icon={item.type === 'circle' ? 'checkbox-blank-circle-outline' : 'vector-polygon'}
        />
      )}
      right={(props) => (
        <Chip {...props} mode="outlined" selected={item.active}>
          {item.active ? 'Actif' : 'Inactif'}
        </Chip>
      )}
    />
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={zones}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
})
