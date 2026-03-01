import { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { api } from "../../services/api";
import { useSelfCareStore } from "../../store/selfcare";
import { PuppyAvatar } from "../../components/PuppyAvatar";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

export default function DogPark() {
  const { user } = useSelfCareStore();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");

  useEffect(() => {
    loadFriends();
  }, [user]);

  async function loadFriends() {
    if (!user) return;
    try {
      const data: any = await api.getFriends(user.id);
      setFriends(data.friends || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend() {
    if (!friendEmail.trim() || !user) return;
    try {
      await api.addFriend(user.id, friendEmail);
      Alert.alert("Request sent! 🐾", `Friend request sent to ${friendEmail}`);
      setFriendEmail("");
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={PEACH} style={{ marginTop: 60 }} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🌳 Dog Park</Text>
        <Text style={styles.sub}>See how your friends' puppies are doing</Text>

        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌳</Text>
            <Text style={styles.emptyTitle}>Your park is empty</Text>
            <Text style={styles.emptySub}>Add friends to see their puppies here and cheer each other on!</Text>
          </View>
        ) : (
          <View style={styles.friendsGrid}>
            {friends.map((f) => (
              <View key={f.user_id} style={styles.friendCard}>
                <PuppyAvatar breed={f.puppy.breed} level={f.puppy.level} name={f.puppy.name} size="medium" />
                <Text style={styles.friendPuppyName}>{f.puppy.name}</Text>
                <Text style={styles.friendName}>{f.display_name}</Text>
                <View style={styles.levelBadgeSmall}>
                  <Text style={styles.levelBadgeText}>Lv {f.puppy.level}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addFriendBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addFriendText}>{showAdd ? "Cancel" : "🐾 Add a friend"}</Text>
        </TouchableOpacity>

        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addCardTitle}>Invite a friend</Text>
            <TextInput
              style={styles.input}
              placeholder="Their email address"
              value={friendEmail}
              onChangeText={setFriendEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#B8957E"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleAddFriend}>
              <Text style={styles.sendBtnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: "800", color: BROWN },
  sub: { fontSize: 14, color: "#7A5C58" },
  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: BROWN },
  emptySub: { fontSize: 14, color: "#7A5C58", textAlign: "center", lineHeight: 20 },
  friendsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  friendCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: "#F0CEBA", flex: 1, minWidth: "45%" },
  friendPuppyName: { fontSize: 16, fontWeight: "800", color: BROWN },
  friendName: { fontSize: 12, color: "#7A5C58" },
  levelBadgeSmall: { backgroundColor: "#FFF0EA", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  levelBadgeText: { color: PEACH, fontWeight: "700", fontSize: 12 },
  addFriendBtn: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: PEACH, borderStyle: "dashed", paddingVertical: 14, alignItems: "center" },
  addFriendText: { color: PEACH, fontWeight: "700", fontSize: 15 },
  addCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, gap: 12, borderWidth: 1.5, borderColor: "#F0CEBA" },
  addCardTitle: { fontSize: 16, fontWeight: "700", color: BROWN },
  input: { backgroundColor: CREAM, borderRadius: 12, padding: 14, fontSize: 15, color: BROWN, borderWidth: 1, borderColor: "#F0CEBA" },
  sendBtn: { backgroundColor: PEACH, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
