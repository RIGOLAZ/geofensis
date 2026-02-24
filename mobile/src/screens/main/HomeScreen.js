import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Card, Title, Paragraph, Button, List, Badge } from 'react-native-paper'
import { useGeofence } from '../../context/GeofenceContext'

export default function HomeScreen({ navigation }) {
  const { zones, activeAlerts } = useGeofence()

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Bienvenue sur Geofencing Pro</Title>
          <Paragraph>Surveillance active de {zones.length} zones</Paragraph>
        </Card.Content>
      </Card>

      {activeAlerts.length > 0 && (
        <Card style={[styles.card, styles.alertCard]}>
          <Card.Title
            title="Alertes Actives"
            left={(props) => <Badge {...props} size={24}>{activeAlerts.length}</Badge>}
          />
          <Card.Content>
            {activeAlerts.map((alert, index) => (
              <List.Item
                key={index}
                title={alert.zoneName}
                description={alert.type === 'inside' ? 'Entrée détectée' : 'Sortie détectée'}
                left={(props) => <List.Icon {...props} icon="alert-circle" color="red" />}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title="Actions Rapides" />
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Map')}
            style={styles.button}
          >
            Voir la Carte
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Zones')}
            style={styles.button}
          >
            Liste des Zones
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  alertCard: {
    borderColor: 'red',
    borderWidth: 1,
  },
  button: {
    marginVertical: 8,
  },
})
