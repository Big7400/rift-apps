const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: any) =>
    request(`/auth/register`, { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) =>
    request(`/auth/login`, { method: "POST", body: JSON.stringify(data) }),

  // Profile
  getProfile: (userId: string) => request(`/fitforge/profile/${userId}`),
  upsertProfile: (userId: string, data: any) =>
    request(`/fitforge/profile/${userId}`, { method: "POST", body: JSON.stringify(data) }),

  // Exercises
  getExercises: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request(`/fitforge/exercises${qs ? `?${qs}` : ""}`);
  },

  // PRs
  logPR: (userId: string, data: any) =>
    request(`/fitforge/pr/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  getAllPRs: (userId: string) => request(`/fitforge/prs/${userId}`),
  getExercisePRs: (userId: string, exerciseId: string) =>
    request(`/fitforge/prs/${userId}/${exerciseId}`),

  // Plans
  generatePlan: (userId: string) =>
    request(`/fitforge/plan/generate`, { method: "POST", body: JSON.stringify({ user_id: userId }) }),
  getActivePlan: (userId: string) => request(`/fitforge/plan/${userId}`),

  // Logs
  logWorkout: (userId: string, data: any) =>
    request(`/fitforge/log/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  getWorkoutLogs: (userId: string) => request(`/fitforge/logs/${userId}`),

  // Progress
  getProgress: (userId: string) => request(`/fitforge/progress/${userId}`),

  // Push
  registerPushToken: (data: any) =>
    request(`/notify/register`, { method: "POST", body: JSON.stringify(data) }),
};
