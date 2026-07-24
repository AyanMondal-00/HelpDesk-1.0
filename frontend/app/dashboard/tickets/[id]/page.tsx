/**
 * @file [id]/page.tsx
 * @description Ticket detail page providing comprehensive information and management actions.
 * Users can view ticket details, track progress, participate in conversations, and update status/assignment.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import TicketChatbox from "@/components/tickets/TicketChatbox";

/**
 * @interface Ticket
 * @description Represents a detailed ticket object from the API.
 */
interface Ticket {
  id: number;
  ticket_number: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  client: number;
  issue: number;
  sub_issue: number;
  assigned_to: number | null;
  client_name: string;
  client_email: string;
  company_name: string;
  client_phone: string;
  issue_name: string;
  sub_issue_name: string;
  assigned_member: string | null;
}

/**
 * @interface Activity
 * @description Represents an audit log entry for ticket changes.
 */
interface Activity {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
}

/**
 * @interface Member
 * @description Represents a support team member eligible for assignment.
 */
interface Member {
  id: number;
  username: string;
}

/**
 * @interface UpdateTicketData
 * @description Structure for the ticket update request payload.
 */
interface UpdateTicketData extends Record<string, unknown> {
  status: string;
  assigned_to?: number;
}

/**
 * @component TicketDetailPage
 * @description The main page component for viewing and managing a single ticket.
 */
