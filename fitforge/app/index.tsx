import { Redirect } from "expo-router";
import { useFitForgeStore } from "../store/fitforge";

export default function Index() {
  const user = useFitForgeStore((s) => s.user);
  const profile = useFitForgeStore((s) => s.profile);
  const onboarded = useFitForgeStore((s) => s.hasCompletedOnboarding);

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!onboarded || !profile) return <Redirect href="/(onboarding)/fitness-level" />;
  return <Redirect href="/(tabs)/home" />;
}
