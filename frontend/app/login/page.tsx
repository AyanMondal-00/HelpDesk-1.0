/**
 * @file page.tsx (Login)
 * @description Login page for the HelpDesk system.
 * Handles user authentication via JWT and manages session persistence.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * LoginPage component that provides the user authentication interface.
 * 
 * @returns {JSX.Element} The rendered login page.
 */
export default function LoginPage() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [username, setUsername] = useState(""); // Stores user input for username
  const [password, setPassword] = useState(""); // Stores user input for password
  const [error, setError] = useState(""); // Stores error messages for display
  const [loading, setLoading] = useState(false); // Flag for authentication progress

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /**
   * Handles the login form submission.
   * Performs the authentication request and stores tokens on success.
   * 
   * @param {React.FormEvent} e - The form submission event.
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // REQUEST TOKENS FROM BACKEND
      const res = await fetch(
        `${API_URL}/api/token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (typeof window !== "undefined") {
          // STORE TOKENS IN LOCAL STORAGE
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          
          // DECODE JWT PAYLOAD
          // JWT payload is the middle part of the token (base64 encoded)
          const payload = JSON.parse(atob(data.access.split('.')[1]));
          localStorage.setItem("user_id", payload.user_id.toString());
          
          // PERSIST USERNAME FOR UI USE
          localStorage.setItem("username", username);
          
          // FETCH ADDITIONAL USER INFO IF NOT IN JWT
          if (payload.role) {
            localStorage.setItem("user_role", payload.role);
          } else {
            try {
              const meRes = await fetch(`${API_URL}/api/me/`, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.access}`,
                },
              });
              if (meRes.ok) {
                const me = await meRes.json();
                if (me?.role) localStorage.setItem("user_role", me.role);
                if (me?.username) localStorage.setItem("username", me.username);
              }
            } catch {
              /* noop - fail silently, defaults will be used */
            }
          }
        }
        // REDIRECT TO DASHBOARD ON SUCCESS
        router.push("/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      
      {/* LEFT TECHNICAL BRANDING SECTION */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:border-r border-slate-700">
        <div className="space-y-6 lg:space-y-10 max-w-sm">
          {/* BRANDING */}
          <div className="flex flex-col items-center text-center">
            <Image src="/Elements/silicon logo.png" alt="Silicon Systems Logo" width={100} height={100} className="w-36 h-12 mb-6" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs uppercase tracking-[2px] text-blue-400 font-semibold">System Access</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
              Silicon Systems HelpDesk
            </h1>
            <h2 className="text-xl text-slate-300 font-medium">Issue Management Platform</h2>
          </div>
        </div>
      </div>

      {/* RIGHT AUTHENTICATION SECTION */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* CARD HEADER */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Authenticate
            </h2>
            <p className="text-sm text-slate-400">
              Enter your credentials to access the system
            </p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* USERNAME FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                placeholder="your.username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-lg font-medium flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM10 9a1 1 0 100-2 1 1 0 000 2zm3 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 rounded-lg font-semibold uppercase tracking-wide text-sm transition-all ${
                loading
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating…</span>
                </div>
              ) : (
                "Authenticate Access"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="border-t border-slate-800 pt-6 text-center space-y-1">
            <p className="text-xs text-slate-500 font-mono">Silicon Systems HelpDesk v1.0.0</p>
            <p className="text-xs text-slate-600">© 2026 Enterprise Issue Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
