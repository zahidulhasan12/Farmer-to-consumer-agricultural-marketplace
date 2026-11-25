import { useState } from "react"
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Radio,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd"
import {
  EnvironmentOutlined,
  LockOutlined,
  LoginOutlined,
  MailOutlined,
  PhoneOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { useAuth } from "../context/AuthContext"
import type { LoginInput, SignupInput } from "../types/auth"

const { Title, Text, Paragraph } = Typography

interface RegisterFormValues extends SignupInput {
  confirm_password?: string
}

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const { login, signup } = useAuth()

  const [loginForm] = Form.useForm<LoginInput>()
  const [registerForm] = Form.useForm<RegisterFormValues>()

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Handle Login submission
  const handleLoginSubmit = async (values: LoginInput) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await login(values)
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please verify your credentials."
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle Register submission
  const handleRegisterSubmit = async (values: RegisterFormValues) => {
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register account")
    } finally {
      setLoading(false)
    }
  }

  // Quick autofill demo credentials
  const autofillDemo = (email: string, pass: string) => {
    setMode("login")
    loginForm.setFieldsValue({ email, password: pass })
    setErrorMsg(null)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #e0f2f1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(46, 125, 50, 0.12)",
          border: "1px solid #c8e6c9",
          overflow: "hidden",
        }}
        bodyStyle={{ padding: "32px 28px" }}
      >
        {/* Branding Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "#2e7d32",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              marginBottom: "12px",
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.35)",
            }}
          >
            🌾
          </div>
          <Title level={2} style={{ margin: "0 0 4px 0", color: "#1b5e20", fontWeight: 700 }}>
            AgroConnect
          </Title>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            Farmer-to-Consumer Agricultural Marketplace
          </Text>
        </div>

        {/* Auth Mode Toggle (Sign In vs Register) */}
        <div style={{ marginBottom: "20px" }}>
          <Segmented
            block
            size="large"
            value={mode}
            onChange={(val) => {
              setMode(val as "login" | "register")
              setErrorMsg(null)
            }}
            options={[
              {
                label: (
                  <span style={{ fontWeight: 600, padding: "4px 8px" }}>
                    <LoginOutlined style={{ marginRight: "6px" }} />
                    Sign In
                  </span>
                ),
                value: "login",
              },
              {
                label: (
                  <span style={{ fontWeight: 600, padding: "4px 8px" }}>
                    <UserAddOutlined style={{ marginRight: "6px" }} />
                    Create Account
                  </span>
                ),
                value: "register",
              },
            ]}
          />
        </div>

        {/* Demo Credentials Quick-Access Box (shown in Login mode) */}
        {mode === "login" && (
          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <Text strong style={{ fontSize: "12px", color: "#135200" }}>
                ⚡ Quick Demo Accounts (Click to Fill):
              </Text>
            </div>
            <Space wrap size={[6, 8]}>
              <Tag
                color="gold"
                style={{ cursor: "pointer", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}
                onClick={() => autofillDemo("mainadmin@agroconnect.com", "Admin123!")}
              >
                👑 Main Admin Demo
              </Tag>
              <Tag
                color="purple"
                style={{ cursor: "pointer", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
                onClick={() => autofillDemo("admin@agroconnect.com", "Admin123!")}
              >
                🔑 Admin Demo
              </Tag>
              <Tag
                color="green"
                style={{ cursor: "pointer", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
                onClick={() => autofillDemo("farmer.rahim@agroconnect.com", "Farmer123!")}
              >
                🚜 Farmer Demo
              </Tag>
              <Tag
                color="blue"
                style={{ cursor: "pointer", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
                onClick={() => autofillDemo("consumer.sourov@agroconnect.com", "Consumer123!")}
              >
                🛒 Consumer Demo
              </Tag>
            </Space>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: "18px", borderRadius: "8px" }}
          />
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <Form form={loginForm} layout="vertical" onFinish={handleLoginSubmit} size="large">
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email address" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#2e7d32" }} />}
                placeholder="e.g. farmer.rahim@agroconnect.com"
                style={{ borderRadius: "8px" }}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#2e7d32" }} />}
                placeholder="••••••••"
                style={{ borderRadius: "8px" }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: "24px", marginBottom: "8px" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  backgroundColor: "#2e7d32",
                  borderColor: "#2e7d32",
                  height: "46px",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
                }}
              >
                Sign In to Marketplace
              </Button>
            </Form.Item>
          </Form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && (
          <Form
            form={registerForm}
            layout="vertical"
            initialValues={{ role: "FARMER", location: "Bogura" }}
            onFinish={handleRegisterSubmit}
            size="middle"
          >
            <Form.Item
              label="Select Your Role"
              name="role"
              rules={[{ required: true, message: "Please choose your role" }]}
            >
              <Radio.Group style={{ width: "100%" }}>
                <Space direction="horizontal" style={{ width: "100%", justifyContent: "space-between" }}>
                  <Radio.Button value="FARMER" style={{ padding: "0 16px", height: "36px", lineHeight: "36px" }}>
                    🚜 Farmer (Sell)
                  </Radio.Button>
                  <Radio.Button value="CONSUMER" style={{ padding: "0 16px", height: "36px", lineHeight: "36px" }}>
                    🛒 Consumer (Buy)
                  </Radio.Button>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input prefix={<UserOutlined style={{ color: "#2e7d32" }} />} placeholder="e.g. Zahidul Hasan" />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Enter valid email" },
              ]}
            >
              <Input prefix={<MailOutlined style={{ color: "#2e7d32" }} />} placeholder="e.g. user@agroconnect.com" />
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Form.Item
                label="Location / District"
                name="location"
                rules={[{ required: true, message: "Enter location" }]}
              >
                <Input prefix={<EnvironmentOutlined style={{ color: "#2e7d32" }} />} placeholder="e.g. Bogura" />
              </Form.Item>

              <Form.Item label="Contact Phone" name="phone">
                <Input prefix={<PhoneOutlined style={{ color: "#2e7d32" }} />} placeholder="+88017..." />
              </Form.Item>
            </div>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Enter password" },
                { min: 6, message: "At least 6 characters" },
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: "#2e7d32" }} />} placeholder="Minimum 6 characters" />
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
                    return Promise.reject(new Error("Passwords do not match"))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: "#2e7d32" }} />} placeholder="Confirm password" />
            </Form.Item>

            <Form.Item style={{ marginTop: "16px", marginBottom: "8px" }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  backgroundColor: "#2e7d32",
                  borderColor: "#2e7d32",
                  height: "44px",
                  fontSize: "15px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
                }}
              >
                Create Account & Continue
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            🔒 Protected by Argon2 password hashing & stateful JWT refresh sessions
          </Text>
        </div>
      </Card>
    </div>
  )
}
