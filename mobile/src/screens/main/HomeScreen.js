import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, List, Badge, Avatar } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useGeofence } from '../../context/GeofenceContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { zones, activeAlerts } = useGeofence();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const getStatusColor = (count) => {
    if (count === 0) return '#4CAF50';
    if (count < 3) return '#FF9800';
    return '#F44336';
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.welcomeCard}>
        <Card.Title
          title={`Bonjour, ${user?.email?.split('@')[0] || 'Utilisateur'}`}
          subtitle={user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
          left={(props) => <Avatar.Icon {...props} icon="account" />}
        />
        <Card.Content>
          <Paragraph>
            Bienvenue dans Geofencing Pro. Surveillez vos zones en temps réel.
          </Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { borderLeftColor: getStatusColor(activeAlerts.length) }]}>
          <Card.Content>
            <Title>{activeAlerts.length}</Title>
            <Paragraph>Alertes actives</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title>{zones.length}</Title>
            <Paragraph>Zones surveillées</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.menuCard}>
        <Card.Title title="Navigation rapide" />
        <Card.Content>
          <List.Item
            title="Voir la carte"
            description="Carte interactive des zones"
            left={props => <List.Icon {...props} icon="map" />}
            onPress={() => navigation.navigate('Map')}
          />
          <List.Item
            title="Mes zones"
            description="Liste des zones de geofencing"
            left={props => <List.Icon {...props} icon="map-marker-radius" />}
            onPress={() => navigation.navigate('Zones')}
          />
          <List.Item
            title="Alertes"
            description="Historique des notifications"
            left={props => (
              <View>
                <List.Icon {...props} icon="bell" />
                {activeAlerts.length > 0 && (
                  <Badge style={styles.badge}>{activeAlerts.length}</Badge>
                )}
              </View>
            )}
            onPress={() => navigation.navigate('Alerts')}
          />
          <List.Item
            title="Paramètres"
            description="Configuration de l'application"
            left={props => <List.Icon {...props} icon="cog" />}
            onPress={() => navigation.navigate('Settings')}
          />
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Déconnexion
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 10,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderLeftWidth: 4,
  },
  menuCard: {
    margin: 10,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  logoutButton: {
    margin: 20,
    marginTop: 10,
  },
});