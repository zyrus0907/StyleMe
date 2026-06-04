// Typed API client for the StyleMe FastAPI backend.
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

// ---- Photos ----
export type Presign = { path: string; signed_url: string; token: string };
export const presignPhoto = (token: string, ext = "jpg") =>
  api<Presign>("/photos/presign", token, {
    method: "POST",
    body: JSON.stringify({ ext }),
  });

export const confirmPhoto = (token: string, path: string) =>
  api<{ id: string; read_url: string }>("/photos/confirm", token, {
    method: "POST",
    body: JSON.stringify({ path }),
  });

// ---- Profile ----
export const setCanonical = (token: string, canonicalPhotoId: string, displayName?: string) =>
  api("/profiles", token, {
    method: "POST",
    body: JSON.stringify({ canonical_photo_id: canonicalPhotoId, display_name: displayName }),
  });

// ---- Clothing ----
export const presignGarment = (token: string, ext = "jpg") =>
  api<Presign>("/clothing/presign", token, {
    method: "POST",
    body: JSON.stringify({ ext }),
  });

export const createClothing = (
  token: string,
  data: { path?: string; external_url?: string; category?: string; name?: string }
) => api<{ id: string }>("/clothing", token, { method: "POST", body: JSON.stringify(data) });

// ---- Try-ons ----
export type TryOn = {
  id: string;
  status: "pending" | "processing" | "done" | "failed";
  result_url: string | null;
  error: string | null;
};
export const createTryOn = (token: string, clothingItemId: string) =>
  api<TryOn>("/try-ons", token, {
    method: "POST",
    body: JSON.stringify({ clothing_item_id: clothingItemId }),
  });
export const getTryOn = (token: string, id: string) => api<TryOn>(`/try-ons/${id}`, token);
