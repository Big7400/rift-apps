import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Animated, Alert } from "react-native";
import { api } from "../../services/api";
import { useSelfCareStore } from "../../store/selfcare";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

const ACTIVITIES = [
  { id: "breathing", title: "Breathing Exercise", emoji: "🫁", desc: "A calming 4-7-8 breathing session", xp: 15, duration: 60 },
  { id: "journal", title: "Journaling", emoji: "📓", desc: "Reflect on your day and feelings", xp: 20, duration: 300 },
  { id: "quiz", title: "Mood Quiz", emoji: "🧠", desc: "A short quiz to understand your emotions", xp: 15, duration: 120 },
  { id: "timer", title: "Focus Timer", emoji: "⏱", desc: "25-minute Pomodoro focus session", xp: 30, duration: 1500 },
  { id: "kindness", title: "Act of Kindness", emoji: "💝", desc: "A suggestion to brighten someone's day", xp: 20, duration: 60 },
];

const BREATHING_PHASES = [
  { label: "Breathe In", duration: 4, color: "#81C784" },
  { label: "Hold", duration: 7, color: "#FFB74D" },
  { label: "Breathe Out", duration: 8, color: "#64B5F6" },
];

export default function Activities() {
  const { user, updatePuppyXP, puppy } = useSelfCareStore();
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const breathAnim = useRef(new Animated.Value(0.5)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (activeActivity === "breathing") {
      runBreathingCycle();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeActivity, breathPhase]);

  function runBreathingCycle() {
    const phase = BREATHING_PHASES[breathPhase];
    const toValue = breathPhase === 0 ? 1 : breathPhase === 2 ? 0.5 : 1;
    Animated.timing(breathAnim, {
      toValue,
      duration: phase.duration * 1000,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      const next = (breathPhase + 1) % BREATHING_PHASES.length;
      if (next === 0) {
        const newCount = breathCount + 1;
        setBreathCount(newCount);
        if (newCount >= 3) {
          finishActivity("breathing", 60);
          return;
        }
      }
      setBreathPhase(next);
    }, phase.duration * 1000);
  }

  async function finishActivity(type: string, duration: number) {
    if (!user) return;
    setActiveActivity(null);
    setBreathPhase(0);
    setBreathCount(0);
    try {
      const result: any = await api.logActivity(user.id, { activity_type: type, duration_seconds: duration });
      if (puppy && result.new_total_xp !== undefined) {
        updatePuppyXP(result.new_total_xp, result.level || puppy.level);
      }
      Alert.alert("Great job! 🎉", `Activity complete! +${result.xp_earned || 15} XP earned`);
    } catch {}
  }

  if (activeActivity === "breathing") {
    const phase = BREATHING_PHASES[breathPhase];
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.breathTitle}>Breathing Exercise</Text>
        <Text style={styles.breathRound}>Round {breathCount + 1}/3</Text>
        <Animated.View style={[styles.breathCircle, { backgroundColor: phase.color, transform: [{ scale: breathAnim }] }]}>
          <Text style={styles.breathLabel}>{phase.label}</Text>
          <Text style={styles.breathSecs}>{phase.duration}s</Text>
        </Animated.View>
        <TouchableOpacity style={styles.stopBtn} onPress={() => { if (timerRef.current) clearTimeout(timerRef.current); setActiveActivity(null); }}>
          <Text style={styles.stopBtnText}>Stop</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.sub}>Complete activities to earn XP for your puppy</Text>

        {ACTIVITIES.map((a) => (
          <TouchableOpacity key={a.id} style={styles.activityCard} onPress={() => {
            if (a.id === "breathing") {
              setBreathCount(0);
              setBreathPhase(0);
              setActiveActivity("breathing");
            } else {
              // For non-interactive activities, just log and award XP
              finishActivity(a.id, a.duration);
            }
          }}>
            <Text style={styles.actEmoji}>{a.emoji}</Text>
            <View style={styles.actInfo}>
              <Text style={styles.actTitle}>{a.title}</Text>
              <Text style={styles.actDesc}>{a.desc}</Text>
            </View>
            <View style={styles.actXP}>
              <Text style={styles.actXPText}>+{a.xp} XP</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: "800", color: BROWN },
  sub: { fontSize: 14, color: "#7A5C58" },
  activityCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, padding: 16, gap: 14, borderWidth: 1.5, borderColor: "#F0CEBA" },
  actEmoji: { fontSize: 32 },
  actInfo: { flex: 1, gap: 4 },
  actTitle: { fontSize: 16, fontWeight: "700", color: BROWN },
  actDesc: { fontSize: 13, color: "#7A5C58" },
  actXP: { backgroundColor: "#FFF0EA", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  actXPText: { color: PEACH, fontWeight: "700", fontSize: 13 },
  // Breathing screen
  breathTitle: { fontSize: 24, fontWeight: "800", color: BROWN, marginBottom: 8 },
  breathRound: { fontSize: 16, color: "#7A5C58", marginBottom: 40 },
  breathCircle: { width: 220, height: 220, borderRadius: 110, justifyContent: "center", alignItems: "center", marginBottom: 48 },
  breathLabel: { fontSize: 20, fontWeight: "800", color: "#fff" },
  breathSecs: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  stopBtn: { borderRadius: 14, borderWidth: 2, borderColor: PEACH, paddingHorizontal: 32, paddingVertical: 12 },
  stopBtnText: { color: PEACH, fontWeight: "700", fontSize: 15 },
});
