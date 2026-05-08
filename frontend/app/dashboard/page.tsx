/**
 * @file page.tsx (Dashboard)
 * @description Main dashboard page providing analytics and system-wide statistics.
 * Features various charts and status summaries based on the user's role.
 */

"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/**
 * Interface for the stat card data.
 */
interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: "blue" | "purple" | "green" | "orange" | "red" | "yellow";
}

/**
 * Interface for dashboard summary statistics response from the backend.
 */
interface DashboardSummary {
  created: number;
  assigned: number;
  started: number;
  resolved: number;
  closed: number;
}

/**
 * Interface for a single data point in the Recharts bar chart.
 */
interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Interface for monthly ticket count statistics.
 */
interface MonthlyStats {
  month: string;
  count: number;
}

/**
 * Interface for client-wise ticket count statistics.
 */
interface ClientStats {
  client__user__username: string;
  count: number;
}

/**
 * Interface for member-wise ticket count statistics (assigned to).
 */
interface MemberStats {
  assigned_to__user__username: string | null;
  count: number;
}

/**
 * DashboardPage component that renders analytics and status cards.
 * 
 * @returns {JSX.Element} The rendered dashboard page.
 */
export default function DashboardPage() {
  // --- STATE MANAGEMENT ---
  const [role, setRole] = useState<string | null>(null); // Current user's role
  const [activeTab, setActiveTab] = useState("status"); // Currently active analytics tab
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]); // Formatted data for the bar chart
  const [loading, setLoading] = useState(true); // Loading state for chart data
  const [summaryStats, setSummaryStats] = useState<DashboardSummary | null>(null); // Top-level summary stats

  // --- SIDE EFFECTS ---
  /**
   * Effect to retrieve user role from localStorage on mount.
   */
  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
  }, []);

  /**
   * Effect to fetch initial dashboard summary statistics on mount.
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Effect to fetch specific analytics data whenever the active tab changes.
   */
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  /**
   * Fetches general summary statistics (totals for created, assigned, etc.).
   */
  async function fetchDashboardData() {
    try {
      const data = await apiGet("/api/dashboard/summary/");
      setSummaryStats(data);
    } catch (error) {
      console.error("Dashboard summary fetch error:", error);
    }
  }

  /**
   * Fetches detailed analytics data based on the selected tab.
   * 
   * @param {string} tab - The identifier for the data to fetch (status, monthly, client, member).
   */
  async function fetchData(tab: string) {
    setLoading(true);
    try {
      let endpoint = "";
      if (tab === "status") endpoint = "/api/dashboard/summary/";
      if (tab === "monthly") endpoint = "/api/dashboard/monthly/";
      if (tab === "client") endpoint = "/api/dashboard/client-wise/";
      if (tab === "member") endpoint = "/api/dashboard/member-wise/";

      const data: unknown = await apiGet(endpoint);
      let formatted: ChartDataPoint[] = [];

      // FORMAT DATA BASED ON TAB TYPE
      if (tab === "status" && data && typeof data === "object") {
        const stats = data as DashboardSummary;
        formatted = [
          { name: "Created", value: stats.created },
          { name: "Assigned", value: stats.assigned },
          { name: "Started", value: stats.started },
          { name: "Resolved", value: stats.resolved },
          { name: "Closed", value: stats.closed },
        ];
      } else if (tab === "monthly" && Array.isArray(data)) {
        formatted = (data as MonthlyStats[]).map((item) => ({
          name: new Date(item.month).toLocaleString("default", { month: "short" }),
          value: item.count,
        }));
      } else if (tab === "client" && Array.isArray(data)) {
        formatted = (data as ClientStats[]).map((item) => ({
          name: item.client__user__username,
          value: item.count,
        }));
      } else if (tab === "member" && Array.isArray(data)) {
        formatted = (data as MemberStats[]).map((item) => ({
          name: item.assigned_to__user__username || "Unassigned",
          value: item.count,
        }));
      }

      setChartData(formatted);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  // PREPARE STAT CARDS DATA
  const statCards: StatCard[] = summaryStats
    ? [
        { label: "New Issues", value: summaryStats.created || 0, icon: "📝", color: "blue" },
        { label: "Assigned", value: summaryStats.assigned || 0, icon: "👤", color: "purple" },
        { label: "In Progress", value: summaryStats.started || 0, icon: "⚙️", color: "yellow" },
        { label: "Resolved", value: summaryStats.resolved || 0, icon: "✅", color: "green" },
        { label: "Closed", value: summaryStats.closed || 0, icon: "🔒", color: "red" },
        { label: "Total", value: (summaryStats.created || 0) + (summaryStats.assigned || 0) + (summaryStats.started || 0) + (summaryStats.resolved || 0) + (summaryStats.closed || 0), icon: "📊", color: "orange" },
      ]
    : [];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
          {role === "ADMIN" ? "System Dashboard" : role === "MEMBER" ? "Team Overview" : "Dashboard"}
        </h1>
        <p className="text-slate-500 text-xs md:text-sm">
          {role === "ADMIN" 
            ? "Real-time analytics and comprehensive issue management"
            : role === "MEMBER"
            ? "Track your assigned issues and team performance"
            : "Monitor your issues and support requests"}
        </p>
      </div>

      {/* STAT CARDS GRID */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
          {statCards.map((card, idx) => (
            <StatCardComponent key={idx} {...card} />
          ))}
        </div>
      )}

      {/* ANALYTICS SECTION */}
      <div className="space-y-4">
        {/* TAB NAVIGATION */}
        <div className="flex gap-2 flex-wrap">
          <Tab label="Status Distribution" value="status" activeTab={activeTab} setActiveTab={setActiveTab} />
          <Tab label="Monthly Trends" value="monthly" activeTab={activeTab} setActiveTab={setActiveTab} />
          {(role === "MEMBER" || role === "ADMIN") && (
            <Tab label="Client Analytics" value="client" activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {role === "ADMIN" && (
            <Tab label="Team Performance" value="member" activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </div>

        {/* CHART CONTAINER */}
        <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm border border-slate-200/60 overflow-x-hidden">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-1">Analytics Dashboard</h2>
          <p className="text-xs text-slate-500 mb-4 md:mb-6">Historical data and trend visualization</p>

          {loading ? (
            <div className="h-64 md:h-80 flex items-center justify-center text-slate-400 text-sm">
              <span className="animate-pulse">Fetching analytics…</span>
            </div>
          ) : chartData.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    angle={chartData.length > 6 ? -45 : 0}
                    height={chartData.length > 6 ? 80 : 30}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                    cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
                  />
                  <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 md:h-80 flex items-center justify-center text-slate-400 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tab component for switching between different analytics views.
 * 
 * @param {Object} props - Component props.
 * @param {string} props.label - Display label for the tab.
 * @param {string} props.value - Value associated with the tab.
 * @param {string} props.activeTab - Currently active tab value.
 * @param {Function} props.setActiveTab - Callback to change the active tab.
 * @returns {JSX.Element} The rendered tab button.
 */
function Tab({
  label,
  value,
  activeTab,
  setActiveTab,
}: {
  label: string;
  value: string;
  activeTab: string;
  setActiveTab: (val: string) => void;
}) {
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
        activeTab === value
          ? "bg-blue-600 text-white shadow-md"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * StatCardComponent for displaying a single numerical statistic.
 * 
 * @param {StatCard} props - The data for the card.
 * @returns {JSX.Element} The rendered statistic card.
 */
function StatCardComponent({
  label,
  value,
  icon,
  color,
}: StatCard) {
  // Mapping color names to Tailwind CSS classes
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    green: "bg-green-50 border-green-200 text-green-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    red: "bg-red-50 border-red-200 text-red-600",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
  };

  const iconBgMap = {
    blue: "bg-blue-100",
    purple: "bg-purple-100",
    green: "bg-green-100",
    orange: "bg-orange-100",
    red: "bg-red-100",
    yellow: "bg-yellow-100",
  };

  return (
    <div
      className={`p-3 md:p-5 rounded-lg border ${colorMap[color]} bg-white shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
          <p className="text-lg md:text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`text-xl md:text-2xl ${iconBgMap[color]} p-2 md:p-2.5 rounded-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}