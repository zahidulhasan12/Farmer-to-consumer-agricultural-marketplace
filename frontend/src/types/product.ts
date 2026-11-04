// Type definitions for agricultural products and API responses

export type ProductCategory =
  | "Vegetables"
  | "Fruits"
  | "Grains"
  | "Dairy"
  | "Poultry"
  | "Spices"
  | "Other"

export interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
  quantity: number
  description?: string | null
  image_url?: string | null
  farmer_name: string
  farmer_location: string
  farmer_phone?: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface ProductInput {
  name: string
  category: string
  price: number
  unit?: string
  quantity: number
  description?: string
  image_url?: string
  farmer_name: string
  farmer_location?: string
  farmer_phone?: string
  is_available?: boolean
}

export interface ProductPatch {
  name?: string
  category?: string
  price?: number
  unit?: string
  quantity?: number
  description?: string
  image_url?: string
  farmer_name?: string
  farmer_location?: string
  farmer_phone?: string
  is_available?: boolean
}

export interface ProductPage {
  items: Product[]
  total: number
  offset: number
  limit: number
}
