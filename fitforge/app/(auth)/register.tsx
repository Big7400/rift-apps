import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { api } from "../../services/api";
import { useFitForgeStore } from "../../store/fitforge";

const ORANGE = "#FF4500";
const DARK = "#0D0D0D";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useFitForgeStore((s) => s.setUser);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const data: any = await api.register({ display_name: name, email, password });
      setUser(data.user);
      router.replace("/(onboarding)/fitness-level");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>Let's build your fitness profile</Text>
        <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#555" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#555" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Creating..." : "Create Account"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  scroll: { padding: 28, gap: 14 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 15, color: "#888", marginBottom: 8 },
  input: { backgroundColor: "#1A1A1A", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: "#fff", borderWidth: 1.5, borderColor: "#333" },
  btn: { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", color: "#888", fontWeight: "600", marginTop: 8 },
});
