export type ErrorType<ErrorData> = ErrorData;
export type BodyType<BodyData> = BodyData;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const token = localStorage.getItem("teamflow_token");
  
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData;
  }
  return response.json();
};