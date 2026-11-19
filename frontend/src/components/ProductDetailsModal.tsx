import { Button, Descriptions, Divider, Image, Modal, Space, Tag, Typography } from "antd"
import {
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons"
import type { Product } from "../types/product"

const { Title, Paragraph, Text } = Typography

interface ProductDetailsModalProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onEdit: (product: Product) => void
}

export function ProductDetailsModal({
  product,
  open,
  onClose,
  onEdit,
}: ProductDetailsModalProps) {
  if (!product) return null

  const fallbackImg =
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80"

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}
          onClick={() => {
            onClose()
            onEdit(product)
          }}
        >
          Edit Product
        </Button>,
      ]}
      width={720}
      title={
        <Space>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1b5e20" }}>
            🌾 Product Details (Read Single Endpoint)
          </span>
          <Tag color="cyan">GET /api/v1/products/{product.id.slice(0, 8)}...</Tag>
        </Space>
      }
    >
      <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 260px" }}>
          <Image
            src={product.image_url || fallbackImg}
            fallback={fallbackImg}
            alt={product.name}
            style={{
              width: "100%",
              height: "220px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
              textAlign: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
              CURRENT PRICE
            </Text>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#166534" }}>
              ৳{product.price}
            </span>
            <span style={{ color: "#4b5563", fontSize: "14px" }}> / {product.unit}</span>

            <div style={{ marginTop: "8px" }}>
              {product.is_available && product.quantity > 0 ? (
                <Tag color="success">In Stock: {product.quantity} {product.unit}</Tag>
              ) : (
                <Tag color="error">Out of Stock</Tag>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Tag color="green" style={{ fontSize: "12px", padding: "2px 8px" }}>
              {product.category}
            </Tag>
            {product.is_available ? (
              <Tag color="blue">Available for Purchase</Tag>
            ) : (
              <Tag color="red">Archived / Unavailable</Tag>
            )}
          </div>

          <Title level={3} style={{ margin: "0 0 12px 0", color: "#111827" }}>
            {product.name}
          </Title>

          <Paragraph style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6" }}>
            {product.description || "No description provided for this agricultural product listing."}
          </Paragraph>

          <Divider style={{ margin: "16px 0" }} />

          <Descriptions title="Farmer & Provenance" size="small" column={1} bordered>
            <Descriptions.Item label={<Space><UserOutlined /> Farmer</Space>}>
              <Text strong>{product.farmer_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><EnvironmentOutlined /> Location</Space>}>
              {product.farmer_location}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><PhoneOutlined /> Contact</Space>}>
              {product.farmer_phone || "Not specified"}
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: "16px 0" }} />

          <Descriptions title="System Metadata" size="small" column={1}>
            <Descriptions.Item label={<Space><IdcardOutlined /> UUID</Space>}>
              <Text code copyable style={{ fontSize: "11px" }}>
                {product.id}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><CalendarOutlined /> Created</Space>}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {formatDate(product.created_at)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><CalendarOutlined /> Last Updated</Space>}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {formatDate(product.updated_at)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Modal>
  )
}
