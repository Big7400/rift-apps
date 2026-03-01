import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { api } from "../../services/api";
import { useSelfCareStore } from "../../store/selfcare";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

const MOOD_LABELS: Record<number, string> = { 1: "☁️", 2: "🌧", 3: "🌥", 4: "⛅", 5: "🌤", 6: "🌤", 7: "🌤", 8: "☀️", 9: "☀️", 10: "🌈" };

export default function Insights() {
  const { user, puppy } = useSelfCareStore();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getInsights(user.id)
      .then((data) => setInsights(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={PEACH} style={{ marginTop: 60 }} /></SafeAreaView>;
  }

  const moodHistory: { date: string; score: number }[] = insights?.mood_history || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📊 Your Insights</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard emoji="🔥" label="Day Streak" value={`${insights?.streak_days ?? 0}`} />
          <StatCard emoji="✅" label="Goals Done" value={`${insights?.total_goals_completed ?? 0}`} />
          <StatCard emoji="☀️" label="Avg Mood" value={`${insights?.mood_average_7d ?? 0}/10`} />
        </View>

        {/* Puppy level */}
        {puppy && (
          <View style={styles.levelCard}>
            <Text style={styles.cardTitle}>🐾 {puppy.name}'s Progress</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelBig}>Level {puppy.level}</Text>
              <Text style={styles.xpText}>{insights?.level_progress?.xp ?? 0}/{insights?.level_progress?.xp_to_next ?? 100} XP</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${Math.min(((insights?.level_progress?.xp ?? 0) / (insights?.level_progress?.xp_to_next ?? 100)) * 100, 100)}%` as any }]} />
            </View>
          </View>
        )}

        {/* Mood chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mood — Last 14 Days</Text>
          {moodHistory.length === 0 ? (
            <Text style={styles.emptyText}>No check-ins yet. Start checking in daily!</Text>
          ) : (
            <View style={styles.moodChart}>
              {moodHistory.slice(-14).map((m, i) => (
                <View key={i} style={styles.moodBar}>
                  <View style={[styles.moodBarFill, { height: `${m.score * 10}%` as any, backgroundColor: m.score >= 7 ? "#66BB6A" : m.score >= 5 ? "#FFB74D" : "#EF5350" }]} />
                  <Text style={styles.moodDay}>{new Date(m.date).toLocaleDateString("en-US", { weekday: "narrow" })}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tips based on insights */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Wellness Tip</Text>
          <Text style={styles.tipText}>
            {(insights?.streak_days ?? 0) >= 7
              ? "Amazing! You've been checking in for a whole week. Consistency is the key to lasting wellbeing! 🌟"
              : (insights?.streak_days ?? 0) >= 3
              ? "You're building a great habit! Keep checking in every day to grow your streak."
              : "Start small — even checking in for 3 days in a row makes a real difference for mental wellbeing."}
          </Text>
        </View>
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
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: "800", color: BROWN },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: "#F0CEBA" },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 20, fontWeight: "800", color: BROWN },
  statLabel: { fontSize: 11, color: "#7A5C58", fontWeight: "600", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, gap: 12, borderWidth: 1.5, borderColor: "#F0CEBA" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: BROWN },
  levelCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, gap: 10, borderWidth: 1.5, borderColor: "#F0CEBA" },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  levelBig: { fontSize: 22, fontWeight: "800", color: PEACH },
  xpText: { fontSize: 13, color: "#7A5C58" },
  xpTrack: { height: 8, backgroundColor: "#F0CEBA", borderRadius: 4, overflow: "hidden" },
  xpFill: { height: "100%", backgroundColor: PEACH, borderRadius: 4 },
  moodChart: { flexDirection: "row", gap: 4, height: 100, alignItems: "flex-end" },
  moodBar: { flex: 1, height: "100%", justifyContent: "flex-end", alignItems: "center", gap: 4 },
  moodBarFill: { width: "80%", borderRadius: 4, minHeight: 4 },
  moodDay: { fontSize: 9, color: "#7A5C58", fontWeight: "600" },
  emptyText: { color: "#7A5C58", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  tipCard: { backgroundColor: "#FFF3E0", borderRadius: 16, padding: 16, gap: 8 },
  tipTitle: { fontSize: 15, fontWeight: "700", color: BROWN },
  tipText: { fontSize: 14, color: "#7A5C58", lineHeight: 20 },
});
