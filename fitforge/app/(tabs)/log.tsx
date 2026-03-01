import { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";
const CARD = "#1A1A1A";

interface SetEntry {
  set_number: number;
  weight_kg: number;
  reps: number;
}

interface ExerciseEntry {
  exercise_name: string;
  exercise_id: string;
  sets: SetEntry[];
}

function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export default function Log() {
  const { user, activePlan, addPR } = useFitForgeStore();
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function addExercise() {
    if (!newExName.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        exercise_name: newExName.trim(),
        exercise_id: `custom_${Date.now()}`,
        sets: [{ set_number: 1, weight_kg: 0, reps: 0 }],
      },
    ]);
    setNewExName("");
    setAddingExercise(false);
  }

  function addSet(exIndex: number) {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      ex.sets = [...ex.sets, { set_number: ex.sets.length + 1, weight_kg: ex.sets[ex.sets.length - 1]?.weight_kg || 0, reps: ex.sets[ex.sets.length - 1]?.reps || 0 }];
      updated[exIndex] = ex;
      return updated;
    });
  }

  function updateSet(exIndex: number, setIndex: number, field: "weight_kg" | "reps", value: string) {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exIndex] };
      ex.sets = ex.sets.map((s, i) => i === setIndex ? { ...s, [field]: parseFloat(value) || 0 } : s);
      updated[exIndex] = ex;
      return updated;
    });
  }

  function removeExercise(exIndex: number) {
    setExercises((prev) => prev.filter((_, i) => i !== exIndex));
  }

  async function saveWorkout() {
    if (!user || exercises.length === 0) {
      Alert.alert("Add at least one exercise before saving.");
      return;
    }
    setSaving(true);
    try {
      await api.logWorkout(user.id, {
        plan_id: activePlan?.id,
        exercises,
        duration_minutes: duration,
        notes,
      });

      // Log PRs for each exercise's best set
      for (const ex of exercises) {
        const bestSet = ex.sets.reduce((best, s) => epley1RM(s.weight_kg, s.reps) > epley1RM(best.weight_kg, best.reps) ? s : best, ex.sets[0]);
        if (bestSet && bestSet.weight_kg > 0 && bestSet.reps > 0) {
          try {
            const pr: any = await api.logPR(user.id, {
              exercise_id: ex.exercise_id,
              exercise_name: ex.exercise_name,
              weight_kg: bestSet.weight_kg,
              reps: bestSet.reps,
            });
            if (pr.is_pr) addPR(pr);
          } catch {}
        }
      }

      Alert.alert("💪 Workout saved!", "Your session has been logged.");
      setExercises([]);
      setNotes("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Log Workout</Text>

        {/* Duration */}
        <View style={styles.durationRow}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationButtons}>
            {[30, 45, 60, 75, 90, 120].map((d) => (
              <TouchableOpacity key={d} style={[styles.durBtn, duration === d && styles.durBtnSelected]} onPress={() => setDuration(d)}>
                <Text style={[styles.durText, duration === d && styles.durTextSelected]}>{d}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercises */}
        {exercises.map((ex, exIdx) => (
          <View key={exIdx} style={styles.exerciseCard}>
            <View style={styles.exHeader}>
              <Text style={styles.exName}>{ex.exercise_name}</Text>
              <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.setHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>Weight (kg)</Text>
              <Text style={styles.setHeaderText}>Reps</Text>
              <Text style={styles.setHeaderText}>1RM est.</Text>
            </View>

            {ex.sets.map((s, setIdx) => (
              <View key={setIdx} style={styles.setRow}>
                <Text style={styles.setNum}>{s.set_number}</Text>
                <TextInput
                  style={styles.setInput}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                  value={s.weight_kg > 0 ? String(s.weight_kg) : ""}
                  onChangeText={(v) => updateSet(exIdx, setIdx, "weight_kg", v)}
                />
                <TextInput
                  style={styles.setInput}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="number-pad"
                  value={s.reps > 0 ? String(s.reps) : ""}
                  onChangeText={(v) => updateSet(exIdx, setIdx, "reps", v)}
                />
                <Text style={styles.estimatedRM}>
                  {s.weight_kg > 0 && s.reps > 0 ? `${epley1RM(s.weight_kg, s.reps)}kg` : "-"}
                </Text>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise */}
        {addingExercise ? (
          <View style={styles.addExCard}>
            <TextInput
              style={styles.addExInput}
              placeholder="Exercise name (e.g. Bench Press)"
              placeholderTextColor="#555"
              value={newExName}
              onChangeText={setNewExName}
              autoFocus
            />
            <View style={styles.addExButtons}>
              <TouchableOpacity style={styles.addExConfirm} onPress={addExercise}>
                <Text style={styles.addExConfirmText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAddingExercise(false)}>
                <Text style={styles.addExCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addExBtn} onPress={() => setAddingExercise(true)}>
            <Text style={styles.addExBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          placeholder="Session notes... (optional)"
          placeholderTextColor="#555"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, (saving || exercises.length === 0) && { opacity: 0.5 }]}
          onPress={saveWorkout}
          disabled={saving || exercises.length === 0}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "💾 Save Workout"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  label: { fontSize: 15, fontWeight: "700", color: "#ccc" },
  durationRow: { gap: 8 },
  durationButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  durBtn: { backgroundColor: CARD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#333" },
  durBtnSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  durText: { color: "#888", fontWeight: "600", fontSize: 13 },
  durTextSelected: { color: "#fff" },
  exerciseCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  exHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exName: { fontSize: 17, fontWeight: "800", color: "#fff" },
  removeBtn: { color: "#555", fontSize: 16 },
  setHeader: { flexDirection: "row", gap: 8 },
  setHeaderText: { flex: 1, fontSize: 11, color: "#555", fontWeight: "700", textAlign: "center" },
  setRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  setNum: { width: 24, textAlign: "center", color: ORANGE, fontWeight: "800", fontSize: 14 },
  setInput: { flex: 1, backgroundColor: "#111", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, color: "#fff", fontSize: 15, textAlign: "center", borderWidth: 1, borderColor: "#333" },
  estimatedRM: { flex: 1, textAlign: "center", color: "#666", fontSize: 12, fontWeight: "600" },
  addSetBtn: { alignSelf: "flex-start" },
  addSetText: { color: ORANGE, fontWeight: "700", fontSize: 14 },
  addExBtn: { backgroundColor: CARD, borderRadius: 14, borderWidth: 1.5, borderColor: ORANGE, borderStyle: "dashed", paddingVertical: 14, alignItems: "center" },
  addExBtnText: { color: ORANGE, fontWeight: "700", fontSize: 15 },
  addExCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: "#333" },
  addExInput: { backgroundColor: "#111", borderRadius: 10, padding: 12, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#333" },
  addExButtons: { flexDirection: "row", gap: 10 },
  addExConfirm: { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, flex: 1, alignItems: "center" },
  addExConfirmText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  addExCancel: { color: "#555", fontWeight: "600", fontSize: 14, paddingVertical: 10 },
  notesInput: { backgroundColor: CARD, borderRadius: 12, padding: 14, color: "#fff", fontSize: 14, minHeight: 56, borderWidth: 1, borderColor: "#333" },
  saveBtn: { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
