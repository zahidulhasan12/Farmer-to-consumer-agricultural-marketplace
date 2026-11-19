import { Button, Col, Empty, Input, Row, Select, Space, Spin, Tag, Typography } from "antd"
import { SearchOutlined, ReloadOutlined, FilterOutlined } from "@ant-design/icons"
import { ProductCard } from "./ProductCard"
import type { Product } from "../types/product"

const { Title, Text, Paragraph } = Typography

interface MarketplaceProps {
  products: Product[]
  loading: boolean
  search: string
  category: string
  onSearchChange: (search: string) => void
  onCategoryChange: (category: string) => void
  onRefresh: () => void
  onViewDetails: (product: Product) => void
  onEdit: (product: Product) => void
  onAddProduct: () => void
}

const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Poultry",
  "Other",
]

export function Marketplace({
  products,
  loading,
  search,
  category,
  onSearchChange,
  onCategoryChange,
  onRefresh,
  onViewDetails,
  onEdit,
  onAddProduct,
}: MarketplaceProps) {
  return (
    <div className="marketplace-container">
      {/* Hero Banner */}
      <section className="agro-hero">
        <div className="hero-content">
          <Tag color="green" style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "16px" }}>
            🌱 Empowering Farmers • Connecting Communities
          </Tag>
          <Title level={1} style={{ margin: "12px 0 8px 0", color: "#14532d", fontWeight: 800 }}>
            Fresh Harvest Directly from Farmers
          </Title>
          <Paragraph style={{ fontSize: "16px", color: "#374151", maxWidth: "650px", margin: "0 auto 20px auto" }}>
            Browse organic vegetables, seasonal fruits, grains, and dairy produce directly supplied by verified local farmers across Bangladesh. No middlemen, fair prices.
          </Paragraph>

          {/* Search bar inside Hero */}
          <div className="hero-search-bar" style={{ maxWidth: "540px", margin: "0 auto" }}>
            <Input
              size="large"
              placeholder="Search fresh vegetables, fruits, grains, or farmer name..."
              prefix={<SearchOutlined style={{ color: "#2e7d32" }} />}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              style={{
                borderRadius: "28px",
                padding: "8px 16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "2px solid #a7f3d0",
              }}
            />
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="marketplace-filters">
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <Space size="small">
            <FilterOutlined style={{ color: "#2e7d32" }} />
            <Text strong style={{ color: "#374151" }}>
              Categories:
            </Text>
          </Space>

          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              type={category === cat ? "primary" : "default"}
              size="middle"
              onClick={() => onCategoryChange(cat)}
              style={
                category === cat
                  ? { backgroundColor: "#2e7d32", borderColor: "#2e7d32", borderRadius: "18px" }
                  : { borderRadius: "18px" }
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text type="secondary">
          Showing <Text strong>{products.length}</Text> agricultural products
          {category !== "All" && ` in ${category}`}
          {search && ` matching "${search}"`}
        </Text>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" tip="Loading agricultural produce from API..." />
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: "40px 0", background: "#fff", borderRadius: "8px" }}>
          <Empty
            description={
              <span>
                No products found matching your search or category filter.
              </span>
            }
          >
            <Space>
              <Button
                onClick={() => {
                  onSearchChange("")
                  onCategoryChange("All")
                }}
              >
                Clear Filters
              </Button>
              <Button type="primary" onClick={onAddProduct} style={{ backgroundColor: "#2e7d32" }}>
                Add New Product
              </Button>
            </Space>
          </Empty>
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          {products.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <ProductCard
                product={product}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
