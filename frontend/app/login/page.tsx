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
        setError("Invalid username/email or password");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white relative overflow-hidden">
      {/* Dynamic Keyframes Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-main {
          0%, 100% { transform: translate(65px, 75px) translateY(0px) rotate(0deg); }
          50% { transform: translate(65px, 75px) translateY(-10px) rotate(1deg); }
        }
        @keyframes float-a {
          0%, 100% { transform: translate(30px, 35px) translateY(0px) rotate(-15deg); }
          50% { transform: translate(30px, 35px) translateY(-6px) rotate(-12deg); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(130px, 125px) translateY(0px) rotate(12deg); }
          50% { transform: translate(130px, 125px) translateY(-8px) rotate(8deg); }
        }
        @keyframes float-c {
          0%, 100% { transform: translate(135px, 35px) translateY(0px) rotate(-8deg); }
          50% { transform: translate(135px, 35px) translateY(-7px) rotate(-5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); filter: blur(60px); }
          50% { opacity: 0.35; transform: scale(1.15); filter: blur(80px); }
        }
        @keyframes tech-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-float-main { animation: float-main 6s ease-in-out infinite; }
        .animate-float-a { animation: float-a 5s ease-in-out infinite; }
        .animate-float-b { animation: float-b 6s ease-in-out infinite 1s; }
        .animate-float-c { animation: float-c 7s ease-in-out infinite 2s; }
        .animate-pulse-glow-blue { animation: pulse-glow 8s ease-in-out infinite; }
        .animate-pulse-glow-purple { animation: pulse-glow 10s ease-in-out infinite; }
        .animate-tech-pulse { animation: tech-pulse 2s ease-in-out infinite; }
        .cyber-grid {
          background-image: 
            linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}} />

      {/* FUTURISTIC WATERMARK BACKGROUND LAYER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Cyber Grid */}
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full animate-pulse-glow-blue z-0"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full animate-pulse-glow-purple z-0"></div>
        
        {/* Futuristic rotated watermark text */}
        <div className="absolute right-[-10%] top-[40%] text-[8vw] font-black font-mono tracking-widest text-slate-800/10 leading-none uppercase rotate-[348deg] select-none">
          TICKET_SYS_2.0
        </div>
        <div className="absolute left-[-5%] bottom-[10%] text-[6vw] font-black font-mono tracking-wider text-slate-800/5 leading-none uppercase rotate-[15deg] select-none">
          SECURE_ACCESS
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[85vh] relative z-10">
        
        {/* LEFT TECHNICAL BRANDING SECTION */}
        <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/60 lg:border-r border-slate-850 backdrop-blur-sm">
          <div className="space-y-10 max-w-md w-full flex flex-col items-center">
            
            {/* BRANDING */}
            <div className="flex flex-col items-center text-center space-y-4">
              <Image src="/Elements/silicon logo.png" alt="Silicon Systems Logo" width={100} height={100} className="w-36 h-12 mb-2" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></div>
                <span className="text-xs uppercase tracking-[3px] text-purple-400 font-bold">Secure Gateway</span>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Silicon HelpDesk
              </h1>
              <p className="text-slate-400 text-sm font-medium">Next-Generation Support & Issue Tracking</p>
            </div>

            {/* Futuristic Animated Tech Core / Reactor */}
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Ambient backing glow */}
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute inset-4 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>

              {/* SVG Tech Reactor */}
              <svg className="w-full h-full relative z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Connecting tech network lines (static, no clock rotation) */}
                <g opacity="0.4" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1" strokeDasharray="3 5">
                  <line x1="100" y1="100" x2="50" y2="49" stroke="#3b82f6" strokeWidth="0.8" />
                  <line x1="100" y1="100" x2="150" y2="139" stroke="#a855f7" strokeWidth="0.8" />
                  <line x1="100" y1="100" x2="155" y2="49" stroke="#ec4899" strokeWidth="0.8" />
                  <circle cx="100" cy="100" r="70" fill="none" />
                </g>

                {/* Pulsing network node points */}
                <circle cx="50" cy="49" r="2.5" fill="#3b82f6" className="animate-pulse" />
                <circle cx="150" cy="139" r="2.5" fill="#a855f7" className="animate-pulse" />
                <circle cx="155" cy="49" r="2.5" fill="#ec4899" className="animate-pulse" />

                {/* 1. Main Central Ticket */}
                <g className="animate-float-main">
                  {/* Outer Ticket Path (width=70, height=50, notch at x=0/70, y=25) */}
                  <path d="M 5,0 
                           L 65,0 
                           A 5,5 0 0,1 70,5 
                           L 70,18 
                           A 5,5 0 0,0 70,27 
                           L 70,45 
                           A 5,5 0 0,1 65,50 
                           L 5,50 
                           A 5,5 0 0,1 0,45 
                           L 0,27 
                           A 5,5 0 0,0 0,18 
                           L 0,5 
                           A 5,5 0 0,1 5,0 Z" 
                        fill="rgba(168, 85, 247, 0.15)" 
                        stroke="url(#ticketBorderGrad)" 
                        strokeWidth="1.5" 
                        className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />

                  {/* Dotted Perforation Line */}
                  <line x1="20" y1="2" x2="20" y2="48" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1.2" strokeDasharray="3 3" />

                  {/* Barcode lines */}
                  <g opacity="0.8">
                    <line x1="6" y1="12" x2="6" y2="38" stroke="#3b82f6" strokeWidth="1" />
                    <line x1="9" y1="12" x2="9" y2="38" stroke="#3b82f6" strokeWidth="2.5" />
                    <line x1="12" y1="12" x2="12" y2="38" stroke="#3b82f6" strokeWidth="1" />
                    <line x1="15" y1="12" x2="15" y2="38" stroke="#3b82f6" strokeWidth="1.5" />
                  </g>

                  {/* Metadata lines */}
                  <line x1="28" y1="15" x2="58" y2="15" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="28" y1="22" x2="62" y2="22" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="28" y1="29" x2="52" y2="29" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Glowing Status indicator */}
                  <circle cx="31" cy="38" r="2.5" fill="#10b981" className="animate-pulse" />
                  <text x="38" y="41" fill="rgba(255, 255, 255, 0.8)" fontSize="7" fontFamily="monospace" fontWeight="bold">#INC</text>
                </g>

                {/* 2. Mini Ticket A (Top Left) */}
                <g className="animate-float-a">
                  <path d="M 3,0 L 37,0 A 3,3 0 0,1 40,3 L 40,10 A 3,3 0 0,0 40,16 L 40,23 A 3,3 0 0,1 37,26 L 3,26 A 3,3 0 0,1 0,23 L 0,16 A 3,3 0 0,0 0,10 L 0,3 A 3,3 0 0,1 3,0 Z" 
                        fill="rgba(59, 130, 246, 0.1)" 
                        stroke="rgba(59, 130, 246, 0.5)" 
                        strokeWidth="1" />
                  <line x1="12" y1="2" x2="12" y2="24" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="0.8" strokeDasharray="2 2" />
                  <line x1="17" y1="9" x2="32" y2="9" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                  <line x1="17" y1="14" x2="35" y2="14" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                  <circle cx="20" cy="20" r="1.5" fill="#3b82f6" />
                </g>

                {/* 3. Mini Ticket B (Bottom Right) */}
                <g className="animate-float-b">
                  <path d="M 3,0 L 37,0 A 3,3 0 0,1 40,3 L 40,10 A 3,3 0 0,0 40,16 L 40,23 A 3,3 0 0,1 37,26 L 3,26 A 3,3 0 0,1 0,23 L 0,16 A 3,3 0 0,0 0,10 L 0,3 A 3,3 0 0,1 3,0 Z" 
                        fill="rgba(236, 72, 153, 0.1)" 
                        stroke="rgba(236, 72, 153, 0.5)" 
                        strokeWidth="1" />
                  <line x1="12" y1="2" x2="12" y2="24" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="0.8" strokeDasharray="2 2" />
                  <line x1="17" y1="9" x2="32" y2="9" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                  <line x1="17" y1="14" x2="35" y2="14" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                  <circle cx="20" cy="20" r="1.5" fill="#ec4899" />
                </g>

                {/* 4. Mini Ticket C (Top Right) */}
                <g className="animate-float-c">
                  <path d="M 3,0 L 37,0 A 3,3 0 0,1 40,3 L 40,10 A 3,3 0 0,0 40,16 L 40,23 A 3,3 0 0,1 37,26 L 3,26 A 3,3 0 0,1 0,23 L 0,16 A 3,3 0 0,0 0,10 L 0,3 A 3,3 0 0,1 3,0 Z" 
                        fill="rgba(168, 85, 247, 0.1)" 
                        stroke="rgba(168, 85, 247, 0.5)" 
                        strokeWidth="1" />
                  <line x1="12" y1="2" x2="12" y2="24" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="0.8" strokeDasharray="2 2" />
                  <line x1="17" y1="9" x2="32" y2="9" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                  <line x1="17" y1="14" x2="35" y2="14" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                  <circle cx="20" cy="20" r="1.5" fill="#a855f7" />
                </g>

                {/* Gradients definitions */}
                <defs>
                  <linearGradient id="ticketBorderGrad" x1="0" y1="0" x2="60" y2="45" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Floating particles or tech details surrounding */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Concentric rotating tech border */}
                <div className="absolute w-60 h-60 rounded-full border border-dashed border-slate-800 animate-[spin_50s_linear_infinite]"></div>
                
                {/* Tech lines floating text */}
                <div className="absolute text-[8px] font-mono text-blue-500/40 select-none tracking-[5px] uppercase animate-pulse bottom-2">
                  Secure Link Active
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT AUTHENTICATION SECTION */}
        <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md space-y-8 bg-slate-900/40 p-8 rounded-2xl border border-slate-800/85 backdrop-blur-md shadow-2xl">
            {/* CARD HEADER */}
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
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
                  Username or Email
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-850/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  placeholder="username or email"
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
                  className="w-full px-4 py-3 bg-slate-850/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
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
                className={`w-full px-4 py-3 rounded-lg font-semibold uppercase tracking-wide text-sm transition-all duration-200 ${
                  loading
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:bg-blue-800 text-white"
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
          </div>
        </div>
      </div>

      {/* PORTAL FOOTER SECTION */}
      <footer className="bg-slate-900 border-t border-slate-850 text-slate-300 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* About Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-wider uppercase">About</h3>
              <div className="w-10 h-0.5 bg-purple-600 rounded"></div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Founded in 2010, evolving into a global IT leader, serving 1000+ clients with scalable, future-ready solutions across industries.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-purple-500/30 flex items-center justify-center text-purple-400 bg-purple-500/10 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Phone</p>
                <p className="text-white text-base font-bold tracking-wide hover:text-purple-400 transition cursor-pointer">
                  +91 8240979738
                </p>
              </div>
            </div>
          </div>

          {/* Explore Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-wider uppercase">Explore</h3>
              <div className="w-10 h-0.5 bg-purple-600 rounded"></div>
            </div>
            <ul className="space-y-3">
              {[
                { name: "Company Overview", url: "https://silicongenxglobal.com/company-overview/" },
                { name: "Our Gallery", url: "https://silicongenxglobal.com/our-gallery/" },
                { name: "Our Clients", url: "https://silicongenxglobal.com/our-clients/" },
                { name: "Contact", url: "https://silicongenxglobal.com/contact-us/" }
              ].map((item, idx) => (
                <li key={idx}>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 group text-slate-400 hover:text-white hover:pl-2 transition-all duration-300 py-0.5 text-sm"
                  >
                    <span className="text-purple-500 text-[10px] group-hover:translate-x-1 group-hover:text-purple-400 transition-all shrink-0">▶</span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Box Column */}
          <div className="lg:pl-2">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl hover:border-purple-500/40 transition duration-300">
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-white tracking-wider uppercase">Contact</h3>
                
                <div className="space-y-4">
                  {/* Phone contact */}
                  <div className="flex gap-3 items-start">
                    <svg className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-slate-300 text-xs font-semibold hover:text-purple-400 transition cursor-pointer">
                      +91 8240979738
                    </p>
                  </div>
                  {/* Email contact */}
                  <div className="flex gap-3 items-start">
                    <svg className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:info@silicongenxglobal.com" className="text-slate-300 text-xs font-semibold hover:text-purple-400 transition break-all">
                      info@silicongenxglobal.com
                    </a>
                  </div>
                  {/* Address contact */}
                  <div className="flex gap-3 items-start">
                    <svg className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Thacker House, 35 Chittaranjan Avenue, Beside Chandni Chowk Gate No. 5, 5th Floor, Room 24, Kolkata - 700012
                    </p>
                  </div>
                </div>
              </div>

              {/* Estimate Button */}
              <button className="w-full py-4 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xs uppercase tracking-widest transition duration-200 text-center border-t border-purple-800">
                Get A Free Estimate
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500 space-y-1">
          <p className="font-mono">Silicon Systems HelpDesk v1.0.0</p>
          <p>© 2026 Enterprise Issue Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
