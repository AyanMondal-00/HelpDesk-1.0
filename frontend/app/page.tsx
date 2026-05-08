/**
 * @file page.tsx
 * @description Landing page for the Silicon Systems HelpDesk.
 * Features a hero section, key features overview, and navigation to login.
 */

import Link from "next/link";
import Image from "next/image";

/**
 * Home component representing the public landing page.
 * 
 * @returns {JSX.Element} The rendered landing page.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/Elements/silicon logo.png" alt="Silicon Systems Logo" width={40} height={40} className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-blue-600">Silicon Systems HelpDesk</h1>
          </div>
          <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-800 transition">
            Sign In
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-slate-900 leading-tight">
              Enterprise Issue Management Platform
            </h1>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto">
              Streamline ticket management, team collaboration, and issue resolution with real-time analytics
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-6">
            <Link href="/login" className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-800 transition shadow-lg">
              Get Started
            </Link>
            <button className="px-8 py-3.5 border border-slate-200 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition">
              Learn More
            </button>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Ticketing</h3>
            <p className="text-slate-600">Advanced issue tracking with status workflows and real-time updates</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">System Analytics</h3>
            <p className="text-slate-600">Comprehensive dashboards with performance metrics and insights</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Role-Based Access</h3>
            <p className="text-slate-600">Multi-tier permission system for admins, members, and clients</p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Silicon Systems HelpDesk</h4>
              <p className="text-slate-400 text-sm">Enterprise-grade issue management system</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Silicon Systems HelpDesk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
