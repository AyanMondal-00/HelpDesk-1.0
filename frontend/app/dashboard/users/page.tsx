/**
 * @file users/page.tsx
 * @description User Directory page for Administrators.
 * Allows viewing, filtering, and basic management (editing) of all system users.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import Link from "next/link";

/**
 * @interface Issue
 * @description Represents a top-level issue category.
 */
interface Issue {
    id: number;
    name: string;
}

/**
 * @interface SubIssue
 * @description Represents a specific sub-category linked to a main issue.
 */
interface SubIssue {
    id: number;
    name: string;
    issue: number | { id: number };
}

/**
 * @interface UserProfile
 * @description Detailed representation of a user account including role-specific profiles.
 */
interface UserProfile {
    id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    date_joined: string;

    // Optional profile data for clients
    client_profile?: {
        id: number;
        company_name: string;
        company_type: string;
        whatsapp_number: string;
        contract_duration: string | null;
    };
    // Optional profile data for support members
    member_profile?: {
        specialty: string;
        is_active: boolean;
    };
}

/**
 * @interface UserEditForm
 * @description Structure for the user update form data.
 */
interface UserEditForm extends Record<string, unknown> {
    is_active?: boolean;
    company_name?: string;
    whatsapp_number?: string;
    contract_duration?: string;
    email?: string;
}

/**
 * @component UsersPage
 * @description Component providing a directory and management interface for users.
 */
