import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Types matching your Supabase schema
export type Outlet = {
  id: string;
  outlet_name: string;
  is_active: boolean;
  city?: string;
};

export type Customer = {
  id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  customer_type?: string;
  address?: string;
  total_orders?: number;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  outlet_id: string;
  status: string;
  priority_type: string;
  total_price: number;
  express_fee?: number;
  payment_status?: string;
  delivery_time?: string;
  created_at?: string;
  total_weight_kg?: number;
  pickup_type?: string;
};

export type OrderWithDetails = Order & {
  outlet?: { outlet_name: string };
  customer?: { full_name: string; phone_number?: string };
};

export type FeedbackRow = {
  id: string;
  order_id: string;
  rating: number;
  category?: string;
  comment?: string;
};
