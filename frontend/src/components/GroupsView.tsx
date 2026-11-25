import { useEffect, useState } from "react"
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  TeamOutlined,
  PlusOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CrownOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
} from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"
import { apiService } from "../services/api"
import type { Group, GroupCreateInput, GroupMember, GroupMemberAddInput, GroupPermission } from "../types/group"

const { Title, Text, Paragraph } = Typography

export function GroupsView() {
  const { message } = App.useApp()
  const { user, isFarmer, isAdmin } = useAuth()

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Create Group Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [createForm] = Form.useForm<GroupCreateInput>()
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false)

  // Selected Group Details & Member Management Modal
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false)

  // Add Member Modal
  const [addMemberModalOpen, setAddMemberModalOpen] = useState<boolean>(false)
  const [memberForm] = Form.useForm<GroupMemberAddInput>()
  const [submittingMember, setSubmittingMember] = useState<boolean>(false)

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const data = await apiService.getGroups()
      setGroups(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to load cooperative groups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (values: GroupCreateInput) => {
    setSubmittingCreate(true)
    try {
      const created = await apiService.createGroup(values)
      message.success(`Cooperative "${created.name}" created successfully!`)
      createForm.resetFields()
      setCreateModalOpen(false)
      await fetchGroups()
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to create cooperative")
    } finally {
      setSubmittingCreate(false)
    }
  }

  const handleOpenDetails = async (group: Group) => {
    setDetailsLoading(true)
    setSelectedGroup(group)
    try {
      const freshData = await apiService.getGroup(group.id)
      setSelectedGroup(freshData)
    } catch {
      // fallback to initial
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleAddMember = async (values: GroupMemberAddInput) => {
    if (!selectedGroup) return
    setSubmittingMember(true)
    try {
      await apiService.addGroupMember(selectedGroup.id, values)
      message.success(`Invited ${values.email} to the cooperative!`)
      memberForm.resetFields()
      setAddMemberModalOpen(false)
      // refresh details
      const freshData = await apiService.getGroup(selectedGroup.id)
      setSelectedGroup(freshData)
      await fetchGroups()
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to add member")
    } finally {
      setSubmittingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return
    try {
      await apiService.removeGroupMember(selectedGroup.id, userId)
      message.success("Member removed from cooperative")
      const freshData = await apiService.getGroup(selectedGroup.id)
      setSelectedGroup(freshData)
      await fetchGroups()
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await apiService.deleteGroup(groupId)
      message.success("Cooperative group deleted")
      setSelectedGroup(null)
      await fetchGroups()
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to delete group")
    }
  }

  const canManageSelectedGroup = !!(
    selectedGroup &&
    user &&
    (isAdmin || selectedGroup.owner_id === user.id || selectedGroup.my_permission === "ADMIN")
  )

  const memberColumns: ColumnsType<GroupMember> = [
    {
      title: "Member",
      key: "name",
      render: (_, record) => (
        <div>
          <Space>
            <Text strong style={{ fontSize: "14px" }}>
              {record.name}
            </Text>
            {selectedGroup?.owner_id === record.user_id && (
              <Tag color="gold" icon={<CrownOutlined />}>
                Creator
              </Tag>
            )}
            {user?.id === record.user_id && <Tag color="green">You</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Account Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "ADMIN" ? "purple" : role === "FARMER" ? "green" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Group Permission",
      dataIndex: "permission",
      key: "permission",
      render: (perm: GroupPermission) => {
        const color = perm === "ADMIN" ? "volcano" : perm === "CAN_ADD_PRODUCTS" ? "green" : "default"
        return <Tag color={color}>{perm.replace(/_/g, " ")}</Tag>
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        if (!canManageSelectedGroup || selectedGroup?.owner_id === record.user_id) {
          return <Text type="secondary" style={{ fontSize: "12px" }}>Protected</Text>
        }
        return (
          <Popconfirm
            title="Remove Member"
            description={`Remove ${record.name} from this cooperative?`}
            okText="Yes, Remove"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleRemoveMember(record.user_id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        )
      },
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
          <Title level={2} style={{ margin: 0, color: "#166534" }}>
            🤝 Farmer Cooperatives & Shared Groups
          </Title>
          <Text type="secondary">
            Form cooperatives to combine agricultural supply, share distribution logistics, and manage group produce.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchGroups} loading={loading}>
            Refresh
          </Button>

          {(isFarmer || isAdmin) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32", fontWeight: 600 }}
            >
              Establish New Cooperative
            </Button>
          )}
        </Space>
      </div>

      {user?.role === "CONSUMER" && (
        <Alert
          message="Consumer Access Notice"
          description="Consumers can view public cooperatives. To establish a new farmer cooperative or contribute shared produce, sign in with a Farmer account."
          type="info"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      {/* Cooperative Cards Grid */}
      <Row gutter={[16, 16]}>
        {groups.map((grp) => {
          const isCreator = user?.id === grp.owner_id
          return (
            <Col xs={24} sm={12} lg={8} key={grp.id}>
              <Card
                hoverable
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "12px",
                  border: "1px solid #d9f7be",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                actions={[
                  <Button
                    type="link"
                    icon={<TeamOutlined />}
                    onClick={() => handleOpenDetails(grp)}
                    style={{ color: "#2e7d32", fontWeight: 600 }}
                  >
                    View Members & Roster ({grp.members_count})
                  </Button>,
                ]}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <Title level={4} style={{ margin: 0, color: "#1b5e20", fontSize: "17px" }}>
                      🌾 {grp.name}
                    </Title>
                    {isCreator ? (
                      <Tag color="gold">Created by You</Tag>
                    ) : grp.my_permission ? (
                      <Tag color="green">{grp.my_permission.replace(/_/g, " ")}</Tag>
                    ) : (
                      <Tag>Public</Tag>
                    )}
                  </div>

                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: "40px", fontSize: "13px" }}>
                    {grp.description || "A regional agricultural collective uniting farmers for direct consumer supply."}
                  </Paragraph>
                </div>

                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "10px", marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
                  <div>
                    <strong>Founder:</strong> {grp.owner_name}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <strong>Established:</strong> {new Date(grp.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}

        {groups.length === 0 && !loading && (
          <Col span={24}>
            <Card style={{ textAlign: "center", padding: "40px 20px", background: "#f6ffed" }}>
              <TeamOutlined style={{ fontSize: "48px", color: "#2e7d32", marginBottom: "16px" }} />
              <Title level={4}>No Cooperatives Joined Yet</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: "16px" }}>
                Start a local collective with neighboring growers or wait for an invitation from fellow farmers.
              </Text>
              {(isFarmer || isAdmin) && (
                <Button type="primary" onClick={() => setCreateModalOpen(true)} style={{ backgroundColor: "#2e7d32" }}>
                  Establish First Cooperative
                </Button>
              )}
            </Card>
          </Col>
        )}
      </Row>

      {/* CREATE GROUP MODAL */}
      <Modal
        open={createModalOpen}
        title={
          <Space>
            <span>🤝</span>
            <span>Establish a Farmer Cooperative</span>
          </Space>
        }
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            label="Cooperative Name"
            name="name"
            rules={[{ required: true, message: "Please enter a cooperative name" }]}
          >
            <Input placeholder="e.g. Bogura Organic Mango & Rice Growers" />
          </Form.Item>

          <Form.Item label="Purpose / Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="e.g. Regional association of farmers collaborating on wholesale supply and direct delivery."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "20px" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingCreate}
              block
              style={{ backgroundColor: "#2e7d32", height: "40px", fontWeight: 600 }}
            >
              Create Cooperative
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* GROUP DETAILS & ROSTER MODAL */}
      <Modal
        open={!!selectedGroup}
        title={
          <Space>
            <TeamOutlined style={{ color: "#2e7d32" }} />
            <span>{selectedGroup?.name}</span>
          </Space>
        }
        onCancel={() => setSelectedGroup(null)}
        width={760}
        footer={[
          canManageSelectedGroup && (
            <Popconfirm
              key="del"
              title="Delete Cooperative"
              description="Are you sure? This will remove all group memberships permanently."
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => selectedGroup && handleDeleteGroup(selectedGroup.id)}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete Group
              </Button>
            </Popconfirm>
          ),
          <Button key="close" onClick={() => setSelectedGroup(null)}>
            Close
          </Button>,
        ]}
      >
        {selectedGroup && (
          <div>
            <Paragraph style={{ color: "#4b5563" }}>
              {selectedGroup.description || "Agricultural collective members roster."}
            </Paragraph>

            <Descriptions size="small" column={2} style={{ margin: "16px 0" }}>
              <Descriptions.Item label="Creator / Owner">
                <Text strong>{selectedGroup.owner_name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Your Permission">
                <Tag color="green">{selectedGroup.my_permission?.replace(/_/g, " ") || "Member"}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <Title level={5} style={{ margin: 0 }}>
                Cooperative Members ({selectedGroup.members?.length || selectedGroup.members_count})
              </Title>

              {canManageSelectedGroup && (
                <Button
                  size="small"
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setAddMemberModalOpen(true)}
                  style={{ backgroundColor: "#2e7d32" }}
                >
                  Invite Farmer by Email
                </Button>
              )}
            </div>

            <Table
              dataSource={selectedGroup.members || []}
              columns={memberColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={detailsLoading}
            />
          </div>
        )}
      </Modal>

      {/* INVITE MEMBER MODAL */}
      <Modal
        open={addMemberModalOpen}
        title={
          <Space>
            <UserAddOutlined />
            <span>Invite Farmer to Cooperative</span>
          </Space>
        }
        onCancel={() => setAddMemberModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={memberForm}
          layout="vertical"
          initialValues={{ permission: "CAN_ADD_PRODUCTS" }}
          onFinish={handleAddMember}
        >
          <Form.Item
            label="User Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter user email" },
              { type: "email", message: "Enter valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="e.g. farmer.rahim@agroconnect.com" />
          </Form.Item>

          <Form.Item
            label="Permission Level"
            name="permission"
            rules={[{ required: true, message: "Please choose a permission level" }]}
          >
            <Select>
              <Select.Option value="CAN_ADD_PRODUCTS">🌾 CAN ADD PRODUCTS (Add & manage group inventory)</Select.Option>
              <Select.Option value="ADMIN">👑 GROUP ADMIN (Manage roster & add produce)</Select.Option>
              <Select.Option value="VIEW_ONLY">👁️ VIEW ONLY (Inspect stock & cooperative reports)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "20px" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingMember}
              block
              style={{ backgroundColor: "#2e7d32", height: "40px", fontWeight: 600 }}
            >
              Add Member to Group
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
