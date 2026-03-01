import { View, Text, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

const BREED_EMOJIS: Record<string, string> = {
  corgi: "🐕",
  labrador: "🦮",
  husky: "🐺",
  poodle: "🐩",
  dalmatian: "🐾",
};

const LEVEL_AURAS: Record<number, string> = {
  1: "#FFF8F0",
  5: "#FFE4CC",
  10: "#FFCBA4",
  20: "#FFB085",
  50: "#FF8C69",
};

function getAura(level: number): string {
  const thresholds = [50, 20, 10, 5, 1];
  for (const t of thresholds) {
    if (level >= t) return LEVEL_AURAS[t];
  }
  return LEVEL_AURAS[1];
}

interface Props {
  breed: string;
  level: number;
  name: string;
  size?: "small" | "medium" | "large";
  animated?: boolean;
}

export function PuppyAvatar({ breed, level, name, size = "large", animated = true }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [animated]);

  const sizes = { small: 48, medium: 80, large: 140 };
  const fontSize = { small: 28, medium: 48, large: 90 };
  const emoji = BREED_EMOJIS[breed] || "🐶";
  const aura = getAura(level);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            width: sizes[size],
            height: sizes[size],
            borderRadius: sizes[size] / 2,
            backgroundColor: aura,
            transform: animated ? [{ translateY: bounce }] : [],
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: fontSize[size] }]}>{emoji}</Text>
      </Animated.View>
      {size !== "small" && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv {level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  avatarContainer: { justifyContent: "center", alignItems: "center", shadowColor: "#FF8C69", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  emoji: { textAlign: "center" },
  levelBadge: { marginTop: 8, backgroundColor: "#FF8C69", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  levelText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
