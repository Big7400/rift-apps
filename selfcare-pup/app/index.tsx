import { Redirect } from "expo-router";
import { useSelfCareStore } from "../store/selfcare";

export default function Index() {
  const user = useSelfCareStore((s) => s.user);
  const puppy = useSelfCareStore((s) => s.puppy);

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!puppy) return <Redirect href="/(onboarding)/create-puppy" />;
  return <Redirect href="/(tabs)/home" />;
}
