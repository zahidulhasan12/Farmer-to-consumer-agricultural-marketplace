import { useEffect, useState } from "react"
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  CrownOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  HistoryOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserDeleteOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"
import { apiService, tokenStorage } from "../services/api"
import type { AdminStats, AdminUser, AuditLog } from "../types/admin"

const { Title, Text } = Typography

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "green",
  FAILED_LOGIN: "orange",
  ACCOUNT_LOCKED: "red",
  LOGOUT: "default",
  SIGNUP: "cyan",
  USER_BANNED: "volcano",
  USER_UNBANNED: "lime",
  ROLE_CHANGED: "purple",
  PRODUCT_CREATED: "blue",
  PRODUCT_UPDATED: "geekblue",
  PRODUCT_DELETED: "magenta",
}

export function AdminDashboard() {
  const { message } = App.useApp()
  const { user: currentAdmin } = useAuth()

  // High-level Stats & Users
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditTotal, setAuditTotal] = useState<number>(0)
  const [auditLoading, setAuditLoading] = useState<boolean>(false)
  const [auditAction, setAuditAction] = useState<string>("ALL")
  const [auditSearch, setAuditSearch] = useState<string>("")
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false)

  const fetchData = async (currentSearch = search) => {
    setLoading(true)
    try {
      const [statsData, usersData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminUsers(currentSearch),
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (err) {
      if (tokenStorage.getAccessToken()) {
        message.error(err instanceof Error ? err.message : "Failed to load admin data")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setAuditLoading(true)
    try {
      const data = await apiService.getAuditLogs(0, 100, auditAction, auditSearch)
      setAuditLogs(data.items)
      setAuditTotal(data.total)
    } catch (err) {
      if (tokenStorage.getAccessToken()) {
        message.error(err instanceof Error ? err.message : "Failed to load audit logs")
      }
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs()
    }, 300)
    return () => clearTimeout(timer)
  }, [auditAction, auditSearch])

  const handleToggleBan = async (targetUser: AdminUser) => {
    setActionLoading(targetUser.id)
    try {
      const newStatus = !targetUser.is_banned
      await apiService.toggleUserBan(targetUser.id, newStatus)
      message.success(
        newStatus
          ? `Account "${targetUser.name}" has been suspended.`
          : `Account "${targetUser.name}" has been reactivated.`
      )
      await Promise.all([fetchData(search), fetchAuditLogs()])
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Moderation action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      await apiService.updateUserRole(userId, newRole)
      message.success(`User role updated to ${newRole}`)
      await Promise.all([fetchData(search), fetchAuditLogs()])
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update user role")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true)
    try {
      await apiService.downloadAuditLogsCsv()
      message.success("Audit logs exported to CSV successfully!")
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to export CSV")
    } finally {
      setDownloadingCsv(false)
    }
  }

  // --- Users Table Columns ---
  const userColumns: ColumnsType<AdminUser> = [
    {
      title: "User Profile",
      key: "user",
      render: (_, record) => {
        const isSelf = currentAdmin?.id === record.id
        return (
          <Space size="middle">
            <Avatar
              style={{
                backgroundColor:
                  record.role === "ADMIN" ? "#722ed1" : record.role === "FARMER" ? "#2e7d32" : "#1890ff",
              }}
              icon={<UserOutlined />}
            >
              {record.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Space>
                <Text strong style={{ fontSize: "14px" }}>
                  {record.name}
                </Text>
                {record.is_main_admin && <Tag color="gold" icon={<CrownOutlined />}>Main Admin</Tag>}
                {isSelf && <Tag color="purple">You</Tag>}
              </Space>
              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                {record.email}
              </Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: "Platform Role",
      dataIndex: "role",
      key: "role",
      render: (role: string, record: AdminUser) => {
        const isSelf = currentAdmin?.id === record.id
        if (record.is_main_admin) {
          return <Tag color="gold" style={{ fontWeight: 600 }}>👑 Main Admin</Tag>
        }

        const isMainAdmin = currentAdmin?.is_main_admin
        // Non-main admins cannot demote an ADMIN
        const isDemoteDisabled = !isMainAdmin && record.role === "ADMIN"

        return (
          <Select
            value={role}
            size="small"
            style={{ width: 140 }}
            disabled={isSelf || isDemoteDisabled || actionLoading === record.id}
            onChange={(val) => handleRoleChange(record.id, val)}
          >
            <Select.Option value="FARMER">🚜 FARMER</Select.Option>
            <Select.Option value="CONSUMER">🛒 CONSUMER</Select.Option>
            <Select.Option value="ADMIN" disabled={!isMainAdmin}>
              👑 ADMIN {!isMainAdmin ? "(Main Admin Only)" : ""}
            </Select.Option>
          </Select>
        )
      },
    },
    {
      title: "Products",
      dataIndex: "products_count",
      key: "products_count",
      align: "center",
      sorter: (a, b) => a.products_count - b.products_count,
      render: (count: number) => <Tag color={count > 0 ? "green" : "default"}>{count} items</Tag>,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (loc: string | null) => loc || <Text type="secondary">—</Text>,
    },
    {
      title: "Account Status",
      key: "status",
      align: "center",
      render: (_, record) =>
        record.is_banned ? (
          <Tag color="error" icon={<LockOutlined />}>
            Suspended
          </Tag>
        ) : (
          <Tag color="success" icon={<SafetyCertificateOutlined />}>
            Active
          </Tag>
        ),
    },
    {
      title: "Moderation Action",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const isSelf = currentAdmin?.id === record.id
        if (record.is_main_admin) {
          return (
            <Tooltip title="The Main Administrator is immune to account suspension">
              <Button size="small" disabled style={{ color: "#d48806", borderColor: "#ffe58f" }}>
                👑 Protected
              </Button>
            </Tooltip>
          )
        }

        if (isSelf) {
          return (
            <Tooltip title="You cannot ban your own administrator account">
              <Button size="small" disabled>
                Protected
              </Button>
            </Tooltip>
          )
        }

        // System Admin cannot ban other Administrators (only Main Admin can ban Admins)
        if (record.role === "ADMIN" && !currentAdmin?.is_main_admin) {
          return (
            <Tooltip title="Only the Main Administrator can suspend or reactivate Administrators">
              <Button size="small" disabled>
                Admin Protected
              </Button>
            </Tooltip>
          )
        }

        return (
          <Popconfirm
            title={record.is_banned ? "Reactivate User" : "Suspend Account"}
            description={
              record.is_banned
                ? `Restore access for "${record.name}"?`
                : `Are you sure you want to suspend "${record.name}"? Active login sessions will be immediately revoked.`
            }
            okText={record.is_banned ? "Reactivate" : "Yes, Suspend"}
            cancelText="Cancel"
            okButtonProps={record.is_banned ? undefined : { danger: true }}
            onConfirm={() => handleToggleBan(record)}
          >
            {record.is_banned ? (
              <Button
                size="small"
                type="primary"
                icon={<UnlockOutlined />}
                loading={actionLoading === record.id}
                style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}
              >
                Reactivate
              </Button>
            ) : (
              <Button
                size="small"
                danger
                icon={<UserDeleteOutlined />}
                loading={actionLoading === record.id}
              >
                Suspend
              </Button>
            )}
          </Popconfirm>
        )
      },
    },
  ]

  // --- Audit Logs Table Columns ---
  const auditColumns: ColumnsType<AuditLog> = [
    {
      title: "Timestamp (UTC)",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (val: string) => {
        try {
          return new Date(val).toLocaleString()
        } catch {
          return val
        }
      },
    },
    {
      title: "Action Event",
      dataIndex: "action",
      key: "action",
      width: 170,
      render: (act: string) => <Tag color={ACTION_COLORS[act] || "blue"}>{act.replace(/_/g, " ")}</Tag>,
    },
    {
      title: "Actor / Target Email",
      dataIndex: "user_email",
      key: "user_email",
      width: 220,
      render: (email: string | null) =>
        email ? (
          <Text strong style={{ fontSize: "13px" }}>
            {email}
          </Text>
        ) : (
          <Text type="secondary" italic>
            Anonymous / Visitor
          </Text>
        ),
    },
    {
      title: "Details & Event Metadata",
      dataIndex: "details",
      key: "details",
      render: (details: string | null) => (
        <Text style={{ fontSize: "13px", color: "#374151" }}>{details || "—"}</Text>
      ),
    },
    {
      title: "Client IP",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 130,
      render: (ip: string | null) => <Tag style={{ fontFamily: "monospace" }}>{ip || "127.0.0.1"}</Tag>,
    },
  ]

  return (
    <div className="dashboard-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#531dab" }}>
            👑 System Administrator Dashboard
          </Title>
          <Text type="secondary">
            Platform governance, real-time KPI metrics, user moderation, and security audit trail.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchData(search); fetchAuditLogs(); }} loading={loading || auditLoading}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Main Admin Notice Banner */}
      {currentAdmin?.is_main_admin ? (
        <Alert
          message={
            <span style={{ fontWeight: 700, color: "#874d00" }}>
              👑 Main Administrator Authority Active
            </span>
          }
          description="You possess full platform supremacy. You manage and control the System Administrator and all marketplace accounts, with exclusive authority to promote/demote admins and ban/reactivate any account."
          type="warning"
          showIcon
          icon={<CrownOutlined style={{ color: "#faad14", fontSize: "18px" }} />}
          style={{ marginBottom: "20px", borderRadius: "8px", border: "1px solid #ffe58f", background: "#fffbe6" }}
        />
      ) : (
        <Alert
          message="🛡️ System Administrator Moderation Mode"
          description="You have active moderation authority to inspect metrics, manage agricultural produce, and ban or reactivate farmers and consumers. Note: Managing administrators and suspending admin accounts is reserved exclusively for the Main Administrator."
          type="info"
          showIcon
          style={{ marginBottom: "20px", borderRadius: "8px" }}
        />
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={12} sm={8} lg={4}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Total Users"
              value={stats?.total_users || 0}
              prefix={<TeamOutlined style={{ color: "#722ed1" }} />}
            />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#8c8c8c" }}>
              {stats?.total_farmers || 0} Farmers • {stats?.total_consumers || 0} Buyers
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Suspended Accounts"
              value={stats?.banned_users || 0}
              valueStyle={{ color: (stats?.banned_users || 0) > 0 ? "#cf1322" : "#3f8600" }}
              prefix={<WarningOutlined />}
            />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#8c8c8c" }}>
              {(stats?.banned_users || 0) > 0 ? "Requires review" : "No active bans"}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Total Products"
              value={stats?.total_products || 0}
              prefix={<ShopOutlined style={{ color: "#2e7d32" }} />}
            />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#8c8c8c" }}>
              {stats?.in_stock_products || 0} currently in stock
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={5}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Inventory Value"
              value={stats?.total_inventory_value || 0}
              precision={0}
              prefix="৳"
              valueStyle={{ color: "#166534", fontWeight: 700 }}
            />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#8c8c8c" }}>
              Wholesale marketplace volume
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={5}>
          <Card bordered={false} className="kpi-card">
            <Statistic
              title="Active Cooperatives"
              value={stats?.total_groups || 0}
              prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
            />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#8c8c8c" }}>
              Shared farmer collectives
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Panel Tabs: User Moderation & Security Audit Trail */}
      <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <Tabs
          defaultActiveKey="users"
          items={[
            {
              key: "users",
              label: (
                <span style={{ fontWeight: 600 }}>
                  <TeamOutlined style={{ marginRight: 6 }} />
                  User Accounts Moderation ({users.length})
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <Text type="secondary">
                      Manage registered accounts, modify access roles, and suspend malicious users.
                    </Text>

                    <Input
                      placeholder="Search user by name or email..."
                      prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ width: "260px" }}
                      allowClear
                    />
                  </div>

                  <Table
                    columns={userColumns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8, showSizeChanger: true }}
                    scroll={{ x: 800 }}
                  />
                </div>
              ),
            },
            {
              key: "audit",
              label: (
                <span style={{ fontWeight: 600 }}>
                  <HistoryOutlined style={{ marginRight: 6 }} />
                  Security & Audit Trail ({auditTotal})
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <Space wrap>
                      <Select
                        value={auditAction}
                        onChange={(val) => setAuditAction(val)}
                        style={{ width: 170 }}
                      >
                        <Select.Option value="ALL">All Event Types</Select.Option>
                        <Select.Option value="LOGIN">LOGIN</Select.Option>
                        <Select.Option value="FAILED_LOGIN">FAILED LOGIN</Select.Option>
                        <Select.Option value="ACCOUNT_LOCKED">ACCOUNT LOCKED</Select.Option>
                        <Select.Option value="USER_BANNED">USER BANNED</Select.Option>
                        <Select.Option value="USER_UNBANNED">USER UNBANNED</Select.Option>
                        <Select.Option value="ROLE_CHANGED">ROLE CHANGED</Select.Option>
                        <Select.Option value="PRODUCT_CREATED">PRODUCT CREATED</Select.Option>
                        <Select.Option value="PRODUCT_UPDATED">PRODUCT UPDATED</Select.Option>
                        <Select.Option value="PRODUCT_DELETED">PRODUCT DELETED</Select.Option>
                        <Select.Option value="SIGNUP">SIGNUP</Select.Option>
                        <Select.Option value="LOGOUT">LOGOUT</Select.Option>
                      </Select>

                      <Input
                        placeholder="Filter by email or keyword..."
                        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        style={{ width: "240px" }}
                        allowClear
                      />
                    </Space>

                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      loading={downloadingCsv}
                      onClick={handleDownloadCsv}
                      style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32", fontWeight: 600 }}
                    >
                      Export Logs to CSV
                    </Button>
                  </div>

                  <Table
                    columns={auditColumns}
                    dataSource={auditLogs}
                    rowKey="id"
                    loading={auditLoading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 900 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