export default function TicketDetailPage() {
  const { id } = useParams();

  // --- State Management ---

  // Detailed ticket data
  const [ticket, setTicket] = useState<Ticket | null>(null);
  
  // List of status changes and assignments for the activity log
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Statuses the current ticket is allowed to transition to
  const [allowedStatuses, setAllowedStatuses] = useState<string[]>([]);
  
  // Current status selected in the update modal
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Members who can be assigned to this ticket (based on specialty)
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  
  // ID of the member selected for assignment in the update modal
  const [selectedMember, setSelectedMember] = useState("");
  
  // Loading state for update operations
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  
  // User context states
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  // UI visibility toggles
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Notification states
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  /**
   * @effect
   * @description Fetches all necessary ticket data and user context on component mount or ID change.
   */
  useEffect(() => {
    // Retrieve user details from localStorage
    const userRole = localStorage.getItem("user_role");
    setRole(userRole);
    setUserId(parseInt(localStorage.getItem("user_id") || "0", 10));
    setUserName(localStorage.getItem("username"));

    // Parallel fetch of ticket-related resources
    apiGet(`/api/tickets/${id}/`).then(setTicket);

    apiGet(`/api/tickets/${id}/activity/`).then((data) =>
      setActivities(data.results || data)
    );

    apiGet(`/api/tickets/${id}/allowed-transitions/`).then((data) => {
      setAllowedStatuses(data.allowed_statuses);
      setSelectedStatus(data.current_status);
    });

    if (userRole !== "CLIENT") {
      apiGet(`/api/tickets/${id}/eligible-members/`).then((data) =>
        setEligibleMembers(data.results || data)
      );
    }
  }, [id]);

  /**
   * @function updateTicket
   * @description Submits status and/or assignment changes to the backend.
   */
  async function updateTicket() {
    setLoadingUpdate(true);
    try {
      const updateData: UpdateTicketData = { status: selectedStatus };
      if (selectedMember) {
        updateData.assigned_to = parseInt(selectedMember, 10);
      }
      
      // Perform the patch update
      await apiPatch(`/api/tickets/${id}/update/`, updateData);

      // Refresh all ticket data to reflect changes
      const updatedTicket = await apiGet(`/api/tickets/${id}/`);
      setTicket(updatedTicket);

      const activitiesData = await apiGet(`/api/tickets/${id}/activity/`);
      setActivities(activitiesData.results || activitiesData);

      const transitionsData = await apiGet(`/api/tickets/${id}/allowed-transitions/`);
      setAllowedStatuses(transitionsData.allowed_statuses);
      setSelectedStatus(transitionsData.current_status);

      // Reset member selection
      setSelectedMember("");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update ticket";
      alert(`Update failed: ${errorMsg}`);
      console.error("Update error:", error);
    } finally {
      setLoadingUpdate(false);
    }
  }

  // Loading state placeholder
  if (!ticket)
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 text-lg">
        Loading ticket details...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs tracking-wider uppercase text-slate-400">
            Ticket #{typeof ticket.ticket_number === "string" && ticket.ticket_number.includes("-")
              ? ticket.ticket_number.split("-")[0]
              : String(ticket.ticket_number).slice(0, 8)}
          </p>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Support Request Details
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Full ID: {String(ticket.ticket_number)}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Main Information */}
        <div className="lg:col-span-2 space-y-8">

          {/* Ticket Information Details Card */}
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100 space-y-6">
            <h2 className="text-lg font-semibold text-slate-700">
              Ticket Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-400 uppercase text-xs">Company</p>
                <p className="text-slate-700 font-medium">{ticket.company_name}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-xs">Client</p>
                <p className="text-slate-700 font-medium">{ticket.client_name}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-xs">Email</p>
                <p className="text-slate-700 font-medium">{ticket.client_email}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-xs">Phone</p>
                <p className="text-slate-700 font-medium">{ticket.client_phone}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-xs">Issue</p>
                <p className="text-slate-700 font-medium">{ticket.issue_name}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-xs">Sub Issue</p>
                <p className="text-slate-700 font-medium">{ticket.sub_issue_name}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-xs">Assigned Member</p>
                <p className="text-slate-700 font-medium">
                  {ticket.assigned_member || "Not Assigned"}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <p className="text-slate-400 uppercase text-xs mb-2">Description</p>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {ticket.description}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions and Tools */}
        <div className="space-y-4">

          {/* TICKET PROGRESS PANEL TOGGLE */}
          <div>
            <button
              onClick={() => setShowProgressPanel(!showProgressPanel)}
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ticket Progress
              </span>
              <svg className={`w-4 h-4 transition-transform ${showProgressPanel ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* EXPANDABLE PROGRESS TIMELINE */}
            {showProgressPanel && (
              <div className="mt-2 bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
                <div
                  className="px-6 py-4 flex items-center gap-2"
                  style={{
                    background: "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
                  }}
                >
                  <svg className="w-4 h-4 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-white font-semibold text-sm tracking-wide">
                    Ticket Progress
                  </span>
                </div>
                <div className="p-6">
                  <TicketProgressBar currentStatus={ticket.status} activities={activities} />
                </div>
              </div>
            )}
          </div>

          {/* CONVERSATION MODAL TOGGLE */}
          <button
            onClick={() => {
              setShowConversationModal(true);
              setUnreadCount(0);
              setShowNotification(false);
            }}
            className="w-full p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 relative"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Conversation
            {/* Unread Message Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* UPDATE TICKET MODAL TOGGLE (Hidden for clients) */}
          {role !== "CLIENT" && (
            <button
              onClick={() => setShowUpdateModal(true)}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Ticket
            </button>
          )}

          {/* TOAST NOTIFICATION (Appears for new messages) */}
          {showNotification && (
            <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm bg-emerald-50 border border-emerald-200 rounded-2xl shadow-lg p-4 z-50">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900 text-sm">New Message</p>
                  <p className="text-emerald-700 text-xs mt-1">{notificationMessage}</p>
                </div>
                <button
                  onClick={() => setShowNotification(false)}
                  className="text-emerald-600 hover:text-emerald-800 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* CHAT CONVERSATION MODAL */}
          {showConversationModal && (
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setShowConversationModal(false)}
              ></div>
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Conversation</h2>
                    <button
                      onClick={() => setShowConversationModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(80vh - 80px)" }}>
                    {userId && userName && role && (
                      <TicketChatbox
                        ticketId={ticket.id}
                        userRole={role}
                        userName={userName}
                        userId={userId}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* UPDATE FORM MODAL */}
          {showUpdateModal && role !== "CLIENT" && (
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setShowUpdateModal(false)}
              ></div>
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Update Ticket</h2>
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Status Transition Selector */}
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase tracking-wide">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
                      >
                        <option value={ticket.status}>{ticket.status}</option>
                        {allowedStatuses
                          .filter((s) => (role === "MEMBER" ? s !== "CLOSED" : true))
                          .map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                    </div>

                    {/* Member Assignment Selector (Admin/Manager only) */}
                    {role !== "MEMBER" && (
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 uppercase tracking-wide">
                          Assign Member
                        </label>
                        <select
                          value={selectedMember}
                          onChange={(e) => setSelectedMember(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
                        >
                          <option value="">Select member</option>
                          {eligibleMembers.map((m) => (
                            <option key={m.id} value={m.id}>{m.username}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Submit Changes Button */}
                    <button
                      onClick={() => {
                        updateTicket();
                        setShowUpdateModal(false);
                      }}
                      disabled={loadingUpdate}
                      className={`w-full p-3 rounded-xl text-white font-semibold text-sm transition-all ${loadingUpdate
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
                        }`}
                    >
                      {loadingUpdate ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * @component StatusBadge
 * @description A styled badge representing the current ticket status.
 */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CREATED: "bg-blue-100  text-blue-700",
    ASSIGNED: "bg-purple-100 text-purple-700",
    STARTED: "bg-yellow-100 text-yellow-700",
    RESOLVED: "bg-green-100  text-green-700",
    CLOSED: "bg-gray-200   text-gray-700",
  };
  return (
    <span className={`px-4 py-1 text-xs font-semibold rounded-full ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

// Workflow stages configuration for the progress indicator
const TICKET_STAGES = ["CREATED", "ASSIGNED", "STARTED", "RESOLVED", "CLOSED"];

// Styling metadata for each stage
const STAGE_META: Record<string, { icon: string; label: string; color: string; light: string }> = {
  CREATED: { icon: "🎫", label: "Created", color: "#6366f1", light: "#eef2ff" },
  ASSIGNED: { icon: "👤", label: "Assigned", color: "#8b5cf6", light: "#f5f3ff" },
  STARTED: { icon: "⚙️", label: "Started", color: "#f59e0b", light: "#fffbeb" },
  RESOLVED: { icon: "✅", label: "Resolved", color: "#10b981", light: "#ecfdf5" },
  CLOSED: { icon: "🔒", label: "Closed", color: "#6b7280", light: "#f9fafb" },
};

/**
 * @component TicketProgressBar
 * @description A vertical progress timeline showing ticket lifecycle stages and timestamps.
 */
function TicketProgressBar({
  currentStatus,
  activities,
}: {
  currentStatus: string;
  activities: Activity[];
}) {
  // Find current position in the workflow
  const currentIndex = TICKET_STAGES.indexOf(currentStatus);

  // Build a lookup map of stage → last activity timestamp for easy display
  const stageTimestamps: Record<string, string> = {};
  for (const act of activities) {
    stageTimestamps[act.new_status] = act.created_at;
  }

  return (
    <div className="relative">
      {/* Background Track Line */}
      <div
        className="absolute left-5 top-5 bottom-5 w-0.5 rounded-full"
        style={{ background: "#e2e8f0" }}
      />
      {/* Active/Completed Track Line (Animated) */}
      <div
        className="absolute left-5 top-5 w-0.5 rounded-full transition-all duration-700"
        style={{
          background: "linear-gradient(180deg, #6366f1, #10b981)",
          height: `${(currentIndex / (TICKET_STAGES.length - 1)) * 100}%`,
        }}
      />

      <div className="space-y-0">
        {TICKET_STAGES.map((stage, index) => {
          const meta = STAGE_META[stage];
          const isDone = index < currentIndex;
          const isNow = index === currentIndex;
          const isPending = index > currentIndex;
          const ts = stageTimestamps[stage];

          return (
            <div key={stage} className="relative flex items-start gap-4 pb-7 last:pb-0">
              {/* STAGE NODE (Circle) */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                {/* Visual pulse for the currently active stage */}
                {isNow && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: meta.color, opacity: 0.25 }}
                  />
                )}
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-300"
                  style={{
                    background: isDone
                      ? `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`
                      : isNow
                        ? meta.light
                        : "#f8fafc",
                    border: `2px solid ${isDone || isNow ? meta.color : "#e2e8f0"}`,
                    boxShadow: isNow
                      ? `0 0 0 4px ${meta.color}22, 0 4px 12px ${meta.color}33`
                      : isDone
                        ? `0 2px 8px ${meta.color}44`
                        : "none",
                  }}
                >
                  {isDone ? (
                    // Checkmark for completed stages
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    // Stage icon for current/pending stages
                    <span style={{ opacity: isPending ? 0.35 : 1 }}>{meta.icon}</span>
                  )}
                </div>
              </div>

              {/* STAGE DESCRIPTION AND TIMESTAMP */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: isDone ? meta.color : isNow ? meta.color : "#cbd5e1",
                    }}
                  >
                    {meta.label}
                  </span>
                  {/* Status Badges within timeline */}
                  {isNow && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: meta.light, color: meta.color }}
                    >
                      Current
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                      Done
                    </span>
                  )}
                </div>
                {/* Show timestamp if stage has been reached */}
                {ts ? (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(ts).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                ) : isPending ? (
                  <p className="text-xs text-slate-300 mt-0.5">Pending</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
