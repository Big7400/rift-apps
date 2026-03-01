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

// Auth
export const api = {
  // Puppy
  createPuppy: (userId: string, data: any) =>
    request(`/selfcare/puppy/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  getPuppy: (userId: string) =>
    request(`/selfcare/puppy/${userId}`),
  customizePuppy: (userId: string, data: any) =>
    request(`/selfcare/puppy/${userId}/customize`, { method: "PATCH", body: JSON.stringify(data) }),

  // Check-in
  checkin: (userId: string, data: any) =>
    request(`/selfcare/checkin/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  getTodaysCheckin: (userId: string) =>
    request(`/selfcare/checkin/${userId}/today`),

  // Goals
  getGoals: (userId: string) =>
    request(`/selfcare/goals/${userId}`),
  createGoal: (userId: string, data: any) =>
    request(`/selfcare/goals/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  completeGoal: (userId: string, goalId: string) =>
    request(`/selfcare/goals/${userId}/complete/${goalId}`, { method: "POST" }),
  deleteGoal: (userId: string, goalId: string) =>
    request(`/selfcare/goals/${userId}/${goalId}`, { method: "DELETE" }),

  // Activities
  logActivity: (userId: string, data: any) =>
    request(`/selfcare/activity/${userId}`, { method: "POST", body: JSON.stringify(data) }),

  // Insights
  getInsights: (userId: string) =>
    request(`/selfcare/insights/${userId}`),

  // Friends
  addFriend: (userId: string, email: string) =>
    request(`/selfcare/friends/${userId}/add`, { method: "POST", body: JSON.stringify({ friend_email: email }) }),
  getFriends: (userId: string) =>
    request(`/selfcare/friends/${userId}`),

  // Push
  registerPushToken: (data: any) =>
    request(`/notify/register`, { method: "POST", body: JSON.stringify(data) }),
};
