import React from 'react'
import { View, StyleSheet } from 'react-native'
import { List, Switch, Divider } from 'react-native-paper'

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true)
  const [soundAlerts, setSoundAlerts] = React.useState(true)
  const [backgroundTracking, setBackgroundTracking] = React.useState(true)

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Activer les notifications"
          right={() => (
            <Switch value={notifications} onValueChange={setNotifications} />
          )}
        />
        <List.Item
          title="Alertes sonores"
          right={() => (
            <Switch value={soundAlerts} onValueChange={setSoundAlerts} />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Localisation</List.Subheader>
        <List.Item
          title="Suivi en arrière-plan"
          description="Nécessaire pour le geofencing"
          right={() => (
            <Switch value={backgroundTracking} onValueChange={setBackgroundTracking} />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>À propos</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
        />
        <List.Item
          title="Support technique"
          description="support@geofencing-pro.com"
        />
      </List.Section>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
