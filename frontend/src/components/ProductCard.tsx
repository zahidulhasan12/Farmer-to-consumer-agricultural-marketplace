import { Button, Card, Image, Space, Tag, Typography } from "antd"
import {
  EnvironmentOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons"
import type { Product } from "../types/product"

const { Text, Title, Paragraph } = Typography

interface ProductCardProps {
  product: Product
  onViewDetails: (product: Product) => void
  onEdit: (product: Product) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Vegetables: "green",
  Fruits: "orange",
  Grains: "gold",
  Dairy: "cyan",
  Poultry: "volcano",
  Spices: "red",
  Other: "blue",
}

export function ProductCard({ product, onViewDetails, onEdit }: ProductCardProps) {
  const fallbackImg =
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80"

  return (
    <Card
      hoverable
      className="product-card"
      cover={
        <div style={{ position: "relative", height: "180px", overflow: "hidden", background: "#f5f5f5" }}>
          <Image
            alt={product.name}
            src={product.image_url || fallbackImg}
            fallback={fallbackImg}
            preview={false}
            style={{ width: "100%", height: "180px", objectFit: "cover" }}
          />
          <Tag
            color={CATEGORY_COLORS[product.category] || "default"}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontWeight: 600,
              borderRadius: "4px",
            }}
          >
            {product.category}
          </Tag>
          {!product.is_available || product.quantity === 0 ? (
            <Tag color="error" style={{ position: "absolute", bottom: 10, left: 10 }}>
              Out of Stock
            </Tag>
          ) : (
            <Tag color="success" style={{ position: "absolute", bottom: 10, left: 10 }}>
              In Stock ({product.quantity} {product.unit})
            </Tag>
          )}
        </div>
      }
      actions={[
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onViewDetails(product)}
          key="view"
          style={{ color: "#2e7d32" }}
        >
          View Details
        </Button>,
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(product)}
          key="edit"
        >
          Edit
        </Button>,
      ]}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <Title level={5} style={{ margin: 0, fontSize: "16px", color: "#1f2937" }} ellipsis={{ rows: 1 }}>
          {product.name}
        </Title>
      </div>

      <div style={{ margin: "8px 0 12px 0" }}>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#166534" }}>
          ৳{product.price}
        </span>
        <Text type="secondary" style={{ fontSize: "13px", marginLeft: "4px" }}>
          / {product.unit}
        </Text>
      </div>

      <Paragraph
        type="secondary"
        ellipsis={{ rows: 2 }}
        style={{ fontSize: "13px", minHeight: "38px", marginBottom: "12px" }}
      >
        {product.description || "Farm-fresh agricultural product harvested directly from local farms."}
      </Paragraph>

      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <Space size="small">
          <UserOutlined style={{ color: "#6b7280", fontSize: "12px" }} />
          <Text style={{ fontSize: "12px", color: "#4b5563" }} strong>
            {product.farmer_name}
          </Text>
        </Space>
        <Space size="small">
          <EnvironmentOutlined style={{ color: "#6b7280", fontSize: "12px" }} />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {product.farmer_location}
          </Text>
        </Space>
      </div>
    </Card>
  )
}
