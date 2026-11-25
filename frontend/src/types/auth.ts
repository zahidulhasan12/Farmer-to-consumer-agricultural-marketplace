export type UserRole = "FARMER" | "CONSUMER" | "ADMIN"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string | null
  location?: string | null
  is_banned: boolean
  is_main_admin?: boolean
  created_at: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  location?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface ChangePasswordInput {
  current_password: string
  new_password: string
}
