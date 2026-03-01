import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

export default function Permissions() {
  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    // Proceed regardless of permission status
    router.replace("/(tabs)/home");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>Stay on track</Text>
        <Text style={styles.sub}>
          Allow notifications so your puppy can remind you to check in and complete your daily goals.
          {"\n\n"}
          Your puppy will send you gentle nudges — never overwhelming.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={requestPermissions}>
          <Text style={styles.btnText}>Allow Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
          <Text style={styles.skip}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { flex: 1, padding: 32, justifyContent: "center", alignItems: "center", gap: 20 },
  emoji: { fontSize: 80 },
  title: { fontSize: 28, fontWeight: "800", color: BROWN, textAlign: "center" },
  sub: { fontSize: 16, color: "#7A5C58", textAlign: "center", lineHeight: 24 },
  btn: { backgroundColor: PEACH, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: "center", width: "100%" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  skip: { color: "#B8957E", fontWeight: "600", fontSize: 15 },
});
