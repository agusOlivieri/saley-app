import { View, Text, StyleSheet } from "react-native";

export default function SavedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guardados</Text>
      <Text>Aquí aparecerán tus promociones favoritas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#003366",
  },
});
