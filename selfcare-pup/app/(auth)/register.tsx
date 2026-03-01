import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSelfCareStore } from "../../store/selfcare";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useSelfCareStore((s) => s.setUser);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      setUser(data.user);
      router.replace("/(onboarding)/create-puppy");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🐶</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>Then we'll create your puppy!</Text>

        <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} placeholderTextColor="#B8957E" />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#B8957E" />
        <TextInput style={styles.input} placeholder="Password (min 6 chars)" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#B8957E" />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Creating account..." : "Create Account"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: 28, gap: 14 },
  emoji: { fontSize: 60, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: BROWN, textAlign: "center" },
  sub: { fontSize: 15, color: "#7A5C58", textAlign: "center", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: BROWN, borderWidth: 1.5, borderColor: "#F0CEBA" },
  btn: { backgroundColor: PEACH, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", color: PEACH, fontWeight: "600", marginTop: 8 },
});
