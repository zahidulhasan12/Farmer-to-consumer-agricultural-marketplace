// Every backend call lives here; components never call fetch directly.
import type { Product, ProductInput, ProductPage, ProductPatch } from "../types/product"

export const PAGE_SIZE = 50

const BASE = "/api/v1/products"

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

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(await errorMessage(res))
  }

  return res.status === 204 ? (undefined as T) : await res.json()
}

// Central API Service connecting React to FastAPI endpoints
export const apiService = {
  // Read List: GET /api/v1/products
  getProducts: (offset = 0, limit = PAGE_SIZE, search?: string, category?: string) => {
    const params = new URLSearchParams()
    params.set("offset", offset.toString())
    params.set("limit", limit.toString())
    if (search && search.trim()) params.set("search", search.trim())
    if (category && category !== "All") params.set("category", category)
    return request<ProductPage>(`${BASE}?${params.toString()}`)
  },

  // Read Single: GET /api/v1/products/{id}
  getProduct: (id: string) => request<Product>(`${BASE}/${id}`),

  // Create: POST /api/v1/products
  createProduct: (data: ProductInput) =>
    request<Product>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update: PUT/PATCH /api/v1/products/{id}
  updateProduct: (id: string, patch: ProductPatch) =>
    request<Product>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  // Delete: DELETE /api/v1/products/{id}
  deleteProduct: (id: string) =>
    request<void>(`${BASE}/${id}`, {
      method: "DELETE",
    }),

  // Health check
  checkHealth: () => request<{ status: string; service: string }>("/api/health"),
}