export default function UsersPage() {
    // --- State Management ---

    // Full list of users fetched from the API
    const [users, setUsers] = useState<UserProfile[]>([]);
    
    // Loading state for initial data fetch
    const [loading, setLoading] = useState(true);
    
    // Current role filter (ALL, ADMIN, MEMBER, CLIENT)
    const [filterRole, setFilterRole] = useState<string>("ALL");

    // Modal & Editing State
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<UserEditForm>({});

    // Ticket creation states
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [subIssues, setSubIssues] = useState<SubIssue[]>([]);
    const [filteredSubIssues, setFilteredSubIssues] = useState<SubIssue[]>([]);
    const [ticketIssueId, setTicketIssueId] = useState("");
    const [ticketSubIssueId, setTicketSubIssueId] = useState("");
    const [ticketDescription, setTicketDescription] = useState("");
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketError, setTicketError] = useState<string | null>(null);
    const [ticketSubmitLoading, setTicketSubmitLoading] = useState(false);
    const [ticketSuccess, setTicketSuccess] = useState(false);

    const router = useRouter();

    /**
     * @effect
     * @description Enforces ADMIN-only access and fetches user data on mount.
     */
    useEffect(() => {
        const role = localStorage.getItem("user_role");
        if (role !== "ADMIN") {
            // Redirect non-admins back to the main dashboard
            router.push("/dashboard");
            return;
        }
        fetchUsers();
    }, [router]);

    /**
     * @function fetchUsers
     * @description Retrieves the list of all users from the backend.
     */
    async function fetchUsers() {
        setLoading(true);
        try {
            const data: unknown = await apiGet("/api/users/");
            if (data && typeof data === "object") {
                // Handle potentially paginated results
                const results = (data as { results?: UserProfile[] }).results || (data as UserProfile[]);
                setUsers(Array.isArray(results) ? results : [data as UserProfile]);
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : "Failed to load users";
            console.error("Error loading users:", errorMsg);
            alert("Error loading users");
        } finally {
            setLoading(false);
        }
    }

    // --- Filtering Logic ---

    // Filter users based on the currently selected role
    const filteredUsers = filterRole === "ALL" ? users : users.filter(u => u.role === filterRole);

    // Calculate counts for the filter buttons
    const roleCounts = {
        total: users.length,
        admin: users.filter(u => u.role === "ADMIN").length,
        member: users.filter(u => u.role === "MEMBER").length,
        client: users.filter(u => u.role === "CLIENT").length,
    };

    /**
     * @function handleUserClick
     * @description Opens the user detail modal and initializes the edit form state.
     * @param {UserProfile} user - The user object that was clicked.
     */
    const handleUserClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditing(false);
        setIsCreatingTicket(false);

        // Initialize edit form state with current values from the user profile
        setEditForm({
            is_active: user.is_active,
            email: user.email,
            // If it's a client, grab their specific organization fields
            ...(user.role === "CLIENT" && user.client_profile ? {
                company_name: user.client_profile.company_name,
                whatsapp_number: user.client_profile.whatsapp_number,
                contract_duration: user.client_profile.contract_duration || "",
            } : {})
        });
    };

    /**
     * @function handleSaveEdit
     * @description Submits the user updates to the backend and refreshes the local state.
     */
    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        try {
            // Send a PATCH request with the updated fields
            const updatedUser = await apiPatch(`/api/users/${selectedUser.id}/`, editForm);
            alert("User updated successfully!");

            // Update the user in the local list to reflect changes immediately
            setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(updatedUser);
            setIsEditing(false);
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : "Failed to update user";
            console.error("Error updating user:", errorMsg);
            alert("Failed to update user: " + errorMsg);
        }
    };

    /**
     * @effect
     * @description Filters sub-issues whenever the selected issue category changes.
     */
    useEffect(() => {
        const filtered = subIssues.filter(
            (sub) => {
                const issueValue = sub.issue;
                const issueIdToCompare = typeof issueValue === 'object' && issueValue !== null ? String((issueValue as { id: number }).id) : String(issueValue);
                return issueIdToCompare === ticketIssueId;
            }
        );
        setFilteredSubIssues(filtered);
        setTicketSubIssueId("");
    }, [ticketIssueId, subIssues]);

    /**
     * @function handleCreateTicketClick
     * @description Prepares the ticket creation form and loads issues & sub-issues from API.
     */
    const handleCreateTicketClick = async () => {
        setIsCreatingTicket(true);
        setTicketIssueId("");
        setTicketSubIssueId("");
        setTicketDescription("");
        setTicketError(null);
        setTicketSuccess(false);

        if (issues.length === 0) {
            setTicketLoading(true);
            try {
                const issuesData: unknown = await apiGet("/api/issues/");
                const issuesList = Array.isArray(issuesData) ? issuesData : ((issuesData as { results?: Issue[] }).results || []);
                setIssues(issuesList as Issue[]);

                const subIssuesData: unknown = await apiGet("/api/subissues/");
                const subIssuesList = Array.isArray(subIssuesData) ? subIssuesData : ((subIssuesData as { results?: SubIssue[] }).results || []);
                setSubIssues(subIssuesList as SubIssue[]);
            } catch (err: unknown) {
                console.error("Failed to load options:", err);
                setTicketError("Failed to load issue categories.");
            } finally {
                setTicketLoading(false);
            }
        }
    };

    /**
     * @function handleTicketSubmit
     * @description Submits a new ticket for the selected client.
     */
    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !selectedUser.client_profile) return;

        setTicketSubmitLoading(true);
        setTicketError(null);

        try {
            const clientId = selectedUser.client_profile.id;
            if (!clientId) {
                throw new Error("Client ID not found.");
            }

            await apiPost("/api/tickets/create/", {
                issue: ticketIssueId ? Number(ticketIssueId) : null,
                sub_issue: ticketSubIssueId ? Number(ticketSubIssueId) : null,
                description: ticketDescription,
                client: clientId
            });

            setTicketSuccess(true);
            setTimeout(() => {
                setIsCreatingTicket(false);
                setSelectedUser(null);
            }, 1500);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Failed to create ticket";
            console.error("Error creating ticket:", err);
            setTicketError(errorMsg);
        } finally {
            setTicketSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* PAGE HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Directory</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage team members and client accounts</p>
                </div>
                <Link href="/dashboard/users/create" className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm flex items-center gap-2">
                    <span>+</span> Add User
                </Link>
            </div>

            {/* ROLE FILTER NAVIGATION */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">Filter by Role</p>
                    {filterRole !== "ALL" && (
                        <button
                            onClick={() => setFilterRole("ALL")}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium self-start sm:self-auto"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <RoleFilterButton
                        label="All Users"
                        count={roleCounts.total}
                        value="ALL"
                        isActive={filterRole === "ALL"}
                        onClick={() => setFilterRole("ALL")}
                    />
                    <RoleFilterButton
                        label="Administrators"
                        count={roleCounts.admin}
                        value="ADMIN"
                        isActive={filterRole === "ADMIN"}
                        onClick={() => setFilterRole("ADMIN")}
                        icon="👑"
                        color="purple"
                    />
                    <RoleFilterButton
                        label="Members"
                        count={roleCounts.member}
                        value="MEMBER"
                        isActive={filterRole === "MEMBER"}
                        onClick={() => setFilterRole("MEMBER")}
                        icon="👥"
                        color="blue"
                    />
                    <RoleFilterButton
                        label="Clients"
                        count={roleCounts.client}
                        value="CLIENT"
                        isActive={filterRole === "CLIENT"}
                        onClick={() => setFilterRole("CLIENT")}
                        icon="🏢"
                        color="cyan"
                    />
                </div>
            </div>

            {/* USERS DATA TABLE */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-sm">Loading user database…</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No users found</h3>
                        <p className="text-slate-500 text-sm">No {filterRole !== "ALL" ? filterRole.toLowerCase() + " " : ""}users match your filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200/60">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User Account</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Company</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Date Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        className="hover:bg-blue-50/40 transition cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition">{user.username}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Role-specific display logic */}
                                            {user.role === "CLIENT" && user.client_profile ? (
                                                <div>
                                                    <p className="font-medium text-slate-700">{user.client_profile.company_name}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">📞 {user.client_profile.whatsapp_number}</p>
                                                </div>
                                            ) : user.role === "MEMBER" && user.member_profile ? (
                                                <div>
                                                    <p className="font-medium text-slate-700">{user.member_profile.specialty}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(user.date_joined).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* USER DETAILS & EDIT MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* MODAL HEADER */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                {isCreatingTicket ? `Create Ticket for ${selectedUser.username}` : selectedUser.username}
                                {!isCreatingTicket && <RoleBadge role={selectedUser.role} />}
                            </h3>
                            <div className="flex items-center gap-2">
                                {!isEditing && !isCreatingTicket && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setIsCreatingTicket(false);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* MODAL BODY (View/Edit Mode or Create Ticket Mode) */}
                        {isCreatingTicket ? (
                            <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">
                                {ticketLoading ? (
                                    <div className="py-6 text-center text-sm text-slate-500">Loading options...</div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Issue Category</label>
                                            <select
                                                value={ticketIssueId}
                                                onChange={(e) => setTicketIssueId(e.target.value)}
                                                required
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-800"
                                            >
                                                <option value="">— Select Category —</option>
                                                {issues.map(issue => (
                                                    <option key={issue.id} value={issue.id}>{issue.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Specific Issue Type</label>
                                            <select
                                                value={ticketSubIssueId}
                                                onChange={(e) => setTicketSubIssueId(e.target.value)}
                                                required
                                                disabled={!ticketIssueId}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-800"
                                            >
                                                <option value="">— Select Subcategory —</option>
                                                {filteredSubIssues.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description</label>
                                            <textarea
                                                value={ticketDescription}
                                                onChange={(e) => setTicketDescription(e.target.value)}
                                                required
                                                rows={4}
                                                placeholder="Enter ticket description..."
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-800"
                                            />
                                        </div>

                                        {ticketSuccess && (
                                            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-xs font-medium">
                                                ✓ Ticket created successfully!
                                            </div>
                                        )}

                                        {ticketError && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-medium">
                                                {ticketError}
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setIsCreatingTicket(false)}
                                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={ticketSubmitLoading || !ticketIssueId || !ticketSubIssueId}
                                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition disabled:bg-blue-300"
                                            >
                                                {ticketSubmitLoading ? "Submitting..." : "Create Ticket"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        ) : (
                            <>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={editForm.email || ""}
                                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="mt-1 block w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-800 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            ) : (
                                                <div className="text-sm font-medium text-slate-800">{selectedUser.email}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase">Account Created</label>
                                            <div className="text-sm font-medium text-slate-800">{new Date(selectedUser.date_joined).toLocaleDateString()}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase">Account Status</label>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.is_active ? "true" : "false"}
                                                    onChange={e => setEditForm({ ...editForm, is_active: e.target.value === "true" })}
                                                    className="mt-1 block w-full text-sm rounded-lg border border-slate-200 bg-white focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                                                >
                                                    <option value="true">Active</option>
                                                    <option value="false">Inactive</option>
                                                </select>
                                            ) : (
                                                <div className="mt-1"><span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedUser.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{selectedUser.is_active ? "Active" : "Inactive"}</span></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Client-specific information */}
                                    {selectedUser.role === "CLIENT" && (
                                        <div className="pt-4 border-t border-slate-200 space-y-4">
                                            <h4 className="font-semibold text-slate-900">Organization Profile</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-400 uppercase">Company Name</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.company_name}
                                                            onChange={e => setEditForm({ ...editForm, company_name: e.target.value })}
                                                            className="mt-1 block w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-800"
                                                        />
                                                    ) : (
                                                        <div className="text-sm text-slate-800 font-medium">{selectedUser.client_profile?.company_name}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-400 uppercase">Contact Number</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.whatsapp_number}
                                                            onChange={e => setEditForm({ ...editForm, whatsapp_number: e.target.value })}
                                                            className="mt-1 block w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-800"
                                                        />
                                                    ) : (
                                                        <div className="text-sm text-slate-800 font-medium">{selectedUser.client_profile?.whatsapp_number}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {!isEditing && (
                                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateTicketClick}
                                                        className="w-full bg-blue-600 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition shadow-sm flex items-center justify-center gap-2"
                                                    >
                                                        <span>🎫</span> Create Ticket
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Member-specific information */}
                                    {selectedUser.role === "MEMBER" && (
                                        <div className="pt-4 border-t border-slate-200">
                                            <h4 className="font-semibold text-slate-900 mb-3">Technical Specialization</h4>
                                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium inline-block">
                                                {selectedUser.member_profile?.specialty}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-3">Specialization is system-defined.</p>
                                        </div>
                                    )}
                                </div>

                                {/* MODAL ACTIONS (Edit mode only) */}
                                {isEditing && (
                                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/60 flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-800 shadow-sm transition"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

/**
 * @component RoleBadge
 * @description A styled badge representing the user's system role.
 */
function RoleBadge({ role }: { role: string }) {
    const styles: Record<string, string> = {
        ADMIN: "bg-purple-100 text-purple-700 font-semibold",
        MEMBER: "bg-blue-100 text-blue-700 font-semibold",
        CLIENT: "bg-cyan-100 text-cyan-700 font-semibold",
    };
    return (
        <span className={`px-3 py-1 rounded-lg text-xs tracking-wide ${styles[role] || "bg-slate-100 text-slate-600"}`}>
            {role}
        </span>
    );
}

/**
 * @interface RoleFilterButtonProps
 */
interface RoleFilterButtonProps {
    label: string;
    count: number;
    value: string;
    isActive: boolean;
    onClick: () => void;
    icon?: string;
    color?: string;
}

/**
 * @component RoleFilterButton
 * @description A button used for filtering the user directory by role.
 */
function RoleFilterButton({
    label,
    count,
    value,
    isActive,
    onClick,
    icon,
    color = "slate",
}: RoleFilterButtonProps) {
    const colorMap: Record<string, string> = {
        purple: "bg-purple-100 text-purple-700 border-purple-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
        cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
        slate: "bg-slate-100 text-slate-700 border-slate-200",
    };

    const activeColorMap: Record<string, string> = {
        purple: "bg-purple-600 text-white border-purple-600",
        blue: "bg-blue-600 text-white border-blue-600",
        cyan: "bg-cyan-600 text-white border-cyan-600",
        slate: "bg-slate-600 text-white border-slate-600",
    };

    return (
        <button
            onClick={onClick}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all border flex items-center gap-2 whitespace-nowrap ${
                isActive
                    ? `${activeColorMap[color]} shadow-md`
                    : `${colorMap[color]} hover:shadow-sm`
            }`}
        >
            {icon && <span className="text-sm">{icon}</span>}
            {label}
            <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                        ? `${value === "ALL" ? "bg-slate-700/30" : "bg-white/30"}`
                        : "bg-current/20"
                }`}
            >
                {count}
            </span>
        </button>
    );
}
