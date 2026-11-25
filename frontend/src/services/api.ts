// Every backend call lives here; components never call fetch directly.
import type { Product, ProductInput, ProductPage, ProductPatch } from "../types/product"
import type { ChangePasswordInput, LoginInput, SignupInput, TokenResponse, User } from "../types/auth"
import type { Group, GroupCreateInput, GroupMember, GroupMemberAddInput } from "../types/group"
import type { AdminStats, AdminUser, AuditLogPage } from "../types/admin"

export const PAGE_SIZE = 50

const BASE = "/api/v1/products"
const AUTH_BASE = "/api/v1/auth"
const GROUPS_BASE = "/api/v1/groups"
const ADMIN_BASE = "/api/v1/admin"

const ACCESS_TOKEN_KEY = "agroconnect_access_token"
const REFRESH_TOKEN_KEY = "agroconnect_refresh_token"

// Token storage helpers
export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// FastAPI sends detail as a string (e.g. 404, 409) or a list of {loc, msg} (422 validation error).
const errorMessage = async (res: Response): Promise<string> => {
  try {
    const data = await res.json()
    if (typeof data.detail === "string") return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((d: { loc: string[]; msg: string }) => `${d.loc.at(-1)}: ${d.msg}`).join("; ")
    }
  } catch {
    // response body was not valid JSON
  }
  return `Request failed (${res.status}: ${res.statusText})`
}

const request = async <T>(url: string, options: RequestInit = {}, retryOn401 = true): Promise<T> => {
  const headers = new Headers(options.headers || {})
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  const accessToken = tokenStorage.getAccessToken()
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  // Handle automatic silent refresh on 401 Unauthorized
  if (res.status === 401 && retryOn401 && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
    const refreshToken = tokenStorage.getRefreshToken()
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${AUTH_BASE}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (refreshRes.ok) {
          const tokenData: TokenResponse = await refreshRes.json()
          tokenStorage.setAccessToken(tokenData.access_token)
          tokenStorage.setRefreshToken(tokenData.refresh_token)
          // Retry original request with newly acquired access token
          headers.set("Authorization", `Bearer ${tokenData.access_token}`)
          const retryRes = await fetch(url, { ...options, headers })
          if (!retryRes.ok) throw new Error(await errorMessage(retryRes))
          return retryRes.status === 204 ? (undefined as T) : await retryRes.json()
        } else {
          tokenStorage.clearTokens()
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("agroconnect:unauthorized"))
          }
        }
      } catch {
        tokenStorage.clearTokens()
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("agroconnect:unauthorized"))
        }
      }
    } else {
      tokenStorage.clearTokens()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("agroconnect:unauthorized"))
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !url.includes("/auth/login") && typeof window !== "undefined") {
      tokenStorage.clearTokens()
      window.dispatchEvent(new CustomEvent("agroconnect:unauthorized"))
    }
    throw new Error(await errorMessage(res))
  }

  return res.status === 204 ? (undefined as T) : await res.json()
}

