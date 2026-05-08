/**
 * @file create/page.tsx
 * @description Administrator page for creating new users in the HelpDesk system.
 * Handles creation of ADMIN, MEMBER, and CLIENT accounts with role-specific profile data.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import Link from "next/link";

/**
 * @interface CompanyType
 * @description Structure for company type options (e.g., Enterprise, Startup).
 */
interface CompanyType {
    id: number;
    name: string;
}

/**
 * @interface Issue
 * @description Structure for issue categories, used to define member specialties.
 */
interface Issue {
    id: number;
    name: string;
}

/**
 * @interface CreateUserPayload
 * @description Comprehensive structure for the user creation API request.
 */
interface CreateUserPayload extends Record<string, unknown> {
    username: string;
    email: string;
    password: string;
    role: string;
    company_name?: string;
    company_type_id?: number;
    whatsapp_number?: string;
    contract_duration?: string;
    specialty_id?: number;
}

/**
 * @component CreateUserPage
 * @description Page component that provides a multi-role user creation form.
 */
export default function CreateUserPage() {
    const router = useRouter();

    // --- State Management ---

    // UI Loading state
    const [loading, setLoading] = useState(false);
    
    // User role selection (determines which form sections are visible)
    const [role, setRole] = useState("CLIENT");

    // Base User fields
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Client-specific profile fields
    const [companyName, setCompanyName] = useState("");
    const [companyType, setCompanyType] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [contractData, setContractData] = useState("");

    // Member-specific profile fields
    const [specialty, setSpecialty] = useState("");

    // Dropdown options fetched from the API
    const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);

    /**
     * @effect
     * @description Enforces admin authentication and fetches lookup data for dropdowns.
     */
    useEffect(() => {
        // Enforce ADMIN role check
        if (localStorage.getItem("user_role") !== "ADMIN") {
            router.push("/dashboard");
            return;
        }

        /**
         * @function fetchData
         * @description Fetches auxiliary data needed for form selection fields.
         */
        const fetchData = async () => {
            try {
                // Fetch company types for Client profile
                const companyTypesData: unknown = await apiGet("/api/company-types/");
                if (companyTypesData && typeof companyTypesData === "object") {
                    const types = (companyTypesData as { results?: CompanyType[] }).results || (companyTypesData as CompanyType[]);
                    setCompanyTypes(Array.isArray(types) ? types : []);
                }

                // Fetch issues for Member specialty assignment
                const issuesData: unknown = await apiGet("/api/issues/");
                if (issuesData && typeof issuesData === "object") {
                    const issueList = (issuesData as { results?: Issue[] }).results || (issuesData as Issue[]);
                    setIssues(Array.isArray(issueList) ? issueList : []);
                }
            } catch (error) {
                console.error("Failed to fetch dropdown data:", error);
            }
        };
        fetchData();
    }, [router]);

    /**
     * @function handleSubmit
     * @description Processes the form, constructs the role-aware payload, and submits to the API.
     * @param {React.FormEvent} e - The form submission event.
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Construct base payload required for all users
            const payload: CreateUserPayload = {
                username,
                email,
                password,
                role,
            };

            // 2. Add role-specific profile data
            if (role === "CLIENT") {
                payload.company_name = companyName;
                payload.company_type_id = parseInt(companyType, 10);
                payload.whatsapp_number = whatsapp;
                if (contractData) payload.contract_duration = contractData;
            } else if (role === "MEMBER") {
                // Member specialty relates to issue categories
                payload.specialty_id = parseInt(specialty, 10);
            }

            // 3. Submit the integrated user + profile payload
            await apiPost("/api/users/", payload);
            alert("User created successfully!");
            
            // Navigate back to user list on success
            router.push("/dashboard/users");

        } catch (error: unknown) {
            console.error("Create user error", error);
            
            // Handle and display structured error messages from the backend
            let msg = "Failed to create user.";
            if (error instanceof Error) {
                msg = error.message;
            } else if (error && typeof error === "object") {
                const entries = Object.entries(error).map(([k, v]) => `${k}: ${v}`).join("\n");
                if (entries) msg = entries;
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* PAGE HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Create New User</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Add a new member or client to the system
                    </p>
                </div>
                <Link
                    href="/dashboard/users"
                    className="text-slate-500 hover:text-slate-800 px-4 py-2 font-medium transition"
                >
                    Cancel
                </Link>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* BASE ACCOUNT INFORMATION SECTION */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">Account Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Username <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>

                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>

                            {/* Role Selection (Drives dynamic sections below) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Account Role <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none bg-slate-50 font-medium text-indigo-700"
                                >
                                    <option value="CLIENT">Client (End User)</option>
                                    <option value="MEMBER">Member (Support Staff)</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* CLIENT-SPECIFIC PROFILE SECTION */}
                    {role === "CLIENT" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">Client Profile</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Company Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Company Name <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>

                                {/* Company Type (Fetched from API) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Company Type <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={companyType}
                                        onChange={(e) => setCompanyType(e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                    >
                                        <option value="">Select a type...</option>
                                        {companyTypes.map((ct) => (
                                            <option key={ct.id} value={ct.id}>{ct.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">WhatsApp Number <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        placeholder="+1234567890"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>

                                {/* Optional Contract Duration */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Contract Duration</label>
                                    <input
                                        type="text"
                                        value={contractData}
                                        onChange={(e) => setContractData(e.target.value)}
                                        placeholder="e.g. 1 Year, Monthly"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MEMBER-SPECIFIC PROFILE SECTION */}
                    {role === "MEMBER" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">Support Profile</h2>

                            {/* Specialty Selection (Linked to Issue categories) */}
                            <div className="space-y-2 max-w-md">
                                <label className="text-sm font-medium text-slate-700">Issue Specialty <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                                >
                                    <option value="">Select issue specialty...</option>
                                    {issues.map((issue) => (
                                        <option key={issue.id} value={issue.id}>{issue.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">This determines which tickets get assigned to this member.</p>
                            </div>
                        </div>
                    )}

                    {/* SUBMIT ACTION */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full p-4 rounded-xl text-white font-bold text-lg transition-all ${loading
                                    ? "bg-indigo-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                                }`}
                        >
                            {loading ? "Creating User..." : "Create User"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
