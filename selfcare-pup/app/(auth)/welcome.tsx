import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { router } from "expo-router";

export default function Welcome() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>SelfCare Pup</Text>
        <Text style={styles.subtitle}>
          Your virtual puppy grows when you take care of yourself.{"\n"}
          Show up for them — and for you.
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureRow emoji="✅" text="Set daily self-care goals" />
        <FeatureRow emoji="🌤" text="Track your mood every day" />
        <FeatureRow emoji="🐕" text="Watch your puppy grow & level up" />
        <FeatureRow emoji="🌳" text="Cheer on friends at the Dog Park" />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.primaryBtnText}>Get Started — it's free</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM, paddingHorizontal: 28 },
  hero: { flex: 1, justifyContent: "center", alignItems: "center" },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: "800", color: BROWN, marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#7A5C58", textAlign: "center", lineHeight: 24 },
  features: { gap: 14, marginBottom: 32 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureEmoji: { fontSize: 22 },
  featureText: { fontSize: 16, color: BROWN, flex: 1 },
  buttons: { gap: 12, paddingBottom: 32 },
  primaryBtn: { backgroundColor: PEACH, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  secondaryBtnText: { color: PEACH, fontWeight: "600", fontSize: 15 },
});
