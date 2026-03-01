import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRef, useEffect } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  health: "#4CAF50",
  social: "#2196F3",
  mindfulness: "#9C27B0",
  productivity: "#FF9800",
  creativity: "#E91E63",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  health: "💚",
  social: "💙",
  mindfulness: "💜",
  productivity: "🧡",
  creativity: "💗",
};

interface Props {
  goal: { id: string; title: string; category: string; xp_reward: number };
  isCompleted: boolean;
  onComplete: (id: string) => void;
}

export function GoalCard({ goal, isCompleted, onComplete }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const color = CATEGORY_COLORS[goal.category] || "#888";
  const emoji = CATEGORY_EMOJIS[goal.category] || "⭐";

  function handlePress() {
    if (isCompleted) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => onComplete(goal.id));
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isCompleted && styles.completedCard]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, isCompleted && styles.completedTitle]}>{goal.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.categoryText}>{emoji} {goal.category}</Text>
            <Text style={styles.xp}>+{goal.xp_reward} XP</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 14, borderWidth: 1.5, borderColor: "#F0CEBA", marginBottom: 10 },
  completedCard: { backgroundColor: "#F9FBF9", borderColor: "#C8E6C9", opacity: 0.85 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#F0CEBA", justifyContent: "center", alignItems: "center" },
  checkedBox: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  checkmark: { color: "#fff", fontWeight: "800", fontSize: 14 },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "600", color: "#4A2C2A" },
  completedTitle: { textDecorationLine: "line-through", color: "#9E9E9E" },
  meta: { flexDirection: "row", justifyContent: "space-between" },
  categoryText: { fontSize: 12, color: "#7A5C58" },
  xp: { fontSize: 12, fontWeight: "700", color: "#FF8C69" },
});
