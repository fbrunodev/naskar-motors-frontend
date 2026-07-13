const TOKEN_KEY = 'naskar_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRoleFromToken(): string {
  const token = getToken();
  if (!token) return 'employee';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? 'employee';
  } catch {
    return 'employee';
  }
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
