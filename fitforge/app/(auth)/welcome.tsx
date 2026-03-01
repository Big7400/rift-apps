import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { router } from "expo-router";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";
const CARD = "#1A1A1A";

export default function Welcome() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>⚡ FitForge</Text>
        <Text style={styles.title}>Build your strongest self</Text>
        <Text style={styles.subtitle}>
          AI-powered workout plans personalized to you.{"\n"}
          Track PRs. See real progress. Get stronger every week.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          ["🤖", "AI workout plans tailored to your goals"],
          ["🏆", "Track personal records & estimated 1RM"],
          ["📈", "Visualize strength progress over time"],
          ["🔔", "Smart reminders on workout days"],
        ].map(([emoji, text]) => (
          <View key={text as string} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.primaryBtnText}>Start Training — Free</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.secondaryBtnText}>Already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK, paddingHorizontal: 28 },
  hero: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  logo: { fontSize: 32, fontWeight: "900", color: ORANGE },
  title: { fontSize: 34, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 40 },
  subtitle: { fontSize: 16, color: "#888", textAlign: "center", lineHeight: 24 },
  features: { gap: 16, marginBottom: 32 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureEmoji: { fontSize: 22 },
  featureText: { fontSize: 15, color: "#ccc", flex: 1 },
  buttons: { gap: 12, paddingBottom: 32 },
  primaryBtn: { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  secondaryBtnText: { color: "#888", fontWeight: "600", fontSize: 15 },
});
