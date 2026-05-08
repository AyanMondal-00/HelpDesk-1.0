/**
 * @file layout.tsx (Dashboard)
 * @description Layout component for the dashboard area.
 * Handles authentication checks, sidebar navigation, and user session management.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiGet, apiPost } from "@/lib/api";

/**
 * DashboardLayout component that provides the authenticated shell for the application.
 * 
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The page content to be rendered within the dashboard.
 * @returns {JSX.Element} The rendered dashboard layout.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- STATE MANAGEMENT ---
  const [role, setRole] = useState<string | null>(null); // Stores the user's role (ADMIN, MEMBER, CLIENT)
  const [username, setUsername] = useState<string | null>(null); // Stores the logged-in user's name
  const [loading, setLoading] = useState(true); // Flag for authentication check progress
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controls mobile sidebar visibility
  const router = useRouter();
  const pathname = usePathname();

  // TRACKING SIDEBAR STATE PER PATH
  const [lastToggledPath, setLastToggledPath] = useState(pathname);
  const isSidebarOpen = sidebarOpen && pathname === lastToggledPath;

  /**
   * Logs out the user by blacklisting the refresh token and clearing local storage.
   */
  async function handleLogout() {
    const refresh = localStorage.getItem("refresh");

    try {
      if (refresh) {
        // Attempt to notify backend about logout
        await apiPost("/api/logout/", { refresh });
      }
    } catch (err) {
      console.error("Logout error", err);
    }

    // Clear all session data
    localStorage.clear();
    router.push("/login");
  }

  // --- SIDE EFFECTS ---
  /**
   * Effect to verify user authentication on component mount or router change.
   * Fetches the current user profile and sets session details.
   */
  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      // No token found, redirect to login
      router.push("/login");
      return;
    }

    // Fetch user info from /api/me/
    apiGet("/api/me/")
      .then((data) => {
        setRole(data.role);
        setUsername(data.username);
        // Persist session details in localStorage for synchronous access in other components
        localStorage.setItem("user_role", data.role);
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("username", data.username);
        setLoading(false);
      })
      .catch(() => {
        // If profile fetch fails, token might be invalid/expired
        localStorage.clear();
        router.push("/login");
      });
  }, [router]);

  // Show loading state while authenticating
  if (loading) {
    return <div className="p-8 text-slate-500">Authenticating...</div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* DARK SIDEBAR */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 p-6 flex flex-col justify-between h-screen border-r border-slate-800 transition-transform duration-300 ease-in-out z-40 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div>
          <div className="mb-8 flex flex-col items-center text-center">
            <Image src="/Elements/silicon logo.png" alt="Silicon Systems Logo" width={60} height={60} className="w-30 h-10 mb-3" />
            <div className="min-w-0">
              <p className="text-sm text-slate-300">Silicon Systems</p>
              <h2 className="text-lg font-bold text-white leading-tight">HelpDesk</h2>
              <p className="text-xs text-slate-400 mt-1">Control Center</p>
            </div>
          </div>

          <nav className="space-y-2">
            <MenuItem label="System Overview" href="/dashboard" />

            {/* ROLE-BASED NAVIGATION */}
            {role === "CLIENT" && (
              <>
                <MenuItem label="Create Issue" href="/dashboard/tickets/create" />
                <MenuItem label="My Issues" href="/dashboard/tickets" />
              </>
            )}

            {role === "MEMBER" && (
              <>
                <MenuItem label="Assigned Issues" href="/dashboard/tickets" />
              </>
            )}

            {role === "ADMIN" && (
              <>
                <MenuItem label="Issue Tracking" href="/dashboard/tickets" />
                <MenuItem label="User Directory" href="/dashboard/users" />
              </>
            )}
          </nav>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-400 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">👤 {username || role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-red-600/20 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="w-full flex-1 flex flex-col min-h-screen lg:ml-64 relative">
        {/* TOP HEADER */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200/60 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center gap-2">
          {/* MOBILE TOGGLE */}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setLastToggledPath(pathname);
            }}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
            title="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* ROLE BADGE */}
          <div className="text-xs md:text-sm text-slate-500 flex-shrink-0">
            <span className="inline-block bg-blue-50 text-blue-700 px-2 md:px-3 py-1 rounded-lg font-medium text-xs">
              {role === "ADMIN" && "Administrator"}
              {role === "MEMBER" && "Support Member"}
              {role === "CLIENT" && "Client Portal"}
            </span>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            v1.0.0 | System Online
          </div>
        </div>

        {/* PAGE CONTENT CONTAINER */}
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * MenuItem component for sidebar navigation links.
 * 
 * @param {Object} props - The component props.
 * @param {string} props.label - Display text for the menu item.
 * @param {string} props.href - Destination URL.
 * @param {boolean} [props.external=false] - Whether the link is external.
 * @returns {JSX.Element} The rendered menu item.
 */
function MenuItem({
  label,
  href,
  external = false,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  const content = (
    <div className="px-4 py-3 flex items-center justify-between rounded-lg text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer transition font-medium group text-sm">
      <span>{label}</span>
      {external && (
        <svg
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}
