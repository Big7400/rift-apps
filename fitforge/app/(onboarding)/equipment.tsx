import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";

const EQUIPMENT_OPTIONS = [
  { id: "gym", label: "Full Gym", emoji: "🏋️", desc: "All machines, cables, barbells" },
  { id: "barbell", label: "Barbell + Rack", emoji: "🏗", desc: "Power rack at home or school" },
  { id: "dumbbells", label: "Dumbbells", emoji: "🥊", desc: "Adjustable or fixed dumbbells" },
  { id: "cables", label: "Cable Machine", emoji: "🔗", desc: "Cable/pulley system" },
  { id: "bands", label: "Resistance Bands", emoji: "💪", desc: "Light bands for assistance" },
  { id: "bodyweight", label: "Bodyweight Only", emoji: "🤸", desc: "No equipment needed" },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export default function Equipment() {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<string[]>(["gym"]);
  const [days, setDays] = useState(4);
  const [loading, setLoading] = useState(false);
  const { user, setProfile, setActivePlan, setOnboarded } = useFitForgeStore();

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  }

  async function handleFinish() {
    if (!user || selected.length === 0) return;
    setLoading(true);
    try {
      const profile = {
        fitness_level: params.level as string || "beginner",
        goals: (params.goals as string || "general").split(","),
        equipment: selected,
        days_per_week: days,
      };
      await api.upsertProfile(user.id, profile);
      setProfile(profile as any);
      setOnboarded(true);

      // Immediately generate AI plan
      Alert.alert("🤖 Generating your plan...", "FitForge AI is building your personalized workout plan. This takes a moment.");
      const plan: any = await api.generatePlan(user.id);
      setActivePlan(plan);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.title}>Equipment & Schedule</Text>

        <Text style={styles.label}>Available equipment</Text>
        <View style={styles.options}>
          {EQUIPMENT_OPTIONS.map((e) => {
            const isSelected = selected.includes(e.id);
            return (
              <TouchableOpacity key={e.id} style={[styles.card, isSelected && styles.selectedCard]} onPress={() => toggle(e.id)}>
                <Text style={styles.cardEmoji}>{e.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLabel, isSelected && styles.selectedLabel]}>{e.label}</Text>
                  <Text style={styles.cardDesc}>{e.desc}</Text>
                </View>
                {isSelected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Days per week</Text>
        <View style={styles.daysRow}>
          {DAYS_OPTIONS.map((d) => (
            <TouchableOpacity key={d} style={[styles.dayBtn, days === d && styles.dayBtnSelected]} onPress={() => setDays(d)}>
              <Text style={[styles.dayText, days === d && styles.dayTextSelected]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || selected.length === 0) && { opacity: 0.6 }]}
          onPress={handleFinish}
          disabled={loading || selected.length === 0}
        >
          <Text style={styles.btnText}>{loading ? "🤖 Building your plan..." : "Generate My Plan →"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 28, gap: 14 },
  step: { fontSize: 13, color: "#666", fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff" },
  label: { fontSize: 16, fontWeight: "700", color: "#ccc", marginTop: 8 },
  options: { gap: 10 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, gap: 12, borderWidth: 1.5, borderColor: "#333" },
  selectedCard: { borderColor: ORANGE, backgroundColor: "#1A0A00" },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
  selectedLabel: { color: ORANGE },
  cardDesc: { fontSize: 12, color: "#666" },
  check: { color: ORANGE, fontWeight: "800", fontSize: 16 },
  daysRow: { flexDirection: "row", gap: 10 },
  dayBtn: { flex: 1, backgroundColor: "#1A1A1A", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#333" },
  dayBtnSelected: { borderColor: ORANGE, backgroundColor: "#1A0A00" },
  dayText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  dayTextSelected: { color: ORANGE },
  btn: { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
