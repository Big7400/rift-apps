import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { router } from "expo-router";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

const SUGGESTED_GOALS = [
  { title: "Get out of bed", category: "health", emoji: "🛏" },
  { title: "Drink 8 glasses of water", category: "health", emoji: "💧" },
  { title: "Take a shower", category: "health", emoji: "🚿" },
  { title: "Go for a walk", category: "health", emoji: "🚶" },
  { title: "Eat a nutritious meal", category: "health", emoji: "🥗" },
  { title: "Text a friend", category: "social", emoji: "📱" },
  { title: "10-minute meditation", category: "mindfulness", emoji: "🧘" },
  { title: "Journal for 5 minutes", category: "mindfulness", emoji: "📓" },
  { title: "Read for 20 minutes", category: "productivity", emoji: "📚" },
  { title: "Clean your space", category: "productivity", emoji: "🧹" },
  { title: "Draw or doodle", category: "creativity", emoji: "✏️" },
  { title: "Cook a meal from scratch", category: "creativity", emoji: "🍳" },
];

export default function PickGoals() {
  const [selected, setSelected] = useState<string[]>(["Get out of bed", "Drink 8 glasses of water", "Take a shower"]);

  function toggle(title: string) {
    setSelected((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Pick your daily goals</Text>
        <Text style={styles.sub}>Choose at least 3. You can always add more later.</Text>

        <View style={styles.grid}>
          {SUGGESTED_GOALS.map((g) => {
            const isSelected = selected.includes(g.title);
            return (
              <TouchableOpacity
                key={g.title}
                style={[styles.goalCard, isSelected && styles.selectedCard]}
                onPress={() => toggle(g.title)}
              >
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <Text style={[styles.goalText, isSelected && styles.selectedText]}>{g.title}</Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.btn, selected.length < 3 && { opacity: 0.5 }]}
          onPress={() => router.replace("/(onboarding)/permissions")}
          disabled={selected.length < 3}
        >
          <Text style={styles.btnText}>I'm ready with {selected.length} goals →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: "800", color: BROWN, textAlign: "center" },
  sub: { fontSize: 15, color: "#7A5C58", textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: "#F0CEBA", minWidth: "45%", flex: 1 },
  selectedCard: { backgroundColor: "#FFF0EA", borderColor: PEACH },
  goalEmoji: { fontSize: 20 },
  goalText: { fontSize: 13, color: BROWN, fontWeight: "500", flex: 1 },
  selectedText: { color: PEACH, fontWeight: "700" },
  checkmark: { color: PEACH, fontWeight: "800", fontSize: 16 },
  btn: { backgroundColor: PEACH, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
