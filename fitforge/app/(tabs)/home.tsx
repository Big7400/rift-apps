import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";
const CARD = "#1A1A1A";

export default function Home() {
  const { user, activePlan, setActivePlan, prs } = useFitForgeStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getActivePlan(user.id).then((p) => setActivePlan(p as any)).catch(() => {}),
      api.getProgress(user.id).then((s) => setStats(s)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  async function regeneratePlan() {
    if (!user) return;
    Alert.alert(
      "Regenerate Plan?",
      "Claude AI will create a new plan based on your current PRs and profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate", onPress: async () => {
            try {
              const plan: any = await api.generatePlan(user.id);
              setActivePlan(plan);
              Alert.alert("✅ New plan ready!", plan.name);
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const todayDayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayPlan = activePlan?.plan_json?.days?.[todayDayIndex % (activePlan?.days_per_week || 1)];

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>⚡ FitForge</Text>
          <Text style={styles.date}>{today}</Text>
          <Text style={styles.greeting}>Hey {user?.display_name?.split(" ")[0]}, ready to train?</Text>
        </View>

        {/* Today's workout */}
        {todayPlan ? (
          <TouchableOpacity style={styles.todayCard} onPress={() => router.push("/(tabs)/log")}>
            <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>TODAY</Text></View>
            <Text style={styles.todayTitle}>{todayPlan.name}</Text>
            <Text style={styles.todayFocus}>{todayPlan.focus}</Text>
            <Text style={styles.todayExCount}>{todayPlan.exercises?.length || 0} exercises</Text>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Workout →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPlanCard}>
            <Text style={styles.noPlanEmoji}>🤖</Text>
            <Text style={styles.noPlanTitle}>No plan yet</Text>
            <TouchableOpacity style={styles.generateBtn} onPress={regeneratePlan}>
              <Text style={styles.generateBtnText}>Generate AI Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatCard emoji="💪" label="Total Workouts" value={`${stats?.total_workouts ?? 0}`} />
          <StatCard emoji="🏆" label="PRs Logged" value={`${stats?.pr_count ?? 0}`} />
          <StatCard emoji="🔥" label="This Week" value={`${stats?.this_week_workouts ?? 0}`} />
        </View>

        {/* Active plan info */}
        {activePlan && (
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>📋 Current Program</Text>
            <Text style={styles.planName}>{activePlan.name}</Text>
            <Text style={styles.planDays}>{activePlan.days_per_week} days/week · AI-generated</Text>
            <TouchableOpacity onPress={regeneratePlan} style={styles.regenBtn}>
              <Text style={styles.regenText}>🔄 Regenerate with Claude</Text>
            </TouchableOpacity>
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
  scroll: { padding: 20, gap: 16 },
  header: { gap: 4 },
  appName: { fontSize: 20, fontWeight: "900", color: ORANGE },
  date: { fontSize: 13, color: "#555" },
  greeting: { fontSize: 22, fontWeight: "800", color: "#fff" },
  todayCard: { backgroundColor: ORANGE, borderRadius: 20, padding: 20, gap: 6 },
  todayBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  todayBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  todayTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  todayFocus: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  todayExCount: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  startBtn: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  noPlanCard: { backgroundColor: CARD, borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  noPlanEmoji: { fontSize: 48 },
  noPlanTitle: { fontSize: 18, fontWeight: "700", color: "#ccc" },
  generateBtn: { backgroundColor: ORANGE, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  generateBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, padding: 14, alignItems: "center", gap: 6 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 10, color: "#666", fontWeight: "600", textAlign: "center" },
  planCard: { backgroundColor: CARD, borderRadius: 20, padding: 18, gap: 6, borderWidth: 1, borderColor: "#2A2A2A" },
  planTitle: { fontSize: 14, color: "#555", fontWeight: "600" },
  planName: { fontSize: 18, fontWeight: "800", color: "#fff" },
  planDays: { fontSize: 13, color: "#666" },
  regenBtn: { marginTop: 8, alignSelf: "flex-start" },
  regenText: { color: ORANGE, fontSize: 14, fontWeight: "600" },
});
