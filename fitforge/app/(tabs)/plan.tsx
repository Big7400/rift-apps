import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";
const CARD = "#1A1A1A";

export default function Plan() {
  const { user, activePlan, setActivePlan } = useFitForgeStore();
  const [loading, setLoading] = useState(!activePlan);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  useEffect(() => {
    if (activePlan || !user) { setLoading(false); return; }
    api.getActivePlan(user.id)
      .then((p) => setActivePlan(p as any))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} /></SafeAreaView>;

  if (!activePlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptySub}>Complete onboarding to generate your AI plan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = activePlan.plan_json?.days || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.planTitle}>{activePlan.name}</Text>
        <Text style={styles.planMeta}>{activePlan.days_per_week} days/week · {activePlan.plan_json?.duration_weeks || 8} weeks</Text>
        <Text style={styles.planDesc}>{activePlan.plan_json?.description}</Text>

        {days.map((day: any, i: number) => (
          <TouchableOpacity key={i} style={styles.dayCard} onPress={() => setExpandedDay(expandedDay === i ? null : i)}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}><Text style={styles.dayBadgeText}>Day {day.day_number}</Text></View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayFocus}>{day.focus}</Text>
              </View>
              <Text style={styles.chevron}>{expandedDay === i ? "▲" : "▼"}</Text>
            </View>

            {expandedDay === i && (
              <View style={styles.exercises}>
                {(day.exercises || []).map((ex: any, j: number) => (
                  <View key={j} style={styles.exRow}>
                    <View style={styles.exNum}><Text style={styles.exNumText}>{j + 1}</Text></View>
                    <View style={styles.exInfo}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exDetail}>{ex.sets} sets × {ex.reps} reps · {ex.rest_seconds}s rest</Text>
                      <Text style={styles.exWeight}>{ex.weight_suggestion}</Text>
                      {ex.notes && <Text style={styles.exNotes}>💡 {ex.notes}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {activePlan.plan_json?.progression_notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>📈 Progression</Text>
            <Text style={styles.notesText}>{activePlan.plan_json.progression_notes}</Text>
          </View>
        )}

        {activePlan.plan_json?.deload_week && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>🔄 Deload Week</Text>
            <Text style={styles.notesText}>{activePlan.plan_json.deload_week}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 20, gap: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  emptySub: { fontSize: 15, color: "#666", textAlign: "center" },
  planTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  planMeta: { fontSize: 13, color: ORANGE, fontWeight: "600" },
  planDesc: { fontSize: 14, color: "#888", lineHeight: 20 },
  dayCard: { backgroundColor: CARD, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#2A2A2A" },
  dayHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  dayBadge: { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dayBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  dayInfo: { flex: 1, gap: 2 },
  dayName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  dayFocus: { fontSize: 12, color: "#666" },
  chevron: { color: "#444", fontSize: 14 },
  exercises: { padding: 16, paddingTop: 0, gap: 12, borderTopWidth: 1, borderTopColor: "#2A2A2A" },
  exRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  exNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center", marginTop: 2 },
  exNumText: { color: ORANGE, fontWeight: "800", fontSize: 13 },
  exInfo: { flex: 1, gap: 2 },
  exName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  exDetail: { fontSize: 13, color: "#888" },
  exWeight: { fontSize: 12, color: ORANGE, fontWeight: "600" },
  exNotes: { fontSize: 12, color: "#666", lineHeight: 18 },
  notesCard: { backgroundColor: CARD, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  notesTitle: { fontSize: 15, fontWeight: "700", color: "#ccc" },
  notesText: { fontSize: 14, color: "#888", lineHeight: 20 },
});
