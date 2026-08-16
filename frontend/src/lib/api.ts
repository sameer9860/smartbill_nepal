import type {
  AuthResponse,
  Customer,
  DashboardData,
  Invoice,
  Product,
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
};

export const coreApi = {
  dashboard() {
    return apiRequest<DashboardData>("/api/dashboard/");
  },
  products() {
    return apiRequest<Product[]>("/api/products/");
  },
  createProduct(payload: {
    name: string;
    price: string;
    stock_quantity: number;
    low_stock_threshold?: number;
    description?: string;
  }) {
    return apiRequest<Product>("/api/products/", {
      method: "POST",
      body: payload,
    });
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
  invoices() {
    return apiRequest<Invoice[]>("/api/invoices/");
  },
  createInvoice(payload: {
    customer: number;
    status?: string;
    discount?: string;
    tax?: string;
    notes?: string;
    items: Array<{ product: number; quantity: number; unit_price?: string }>;
  }) {
    return apiRequest<Invoice>("/api/invoices/", {
      method: "POST",
      body: payload,
    });
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
