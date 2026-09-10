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

export type Category = {
  id: number;
  name: string;
  created_at: string;
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

export type StockMovement = {
  id: number;
  product: number;
  product_name: string;
  movement_type: "IN" | "OUT" | string;
  quantity: number;
  reason: string;
  created_at: string;
};

export type DashboardData = {
  total_products: number;
  total_customers: number;
  total_invoices: number;
  total_revenue: string | number;
  low_stock_products: Array<{
    id: number;
    name: string;
    stock_quantity: number;
    low_stock_threshold: number;
  }>;
  recent_invoices: Invoice[];
};

export type ReportsData = {
  top_products: Array<{
    name: string;
    total_qty: number;
    total_revenue: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  total_revenue: number;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
};

export type HealthMetric = {
  label: string;
  score: number;
  max: number;
  detail: string;
  icon: string;
  color: string;
};

export type HealthData = {
  total_score: number;
  grade: string;
  grade_color: string;
  grade_icon: string;
  breakdown: Record<string, HealthMetric>;
};

export type ForecastData = {
  historical_labels: string[];
  historical_data: number[];
  forecast_labels: string[];
  forecast_data: number[];
  total_forecast: number;
  avg_daily_forecast: number;
  trend: "UP" | "DOWN" | string;
  trend_value: number;
};

export type ABCItem = {
  product_name: string;
  revenue: number;
  qty_sold: number;
  abc_class: "A" | "B" | "C" | string;
  revenue_pct: number;
  cumulative_pct: number;
};

export type ABCData = {
  items: ABCItem[];
  total_revenue: number;
  a_revenue: number;
  b_revenue: number;
  c_revenue: number;
  a_count: number;
  b_count: number;
  c_count: number;
};

export type TrendItem = {
  product_name: string;
  recent_7d: number;
  previous_7d: number;
  change_pct: number;
  trend: "UP" | "DOWN" | "STABLE" | string;
};

export type StockRiskItem = {
  product_name: string;
  stock_quantity: number;
  avg_daily_sales: number;
  days_until_stockout: number | null;
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  recommended_restock: number;
};

export type ReorderPlanItem = {
  product_name: string;
  avg_daily_sales: number;
  safety_stock: number;
  reorder_point: number;
  current_stock: number;
  order_qty: number;
  estimated_cost: number;
  needs_order_now: boolean;
};

export type WeeklyOrderItem = {
  product_name: string;
  stock_quantity: number;
  reorder_point: number;
  order_qty: number;
  estimated_cost: number;
};

export type WeeklyOrdersData = {
  items: WeeklyOrderItem[];
  total_items: number;
  total_estimated_cost: number;
};

export type CategorySummaryItem = {
  category: string;
  total_qty: number;
  total_revenue: number;
};

export type AIInsightsData = {
  health: HealthData;
  forecast: ForecastData | null;
  abc: ABCData;
  trends: TrendItem[];
  stock_risk: StockRiskItem[];
  reorder_plan: ReorderPlanItem[];
  weekly_orders: WeeklyOrdersData;
  category_summary: CategorySummaryItem[];
};
