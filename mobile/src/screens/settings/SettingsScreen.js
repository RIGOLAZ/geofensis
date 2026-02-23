import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch, Divider, Button, Dialog, Portal, Text } from 'react-native-paper';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { tracking, startTracking, stopTracking } = useLocation();
  const { sendLocalNotification } = useNotification();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const toggleTracking = () => {
    if (tracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const testNotification = () => {
    sendLocalNotification(
      'Test Geofencing Pro',
      'Ceci est une notification de test',
      { type: 'test' }
    );
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.clear();
      setClearDialogVisible(false);
      alert('Cache effacé avec succès');
    } catch (error) {
      alert('Erreur lors de l\'effacement du cache');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Localisation</List.Subheader>
        <List.Item
          title="Suivi en arrière-plan"
          description="Surveillance continue des zones"
          left={props => <List.Icon {...props} icon="crosshairs-gps" />}
          right={() => (
            <Switch value={tracking} onValueChange={toggleTracking} />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Activer les notifications"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch value={notifications} onValueChange={setNotifications} />
          )}
        />
        <List.Item
          title="Son d'alerte"
          left={props => <List.Icon {...props} icon="volume-high" />}
          right={() => (
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          )}
        />
        <List.Item
          title="Vibration"
          left={props => <List.Icon {...props} icon="vibrate" />}
          right={() => (
            <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Tests et Maintenance</List.Subheader>
        <List.Item
          title="Tester notification"
          description="Envoyer une notification de test"
          left={props => <List.Icon {...props} icon="send" />}
          onPress={testNotification}
        />
        <List.Item
          title="Effacer le cache"
          description="Supprimer les données locales"
          left={props => <List.Icon {...props} icon="delete" color="red" />}
          onPress={() => setClearDialogVisible(true)}
        />
      </List.Section>

      <View style={styles.version}>
        <Text>Version 1.0.0</Text>
      </View>

      <Portal>
        <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)}>
          <Dialog.Title>Confirmer</Dialog.Title>
          <Dialog.Content>
            <Text>Êtes-vous sûr de vouloir effacer le cache ? Cette action est irréversible.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Annuler</Button>
            <Button onPress={clearCache} textColor="red">Effacer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  version: {
    alignItems: 'center',
    padding: 20,
    opacity: 0.5,
  },
});