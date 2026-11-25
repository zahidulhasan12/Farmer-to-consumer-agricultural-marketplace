export type GroupPermission = "ADMIN" | "CAN_ADD_PRODUCTS" | "VIEW_ONLY"

export interface GroupMember {
  id: string
  user_id: string
  email: string
  name: string
  role: string
  permission: GroupPermission
  joined_at: string
}

export interface Group {
  id: string
  name: string
  description?: string | null
  owner_id: string
  owner_name?: string
  my_permission?: string | null
  created_at: string
  members_count: number
  members?: GroupMember[]
}

export interface GroupCreateInput {
  name: string
  description?: string
}

export interface GroupMemberAddInput {
  email: string
  permission: GroupPermission
}
