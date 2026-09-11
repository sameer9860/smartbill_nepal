import type {
  AIInsightsData,
  AuthResponse,
  Category,
  Customer,
  DashboardData,
  Invoice,
  Product,
  ReportsData,
  StockMovement,
  SubscriptionPlan,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ACCESS_KEY = "sb_access";
const REFRESH_KEY = "sb_refresh";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = (await res.json()) as { access: string };
  localStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = true, retry = true } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status, data);
  }

  return data as T;
}

export const authApi = {
  register(payload: {
    username: string;
    email: string;
    password: string;
    store_name: string;
  }) {
    return apiRequest<AuthResponse>("/api/auth/register/", {
      method: "POST",
      body: payload,
      auth: false,
    });
  },
  login(payload: { username: string; password: string }) {
    return apiRequest<AuthResponse>("/api/auth/login/", {
      method: "POST",
      body: payload,
      auth: false,
    });
  },
  me() {
    return apiRequest<User>("/api/auth/me/");
  },
  updateProfile(payload: {
    first_name?: string;
    last_name?: string;
    email?: string;
  }) {
    return apiRequest<User>("/api/auth/profile/", {
      method: "PUT",
      body: payload,
    });
  },
  changePassword(payload: { old_password: string; new_password: string }) {
    return apiRequest<{ message: string }>("/api/auth/change-password/", {
      method: "POST",
      body: payload,
    });
  },
  deleteAccount() {
    return apiRequest<{ message: string }>("/api/auth/delete-account/", {
      method: "DELETE",
    });
  },
};

export const coreApi = {
  categories() {
    return apiRequest<Category[]>("/api/categories/");
  },
  createCategory(payload: { name: string }) {
    return apiRequest<Category>("/api/categories/", {
      method: "POST",
      body: payload,
    });
  },
  updateCategory(id: number, payload: { name: string }) {
    return apiRequest<Category>(`/api/categories/${id}/`, {
      method: "PUT",
      body: payload,
    });
  },
  deleteCategory(id: number) {
    return apiRequest<void>(`/api/categories/${id}/`, { method: "DELETE" });
  },

  products() {
    return apiRequest<Product[]>("/api/products/");
  },
  createProduct(payload: {
    name: string;
    price: string | number;
    stock_quantity: number;
    low_stock_threshold?: number;
    description?: string;
    category?: number | null;
  }) {
    return apiRequest<Product>("/api/products/", {
      method: "POST",
      body: payload,
    });
  },
  updateProduct(
    id: number,
    payload: {
      name: string;
      price: string | number;
      stock_quantity: number;
      low_stock_threshold?: number;
      description?: string;
      category?: number | null;
    }
  ) {
    return apiRequest<Product>(`/api/products/${id}/`, {
      method: "PUT",
      body: payload,
    });
  },
  deleteProduct(id: number) {
    return apiRequest<void>(`/api/products/${id}/`, { method: "DELETE" });
  },

  customers() {
    return apiRequest<Customer[]>("/api/customers/");
  },
  createCustomer(payload: {
    full_name: string;
    phone: string;
    email?: string;
    address?: string;
  }) {
    return apiRequest<Customer>("/api/customers/", {
      method: "POST",
      body: payload,
    });
  },
  updateCustomer(
    id: number,
    payload: {
      full_name: string;
      phone: string;
      email?: string;
      address?: string;
    }
  ) {
    return apiRequest<Customer>(`/api/customers/${id}/`, {
      method: "PUT",
      body: payload,
    });
  },
  deleteCustomer(id: number) {
    return apiRequest<void>(`/api/customers/${id}/`, { method: "DELETE" });
  },

  invoices() {
    return apiRequest<Invoice[]>("/api/invoices/");
  },
  invoice(id: number) {
    return apiRequest<Invoice>(`/api/invoices/${id}/`);
  },
  createInvoice(payload: {
    customer: number;
    status?: string;
    discount?: string | number;
    tax?: string | number;
    notes?: string;
    items: Array<{ product: number; quantity: number; unit_price?: string | number }>;
  }) {
    return apiRequest<Invoice>("/api/invoices/", {
      method: "POST",
      body: payload,
    });
  },
  deleteInvoice(id: number) {
    return apiRequest<void>(`/api/invoices/${id}/`, { method: "DELETE" });
  },
  updateInvoice(
    id: number,
    payload: {
      customer?: number;
      status?: string;
      discount?: string | number;
      tax?: string | number;
      notes?: string;
    }
  ) {
    return apiRequest<Invoice>(`/api/invoices/${id}/`, {
      method: "PATCH",
      body: payload,
    });
  },

  stockMovements() {
    return apiRequest<StockMovement[]>("/api/stock-movements/");
  },
  createStockMovement(payload: {
    product: number;
    movement_type: "IN" | "OUT";
    quantity: number;
    reason?: string;
  }) {
    return apiRequest<StockMovement>("/api/stock-movements/", {
      method: "POST",
      body: payload,
    });
  },

  lowStockProducts() {
    return apiRequest<Product[]>("/api/low-stock/");
  },
  dashboard() {
    return apiRequest<DashboardData>("/api/dashboard/");
  },
  reports() {
    return apiRequest<ReportsData>("/api/reports/");
  },
  aiInsights() {
    return apiRequest<AIInsightsData>("/api/ai-insights/");
  },
  subscriptionPlans() {
    return apiRequest<{ plans: SubscriptionPlan[] }>(
      "/api/subscription/plans/"
    );
  },
  subscribe(payload: { plan: string; payment_method: string }) {
    return apiRequest<{
      message: string;
      payment: {
        method: string;
        amount_nrs: number | null;
        status: string;
        simulated: boolean;
      };
      tenant: User["tenant"];
    }>("/api/subscription/subscribe/", {
      method: "POST",
      body: payload,
    });
  },
};

export function formatNpr(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "NPR 0";
  return `NPR ${n.toLocaleString("en-NP", { maximumFractionDigits: 2 })}`;
}
