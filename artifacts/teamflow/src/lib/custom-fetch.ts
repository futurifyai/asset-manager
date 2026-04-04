export type ErrorType<ErrorData> = ErrorData;
export type BodyType<BodyData> = BodyData;

export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const token = localStorage.getItem("teamflow_token");
  
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData;
  }

  return response.json();
};