"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/EmptyState";
import { ExpiredGate } from "@/components/ExpiredGate";
import { LoadingPage } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, coreApi, formatNpr } from "@/lib/api";
import type { AIInsightsData } from "@/lib/types";

const PIE_COLORS = ["#1a237e", "#1565c0", "#0f766e", "#f59e0b", "#e53935", "#7c3aed"];

const GRADE_RING: Record<string, string> = {
  success: "border-emerald-500 bg-emerald-50 text-emerald-700",
  primary: "border-[var(--navy)] bg-indigo-50 text-[var(--navy)]",
  warning: "border-amber-500 bg-amber-50 text-amber-800",
  danger: "border-red-500 bg-red-50 text-red-700",
};

const METRIC_FILL: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  primary: "bg-[var(--navy)]",
};

export default function AIInsightsPage() {
  const [data, setData] = useState<AIInsightsData | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    coreApi
      .aiInsights()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) setExpired(true);
        else setError(err instanceof Error ? err.message : "Failed to load");
      });
  }, []);

  const forecastChart = useMemo(() => {
    if (!data?.forecast) return [];
    const f = data.forecast;
    const historical = f.historical_labels.map((label, i) => ({
      label,
      actual: f.historical_data[i],
      forecast: null as number | null,
    }));
    const forecast = f.forecast_labels.map((label, i) => ({
      label,
      actual: null as number | null,
      forecast: f.forecast_data[i],
    }));
    return [...historical, ...forecast];
  }, [data]);

  const abcChart = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Class A", revenue: data.abc.a_revenue || 0 },
      { name: "Class B", revenue: data.abc.b_revenue || 0 },
      { name: "Class C", revenue: data.abc.c_revenue || 0 },
    ];
  }, [data]);

  const trendsChart = useMemo(() => {
    if (!data) return [];
    return data.trends.slice(0, 10).map((t) => ({
      name: t.product_name.length > 14 ? `${t.product_name.slice(0, 14)}…` : t.product_name,
      recent: t.recent_7d,
      previous: t.previous_7d,
    }));
  }, [data]);

  if (expired) return <ExpiredGate />;
  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 text-red-800">{error}</div>
    );
  }
  if (!data) return <LoadingPage label="Loading AI insights…" />;

  const health = data.health;
  const criticalCount = data.stock_risk.filter((r) => r.risk === "CRITICAL").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Business intelligence for inventory, sales, and reorder planning"
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="card lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold text-[var(--navy)]">Business health</h2>
            <span className="rounded-full bg-[var(--navy)] px-2 py-0.5 text-[10px] font-semibold text-white">
              AI
            </span>
          </div>
          <div
            className={`mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 ${
              GRADE_RING[health.grade_color] || GRADE_RING.primary
            }`}
          >
            <p className="font-display text-4xl font-bold leading-none">
              {health.total_score}
            </p>
            <p className="text-xs opacity-70">/ 100</p>
          </div>
          <p className="mt-3 text-center text-lg font-semibold">
            {health.grade_icon} {health.grade}
          </p>
          <div className="mt-4 space-y-3">
            {Object.entries(health.breakdown || {}).map(([key, metric]) => (
              <div key={key}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{metric.label}</span>
                  <span className="font-semibold">
                    {metric.score}/{metric.max}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full ${
                      METRIC_FILL[metric.color] || METRIC_FILL.primary
                    }`}
                    style={{
                      width: `${Math.min(100, (metric.score / metric.max) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-9">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card border-l-4 border-l-red-500">
              <p className="text-sm text-[var(--ink-muted)]">Critical alerts</p>
              <p className="mt-1 text-3xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-xs text-[var(--ink-muted)]">Products at risk</p>
            </div>
            <div className="card border-l-4 border-l-emerald-500">
              <p className="text-sm text-[var(--ink-muted)]">30-day forecast</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatNpr(data.forecast?.total_forecast ?? 0)}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {data.forecast ? (
                  <StatusBadge status={data.forecast.trend} />
                ) : (
                  "No sales history"
                )}
              </p>
            </div>
            <div className="card border-l-4 border-l-amber-500">
              <p className="text-sm text-[var(--ink-muted)]">Weekly orders</p>
              <p className="mt-1 text-3xl font-bold text-amber-700">
                {data.weekly_orders.total_items}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                {formatNpr(data.weekly_orders.total_estimated_cost)}
              </p>
            </div>
            <div className="card border-l-4 border-l-[var(--navy)]">
              <p className="text-sm text-[var(--ink-muted)]">Class A products</p>
              <p className="mt-1 text-3xl font-bold text-[var(--navy)]">
                {data.abc.a_count || 0}
              </p>
              <p className="text-xs text-[var(--ink-muted)]">~80% of revenue</p>
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-semibold text-[var(--navy)]">
                What to order this week
              </h2>
              <span className="rounded-full bg-[var(--navy)] px-2 py-0.5 text-[10px] font-semibold text-white">
                AI
              </span>
            </div>
            {data.weekly_orders.items.length === 0 ? (
              <EmptyState title="Nothing urgent to order" />
            ) : (
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--surface)] text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-2 py-2 font-medium">Product</th>
                      <th className="px-2 py-2 font-medium">Stock</th>
                      <th className="px-2 py-2 font-medium">Reorder at</th>
                      <th className="px-2 py-2 font-medium">Order qty</th>
                      <th className="px-2 py-2 font-medium">Est. cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.weekly_orders.items.map((w) => (
                      <tr
                        key={w.product_name}
                        className="border-t border-[var(--line)] bg-amber-50/40"
                      >
                        <td className="px-2 py-2 font-medium">{w.product_name}</td>
                        <td className="px-2 py-2">{w.stock_quantity}</td>
                        <td className="px-2 py-2">{w.reorder_point}</td>
                        <td className="px-2 py-2">{w.order_qty}</td>
                        <td className="px-2 py-2">{formatNpr(w.estimated_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-[var(--navy)]">Sales forecast</h2>
        {!data.forecast ? (
          <div className="mt-4">
            <EmptyState title="Need paid invoice history to forecast" />
          </div>
        ) : (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbe8" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => formatNpr(value)}
                  contentStyle={{ borderRadius: 8, borderColor: "#d5dbe8" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#1a237e"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#1565c0"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls={false}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-[var(--navy)]">ABC revenue mix</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbe8" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatNpr(value)} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {abcChart.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-[var(--navy)]">Category sales</h2>
          {data.category_summary.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No category sales yet" />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_summary}
                    dataKey="total_revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category }) => category}
                  >
                    {data.category_summary.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNpr(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-[var(--navy)]">Sales trends (7d)</h2>
          {trendsChart.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No trend data" />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5dbe8" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="previous" fill="#94a3b8" name="Previous 7d" />
                  <Bar dataKey="recent" fill="#1a237e" name="Recent 7d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card overflow-x-auto">
          <h2 className="mb-3 font-semibold text-[var(--navy)]">Trend details</h2>
          {data.trends.length === 0 ? (
            <EmptyState title="No products with trend signals" />
          ) : (
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-[var(--ink-muted)]">
                <tr>
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Change</th>
                  <th className="py-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.trends.map((t) => (
                  <tr key={t.product_name} className="border-t border-[var(--line)]">
                    <td className="py-2">{t.product_name}</td>
                    <td className="py-2">{t.change_pct}%</td>
                    <td className="py-2">
                      <StatusBadge status={t.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold text-[var(--navy)]">Stock risk</h2>
        {data.stock_risk.length === 0 ? (
          <EmptyState title="No stock risk detected" />
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[var(--ink-muted)]">
              <tr>
                <th className="px-2 py-2 font-medium">Product</th>
                <th className="px-2 py-2 font-medium">Stock</th>
                <th className="px-2 py-2 font-medium">Avg daily</th>
                <th className="px-2 py-2 font-medium">Days left</th>
                <th className="px-2 py-2 font-medium">Risk</th>
                <th className="px-2 py-2 font-medium">Restock</th>
              </tr>
            </thead>
            <tbody>
              {data.stock_risk.map((r) => (
                <tr key={r.product_name} className="border-t border-[var(--line)]">
                  <td className="px-2 py-2 font-medium">{r.product_name}</td>
                  <td className="px-2 py-2">{r.stock_quantity}</td>
                  <td className="px-2 py-2">{r.avg_daily_sales}</td>
                  <td className="px-2 py-2">
                    {r.days_until_stockout ?? "—"}
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge status={r.risk} />
                  </td>
                  <td className="px-2 py-2">{r.recommended_restock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold text-[var(--navy)]">Smart reorder plan</h2>
        {data.reorder_plan.length === 0 ? (
          <EmptyState title="No reorder recommendations" />
        ) : (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="text-[var(--ink-muted)]">
              <tr>
                <th className="px-2 py-2 font-medium">Product</th>
                <th className="px-2 py-2 font-medium">Current</th>
                <th className="px-2 py-2 font-medium">Reorder point</th>
                <th className="px-2 py-2 font-medium">Safety</th>
                <th className="px-2 py-2 font-medium">Order qty</th>
                <th className="px-2 py-2 font-medium">Est. cost</th>
                <th className="px-2 py-2 font-medium">Urgent</th>
              </tr>
            </thead>
            <tbody>
              {data.reorder_plan.map((r) => (
                <tr
                  key={r.product_name}
                  className={`border-t border-[var(--line)] ${
                    r.needs_order_now ? "bg-amber-50" : ""
                  }`}
                >
                  <td className="px-2 py-2 font-medium">{r.product_name}</td>
                  <td className="px-2 py-2">{r.current_stock}</td>
                  <td className="px-2 py-2">{r.reorder_point}</td>
                  <td className="px-2 py-2">{r.safety_stock}</td>
                  <td className="px-2 py-2">{r.order_qty}</td>
                  <td className="px-2 py-2">{formatNpr(r.estimated_cost)}</td>
                  <td className="px-2 py-2">
                    {r.needs_order_now ? (
                      <StatusBadge status="HIGH" />
                    ) : (
                      <span className="text-xs text-[var(--ink-muted)]">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.abc.items.length > 0 ? (
        <div className="card overflow-x-auto">
          <h2 className="mb-3 font-semibold text-[var(--navy)]">ABC product list</h2>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[var(--ink-muted)]">
              <tr>
                <th className="px-2 py-2 font-medium">Product</th>
                <th className="px-2 py-2 font-medium">Class</th>
                <th className="px-2 py-2 font-medium">Revenue</th>
                <th className="px-2 py-2 font-medium">Qty</th>
                <th className="px-2 py-2 font-medium">% Rev</th>
              </tr>
            </thead>
            <tbody>
              {data.abc.items.map((item) => (
                <tr key={item.product_name} className="border-t border-[var(--line)]">
                  <td className="px-2 py-2">{item.product_name}</td>
                  <td className="px-2 py-2">
                    <StatusBadge status={item.abc_class} />
                  </td>
                  <td className="px-2 py-2">{formatNpr(item.revenue)}</td>
                  <td className="px-2 py-2">{item.qty_sold}</td>
                  <td className="px-2 py-2">{item.revenue_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
