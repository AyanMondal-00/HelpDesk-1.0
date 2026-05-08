/**
 * @file api.ts
 * @description Centralized API client for the Silicon Systems HelpDesk.
 * Provides a wrapper around the fetch API with automatic JWT authentication,
 * token refresh logic, and consistent error handling.
 */

// ================================================================
// API CLIENT CONFIGURATION
// ================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Retrieve the current access token from localStorage.
 * 
 * @returns {string | null} The access token or null if not found.
 */
function getAccessToken() {
  return localStorage.getItem("access");
}

/**
 * Retrieve the current refresh token from localStorage.
 * 
 * @returns {string | null} The refresh token or null if not found.
 */
function getRefreshToken() {
  return localStorage.getItem("refresh");
}

/**
 * Refreshes an expired access token using the refresh token.
 * If the refresh fails (e.g., refresh token expired), the user session 
 * is cleared and they are redirected to the login page.
 * 
 * @returns {Promise<string>} A promise that resolves to the new access token.
 * @throws {Error} If no refresh token is found or if the refresh request fails.
 */
async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE}/api/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    // Token refresh failed - user session is invalid
    localStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  const data = await res.json();
  localStorage.setItem("access", data.access);

  return data.access;
}

/**
 * Internal interface for fetch options, extending standard RequestInit.
 */
interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Enhanced fetch wrapper that automatically includes JWT authentication headers.
 * Handles 401 Unauthorized responses by attempting a single token refresh.
 * 
 * @param {string} endpoint - The API endpoint (e.g., '/api/tickets/').
 * @param {FetchOptions} [options={}] - Standard fetch options.
 * @returns {Promise<Response>} The fetch response object.
 */
async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  let access = getAccessToken();

  // ATTEMPT INITIAL REQUEST
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
      ...options.headers,
    },
  });

  // IF UNAUTHORIZED, TRY REFRESHING TOKEN ONCE
  if (res.status === 401) {
    try {
      access = await refreshAccessToken();

      // RETRY REQUEST WITH NEW TOKEN
      return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
          ...options.headers,
        },
      });
    } catch (refreshErr) {
      // If refresh fails, let the original 401 stand or bubble up the refresh error
      return res;
    }
  }

  return res;
}

/**
 * Performs an authenticated GET request.
 * 
 * @param {string} endpoint - The API endpoint to fetch.
 * @returns {Promise<any>} The parsed JSON response.
 * @throws {Error} If the request fails or returns a non-OK status.
 */
export async function apiGet(endpoint: string) {
  const res = await fetchWithAuth(endpoint);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData?.detail || errorData?.error || "GET failed";
    throw new Error(errorMsg);
  }
  return res.json();
}

/**
 * Performs an authenticated POST request.
 * 
 * @param {string} endpoint - The API endpoint to post to.
 * @param {Record<string, unknown>} body - The data to send in the request body.
 * @returns {Promise<any>} The parsed JSON response.
 * @throws {Error} If the request fails, including validation errors from the server.
 */
export async function apiPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMsg = "POST failed";
    
    // EXTRACT DESCRIPTIVE ERROR MESSAGE
    if (errorData?.detail) {
      errorMsg = errorData.detail;
    } else if (errorData?.error) {
      errorMsg = errorData.error;
    } else if (typeof errorData === 'object') {
      // Handle Django Rest Framework field-level validation errors
      const firstError = Object.values(errorData)[0];
      if (firstError) {
        errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      }
    }
    
    console.error(`API POST error at ${endpoint}:`, errorData);
    throw new Error(errorMsg);
  }
  return res.json();
}

/**
 * Performs an authenticated PATCH request.
 * 
 * @param {string} endpoint - The API endpoint to patch.
 * @param {Record<string, unknown>} body - The data to send in the request body.
 * @returns {Promise<any>} The parsed JSON response.
 * @throws {Error} If the request fails or returns a non-OK status.
 */
export async function apiPatch(endpoint: string, body: Record<string, unknown>) {
  const res = await fetchWithAuth(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMsg = "PATCH failed";
    
    // EXTRACT DESCRIPTIVE ERROR MESSAGE
    if (errorData?.detail) {
      errorMsg = errorData.detail;
    } else if (errorData?.error) {
      errorMsg = errorData.error;
    } else if (typeof errorData === 'object') {
      const firstError = Object.values(errorData)[0];
      if (firstError) {
        errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      }
    }
    throw new Error(errorMsg);
  }
  return res.json();
}