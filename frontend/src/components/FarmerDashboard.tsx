import { useState } from "react"
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  Popconfirm,
  Radio,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  DollarCircleOutlined,
  LockOutlined,
} from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"
import type { Product } from "../types/product"

const { Title, Text } = Typography

interface FarmerDashboardProps {
  products: Product[]
  loading: boolean
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (id: string) => Promise<boolean>
  onViewDetails: (product: Product) => void
  onRefresh: () => void
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

export function FarmerDashboard({
  products,
  loading,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onViewDetails,
  onRefresh,
}: FarmerDashboardProps) {
  const { user, isFarmer, isAdmin } = useAuth()
  const [filterMode, setFilterMode] = useState<"all" | "mine">(isFarmer ? "mine" : "all")

  // Filter products based on selected mode
  const displayedProducts = products.filter((p) => {
    if (filterMode === "mine" && user) {
      return p.user_id === user.id
    }
    return true
  })

  // Statistics
  const myItemsCount = products.filter((p) => user && p.user_id === user.id).length
  const totalItems = products.length
  const inStockCount = displayedProducts.filter((p) => p.is_available && p.quantity > 0).length
  const distinctFarmers = new Set(displayedProducts.map((p) => p.farmer_name)).size
  const distinctCategories = new Set(displayedProducts.map((p) => p.category)).size

  const columns: ColumnsType<Product> = [
    {
      title: "Product",
      key: "name",
      render: (_, record) => {
        const fallback =
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80"
        const isOwner = !!(user && record.user_id && user.id === record.user_id)
        return (
          <Space size="middle">
            <Image
              src={record.image_url || fallback}
              fallback={fallback}
              width={48}
              height={48}
              style={{ objectFit: "cover", borderRadius: "6px" }}
              preview={false}
            />
            <div>
              <Space>
                <Text strong style={{ fontSize: "14px" }}>
                  {record.name}
                </Text>
                {isOwner && (
                  <Tag color="green" style={{ fontSize: "10px", lineHeight: "16px", padding: "0 4px" }}>
                    Mine
                  </Tag>
                )}
              </Space>
              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                ID: {record.id.slice(0, 8)}...
              </Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: Array.from(new Set(displayedProducts.map((p) => p.category))).map((c) => ({
        text: c,
        value: c,
      })),
      onFilter: (value, record) => record.category === value,
      render: (category: string) => (
        <Tag color={CATEGORY_COLORS[category] || "default"}>{category}</Tag>
      ),
    },
    {
      title: "Price (৳)",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price: number, record: Product) => (
        <Text strong style={{ color: "#166534" }}>
          ৳{price} <span style={{ fontSize: "12px", color: "#6b7280" }}>/ {record.unit}</span>
        </Text>
      ),
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
      render: (qty: number, record: Product) => (
        <Space>
          <Text strong>{qty}</Text>
          <Text type="secondary">{record.unit}</Text>
        </Space>
      ),
    },
    {
      title: "Farmer / Location",
      key: "farmer",
      render: (_, record) => {
        const isOwner = !!(user && record.user_id && user.id === record.user_id)
        return (
          <div>
            <Space>
              <Text strong style={{ fontSize: "13px" }}>
                {record.farmer_name}
              </Text>
              {isOwner && <Tag color="green">You</Tag>}
            </Space>
            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
              📍 {record.farmer_location}
            </Text>
          </div>
        )
      },
    },
    {
      title: "Status",
      dataIndex: "is_available",
      key: "status",
      render: (isAvailable: boolean, record: Product) =>
        isAvailable && record.quantity > 0 ? (
          <Tag color="success">In Stock</Tag>
        ) : (
          <Tag color="error">Unavailable</Tag>
        ),
    },
    {
      title: "Actions (RBAC Protected)",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const isOwner = !!(user && record.user_id && user.id === record.user_id)
        const canModify = !!(user && (isAdmin || isOwner))

        return (
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
              title="Read Single Product"
            >
              View
            </Button>

            {canModify ? (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => onEditProduct(record)}
                  style={{ backgroundColor: isOwner ? "#2e7d32" : "#722ed1", borderColor: isOwner ? "#2e7d32" : "#722ed1" }}
                  title={isOwner ? "Edit Your Product" : "Admin Edit"}
                >
                  Edit
                </Button>

                <Popconfirm
                  title="Delete Product"
                  description={`Are you sure you want to delete "${record.name}"? This removes it from the database.`}
                  okText="Yes, Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDeleteProduct(record.id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} title="Delete Product">
                    Delete
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <Tooltip title="Only the listing owner or an administrator can edit or delete this product">
                <Button size="small" disabled icon={<LockOutlined />}>
                  Protected
                </Button>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div className="dashboard-container">
      {/* Consumer Warning banner */}
      {user?.role === "CONSUMER" && (
        <Alert
          message="Consumer (Buyer) Mode"
          description="You are currently signed in as a Consumer. You can browse produce and view details. To add new listings or edit farm produce, please sign in with a Farmer or Administrator account."
          type="info"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Header and Add Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#166534" }}>
            🌾 Farmer Management Dashboard
          </Title>
          <Text type="secondary">
            Role-Based Product Management: Owners and Admins have full CRUD permissions.
          </Text>
        </div>

        <Space wrap>
          {/* Ownership View Filter */}
          <Radio.Group
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="mine">🚜 My Products ({myItemsCount})</Radio.Button>
            <Radio.Button value="all">🌐 All Marketplace ({totalItems})</Radio.Button>
          </Radio.Group>

          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>

          {(isFarmer || isAdmin) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddProduct}
              size="middle"
              style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32", fontWeight: 600 }}
            >
              Add New Product
            </Button>
          )}
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title={filterMode === "mine" ? "My Listed Items" : "Total Products"}
              value={displayedProducts.length}
              prefix={<ShopOutlined style={{ color: "#2e7d32" }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="In Stock Items"
              value={inStockCount}
              prefix={<CheckCircleOutlined style={{ color: "#16a34a" }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Farmers"
              value={distinctFarmers}
              prefix={<DollarCircleOutlined style={{ color: "#d97706" }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Categories"
              value={distinctCategories}
              prefix={<AppstoreOutlined style={{ color: "#2563eb" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Products Table */}
      <Card
        title={`Agricultural Listings (${displayedProducts.length} items shown)`}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <Table
          columns={columns}
          dataSource={displayedProducts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}
