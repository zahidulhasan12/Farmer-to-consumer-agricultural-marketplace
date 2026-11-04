import {
  Button,
  Card,
  Col,
  Image,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons"
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
  // Statistics
  const totalItems = products.length
  const inStockCount = products.filter((p) => p.is_available && p.quantity > 0).length
  const distinctFarmers = new Set(products.map((p) => p.farmer_name)).size
  const distinctCategories = new Set(products.map((p) => p.category)).size

  const columns: ColumnsType<Product> = [
    {
      title: "Product",
      key: "name",
      render: (_, record) => {
        const fallback =
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80"
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
              <Text strong style={{ fontSize: "14px", display: "block" }}>
                {record.name}
              </Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
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
      filters: Array.from(new Set(products.map((p) => p.category))).map((c) => ({
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
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: "13px", display: "block" }}>
            {record.farmer_name}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            📍 {record.farmer_location}
          </Text>
        </div>
      ),
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
      title: "Actions (CRUD)",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record)}
            title="Read Single Product"
          >
            View
          </Button>

          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEditProduct(record)}
            style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}
            title="Update Product"
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
        </Space>
      ),
    },
  ]

  return (
    <div className="dashboard-container">
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
            Manage your agricultural listings: Create, Read, Update, and Delete products in real-time.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddProduct}
            size="large"
            style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32", fontWeight: 600 }}
          >
            Add New Product
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Total Products"
              value={totalItems}
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
              title="Active Farmers"
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
        title={`Agricultural Products Table (${products.length} entries)`}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}
