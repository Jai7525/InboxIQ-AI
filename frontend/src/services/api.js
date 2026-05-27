const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const MOCK_LATENCY_MS = 250;
const AUTH_TOKEN_KEY = "inboxiq-session-token";
const sessionCache = new Map();

const delay = (value, ms = MOCK_LATENCY_MS) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

function clearSessionCache() {
  sessionCache.clear();
}

function readAuthTokenFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("session_token");
  if (!token) {
    return null;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  params.delete("session_token");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
  clearSessionCache();
  return token;
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return readAuthTokenFromUrl() || localStorage.getItem(AUTH_TOKEN_KEY);
}

function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem("inboxiq-auth-user");
  }
}

async function cachedRequest(cacheKey, loader) {
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey);
  }

  const promise = loader().catch((error) => {
    sessionCache.delete(cacheKey);
    throw error;
  });
  sessionCache.set(cacheKey, promise);

  const data = await promise;
  sessionCache.set(cacheKey, data);
  return data;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    return null;
  }

  const token = getAuthToken();
  const isPublicEndpoint = path === "/auth/google/url" || path === "/auth/status";
  if (!token && !isPublicEndpoint) {
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getEmailSummary: async () =>
    cachedRequest(`emails:summary:${getAuthToken() || "anonymous"}`, async () =>
      (await request("/emails/summary")) ||
      delay({
        summary: "Today you received 42 emails, including important messages, urgent follow-ups, and one suspicious email.",
        highlights: [],
        urgent_count: 2,
        threat_count: 1,
      }),
    ),

  getEmails: async (params = {}) =>
    cachedRequest(`emails:${buildQuery(params)}:${getAuthToken() || "anonymous"}`, async () =>
      (await request(`/emails${buildQuery(params)}`)) ||
      delay({
        total: 0,
        emails: [],
      }),
    ),

  search: async ({ query, topK = 5 } = {}) =>
    (await request("/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k: topK }),
    })) || delay({ query, results: [] }),

  chat: async ({ question, topK = 5 } = {}) =>
    (await request("/chat", {
      method: "POST",
      body: JSON.stringify({ question, top_k: topK }),
    })) || delay({ answer: "", sources: [], retrieved_chunks: [], rag_steps: [] }),

  getThreats: async () =>
    cachedRequest(`threats:${getAuthToken() || "anonymous"}`, async () =>
      (await request("/threats")) ||
      delay({
        total: 0,
        threats: [],
      }),
    ),

  getAnalyticsOverview: async () =>
    (await (async () => {
      try {
        return await request("/analytics/overview");
      } catch (error) {
        return request("/analytics");
      }
    })()) ||
    delay({
      total_emails: 0,
      urgent_emails: 0,
      threat_alerts: 0,
      categories: {},
      threats: {},
    }),

  syncInbox: async () => {
    const result = (await request("/emails/sync", { method: "POST" })) ||
      (await delay({ status: "connected", syncedAt: new Date().toISOString() }));
    clearSessionCache();
    return result;
  },

  getCurrentUser: async () => {
    if (!getAuthToken()) {
      return delay({ connected: false, email: null, name: "No account connected", google_id: null });
    }

    try {
      return await request("/auth/me");
    } catch (error) {
      clearAuthToken();
      throw error;
    }
  },

  getGoogleAuthUrl: async () =>
    (await request("/auth/google/url")) ||
    delay({ auth_url: `${API_BASE_URL}/auth/google/login` }),

  logout: async (email) => {
    try {
      return getAuthToken()
        ? (await request("/auth/logout", {
            method: "POST",
            body: JSON.stringify(email ? { email } : {}),
          }))
        : (await delay({ status: "logged_out" }));
    } finally {
      clearAuthToken();
      clearSessionCache();
    }
  },

  searchEmails: async (query) => api.search({ query }),

  sendChatMessage: async (message) => api.chat({ question: message }),
};
