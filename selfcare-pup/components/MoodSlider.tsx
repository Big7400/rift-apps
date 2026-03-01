import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const MOODS = [
  { value: 1, emoji: "🌧", label: "Rough" },
  { value: 3, emoji: "🌥", label: "Meh" },
  { value: 5, emoji: "⛅", label: "Okay" },
  { value: 7, emoji: "🌤", label: "Good" },
  { value: 9, emoji: "☀️", label: "Great" },
  { value: 10, emoji: "🌈", label: "Amazing" },
];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function MoodSlider({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>How are you feeling today?</Text>
      <View style={styles.moods}>
        {MOODS.map((m) => {
          const isSelected = value === m.value;
          const isClose = Math.abs(value - m.value) <= 1;
          return (
            <TouchableOpacity
              key={m.value}
              style={[styles.moodBtn, isSelected && styles.selectedBtn]}
              onPress={() => onChange(m.value)}
            >
              <Text style={[styles.moodEmoji, isSelected && styles.bigEmoji]}>{m.emoji}</Text>
              {isSelected && <Text style={styles.moodLabel}>{m.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  question: { fontSize: 16, fontWeight: "700", color: "#4A2C2A", textAlign: "center" },
  moods: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end" },
  moodBtn: { alignItems: "center", padding: 8, borderRadius: 16, minWidth: 44 },
  selectedBtn: { backgroundColor: "#FFF0EA" },
  moodEmoji: { fontSize: 28 },
  bigEmoji: { fontSize: 36 },
  moodLabel: { fontSize: 10, color: "#FF8C69", fontWeight: "700", marginTop: 4 },
});
