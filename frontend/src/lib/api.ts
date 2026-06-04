// Minimal typed API client + a try-on polling hook.
// Auth token comes from your Supabase session.
import { useQuery, useMutation } from "@tanstack/react-query";

const API = process.env.NEXT_PUBLIC_API_URL!;

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type TryOn = {
  id: string;
  status: "pending" | "processing" | "done" | "failed";
  result_url: string | null;
  error: string | null;
};

// Kick off a generation.
export function useCreateTryOn(token: string) {
  return useMutation({
    mutationFn: (clothingItemId: string) =>
      api<TryOn>("/try-ons", token, {
        method: "POST",
        body: JSON.stringify({ clothing_item_id: clothingItemId }),
      }),
  });
}

// Poll until done/failed.
export function useTryOn(token: string, id: string | null) {
  return useQuery({
    queryKey: ["tryon", id],
    enabled: !!id,
    queryFn: () => api<TryOn>(`/try-ons/${id}`, token),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "done" || s === "failed" ? false : 2000;
    },
  });
}
