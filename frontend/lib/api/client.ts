/**
 * API client for backend. Adds Authorization header when session exists.
 */

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return '';
  return url.replace(/\/$/, '');
};

/** Extract user-facing message from backend error response. */
function parseErrorDetail(text: string, fallback: string): string {
  try {
    const json = JSON.parse(text);
    return json.error?.message ?? json.detail ?? json.message ?? fallback;
  } catch {
    return text || fallback;
  }
}

export interface ApiClientOptions {
  /** Access token for Authorization header. If not provided, no auth header is sent. */
  accessToken?: string | null;
  /** Custom base URL. Defaults to NEXT_PUBLIC_API_URL. */
  baseUrl?: string;
}

/**
 * Fetch wrapper that adds base URL and optional Authorization header.
 */
export async function apiFetch(
  path: string,
  options: RequestInit & ApiClientOptions = {}
): Promise<Response> {
  const { accessToken, baseUrl, ...fetchOptions } = options;
  const base = baseUrl ?? getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}/api/v1${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(fetchOptions.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

/**
 * GET request. Returns parsed JSON or throws.
 */
export async function apiGet<T = unknown>(
  path: string,
  accessToken?: string | null
): Promise<T> {
  const res = await apiFetch(path, { method: 'GET', accessToken });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text, `Request failed: ${res.status}`));
  }
  return res.json() as Promise<T>;
}

/**
 * POST request. Returns parsed JSON or throws.
 */
export async function apiPost<T = unknown>(
  path: string,
  body?: object,
  accessToken?: string | null
): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    accessToken,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text, `Request failed: ${res.status}`));
  }
  return res.json() as Promise<T>;
}

/**
 * PATCH request. Returns parsed JSON or throws.
 */
export async function apiPatch<T = unknown>(
  path: string,
  body?: object,
  accessToken?: string | null
): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
    accessToken,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text, `Request failed: ${res.status}`));
  }
  return res.json() as Promise<T>;
}

/**
 * Upload profile picture. Sends multipart/form-data with the file.
 * Returns the updated user data including profile_picture_url.
 */
export async function apiUploadProfilePicture(
  file: File,
  accessToken: string
): Promise<{ data: { profile_picture_url?: string | null } }> {
  const base = getBaseUrl();
  const url = `${base}/api/v1/users/me/profile-picture`;

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text, `Upload failed: ${res.status}`));
  }
  return res.json();
}

/**
 * DELETE request. Returns void or throws.
 */
export async function apiDelete(
  path: string,
  accessToken?: string | null
): Promise<void> {
  const res = await apiFetch(path, { method: 'DELETE', accessToken });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text, `Request failed: ${res.status}`));
  }
}
