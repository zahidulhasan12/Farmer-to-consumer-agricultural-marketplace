import { Button, Typography } from "antd"
import {
  ShopOutlined,
  DashboardOutlined,
  PlusOutlined,
} from "@ant-design/icons"

const { Title, Text } = Typography

interface NavbarProps {
  currentTab: "marketplace" | "dashboard"
  onTabChange: (tab: "marketplace" | "dashboard") => void
  onAddProduct: () => void
  totalProducts: number
}

export function Navbar({
  currentTab,
  onTabChange,
  onAddProduct,
  totalProducts,
}: NavbarProps) {
  return (
    <header className="agro-header">
      <div className="agro-header-container">
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
        </nav>

        <div className="agro-header-actions">
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
        </div>
      </div>
    </header>
  )
}
