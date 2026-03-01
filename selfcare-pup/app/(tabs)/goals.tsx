import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { api } from "../../services/api";
import { useSelfCareStore } from "../../store/selfcare";
import { GoalCard } from "../../components/GoalCard";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

const CATEGORIES = ["health", "social", "mindfulness", "productivity", "creativity"];

export default function Goals() {
  const { user, goals, completedTodayIds, setGoals, setCompletedToday, addCompletedGoal, puppy, updatePuppyXP } = useSelfCareStore();
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("health");

  useEffect(() => {
    loadGoals();
  }, [user]);

  async function loadGoals() {
    if (!user) return;
    try {
      const data: any = await api.getGoals(user.id);
      setGoals(data.goals || []);
      setCompletedToday(data.completed_today || []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(goalId: string) {
    if (!user) return;
    try {
      const result: any = await api.completeGoal(user.id, goalId);
      addCompletedGoal(goalId);
      if (puppy && result.new_total_xp !== undefined) {
        updatePuppyXP(result.new_total_xp, result.level || puppy.level);
      }
    } catch (e: any) {
      if (e.message !== "Goal already completed today") {
        Alert.alert("Error", e.message);
      }
    }
  }

  async function handleAddGoal() {
    if (!newTitle.trim() || !user) return;
    try {
      const goal: any = await api.createGoal(user.id, { title: newTitle, category: newCategory, is_custom: true });
      setGoals([...goals, goal]);
      setNewTitle("");
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  const completed = goals.filter((g) => completedTodayIds.includes(g.id));
  const pending = goals.filter((g) => !completedTodayIds.includes(g.id));
  const completionRate = goals.length > 0 ? Math.round((completed.length / goals.length) * 100) : 0;

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={PEACH} style={{ marginTop: 60 }} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Goals</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{completed.length}/{goals.length} done</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionRate}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{completionRate}% complete today</Text>

        {/* Pending goals */}
        {pending.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>To Do</Text>
            {pending.map((g) => (
              <GoalCard key={g.id} goal={g} isCompleted={false} onComplete={handleComplete} />
            ))}
          </View>
        )}

        {/* Completed goals */}
        {completed.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Completed ✅</Text>
            {completed.map((g) => (
              <GoalCard key={g.id} goal={g} isCompleted={true} onComplete={handleComplete} />
            ))}
          </View>
        )}

        {/* All done! */}
        {completed.length === goals.length && goals.length > 0 && (
          <View style={styles.allDoneCard}>
            <Text style={styles.allDoneEmoji}>🎉</Text>
            <Text style={styles.allDoneTitle}>All done for today!</Text>
            <Text style={styles.allDoneSub}>Your puppy is so proud of you!</Text>
          </View>
        )}

        {/* Add goal */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>{showAdd ? "Cancel" : "+ Add custom goal"}</Text>
        </TouchableOpacity>

        {showAdd && (
          <View style={styles.addCard}>
            <TextInput style={styles.input} placeholder="Goal title..." value={newTitle} onChangeText={setNewTitle} placeholderTextColor="#B8957E" />
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.catBtn, newCategory === c && styles.catBtnSelected]} onPress={() => setNewCategory(c)}>
                  <Text style={[styles.catText, newCategory === c && styles.catTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddGoal}>
              <Text style={styles.saveBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 20, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: BROWN },
  progressBadge: { backgroundColor: PEACH, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  progressText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: "#F0CEBA", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: PEACH, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: "#7A5C58", textAlign: "right" },
  sectionLabel: { fontSize: 16, fontWeight: "700", color: BROWN, marginBottom: 8, marginTop: 4 },
  allDoneCard: { backgroundColor: "#FFF9C4", borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  allDoneEmoji: { fontSize: 48 },
  allDoneTitle: { fontSize: 20, fontWeight: "800", color: BROWN },
  allDoneSub: { fontSize: 14, color: "#7A5C58" },
  addBtn: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: PEACH, borderStyle: "dashed", paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: PEACH, fontWeight: "700", fontSize: 15 },
  addCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, gap: 12, borderWidth: 1.5, borderColor: "#F0CEBA" },
  input: { backgroundColor: CREAM, borderRadius: 12, padding: 14, fontSize: 15, color: BROWN },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: { borderRadius: 20, borderWidth: 1.5, borderColor: "#F0CEBA", paddingHorizontal: 14, paddingVertical: 6 },
  catBtnSelected: { backgroundColor: PEACH, borderColor: PEACH },
  catText: { fontSize: 12, color: BROWN, fontWeight: "600" },
  catTextSelected: { color: "#fff" },
  saveBtn: { backgroundColor: PEACH, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
