import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../services/api";
import { useSelfCareStore } from "../../store/selfcare";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

const BREEDS = [
  { id: "corgi", emoji: "🐕", label: "Corgi" },
  { id: "labrador", emoji: "🦮", label: "Labrador" },
  { id: "husky", emoji: "🐺", label: "Husky" },
  { id: "poodle", emoji: "🐩", label: "Poodle" },
  { id: "dalmatian", emoji: "🐾", label: "Dalmatian" },
];

const COLORS = [
  { id: "golden", label: "Golden", hex: "#F5C869" },
  { id: "brown", label: "Brown", hex: "#8B5E3C" },
  { id: "black", label: "Black", hex: "#2D2D2D" },
  { id: "white", label: "White", hex: "#F5F0E8" },
  { id: "spotted", label: "Spotted", hex: "#D4A96A" },
];

export default function CreatePuppy() {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("corgi");
  const [color, setColor] = useState("golden");
  const [loading, setLoading] = useState(false);
  const { user, setPuppy } = useSelfCareStore();

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your puppy a name!");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const puppy = await api.createPuppy(user.id, { name, breed, color }) as any;
      setPuppy(puppy);
      router.replace("/(onboarding)/pick-goals");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Meet your new puppy! 🐶</Text>
        <Text style={styles.sub}>Customize them before we get started.</Text>

        <Text style={styles.label}>Give them a name</Text>
        <TextInput style={styles.input} placeholder="Puppy name..." value={name} onChangeText={setName} maxLength={20} placeholderTextColor="#B8957E" />

        <Text style={styles.label}>Pick a breed</Text>
        <View style={styles.row}>
          {BREEDS.map((b) => (
            <TouchableOpacity key={b.id} style={[styles.breedCard, breed === b.id && styles.selectedCard]} onPress={() => setBreed(b.id)}>
              <Text style={styles.breedEmoji}>{b.emoji}</Text>
              <Text style={[styles.breedLabel, breed === b.id && styles.selectedLabel]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Pick a coat color</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setColor(c.id)}>
              <View style={[styles.colorCircle, { backgroundColor: c.hex }, color === c.id && styles.selectedCircle]} />
              <Text style={styles.colorLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Creating..." : "Meet " + (name || "your pup") + "! →"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: "800", color: BROWN, textAlign: "center" },
  sub: { fontSize: 15, color: "#7A5C58", textAlign: "center", marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "700", color: BROWN, marginTop: 8 },
  input: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: BROWN, borderWidth: 1.5, borderColor: "#F0CEBA" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  breedCard: { borderRadius: 14, borderWidth: 2, borderColor: "#F0CEBA", padding: 12, alignItems: "center", backgroundColor: "#fff", minWidth: 70 },
  selectedCard: { borderColor: PEACH, backgroundColor: "#FFF0EA" },
  breedEmoji: { fontSize: 28 },
  breedLabel: { fontSize: 12, color: BROWN, marginTop: 4, fontWeight: "600" },
  selectedLabel: { color: PEACH },
  colorRow: { flexDirection: "row", gap: 14 },
  colorCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#E8D5C4" },
  selectedCircle: { borderColor: PEACH, borderWidth: 3 },
  colorLabel: { fontSize: 11, textAlign: "center", color: BROWN, marginTop: 4, fontWeight: "500" },
  btn: { backgroundColor: PEACH, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 16 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
