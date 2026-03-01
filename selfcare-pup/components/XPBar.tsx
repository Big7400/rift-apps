import { View, Text, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface Props {
  xp: number;
  xpToNext: number;
  level: number;
}

export function XPBar({ xp, xpToNext, level }: Props) {
  const progress = Math.min(xp / xpToNext, 1);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{xp} / {xpToNext} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labels: { flexDirection: "row", justifyContent: "space-between" },
  levelText: { fontSize: 13, fontWeight: "700", color: "#4A2C2A" },
  xpText: { fontSize: 12, color: "#7A5C58" },
  track: { height: 10, backgroundColor: "#F0CEBA", borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#FF8C69", borderRadius: 5 },
});
