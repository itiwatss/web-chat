import axios from "axios";

export const api = axios.create({
  headers: { "Cache-Control": "no-cache" },
});

export function onUnauthorized(handler: () => void): () => void {
  const id = api.interceptors.response.use(undefined, (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) handler();
    return Promise.reject(err);
  });
  return () => api.interceptors.response.eject(id);
}

export function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) return err.response?.data?.error ?? fallback;
  return err instanceof Error ? err.message : fallback;
}

export const isUnauthorized = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 401;
