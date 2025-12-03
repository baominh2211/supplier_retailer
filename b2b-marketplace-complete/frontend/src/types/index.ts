export type UserRole = 'admin' | 'supplier' | 'shop';
export type ProductStatus = 'active' | 'inactive' | 'pending';
export type RFQStatus = 'pending' | 'quoted' | 'closed';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';

export interface User {
  id: number;
  email: string;
  full_name: string;
  email_verified?: boolean;  // ← Thêm
  is_approved?: boolean; 
  role: UserRole;
  created_at: string;
  supplier?: Supplier;
  shop?: Shop;
}

export interface Supplier {
  id: number;
  user_id: number;
  company_name: string;
  address?: string;
  phone?: string;
  description?: string;
  created_at: string;
  user?: User;
}

export interface Shop {
  id: number;
  user_id: number;
  shop_name: string;
  address?: string;
  phone?: string;
  created_at: string;
  user?: User;
}

export interface Product {
  id: number;
  supplier_id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image_url?: string;
  category?: string;
  created_at: string;
  supplier?: Supplier;
}

export interface RFQ {
  id: number;
  shop_id: number;
  product_id: number;
  quantity: number;
  message?: string;
  status: RFQStatus;
  created_at: string;
  shop?: Shop;
  product?: Product;
  quotes?: Quote[];
}

export interface Quote {
  id: number;
  rfq_id: number;
  supplier_id: number;
  price: number;
  min_order_qty?: number;
  lead_time?: number;
  message?: string;
  status: QuoteStatus;
  created_at: string;
  supplier?: Supplier;
  rfq?: RFQ;
}

export interface Negotiation {
  id: number;
  rfq_id: number;
  sender_role: UserRole;
  sender_id: number;
  message?: string;
  proposed_price?: number;
  created_at: string;
}

export interface Contract {
  id: number;
  supplier_id: number;
  shop_id: number;
  product_id: number;
  agreed_price: number;
  quantity: number;
  start_date?: string;
  end_date?: string;
  status: ContractStatus;
  created_at: string;
  supplier?: Supplier;
  shop?: Shop;
  product?: Product;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AdminStats {
  total_users: number;
  total_suppliers: number;
  total_shops: number;
  total_products: number;
  pending_products: number;
  total_contracts: number;
  total_rfqs: number;
}
