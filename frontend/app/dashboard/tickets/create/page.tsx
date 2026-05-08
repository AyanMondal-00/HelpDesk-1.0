/**
 * @file create/page.tsx
 * @description Page for clients to create a new support ticket.
 * Features chained dropdowns for issue categories and sub-issues.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";

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
 * @interface APIResponse
 * @description Generic structure for API responses that might be paginated.
 */
interface APIResponse<T> {
  results?: T[];
  [key: string]: unknown;
}

/**
 * @component CreateTicketPage
 * @description Component providing a form for new ticket submission.
 */
export default function CreateTicketPage() {
  const router = useRouter();

  // --- State Management ---

  // All available issue categories
  const [issues, setIssues] = useState<Issue[]>([]);
  
  // All sub-issues (fetched once and filtered locally)
  const [subIssues, setSubIssues] = useState<SubIssue[]>([]);
  
  // Sub-issues filtered based on the selected main issue
  const [filteredSubIssues, setFilteredSubIssues] = useState<SubIssue[]>([]);

  // Form field states
  const [issueId, setIssueId] = useState("");
  const [subIssueId, setSubIssueId] = useState("");
  const [description, setDescription] = useState("");

  // UI status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * @effect
   * @description Fetches issue and sub-issue data from the backend on mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch main issue categories
        const issuesData: unknown = await apiGet("/api/issues/");
        const issuesList = Array.isArray(issuesData) ? issuesData : ((issuesData as APIResponse<Issue>).results || []);
        setIssues(issuesList as Issue[]);

        // 2. Fetch all sub-issues
        const subIssuesData: unknown = await apiGet("/api/subissues/");
        const subIssuesList = Array.isArray(subIssuesData) ? subIssuesData : ((subIssuesData as APIResponse<SubIssue>).results || []);
        setSubIssues(subIssuesList as SubIssue[]);
        
        // Check if data is available
        if (issuesList.length === 0) {
          setError("No issues available. Please create issues first in the admin panel.");
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Fetch error:", error);
        setError(`Failed to load options: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * @effect
   * @description Handles chained dropdown logic. Filters sub-issues whenever the selected main issue changes.
   */
  useEffect(() => {
    const filtered = subIssues.filter(
      (sub) => {
        // Sub-issue 'issue' field might be an ID or an object depending on the API serializer
        const issueValue = sub.issue;
        const issueIdToCompare = typeof issueValue === 'object' ? String(issueValue.id) : String(issueValue);
        return issueIdToCompare === issueId;
      }
    );
    setFilteredSubIssues(filtered);
    
    // Reset sub-issue selection when main issue changes to ensure data consistency
    setSubIssueId("");
  }, [issueId, subIssues]);

  /**
   * @function handleSubmit
   * @description Validates and submits the form data to create a new ticket.
   * @param {React.FormEvent} e - The form submission event.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      // POST the new ticket data
      await apiPost("/api/tickets/create/", {
        issue: issueId ? Number(issueId) : null,
        sub_issue: subIssueId ? Number(subIssueId) : null,
        description,
      });

      setSuccess(true);

      // Redirect back to the tickets list after a short delay to show success state
      setTimeout(() => {
        router.push("/dashboard/tickets");
      }, 1000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Submission error:", error);
      setError(`Error creating ticket: ${errorMessage}`);
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Create New Issue
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Submit an issue ticket and our support team will address it promptly
        </p>
      </div>

      {/* INITIAL DATA LOADING STATE */}
      {loading ? (
        <div className="bg-white p-10 rounded-lg shadow-sm border border-slate-200/60 text-center">
          <div className="text-slate-500 text-sm">Loading form options…</div>
          <div className="text-xs text-slate-400 mt-3">Initializing issue categories</div>
        </div>
      ) : error ? (
        // ERROR STATE WITH RETRY
        <div className="bg-red-50 p-8 rounded-lg shadow-sm border border-red-200">
          <div className="text-red-700 font-medium mb-4 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800 text-sm font-medium transition"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* DATA STATUS INDICATOR */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200/60 text-sm text-blue-700">
            <p className="font-medium">✓ Form Ready: {issues.length} categories, {subIssues.length} subcategories</p>
          </div>
          
          {/* TICKET CREATION FORM */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-sm border border-slate-200/60 space-y-6"
          >
            {/* MAIN ISSUE CATEGORY SELECTION */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Issue Category
              </label>
              <select
                value={issueId}
                onChange={(e) => setIssueId(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="">— Select a category —</option>
                {issues.map((issue) => (
                  <option key={issue.id} value={String(issue.id)}>
                    {issue.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CHAINED SUB-ISSUE SELECTION (Enabled only after main issue is selected) */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Specific Issue Type
              </label>
              <select
                value={subIssueId}
                onChange={(e) => setSubIssueId(e.target.value)}
                required
                disabled={!issueId}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-900"
              >
                <option value="">— Select a subcategory —</option>
                {filteredSubIssues.map((sub) => (
                  <option key={sub.id} value={String(sub.id)}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DETAILED DESCRIPTION TEXTAREA */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Issue Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                placeholder="Provide detailed information about your issue, including what you experienced and any relevant context…"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none bg-white text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* FEEDBACK MESSAGES */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                ✓ Issue created successfully! Redirecting…
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* FORM SUBMISSION ACTION */}
            <button
              type="submit"
              disabled={submitLoading || !issueId || !subIssueId}
              className={`w-full px-4 py-2.5 rounded-lg text-white font-medium transition-all ${
                submitLoading || !issueId || !subIssueId
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-800"
              }`}
            >
              {submitLoading ? "Submitting Issue…" : "Submit Issue"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}