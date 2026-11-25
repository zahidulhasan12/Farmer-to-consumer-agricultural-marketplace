export interface AdminStats {
  total_users: number
  total_farmers: number
  total_consumers: number
  total_admins: number
  banned_users: number
  total_products: number
  in_stock_products: number
  total_inventory_value: number
  total_groups: number
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "FARMER" | "CONSUMER" | "ADMIN"
  phone?: string | null
  location?: string | null
  is_banned: boolean
  is_main_admin?: boolean
  created_at: string
  products_count: number
}

export interface AuditLog {
  id: string
  user_id?: string | null
  user_email?: string | null
  action: string
  ip_address?: string | null
  user_agent?: string | null
  details?: string | null
  created_at: string
}

export interface AuditLogPage {
  items: AuditLog[]
  total: number
  offset: number
  limit: number
}
