export interface Brand {
  id: number;
  name: string;
  logo_url?: string | null;
}

export interface VehicleModel {
  id: number;
  name: string;
  brand_id: number;
}

export interface StoreSettings {
  id: number;
  name: string;
  logo_url: string | null;
  whatsapp: string | null;
  city: string | null;
  primary_color: string;
  secondary_color: string;
  commission_rate?: number;
}

export interface Vehicle {
  id: number;
  category: string;
  brand: string;
  model: string;
  year: string;
  km: number;
  price: number;
  color: string | null;
  description: string | null;
  photos: string[];
  is_featured: boolean;
  is_sold: boolean;
  created_at: string;
  transmission: string | null;
  fuel: string | null;
  doors: number | null;
  body_type: string | null;
  cilindrada?: number | null;
  marchas?: number | null;
  motor_type?: string | null;
  cooling?: string | null;
  moto_style?: string | null;
  starter?: string | null;
  front_brake?: string | null;
  rear_brake?: string | null;
  fuel_system?: string | null;
  sold_at?: string | null;
  brand_id?: number | null;
  model_id?: number | null;
  features?: string[];
  sold_by?: number | null;
  sold_by_name?: string | null;
  commission_rate?: number;
}

export interface EmployeeStats {
  vendas_mes: number;
  faturamento_mes: number;
  comissao_mes: number;
  total_vendas: number;
  historico: Vehicle[];
}

export interface VehicleFilters {
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  include_sold?: boolean;
}

export interface VehicleCreate {
  category: string;
  brand: string;
  model: string;
  year: string;
  km: number;
  price: number;
  color?: string;
  description?: string;
  is_featured?: boolean;
  transmission?: string;
  fuel?: string;
  doors?: number;
  body_type?: string;
  cilindrada?: number;
  marchas?: number;
  motor_type?: string;
  cooling?: string;
  moto_style?: string;
  starter?: string;
  front_brake?: string;
  rear_brake?: string;
  fuel_system?: string;
  brand_id?: number;
  model_id?: number;
  features?: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  monthly_goal?: number;
}
