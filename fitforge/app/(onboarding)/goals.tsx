import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";

const GOALS = [
  { id: "build_muscle", label: "Build Muscle", emoji: "💪", desc: "Gain size and mass" },
  { id: "lose_fat", label: "Lose Fat", emoji: "🔥", desc: "Cut body fat while keeping muscle" },
  { id: "strength", label: "Get Stronger", emoji: "🏋️", desc: "Increase max lifts and power" },
  { id: "endurance", label: "Build Endurance", emoji: "🏃", desc: "Improve cardio and stamina" },
  { id: "general", label: "General Fitness", emoji: "⚡", desc: "Stay active and feel great" },
];

export default function Goals() {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<string[]>(["build_muscle"]);

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.title}>What are your goals?</Text>
        <Text style={styles.sub}>Select all that apply — AI will balance them</Text>

        <View style={styles.options}>
          {GOALS.map((g) => {
            const isSelected = selected.includes(g.id);
            return (
              <TouchableOpacity key={g.id} style={[styles.card, isSelected && styles.selectedCard]} onPress={() => toggle(g.id)}>
                <Text style={styles.cardEmoji}>{g.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLabel, isSelected && styles.selectedLabel]}>{g.label}</Text>
                  <Text style={styles.cardDesc}>{g.desc}</Text>
                </View>
                {isSelected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.btn, selected.length === 0 && { opacity: 0.5 }]}
          onPress={() => router.push({ pathname: "/(onboarding)/equipment", params: { ...params, goals: selected.join(",") } })}
          disabled={selected.length === 0}
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
  options: { gap: 10 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 16, padding: 16, gap: 14, borderWidth: 1.5, borderColor: "#333" },
  selectedCard: { borderColor: ORANGE, backgroundColor: "#1A0A00" },
  cardEmoji: { fontSize: 26 },
  cardInfo: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  selectedLabel: { color: ORANGE },
  cardDesc: { fontSize: 12, color: "#666" },
  check: { color: ORANGE, fontWeight: "800", fontSize: 18 },
  btn: { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
