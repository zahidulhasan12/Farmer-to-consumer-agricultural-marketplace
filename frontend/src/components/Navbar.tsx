import { Avatar, Button, Dropdown, Space, Tag, Typography, type MenuProps } from "antd"
import {
  ShopOutlined,
  DashboardOutlined,
  PlusOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  LoginOutlined,
  UserAddOutlined,
  TeamOutlined,
  CrownOutlined,
} from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"

const { Title, Text } = Typography

export type ActiveNavTab = "marketplace" | "dashboard" | "groups" | "admin"

interface NavbarProps {
  currentTab: ActiveNavTab
  onTabChange: (tab: ActiveNavTab) => void
  onAddProduct: () => void
  totalProducts: number
  onOpenLogin: () => void
  onOpenRegister: () => void
  onOpenChangePassword: () => void
}

export function Navbar({
  currentTab,
  onTabChange,
  onAddProduct,
  totalProducts,
  onOpenLogin,
  onOpenRegister,
  onOpenChangePassword,
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()

  const roleColors: Record<string, string> = {
    ADMIN: "purple",
    FARMER: "green",
    CONSUMER: "blue",
  }

  const userMenuItems: MenuProps["items"] = [
    {
      key: "info",
      disabled: true,
      label: (
        <div style={{ padding: "4px 0", cursor: "default" }}>
          <div style={{ fontWeight: 600, color: "#262626" }}>{user?.name}</div>
          <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{user?.email}</div>
          <div style={{ marginTop: "4px" }}>
            <Tag color={user?.is_main_admin ? "gold" : roleColors[user?.role || "FARMER"]}>
              {user?.is_main_admin ? "👑 MAIN ADMIN" : user?.role}
            </Tag>
            {user?.location && <Tag>{user?.location}</Tag>}
          </div>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Change Password",
      onClick: onOpenChangePassword,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Sign Out",
      onClick: async () => {
        await logout()
      },
    },
  ]

  return (
    <header className="agro-header">
      <div className="agro-header-container">
        {/* Brand Logo & Title */}
        <div className="agro-brand" onClick={() => onTabChange("marketplace")} style={{ cursor: "pointer" }}>
          <div className="agro-logo-icon">🌾</div>
          <div>
            <Title level={4} style={{ margin: 0, color: "#1b5e20", fontWeight: 700 }}>
              AgroConnect
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Farmer-to-Consumer Agricultural Marketplace
            </Text>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="agro-nav-links">
          <Button
            type={currentTab === "marketplace" ? "primary" : "text"}
            icon={<ShopOutlined />}
            onClick={() => onTabChange("marketplace")}
            className="nav-btn"
          >
            Marketplace
          </Button>

          <Button
            type={currentTab === "dashboard" ? "primary" : "text"}
            icon={<DashboardOutlined />}
            onClick={() => onTabChange("dashboard")}
            className="nav-btn"
          >
            Farmer Dashboard ({totalProducts})
          </Button>

          <Button
            type={currentTab === "groups" ? "primary" : "text"}
            icon={<TeamOutlined />}
            onClick={() => onTabChange("groups")}
            className="nav-btn"
          >
            Cooperatives
          </Button>

          {user?.role === "ADMIN" && (
            <Button
              type={currentTab === "admin" ? "primary" : "text"}
              icon={<CrownOutlined />}
              onClick={() => onTabChange("admin")}
              className="nav-btn"
              style={currentTab === "admin" ? { backgroundColor: "#722ed1", borderColor: "#722ed1" } : { color: "#722ed1" }}
            >
              Admin Panel
            </Button>
          )}
        </nav>

        {/* Header Actions (Auth / Add Product) */}
        <div className="agro-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user?.role !== "CONSUMER" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddProduct}
              style={{
                backgroundColor: "#2e7d32",
                borderColor: "#2e7d32",
                fontWeight: 600,
                boxShadow: "0 2px 6px rgba(46,125,50,0.3)",
              }}
            >
              Add Product
            </Button>
          )}

          {isAuthenticated && user ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                style={{
                  height: "40px",
                  padding: "0 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "20px",
                  border: "1px solid #d9d9d9",
                }}
              >
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: user.role === "ADMIN" ? "#722ed1" : "#2e7d32",
                    fontSize: "12px",
                  }}
                  icon={<UserOutlined />}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <span style={{ fontWeight: 600, fontSize: "13px" }}>{user.name}</span>
                <Tag color={user.is_main_admin ? "gold" : (roleColors[user.role] || "green")} style={{ margin: 0, fontSize: "11px" }}>
                  {user.is_main_admin ? "👑 MAIN ADMIN" : user.role}
                </Tag>
              </Button>
            </Dropdown>
          ) : (
            <Space size={8}>
              <Button icon={<LoginOutlined />} onClick={onOpenLogin}>
                Sign In
              </Button>
              <Button
                type="primary"
                ghost
                icon={<UserAddOutlined />}
                onClick={onOpenRegister}
                style={{ borderColor: "#2e7d32", color: "#2e7d32", fontWeight: 600 }}
              >
                Register
              </Button>
            </Space>
          )}
        </div>
      </div>
    </header>
  )
}
