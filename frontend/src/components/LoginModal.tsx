import { useState } from "react"
import { Alert, Button, Form, Input, Modal, Space, Tag, Typography } from "antd"
import { LockOutlined, MailOutlined } from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"
import type { LoginInput } from "../types/auth"

const { Text } = Typography

interface LoginModalProps {
  open: boolean
  onCancel: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ open, onCancel, onSwitchToRegister }: LoginModalProps) {
  const [form] = Form.useForm<LoginInput>()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (values: LoginInput) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await login(values)
      form.resetFields()
      onCancel()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email: string, pass: string) => {
    form.setFieldsValue({ email, password: pass })
    setErrorMsg(null)
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🌾</span>
          <span>Sign In to AgroConnect</span>
        </div>
      }
      onCancel={() => {
        form.resetFields()
        setErrorMsg(null)
        onCancel()
      }}
      footer={null}
      destroyOnClose
      centered
    >
      <div style={{ marginBottom: "16px" }}>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          Sign in to access your farmer dashboard, manage agricultural listings, or make direct farm purchases.
        </Text>
      </div>

      {/* Demo Account Pills for quick teacher / viva evaluation */}
      <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: "6px", padding: "10px 12px", marginBottom: "16px" }}>
        <Text strong style={{ fontSize: "12px", color: "#135200", display: "block", marginBottom: "6px" }}>
          Quick Demo Credentials (Click to Autofill):
        </Text>
        <Space wrap size={[6, 6]}>
          <Tag
            color="purple"
            style={{ cursor: "pointer", padding: "2px 8px" }}
            onClick={() => fillDemo("admin@agroconnect.com", "Admin123!")}
          >
            🔑 Admin: admin@agroconnect.com
          </Tag>
          <Tag
            color="green"
            style={{ cursor: "pointer", padding: "2px 8px" }}
            onClick={() => fillDemo("farmer.rahim@agroconnect.com", "Farmer123!")}
          >
            🚜 Farmer: farmer.rahim@agroconnect.com
          </Tag>
          <Tag
            color="blue"
            style={{ cursor: "pointer", padding: "2px 8px" }}
            onClick={() => fillDemo("consumer.sourov@agroconnect.com", "Consumer123!")}
          >
            🛒 Consumer: consumer.sourov@agroconnect.com
          </Tag>
        </Space>
      </div>

      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          closable
          onClose={() => setErrorMsg(null)}
          style={{ marginBottom: "16px" }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input prefix={<MailOutlined style={{ color: "#8c8c8c" }} />} placeholder="e.g. farmer.rahim@agroconnect.com" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="••••••••" />
        </Form.Item>

        <Form.Item style={{ marginBottom: "12px", marginTop: "20px" }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              backgroundColor: "#2e7d32",
              borderColor: "#2e7d32",
              fontWeight: 600,
              height: "40px",
            }}
          >
            Sign In
          </Button>
        </Form.Item>

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Don't have an account?{" "}
            <Button
              type="link"
              style={{ padding: 0, fontWeight: 600, color: "#2e7d32" }}
              onClick={() => {
                form.resetFields()
                setErrorMsg(null)
                onSwitchToRegister()
              }}
            >
              Register here
            </Button>
          </Text>
        </div>
      </Form>
    </Modal>
  )
}
