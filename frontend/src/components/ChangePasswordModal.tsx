import { useState } from "react"
import { Alert, App, Button, Form, Input, Modal, Typography } from "antd"
import { LockOutlined } from "@ant-design/icons"
import { apiService } from "../services/api"
import type { ChangePasswordInput } from "../types/auth"

const { Text } = Typography

interface ChangePasswordModalProps {
  open: boolean
  onCancel: () => void
}

interface FormValues extends ChangePasswordInput {
  confirm_password?: string
}

export function ChangePasswordModal({ open, onCancel }: ChangePasswordModalProps) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await apiService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      message.success("Password changed successfully!")
      form.resetFields()
      onCancel()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔒</span>
          <span>Change Account Password</span>
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
          Ensure your account stays secure by using a strong password.
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

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Current Password"
          name="current_password"
          rules={[{ required: true, message: "Please enter your current password" }]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="••••••••" />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="new_password"
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="Minimum 6 characters" />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          name="confirm_password"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("The two passwords do not match"))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="Confirm new password" />
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
            Update Password
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
