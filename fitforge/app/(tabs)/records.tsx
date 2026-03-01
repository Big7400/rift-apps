import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";
const CARD = "#1A1A1A";

export default function Records() {
  const { user, prs, setPRs } = useFitForgeStore();
  const [loading, setLoading] = useState(prs.length === 0);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user || prs.length > 0) { setLoading(false); return; }
    api.getAllPRs(user.id)
      .then((data: any) => setPRs(data.records || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} /></SafeAreaView>;

  const categories = [...new Set(prs.map((p) => {
    const name = p.exercise_name.toLowerCase();
    if (name.includes("bench") || name.includes("chest") || name.includes("fly")) return "chest";
    if (name.includes("row") || name.includes("pull") || name.includes("dead") || name.includes("lat")) return "back";
    if (name.includes("squat") || name.includes("leg") || name.includes("lunge") || name.includes("glute")) return "legs";
    if (name.includes("press") && (name.includes("shoulder") || name.includes("overhead") || name.includes("ohp"))) return "shoulders";
    if (name.includes("curl") || name.includes("tricep") || name.includes("bicep")) return "arms";
    return "other";
  }))];

  const filteredPRs = filter ? prs.filter((p) => {
    const name = p.exercise_name.toLowerCase();
    if (filter === "chest") return name.includes("bench") || name.includes("chest") || name.includes("fly");
    if (filter === "back") return name.includes("row") || name.includes("pull") || name.includes("dead") || name.includes("lat");
    if (filter === "legs") return name.includes("squat") || name.includes("leg") || name.includes("lunge") || name.includes("glute");
    if (filter === "shoulders") return name.includes("press") && (name.includes("shoulder") || name.includes("overhead") || name.includes("ohp"));
    if (filter === "arms") return name.includes("curl") || name.includes("tricep") || name.includes("bicep");
    return true;
  }) : prs;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏆 Personal Records</Text>
        <Text style={styles.sub}>{prs.length} exercises tracked</Text>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[null, ...categories].map((c) => (
            <TouchableOpacity key={c ?? "all"} style={[styles.filterChip, filter === c && styles.filterChipSelected]} onPress={() => setFilter(c)}>
              <Text style={[styles.filterChipText, filter === c && styles.filterChipTextSelected]}>{c ?? "All"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredPRs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No PRs yet</Text>
            <Text style={styles.emptySub}>Log your first workout to start tracking personal records</Text>
          </View>
        ) : (
          filteredPRs.map((pr) => (
            <View key={pr.id} style={styles.prCard}>
              <View style={styles.prHeader}>
                <Text style={styles.prName}>{pr.exercise_name}</Text>
                {pr.is_pr && <View style={styles.prBadge}><Text style={styles.prBadgeText}>PR</Text></View>}
              </View>
              <View style={styles.prStats}>
                <PRStat label="Weight" value={`${pr.weight_kg}kg`} />
                <PRStat label="Reps" value={`${pr.reps}`} />
                <PRStat label="Est. 1RM" value={`${pr.one_rep_max}kg`} highlight />
              </View>
              <Text style={styles.prDate}>{new Date(pr.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PRStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.highlightValue]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 13, color: "#666" },
  filterScroll: { marginBottom: 4 },
  filterChip: { backgroundColor: CARD, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: "#333" },
  filterChipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  filterChipText: { color: "#888", fontWeight: "600", fontSize: 13, textTransform: "capitalize" },
  filterChipTextSelected: { color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  emptySub: { fontSize: 14, color: "#666", textAlign: "center" },
  prCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  prHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  prName: { fontSize: 17, fontWeight: "700", color: "#fff" },
  prBadge: { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2 },
  prBadgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  prStats: { flexDirection: "row", gap: 16 },
  stat: { gap: 2 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#ccc" },
  highlightValue: { color: ORANGE },
  statLabel: { fontSize: 11, color: "#555", fontWeight: "600" },
  prDate: { fontSize: 12, color: "#444" },
});
