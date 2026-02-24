import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Card, List, Chip } from 'react-native-paper'

export default function ZoneDetailsScreen({ route }) {
  const { zoneId } = route.params || { zoneId: 'unknown' }

  return (
    <View style={styles.container}>
      <Card>
        <Card.Title title={`Zone ${zoneId}`} />
        <Card.Content>
          <List.Item
            title="Type"
            description="Polygone"
          />
          <List.Item
            title="Alerte"
            description={
              <Chip mode="outlined" color="red">Critique</Chip>
            }
          />
          <List.Item
            title="Dernière activité"
            description="Il y a 5 minutes"
          />
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
})