// Central API Service connecting React to FastAPI endpoints
export const apiService = {
  // --- Products Endpoints ---
  getProducts: (offset = 0, limit = PAGE_SIZE, search?: string, category?: string, mine?: boolean, ownerId?: string) => {
    const params = new URLSearchParams()
    params.set("offset", offset.toString())
    params.set("limit", limit.toString())
    if (search && search.trim()) params.set("search", search.trim())
    if (category && category !== "All") params.set("category", category)
    if (mine) params.set("mine", "true")
    if (ownerId) params.set("owner_id", ownerId)
    return request<ProductPage>(`${BASE}?${params.toString()}`)
  },

  getProduct: (id: string) => request<Product>(`${BASE}/${id}`),

  createProduct: (data: ProductInput) =>
    request<Product>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, patch: ProductPatch) =>
    request<Product>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  deleteProduct: (id: string) =>
    request<void>(`${BASE}/${id}`, {
      method: "DELETE",
    }),

  // --- Authentication Endpoints ---
  signup: async (data: SignupInput): Promise<TokenResponse> => {
    const res = await request<TokenResponse>(`${AUTH_BASE}/signup`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    tokenStorage.setAccessToken(res.access_token)
    tokenStorage.setRefreshToken(res.refresh_token)
    return res
  },

  login: async (credentials: LoginInput): Promise<TokenResponse> => {
    const res = await request<TokenResponse>(`${AUTH_BASE}/login`, {
      method: "POST",
      body: JSON.stringify(credentials),
    })
    tokenStorage.setAccessToken(res.access_token)
    tokenStorage.setRefreshToken(res.refresh_token)
    return res
  },

  refreshToken: async (refreshToken?: string): Promise<TokenResponse> => {
    const token = refreshToken || tokenStorage.getRefreshToken()
    const res = await request<TokenResponse>(`${AUTH_BASE}/refresh`, {
      method: "POST",
      body: JSON.stringify({ refresh_token: token }),
    }, false)
    tokenStorage.setAccessToken(res.access_token)
    tokenStorage.setRefreshToken(res.refresh_token)
    return res
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken()
    try {
      if (refreshToken) {
        await request<void>(`${AUTH_BASE}/logout`, {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        }, false)
      }
    } finally {
      tokenStorage.clearTokens()
    }
  },

  getMe: (): Promise<User> => request<User>(`${AUTH_BASE}/me`),

  changePassword: (data: ChangePasswordInput): Promise<{ status: string; message: string }> =>
    request<{ status: string; message: string }>(`${AUTH_BASE}/change-password`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Health check
  checkHealth: () => request<{ status: string; service: string }>("/api/health"),

  // --- Farmer Cooperatives / Groups Endpoints ---
  getGroups: () => request<Group[]>(GROUPS_BASE),

  getGroup: (id: string) => request<Group>(`${GROUPS_BASE}/${id}`),

  createGroup: (data: GroupCreateInput) =>
    request<Group>(GROUPS_BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addGroupMember: (groupId: string, data: GroupMemberAddInput) =>
    request<GroupMember>(`${GROUPS_BASE}/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeGroupMember: (groupId: string, userId: string) =>
    request<void>(`${GROUPS_BASE}/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),

  deleteGroup: (groupId: string) =>
    request<void>(`${GROUPS_BASE}/${groupId}`, {
      method: "DELETE",
    }),

  // --- Administrator Endpoints ---
  getAdminStats: () => request<AdminStats>(`${ADMIN_BASE}/stats`),

  getAdminUsers: (search?: string) => {
    const params = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""
    return request<AdminUser[]>(`${ADMIN_BASE}/users${params}`)
  },

  toggleUserBan: (userId: string, isBanned: boolean) =>
    request<User>(`${ADMIN_BASE}/users/${userId}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ is_banned: isBanned }),
    }),

  updateUserRole: (userId: string, role: string) =>
    request<User>(`${ADMIN_BASE}/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  // --- Audit Logging Endpoints ---
  getAuditLogs: (offset = 0, limit = 50, action?: string, search?: string) => {
    const params = new URLSearchParams()
    params.set("offset", offset.toString())
    params.set("limit", limit.toString())
    if (action && action !== "ALL") params.set("action", action)
    if (search && search.trim()) params.set("search", search.trim())
    return request<AuditLogPage>(`${ADMIN_BASE}/audit-logs?${params.toString()}`)
  },

  downloadAuditLogsCsv: async (): Promise<void> => {
    const accessToken = tokenStorage.getAccessToken()
    const headers = new Headers()
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
    const res = await fetch(`${ADMIN_BASE}/audit-logs/export-csv`, { headers })
    if (!res.ok) throw new Error("Failed to export audit logs CSV")
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "agroconnect_audit_logs.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },
}
