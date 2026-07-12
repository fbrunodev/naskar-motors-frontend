import type { StoreSettings, Vehicle, VehicleCreate, VehicleFilters, User, Brand, VehicleModel, EmployeeStats } from '@/types';
import { removeToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function jsonAuthHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== 'undefined') {
    removeToken();
    window.location.href = '/admin/login';
  }
  return res;
}

export async function login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Credenciais inválidas');
  return res.json();
}

export async function getMe(token: string): Promise<User> {
  const res = await apiFetch(`${API_URL}/auth/me`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Não autorizado');
  return res.json();
}

export async function getSettings(): Promise<StoreSettings> {
  const res = await fetch(`${API_URL}/settings/`);
  if (!res.ok) throw new Error('Falha ao buscar configurações');
  return res.json();
}

export async function getVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.brand) params.set('brand', filters.brand);
  if (filters?.min_price != null) params.set('min_price', String(filters.min_price));
  if (filters?.max_price != null) params.set('max_price', String(filters.max_price));
  if (filters?.include_sold) params.set('include_sold', 'true');
  const query = params.size ? `?${params.toString()}` : '';
  const res = await fetch(`${API_URL}/vehicles/${query}`);
  if (!res.ok) throw new Error('Falha ao buscar veículos');
  return res.json();
}

export async function getVehicle(id: number): Promise<Vehicle> {
  const res = await fetch(`${API_URL}/vehicles/${id}`);
  if (!res.ok) throw new Error('Veículo não encontrado');
  return res.json();
}

export async function createVehicle(data: VehicleCreate, token: string): Promise<Vehicle> {
  const res = await apiFetch(`${API_URL}/vehicles/`, {
    method: 'POST',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar veículo');
  return res.json();
}

export async function updateVehicle(id: number, data: VehicleCreate, token: string): Promise<Vehicle> {
  const res = await apiFetch(`${API_URL}/vehicles/${id}`, {
    method: 'PUT',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar veículo');
  return res.json();
}

export async function deleteVehicle(id: number, token: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/vehicles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao excluir veículo');
}

export async function markVehicleSold(id: number, token: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/vehicles/${id}/sold`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao marcar como vendido');
}

export async function uploadPhoto(vehicleId: number, file: File, token: string): Promise<{ url: string; photos: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch(`${API_URL}/uploads/vehicle/${vehicleId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) throw new Error('Falha ao enviar foto');
  return res.json();
}

export async function getBrands(category?: string): Promise<Brand[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API_URL}/brands/${query}`);
  if (!res.ok) throw new Error('Falha ao buscar marcas');
  return res.json();
}

export async function getModelsByBrand(brandId: number): Promise<VehicleModel[]> {
  const res = await fetch(`${API_URL}/brands/${brandId}/models`);
  if (!res.ok) throw new Error('Falha ao buscar modelos');
  return res.json();
}

export async function updateSettings(
  data: { name: string; whatsapp?: string | null; city?: string | null; primary_color?: string; secondary_color?: string; commission_rate?: number },
  token: string
): Promise<StoreSettings> {
  const res = await apiFetch(`${API_URL}/settings/`, {
    method: 'PUT',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar configurações');
  return res.json();
}

export async function uploadLogo(file: File, token: string): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch(`${API_URL}/uploads/logo`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) throw new Error('Falha ao enviar logo');
  return res.json();
}

export async function getUsers(token: string): Promise<User[]> {
  const res = await apiFetch(`${API_URL}/users/`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Falha ao buscar usuários');
  return res.json();
}

export async function createUser(data: { name: string; email: string; password: string }, token: string): Promise<User> {
  const res = await apiFetch(`${API_URL}/users/`, {
    method: 'POST',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar usuário');
  return res.json();
}

export async function deleteUser(id: number, token: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao remover usuário');
}

export async function updateMe(
  data: { name?: string; email?: string; current_password?: string; new_password?: string },
  token: string
): Promise<User> {
  const res = await apiFetch(`${API_URL}/users/me`, {
    method: 'PUT',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Falha ao atualizar conta');
  }
  return res.json();
}

export async function updateEmployeeGoal(userId: number, goal: number, token: string): Promise<User> {
  const res = await apiFetch(`${API_URL}/users/${userId}/goal`, {
    method: 'PATCH',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ monthly_goal: goal }),
  });
  if (!res.ok) throw new Error('Falha ao atualizar meta');
  return res.json();
}

export async function getMyStats(token: string): Promise<EmployeeStats> {
  const res = await apiFetch(`${API_URL}/users/me/stats`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Falha ao buscar estatísticas');
  return res.json();
}

export async function sendNotificationToUser(userId: number, message: string, token: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/notifications/send-to-user/${userId}`, {
    method: 'POST',
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Falha ao enviar notificação');
}

export async function deletePhoto(vehicleId: number, photoUrl: string, token: string): Promise<{ photos: string[] }> {
  const params = new URLSearchParams({ photo_url: photoUrl });
  const res = await apiFetch(`${API_URL}/uploads/vehicle/${vehicleId}/photo?${params}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Falha ao remover foto');
  return res.json();
}
