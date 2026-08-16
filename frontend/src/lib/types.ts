export type Tenant = {
  id: number;
  name: string;
  trial_starts_at: string;
  trial_ends_at: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_ends_at: string | null;
  is_trial_active: boolean;
  is_subscription_valid: boolean;
  has_access: boolean;
  days_left_in_trial: number;
  created_at: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant: Tenant | null;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type AuthResponse = {
  user: User;
  tokens: AuthTokens;
  message?: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price_nrs: number | null;
  billing_period: string;
  description: string;
  features: string[];
  subscribeable: boolean;
};

export type Product = {
  id: number;
  category: number | null;
  category_name: string | null;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

export type Invoice = {
  id: number;
  customer: number;
  customer_name: string;
  invoice_number: string;
  status: string;
  total_amount: string;
  discount: string;
  tax: string;
  notes: string;
  items: InvoiceItem[];
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  created_at: string;
  updated_at: string;
};

export type DashboardData = {
  total_products: number;
  total_customers: number;
  total_invoices: number;
  total_revenue: string;
  low_stock_products: Array<{
    id: number;
    name: string;
    stock_quantity: number;
    low_stock_threshold: number;
  }>;
  recent_invoices: Invoice[];
};
