import { registerRootComponent } from "expo";
import { View, Text, StyleSheet } from "react-native";

function TestApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.success}>✅ SUCCÈS !</Text>
      <Text>Expo fonctionne correctement</Text>
      <Text>React: 18.2.0</Text>
      <Text>Expo: 55.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  success: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
});

registerRootComponent(TestApp);
