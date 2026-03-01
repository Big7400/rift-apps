import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { router } from "expo-router";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";

const LEVELS = [
  { id: "beginner", label: "Beginner", emoji: "🌱", desc: "New to working out or returning after a long break" },
  { id: "intermediate", label: "Intermediate", emoji: "💪", desc: "6+ months of consistent training" },
  { id: "advanced", label: "Advanced", emoji: "🏆", desc: "2+ years, know your lifts and PRs" },
];

export default function FitnessLevel() {
  const [selected, setSelected] = useState("beginner");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 1 of 3</Text>
        <Text style={styles.title}>What's your fitness level?</Text>
        <Text style={styles.sub}>This helps us set the right starting weights</Text>

        <View style={styles.options}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[styles.card, selected === l.id && styles.selectedCard]}
              onPress={() => setSelected(l.id)}
            >
              <Text style={styles.cardEmoji}>{l.emoji}</Text>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardLabel, selected === l.id && styles.selectedLabel]}>{l.label}</Text>
                <Text style={styles.cardDesc}>{l.desc}</Text>
              </View>
              {selected === l.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push({ pathname: "/(onboarding)/goals", params: { level: selected } })}
        >
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  content: { flex: 1, padding: 28, justifyContent: "center", gap: 16 },
  step: { fontSize: 13, color: "#666", fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 15, color: "#888" },
  options: { gap: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 16, padding: 18, gap: 14, borderWidth: 1.5, borderColor: "#333" },
  selectedCard: { borderColor: ORANGE, backgroundColor: "#1A0A00" },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, gap: 4 },
  cardLabel: { fontSize: 17, fontWeight: "700", color: "#fff" },
  selectedLabel: { color: ORANGE },
  cardDesc: { fontSize: 13, color: "#666" },
  check: { color: ORANGE, fontWeight: "800", fontSize: 18 },
  btn: { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
