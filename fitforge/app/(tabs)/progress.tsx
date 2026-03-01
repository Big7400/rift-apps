import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";
const CARD = "#1A1A1A";

export default function Progress() {
  const { user } = useFitForgeStore();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getProgress(user.id)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} /></SafeAreaView>;

  const volumeHistory: { date: string; volume_kg: number }[] = progress?.volume_history || [];
  const maxVolume = Math.max(...volumeHistory.map((v) => v.volume_kg), 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📈 Progress</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard emoji="🏋️" label="Total Workouts" value={`${progress?.total_workouts ?? 0}`} />
          <StatCard emoji="📦" label="Total Volume" value={`${((progress?.total_volume_kg ?? 0) / 1000).toFixed(1)}t`} />
        </View>
        <View style={styles.statsRow}>
          <StatCard emoji="🔥" label="This Week" value={`${progress?.this_week_workouts ?? 0} sessions`} />
          <StatCard emoji="🏆" label="PRs Set" value={`${progress?.pr_count ?? 0}`} />
        </View>

        {/* Volume chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Training Volume</Text>
          {volumeHistory.length === 0 ? (
            <Text style={styles.emptyText}>Log workouts to see your volume trend</Text>
          ) : (
            <View style={styles.barChart}>
              {volumeHistory.slice(-12).map((v, i) => (
                <View key={i} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: Math.max((v.volume_kg / maxVolume) * 120, 4) }]} />
                  <Text style={styles.barLabel}>{new Date(v.date).toLocaleDateString("en-US", { weekday: "narrow" })}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* AI Analysis */}
        {progress?.ai_analysis && (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
            <Text style={styles.aiMessage}>{progress.ai_analysis.message}</Text>
            {(progress.ai_analysis.suggestions || []).map((s: string, i: number) => (
              <View key={i} style={styles.suggestion}>
                <Text style={styles.suggestionBullet}>→</Text>
                <Text style={styles.suggestionText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top PRs */}
        {(progress?.top_prs || []).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Top Personal Records</Text>
            {(progress.top_prs as any[]).map((pr: any, i: number) => (
              <View key={i} style={styles.prRow}>
                <Text style={styles.prRank}>#{i + 1}</Text>
                <Text style={styles.prName}>{pr.exercise_name}</Text>
                <Text style={styles.prValue}>{pr.one_rep_max}kg</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, padding: 14, alignItems: "center", gap: 6 },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", textAlign: "center" },
  chartCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  chartTitle: { fontSize: 15, fontWeight: "700", color: "#ccc" },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 140 },
  barWrapper: { flex: 1, alignItems: "center", gap: 4, justifyContent: "flex-end" },
  bar: { width: "80%", backgroundColor: ORANGE, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, color: "#555", fontWeight: "600" },
  emptyText: { color: "#555", fontSize: 14, textAlign: "center", paddingVertical: 20 },
  aiCard: { backgroundColor: "#1A0A00", borderRadius: 16, padding: 18, gap: 10, borderWidth: 1, borderColor: "#3A1500" },
  aiTitle: { fontSize: 15, fontWeight: "700", color: ORANGE },
  aiMessage: { fontSize: 14, color: "#ccc", lineHeight: 20 },
  suggestion: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  suggestionBullet: { color: ORANGE, fontWeight: "800", marginTop: 2 },
  suggestionText: { flex: 1, fontSize: 13, color: "#888", lineHeight: 18 },
  card: { backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#ccc", marginBottom: 4 },
  prRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  prRank: { width: 28, fontSize: 14, fontWeight: "800", color: ORANGE },
  prName: { flex: 1, fontSize: 15, color: "#fff", fontWeight: "600" },
  prValue: { fontSize: 15, fontWeight: "800", color: "#ccc" },
});
