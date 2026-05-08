/**
 * @file TicketChatbox.tsx
 * @description A real-time chat component for support tickets.
 * This component handles displaying, sending, and marking messages as read
 * within a specific ticket context. It includes automatic polling for new messages.
 */

"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";

/**
 * Interface representing a single message in the chat.
 */
export interface Message {
  id: number;
  sender_id: number;
  sender_username: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Props for the TicketChatbox component.
 */
interface ChatboxProps {
  /** The unique ID of the ticket this chat belongs to */
  ticketId: number;
  /** The role of the currently logged-in user (e.g., ADMIN, MEMBER, CLIENT) */
  userRole: string;
  /** The username of the currently logged-in user */
  userName: string;
  /** The unique ID of the currently logged-in user */
  userId: number;
}

/**
 * TicketChatbox Component
 * 
 * Provides a user interface for messaging within a support ticket.
 * Features include:
 * - Real-time polling for new messages every 3 seconds.
 * - Automatic "mark as read" logic for incoming messages.
 * - Message grouping by date (Today, Yesterday, or specific date).
 * - Styled message bubbles based on sender role and identity.
 */
export default function TicketChatbox({
  ticketId,
  userRole,
  userName,
  userId,
}: ChatboxProps) {
  // --- State Management ---
  
  // List of messages for the current ticket
  const [messages, setMessages] = useState<Message[]>([]);
  // Current text in the message input field
  const [newMessage, setNewMessage] = useState("");
  // Loading state for when a message is being sent
  const [loading, setLoading] = useState(false);
  // Error message state for API failures or validation
  const [error, setError] = useState<string | null>(null);
  // Reference to the interval timer for polling new messages
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // --- Side Effects ---

  /**
   * Effect: Initial message load and polling setup.
   * Runs whenever ticketId changes.
   */
  useEffect(() => {
    // Fetch messages immediately on mount
    loadMessages();
    
    // Set up polling to fetch new messages every 3 seconds to ensure real-time feel
    const interval = setInterval(loadMessages, 3000);
    setPollingInterval(interval);

    // Cleanup: Clear the interval when the component unmounts or ticketId changes
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ticketId]);

  /**
   * Effect: Mark unread messages as read.
   * Runs whenever the messages list or userId changes.
   */
  useEffect(() => {
    // Iterate through messages and mark any unread messages from other users as read
    messages.forEach((msg) => {
      if (!msg.is_read && msg.sender_id !== userId) {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, userId]);

  // --- API Handlers ---

  /**
   * Fetches the latest messages for the current ticket from the backend.
   */
  async function loadMessages() {
    try {
      console.log("Loading messages for ticket:", ticketId);
      const data = await apiGet(`/api/tickets/${ticketId}/messages/`);
      console.log("Messages loaded:", data);
      // Backend might return a paginated response (results) or a direct array
      setMessages(data.results || data);
      setError(null);
    } catch (err) {
      console.error("Failed to load messages:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to load messages";
      setError(errorMsg);
    }
  }

  /**
   * Sends a PATCH request to mark a specific message as read.
   * @param messageId - The ID of the message to update
   */
  async function markMessageAsRead(messageId: number) {
    try {
      await apiPatch(
        `/api/tickets/${ticketId}/messages/${messageId}/mark-read/`,
        { is_read: true }
      );
    } catch (err) {
      // Non-critical error, we don't show this to the user but log it
      console.error("Failed to mark message as read:", err);
    }
  }

  /**
   * Handles the submission of a new message.
   * @param e - React FormEvent
   */
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    // Prevent sending empty or whitespace-only messages
    if (!newMessage.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiPost(`/api/tickets/${ticketId}/messages/create/`, {
        content: newMessage,
      });

      console.log("Message sent successfully:", response);
      // Clear input field on success
      setNewMessage("");
      // Refresh messages immediately to show the new one
      await loadMessages();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMsg);
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- Helper Functions ---

  /**
   * Formats a date string into a localized time string (e.g., "10:30 AM").
   * @param dateString - ISO date string from the backend
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  /**
   * Formats a date string into a relative or friendly date format.
   * Returns "Today", "Yesterday", or a formatted date (e.g., "Oct 24").
   * @param dateString - ISO date string from the backend
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  /**
   * Determines the CSS classes for role badges based on the user's role.
   * @param role - The user role string (ADMIN, MEMBER, CLIENT)
   */
  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "MEMBER":
        return "bg-blue-100 text-blue-700";
      case "CLIENT":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // --- Logic ---

  /**
   * Group messages by their formatted date for visual separation in the UI.
   * This results in an object where keys are dates (e.g., "Today") and values are arrays of messages.
   */
  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, msg) => {
      const date = formatDate(msg.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {}
  );

  return (
    <div className="bg-white rounded-3xl shadow-md border border-slate-100 flex flex-col h-[600px]">
      {/* Header - Styled with a gradient */}
      <div
        className="px-6 py-4 flex items-center gap-2 rounded-t-3xl"
        style={{
          background: "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
        }}
      >
        <svg
          className="w-4 h-4 text-white opacity-80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-white font-semibold text-sm tracking-wide">
          Conversation
        </span>
      </div>

      {/* Messages Container - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          /* Grouped messages by date */
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date Divider UI */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-300"></div>
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  {date}
                </span>
                <div className="flex-1 h-px bg-slate-300"></div>
              </div>

              {/* Individual Messages */}
              {dayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender_id === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar (for non-current user messages, shown on the left) */}
                  {msg.sender_id !== userId && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-slate-700">
                        {msg.sender_username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble & Metadata */}
                  <div
                    className={`max-w-xs lg:max-w-sm ${
                      msg.sender_id === userId
                        ? "items-end"
                        : "items-start"
                    } flex flex-col gap-1`}
                  >
                    {/* Sender Information Row */}
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-xs font-semibold text-slate-700">
                        {msg.sender_username}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getRoleColor(msg.sender_role)}`}>
                        {msg.sender_role}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Message Content Bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.sender_id === userId
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>

                    {/* Read/Sent Status (shown only for messages sent by the current user) */}
                    {msg.sender_id === userId && (
                      <div className="px-3">
                        <span className="text-xs text-slate-500">
                          {msg.is_read ? "✓✓ Read" : "✓ Sent"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Avatar spacing for current user messages (shown on the right) */}
                  {msg.sender_id === userId && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
                        {msg.sender_username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Input Form - Anchored to bottom */}
      <form
        onSubmit={sendMessage}
        className="border-t border-slate-200 p-4 bg-white rounded-b-3xl flex gap-3"
      >
        {/* Error overlay for the input form */}
        {error && (
          <div className="absolute -top-10 left-4 right-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        )}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className={`px-4 py-2 rounded-2xl text-white font-semibold text-sm transition-all ${
            loading || !newMessage.trim()
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
          }`}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
