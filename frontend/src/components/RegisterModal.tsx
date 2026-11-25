import { useState } from "react"
import { Alert, Button, Form, Input, Modal, Radio, Space, Typography } from "antd"
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"
import type { SignupInput } from "../types/auth"

const { Text } = Typography

interface RegisterModalProps {
  open: boolean
  onCancel: () => void
  onSwitchToLogin: () => void
}

interface RegisterFormValues extends SignupInput {
  confirm_password?: string
}

export function RegisterModal({ open, onCancel, onSwitchToLogin }: RegisterModalProps) {
  const [form] = Form.useForm<RegisterFormValues>()
  const { signup } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await signup({
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
        phone: values.phone,
        location: values.location,
      })
      form.resetFields()
      onCancel()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🌱</span>
          <span>Create an AgroConnect Account</span>
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
      width={480}
    >
      <div style={{ marginBottom: "16px" }}>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          Join our decentralized marketplace connecting local farmers directly with consumers.
        </Text>
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

      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: "FARMER", location: "Bogura" }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Account Role"
          name="role"
          rules={[{ required: true, message: "Please select an account type" }]}
        >
          <Radio.Group style={{ width: "100%" }}>
            <Space direction="horizontal" style={{ width: "100%", justifyContent: "space-between" }}>
              <Radio.Button value="FARMER" style={{ padding: "0 18px", height: "36px", lineHeight: "36px" }}>
                🚜 Farmer / Producer
              </Radio.Button>
              <Radio.Button value="CONSUMER" style={{ padding: "0 18px", height: "36px", lineHeight: "36px" }}>
                🛒 Consumer / Buyer
              </Radio.Button>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Please enter your full name" }]}
        >
          <Input prefix={<UserOutlined style={{ color: "#8c8c8c" }} />} placeholder="e.g. Zahidul Hasan" />
        </Form.Item>

        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input prefix={<MailOutlined style={{ color: "#8c8c8c" }} />} placeholder="e.g. user@agroconnect.com" />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Form.Item
            label="Location / District"
            name="location"
            rules={[{ required: true, message: "Enter location" }]}
          >
            <Input prefix={<EnvironmentOutlined style={{ color: "#8c8c8c" }} />} placeholder="e.g. Bogura, Rajshahi" />
          </Form.Item>

          <Form.Item label="Contact Phone" name="phone">
            <Input prefix={<PhoneOutlined style={{ color: "#8c8c8c" }} />} placeholder="+88017..." />
          </Form.Item>
        </div>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please enter a password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="Minimum 6 characters" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirm_password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("The two passwords do not match"))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="Confirm password" />
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
            Create Account
          </Button>
        </Form.Item>

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Already have an account?{" "}
            <Button
              type="link"
              style={{ padding: 0, fontWeight: 600, color: "#2e7d32" }}
              onClick={() => {
                form.resetFields()
                setErrorMsg(null)
                onSwitchToLogin()
              }}
            >
              Sign in
            </Button>
          </Text>
        </div>
      </Form>
    </Modal>
  )
}
