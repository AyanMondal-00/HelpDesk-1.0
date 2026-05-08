/**
 * @file page.tsx
 * @description Main tickets listing page for the HelpDesk dashboard.
 * Supports different views for ADMIN, MEMBER, and CLIENT roles.
 * Includes advanced filtering, search, and pagination.
 */

"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import StatusBadge from "@/component/StatusBadge";

/**
 * @interface Ticket
 * @description Represents a ticket object as returned from the API.
 */
interface Ticket {
  id: number;
  ticket_number: string;
  status: string;
  description: string;
  created_at: string;
  client_name?: string;
  assigned_member?: string;
  company_name?: string;
}

/**
 * @component TicketsPage
 * @description The main page component for viewing and managing tickets.
 */
export default function TicketsPage() {
  // --- State Management ---

  // Stores the full list of tickets fetched from the API
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  // Loading state for initial data fetch
  const [loading, setLoading] = useState(true);
  
  // User role retrieved from localStorage to determine UI permissions and views
  const [userRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_role");
    }
    return null;
  });
  
  // Current active status filter (e.g., 'ALL', 'OPEN', 'CREATED', etc.)
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  
  // Search query string for filtering tickets by ID, description, or client
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination: Current page number
  const [currentPage, setCurrentPage] = useState(1);
  
  // Admin-specific filters
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterMember, setFilterMember] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  
  // Number of items to display per page
  const itemsPerPage = 12;
  
  const router = useRouter();

  /**
   * @effect
   * @description Fetches tickets from the backend on component mount.
   */
  useEffect(() => {
    apiGet("/api/tickets/?limit=1000")
      .then((data) => {
        // API might return results in a nested object or directly as an array
        setTickets(data.results || data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tickets:", err);
        setLoading(false);
      });
  }, []);

  /**
   * @function getHeaderText
   * @returns {string} The appropriate header text based on user role.
   */
  const getHeaderText = () => {
    if (userRole === "ADMIN") return "Issue Tracking System";
    if (userRole === "MEMBER") return "Assigned Issues";
    return "My Issues";
  };

  /**
   * @function getHeaderDescription
   * @returns {string} The appropriate header description based on user role.
   */
  const getHeaderDescription = () => {
    if (userRole === "ADMIN")
      return "Comprehensive issue management interface. Organize and monitor all tickets across statuses.";
    if (userRole === "MEMBER")
      return "Track your assigned issues. Monitor progress and respond to client needs.";
    return "Monitor your submitted issues. Track resolution status and get updates on your requests.";
  };

  // --- Filtering Logic ---

  // Start with the full list and apply filters sequentially
  let filteredTickets = tickets;

  // 1. Status Filter
  if (activeStatus !== "ALL") {
    if (activeStatus === "OPEN") {
      // 'OPEN' is a composite status including CREATED, ASSIGNED, and STARTED
      filteredTickets = tickets.filter((t) =>
        ["CREATED", "ASSIGNED", "STARTED"].includes(t.status)
      );
    } else {
      filteredTickets = tickets.filter((t) => t.status === activeStatus);
    }
  }

  // 2. Search Query Filter (Ticket ID, Description, Client, or Company)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTickets = filteredTickets.filter(
      (t) =>
        t.ticket_number.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.client_name?.toLowerCase().includes(query) || false) ||
        (t.company_name?.toLowerCase().includes(query) || false)
    );
  }

  // 3. Admin-Specific Advanced Filters
  if (userRole === "ADMIN") {
    if (filterClient) {
      filteredTickets = filteredTickets.filter(
        (t) => t.client_name === filterClient
      );
    }
    if (filterMember) {
      filteredTickets = filteredTickets.filter(
        (t) => (t.assigned_member || "Unassigned") === filterMember
      );
    }
    if (filterMonth) {
      filteredTickets = filteredTickets.filter((t) => {
        // Extract YYYY-MM from ISO string for comparison
        const ticketMonth = new Date(t.created_at).toISOString().slice(0, 7);
        return ticketMonth === filterMonth;
      });
    }
  }

  // --- Filter Option Extraction ---

  /**
   * Extract unique clients from the ticket list for the admin filter dropdown.
   */
  const uniqueClients = Array.from(
    new Set(tickets.map((t) => t.client_name).filter(Boolean))
  ).sort() as string[];

  /**
   * Extract unique assigned members from the ticket list for the admin filter dropdown.
   */
  const uniqueMembers = Array.from(
    new Set(
      tickets.map((t) => t.assigned_member || "Unassigned").filter(Boolean)
    )
  ).sort() as string[];

  /**
   * Extract unique months from ticket creation dates for the admin filter dropdown.
   */
  const uniqueMonths = Array.from(
    new Set(
      tickets.map((t) => new Date(t.created_at).toISOString().slice(0, 7))
    )
  ).sort().reverse() as string[];

  // --- Pagination Logic ---

  /**
   * Slice the filtered tickets to get only the items for the current page.
   */
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Statistics Calculation ---

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) =>
      ["CREATED", "ASSIGNED", "STARTED"].includes(t.status)
    ).length,
    created: tickets.filter((t) => t.status === "CREATED").length,
    assigned: tickets.filter((t) => t.status === "ASSIGNED").length,
    started: tickets.filter((t) => t.status === "STARTED").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  };

  /**
   * Configuration for status tabs, including role-based visibility.
   */
  const statusTabs = [
    { label: "All Issues", value: "ALL", count: stats.total },
    { label: "Open", value: "OPEN", count: stats.open },
    ...(userRole === "ADMIN"
      ? [
          { label: "Created", value: "CREATED", count: stats.created },
          { label: "Assigned", value: "ASSIGNED", count: stats.assigned },
        ]
      : []),
    { label: "In Progress", value: "STARTED", count: stats.started },
    { label: "Resolved", value: "RESOLVED", count: stats.resolved },
    { label: "Closed", value: "CLOSED", count: stats.closed },
  ];

  // --- Render Logic ---

  // Loading view
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
              <svg
                className="w-6 h-6 text-slate-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Loading {getHeaderText().toLowerCase()}...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state view
  if (!tickets.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{getHeaderText()}</h1>
          <p className="text-slate-500 text-sm">{getHeaderDescription()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-1">No issues found</h2>
          <p className="text-slate-500 text-sm">
            {userRole === "ADMIN"
              ? "Once tickets are created, they will appear here."
              : userRole === "MEMBER"
              ? "No tickets have been assigned to you yet."
              : "No tickets created yet. Create one to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 tracking-tight">
          {getHeaderText()}
        </h1>
        <p className="text-slate-500 text-xs md:text-sm">{getHeaderDescription()}</p>
      </div>

      {/* STATISTICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        <StatSmallCard label="Total" value={stats.total} icon="📊" color="blue" />
        {userRole === "ADMIN" && (
          <>
            <StatSmallCard label="Created" value={stats.created} icon="📝" color="blue" />
            <StatSmallCard label="Assigned" value={stats.assigned} icon="👤" color="purple" />
          </>
        )}
        <StatSmallCard label="In Progress" value={stats.started} icon="⚙️" color="yellow" />
        <StatSmallCard label="Resolved" value={stats.resolved} icon="✅" color="green" />
        <StatSmallCard label="Closed" value={stats.closed} icon="🔒" color="red" />
      </div>

      {/* ACTIVE FILTERS SUMMARY (Visible when any admin filter is active) */}
      {userRole === "ADMIN" && (filterClient || filterMember || filterMonth) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                🔍 Active Filters Applied
              </p>
              <p className="text-sm text-blue-800 break-words">
                Showing {filteredTickets.length} of {tickets.length} issues
                {filterClient && ` • Client: ${filterClient}`}
                {filterMember && ` • Assigned: ${filterMember}`}
                {filterMonth &&
                  ` • Month: ${new Date(filterMonth + "-01").toLocaleString(
                    "default",
                    { month: "short", year: "numeric" }
                  )}`}
              </p>
            </div>
            <button
              onClick={() => {
                setFilterClient("");
                setFilterMember("");
                setFilterMonth("");
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm whitespace-nowrap flex-shrink-0 mt-2 sm:mt-0"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 md:p-6 space-y-4">
        {/* SEARCH INPUT */}
        <div className="relative w-full">
          <svg
            className="absolute left-3 top-3 w-5 h-5 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by ticket, description, client..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
          />
        </div>

        {/* STATUS NAVIGATION TABS */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveStatus(tab.value);
                setCurrentPage(1);
              }}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeStatus === tab.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeStatus === tab.value
                    ? "bg-blue-700/50"
                    : "bg-slate-200"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ADVANCED ADMIN FILTERS SECTION */}
        {userRole === "ADMIN" && (
          <div className="border-t border-slate-200 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="text-sm font-medium text-slate-700">Advanced Filters</p>
              {(filterClient || filterMember || filterMonth) && (
                <button
                  onClick={() => {
                    setFilterClient("");
                    setFilterMember("");
                    setFilterMonth("");
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium self-start sm:self-auto"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              {/* CLIENT SELECTION */}
              <FilterSelect
                label="Client"
                value={filterClient}
                onChange={(value) => {
                  setFilterClient(value);
                  setCurrentPage(1);
                }}
                options={uniqueClients}
                placeholder="All Clients"
                icon="👤"
              />

              {/* MEMBER SELECTION */}
              <FilterSelect
                label="Assigned To"
                value={filterMember}
                onChange={(value) => {
                  setFilterMember(value);
                  setCurrentPage(1);
                }}
                options={uniqueMembers}
                placeholder="All Members"
                icon="👥"
              />

              {/* MONTH SELECTION */}
              <FilterSelect
                label="Month"
                value={filterMonth}
                onChange={(value) => {
                  setFilterMonth(value);
                  setCurrentPage(1);
                }}
                options={uniqueMonths.map((m) => ({
                  value: m,
                  label: new Date(m + "-01").toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  }),
                }))}
                placeholder="All Months"
                icon="📅"
              />
            </div>

            {/* INDIVIDUAL ACTIVE FILTER BADGES */}
            {(filterClient || filterMember || filterMonth) && (
              <div className="flex flex-wrap gap-2">
                {filterClient && (
                  <FilterBadge
                    label={`Client: ${filterClient}`}
                    onRemove={() => {
                      setFilterClient("");
                      setCurrentPage(1);
                    }}
                  />
                )}
                {filterMember && (
                  <FilterBadge
                    label={`Assigned: ${filterMember}`}
                    onRemove={() => {
                      setFilterMember("");
                      setCurrentPage(1);
                    }}
                  />
                )}
                {filterMonth && (
                  <FilterBadge
                    label={new Date(filterMonth + "-01").toLocaleString(
                      "default",
                      { month: "short", year: "numeric" }
                    )}
                    onRemove={() => {
                      setFilterMonth("");
                      setCurrentPage(1);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TICKETS DISPLAY SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60">
        {paginatedTickets.length === 0 ? (
          <div className="p-8 md:p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No issues found
            </h3>
            <p className="text-slate-500 text-sm">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : `No ${activeStatus.toLowerCase()} issues at the moment.`}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (Visible on medium screens and up) */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide whitespace-nowrap">
                      TICKET
                    </th>
                    {userRole === "ADMIN" && (
                      <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide whitespace-nowrap">
                        CLIENT
                      </th>
                    )}
                    <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide min-w-0 flex-1">
                      DESCRIPTION
                    </th>
                    <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide whitespace-nowrap">
                      STATUS
                    </th>
                    {userRole === "ADMIN" && (
                      <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide whitespace-nowrap hidden lg:table-cell">
                        ASSIGNED
                      </th>
                    )}
                    <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide whitespace-nowrap hidden lg:table-cell">
                      CREATED
                    </th>
                    <th className="px-2 lg:px-3 py-2.5 lg:py-4 text-left text-xs font-semibold text-slate-900 tracking-wide whitespace-nowrap">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-2 lg:px-3 py-2.5 lg:py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/tickets/${ticket.id}`)
                          }
                          className="text-xs lg:text-sm font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          {ticket.ticket_number}
                        </button>
                      </td>
                      {userRole === "ADMIN" && (
                        <td className="px-2 lg:px-3 py-2.5 lg:py-4 text-xs lg:text-sm text-slate-700 truncate">
                          {ticket.client_name || "-"}
                        </td>
                      )}
                      <td className="px-2 lg:px-3 py-2.5 lg:py-4 text-xs lg:text-sm text-slate-700 min-w-0 truncate">
                        {ticket.description.substring(0, 35)}
                        {ticket.description.length > 35 ? "..." : ""}
                      </td>
                      <td className="px-2 lg:px-3 py-2.5 lg:py-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>
                      {userRole === "ADMIN" && (
                        <td className="px-2 lg:px-3 py-2.5 lg:py-4 text-xs lg:text-sm text-slate-600 whitespace-nowrap hidden lg:table-cell">
                          {ticket.assigned_member || "Unassigned"}
                        </td>
                      )}
                      <td className="px-2 lg:px-3 py-2.5 lg:py-4 text-xs lg:text-sm text-slate-600 whitespace-nowrap hidden lg:table-cell">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 lg:px-3 py-2.5 lg:py-4">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/tickets/${ticket.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs lg:text-sm transition whitespace-nowrap"
                        >
                          {userRole === "ADMIN" ? "⋯" : "View"} →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW (Visible on small screens) */}
            <div className="md:hidden space-y-3 p-4">
              {paginatedTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  userRole={userRole}
                  onView={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {paginatedTickets.length > 0 && Math.ceil(filteredTickets.length / itemsPerPage) > 1 && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600 order-2 md:order-1">
            Showing {(currentPage - 1) * itemsPerPage + 1} –{" "}
            {Math.min(currentPage * itemsPerPage, filteredTickets.length)} of{" "}
            {filteredTickets.length}
          </p>
          <div className="flex gap-2 flex-wrap order-1 md:order-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Previous
            </button>
            <div className="flex gap-1 flex-wrap">
              {Array.from(
                { length: Math.ceil(filteredTickets.length / itemsPerPage) },
                (_, i) => i + 1
              )
                .slice(
                  Math.max(0, currentPage - 2),
                  Math.min(
                    Math.ceil(filteredTickets.length / itemsPerPage),
                    currentPage + 2
                  )
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    Math.ceil(filteredTickets.length / itemsPerPage),
                    p + 1
                  )
                )
              }
              disabled={
                currentPage === Math.ceil(filteredTickets.length / itemsPerPage)
              }
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @component StatSmallCard
 * @description A small card displaying a single statistic.
 */
function StatSmallCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
  };

  return (
    <div className={`p-2.5 md:p-4 rounded-lg border ${colorMap[color]} bg-white`}>
      <div className="text-xs font-medium text-slate-600 mb-1 truncate">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-lg md:text-xl font-bold text-slate-900">{value}</p>
        <div className="text-base md:text-lg">{icon}</div>
      </div>
    </div>
  );
}

/**
 * @interface FilterSelectProps
 */
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | Array<{ value: string; label: string }>;
  placeholder?: string;
  icon?: string;
}

/**
 * @component FilterSelect
 * @description A styled dropdown for filtering.
 */
function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon,
}: FilterSelectProps) {
  // Determine if options are strings or objects with value/label pairs
  const isObjectArray = options.length > 0 && typeof options[0] === "object";

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-sm">{icon}</span>}
        <label className="text-xs font-medium text-slate-700">{label}</label>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700"
      >
        <option value="">{placeholder}</option>
        {options.map((option, idx) => {
          const optValue = isObjectArray
            ? (option as { value: string; label: string }).value
            : (option as string);
          const optLabel = isObjectArray
            ? (option as { value: string; label: string }).label
            : (option as string);
          return (
            <option key={idx} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}

/**
 * @interface FilterBadgeProps
 */
interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

/**
 * @component FilterBadge
 * @description A removable pill showing an active filter.
 */
function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-700 rounded-full text-xs font-medium">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:text-blue-900 transition"
        title="Remove filter"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * @interface TicketCardProps
 */
interface TicketCardProps {
  ticket: Ticket;
  userRole: string | null;
  onView: () => void;
}

/**
 * @component TicketCard
 * @description A card layout for displaying ticket information on mobile devices.
 */
function TicketCard({ ticket, userRole, onView }: TicketCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 hover:border-blue-300 hover:shadow-md transition-all">
      {/* Ticket ID and Status */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onView}
          className="text-blue-600 hover:text-blue-800 font-bold text-sm flex-shrink-0"
        >
          {ticket.ticket_number}
        </button>
        <StatusBadge status={ticket.status} size="sm" />
      </div>

      <div className="space-y-2">
        {/* Ticket Description (Truncated) */}
        <p className="text-sm text-slate-700 line-clamp-2">
          {ticket.description}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {userRole === "ADMIN" && ticket.client_name && (
            <div>
              <p className="font-medium text-slate-900">Client</p>
              <p className="text-slate-600">{ticket.client_name}</p>
            </div>
          )}
          {userRole === "ADMIN" && ticket.company_name && (
            <div>
              <p className="font-medium text-slate-900">Company</p>
              <p className="text-slate-600">{ticket.company_name}</p>
            </div>
          )}
          {userRole !== "CLIENT" && (
            <div>
              <p className="font-medium text-slate-900">
                {userRole === "ADMIN" ? "Assigned" : "Client"}
              </p>
              <p className="text-slate-600">
                {userRole === "ADMIN"
                  ? ticket.assigned_member || "Unassigned"
                  : ticket.client_name || "-"}
              </p>
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">Created</p>
            <p className="text-slate-600">
              {new Date(ticket.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onView}
        className="w-full py-2 text-blue-600 hover:bg-blue-50 font-semibold text-sm rounded-lg transition"
      >
        {userRole === "ADMIN" ? "Manage" : "View"} →
      </button>
    </div>
  );
}