// Shared API client for the Eryviled React workspace.
// GitHub Pages serves the frontend only; production API calls require a separately hosted backend URL.
const normalizeBase = (value) => {
  let base = String(value || '').trim();
  while (base.endsWith('/')) base = base.slice(0, -1);
  return base;
};

export function getApiBase() {
  try {
    return normalizeBase(window.localStorage.getItem('eryviledApiBase') || import.meta.env.VITE_API_BASE_URL || '');
  } catch {
    return normalizeBase(import.meta.env.VITE_API_BASE_URL || '');
  }
}

export default async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const isApiPath = typeof path === 'string' && path.startsWith('/api/');
  const onGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

  if (isApiPath && onGitHubPages && !base) {
    throw new Error('Backend URL is not configured. In the workspace header, enter the deployed Eryviled backend base URL (the server that exposes /api/health), then click Save.');
  }

  const url = isApiPath && base ? base + path : path;
  const response = await window.fetch(url, options);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('application/json')) {
    const body = (await response.text()).slice(0, 120).replaceAll('\n', ' ').replaceAll('\r', ' ').replaceAll('\t', ' ').trim();
    throw new Error(`API returned non-JSON content (HTTP ${response.status}) for ${path}. ${body.startsWith('<') ? 'This usually means the URL points to the frontend/static host, not the backend API.' : body}`);
  }

  if (!response.ok) {
    const payload = await response.clone().json().catch(() => ({}));
    throw new Error(payload.error || `API request failed (HTTP ${response.status}) for ${path}`);
  }

  return response;
}
