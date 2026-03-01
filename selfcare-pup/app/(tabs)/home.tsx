import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { api } from "../../services/api";
import { useSelfCareStore } from "../../store/selfcare";
import { PuppyAvatar } from "../../components/PuppyAvatar";
import { XPBar } from "../../components/XPBar";
import { MoodSlider } from "../../components/MoodSlider";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

export default function Home() {
  const { user, puppy, checkedInToday, todayMood, setCheckedIn, updatePuppyXP } = useSelfCareStore();
  const [mood, setMood] = useState(7);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getTodaysCheckin(user.id).then((data: any) => {
      if (data.checked_in) setCheckedIn(true, data.data?.mood_score);
    }).catch(() => {});
  }, [user]);

  async function handleCheckin() {
    if (!user) return;
    setLoading(true);
    try {
      await api.checkin(user.id, { mood_score: mood, note });
      setCheckedIn(true, mood);
      setShowCheckin(false);
      if (puppy) updatePuppyXP(puppy.xp + 10, puppy.level);
      Alert.alert("✅ Checked in!", `Your puppy is happy! +10 XP`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()}, {user?.display_name?.split(" ")[0]} 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
        </View>

        {/* Puppy */}
        {puppy && (
          <View style={styles.puppySection}>
            <PuppyAvatar breed={puppy.breed} level={puppy.level} name={puppy.name} size="large" />
            <Text style={styles.puppyName}>{puppy.name}</Text>
            <XPBar xp={puppy.xp} xpToNext={puppy.xp_to_next_level} level={puppy.level} />
          </View>
        )}

        {/* Check-in prompt */}
        {!checkedInToday && !showCheckin && (
          <TouchableOpacity style={styles.checkinPrompt} onPress={() => setShowCheckin(true)}>
            <Text style={styles.checkinEmoji}>🌤</Text>
            <View>
              <Text style={styles.checkinTitle}>Daily check-in</Text>
              <Text style={styles.checkinSub}>How are you feeling today?</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Check-in card */}
        {showCheckin && !checkedInToday && (
          <View style={styles.checkinCard}>
            <MoodSlider value={mood} onChange={setMood} />
            <TextInput
              style={styles.noteInput}
              placeholder="Optional note... (what's on your mind?)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
              placeholderTextColor="#B8957E"
            />
            <TouchableOpacity style={[styles.checkinBtn, loading && { opacity: 0.6 }]} onPress={handleCheckin} disabled={loading}>
              <Text style={styles.checkinBtnText}>{loading ? "Saving..." : "Save check-in ✨"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Already checked in */}
        {checkedInToday && (
          <View style={styles.checkedInBadge}>
            <Text style={styles.checkedInText}>✅ Checked in today</Text>
            {todayMood !== null && (
              <Text style={styles.moodDisplay}>Mood: {todayMood}/10</Text>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            Complete goals to earn XP and level up {puppy?.name || "your puppy"}. Head to the Goals tab to get started!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 20, gap: 20 },
  header: { gap: 4 },
  greeting: { fontSize: 22, fontWeight: "800", color: BROWN },
  date: { fontSize: 14, color: "#7A5C58" },
  puppySection: { alignItems: "center", backgroundColor: "#fff", borderRadius: 24, padding: 24, gap: 12, borderWidth: 1.5, borderColor: "#F0CEBA" },
  puppyName: { fontSize: 22, fontWeight: "800", color: BROWN },
  checkinPrompt: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 20, padding: 18, gap: 14, borderWidth: 1.5, borderColor: "#F0CEBA" },
  checkinEmoji: { fontSize: 32 },
  checkinTitle: { fontSize: 16, fontWeight: "700", color: BROWN },
  checkinSub: { fontSize: 13, color: "#7A5C58" },
  arrow: { fontSize: 20, color: PEACH, marginLeft: "auto" },
  checkinCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, gap: 14, borderWidth: 1.5, borderColor: "#F0CEBA" },
  noteInput: { backgroundColor: CREAM, borderRadius: 12, padding: 14, fontSize: 14, color: BROWN, minHeight: 56 },
  checkinBtn: { backgroundColor: PEACH, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  checkinBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  checkedInBadge: { backgroundColor: "#E8F5E9", borderRadius: 16, padding: 16, gap: 4, alignItems: "center" },
  checkedInText: { fontSize: 16, fontWeight: "700", color: "#2E7D32" },
  moodDisplay: { fontSize: 14, color: "#4CAF50" },
  tipCard: { flexDirection: "row", backgroundColor: "#FFF3E0", borderRadius: 16, padding: 16, gap: 12, alignItems: "flex-start" },
  tipEmoji: { fontSize: 22 },
  tipText: { flex: 1, fontSize: 14, color: "#7A5C58", lineHeight: 20 },
});
