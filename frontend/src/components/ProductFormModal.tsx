import { useEffect } from "react"
import {
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
} from "antd"
import type { Product, ProductInput } from "../types/product"

const { TextArea } = Input
const { Option } = Select

interface ProductFormModalProps {
  open: boolean
  editingProduct: Product | null
  loading: boolean
  onCancel: () => void
  onSubmit: (values: ProductInput) => Promise<boolean>
}

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Poultry",
  "Spices",
  "Other",
]

const UNITS = ["kg", "liter", "piece", "dozen", "bundle", "gram", "ton"]

export function ProductFormModal({
  open,
  editingProduct,
  loading,
  onCancel,
  onSubmit,
}: ProductFormModalProps) {
  const [form] = Form.useForm<ProductInput>()

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        form.setFieldsValue({
          name: editingProduct.name,
          category: editingProduct.category,
          price: editingProduct.price,
          unit: editingProduct.unit || "kg",
          quantity: editingProduct.quantity,
          description: editingProduct.description || "",
          image_url: editingProduct.image_url || "",
          farmer_name: editingProduct.farmer_name,
          farmer_location: editingProduct.farmer_location || "Bogura",
          farmer_phone: editingProduct.farmer_phone || "",
          is_available: editingProduct.is_available,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          category: "Vegetables",
          unit: "kg",
          quantity: 50,
          price: 50,
          farmer_location: "Bogura",
          is_available: true,
        })
      }
    }
  }, [open, editingProduct, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const success = await onSubmit(values)
      if (success) {
        form.resetFields()
      }
    } catch {
      // Form validation errors will be highlighted automatically
    }
  }

  return (
    <Modal
      open={open}
      title={
        <span style={{ fontSize: "18px", fontWeight: 600, color: "#166534" }}>
          {editingProduct ? "🌾 Edit Agricultural Product" : "🌱 Add New Agricultural Product"}
        </span>
      }
      okText={editingProduct ? "Update Product" : "Publish Product"}
      cancelText="Cancel"
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={onCancel}
      width={680}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          category: "Vegetables",
          unit: "kg",
          is_available: true,
        }}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: "Please enter product name" }]}
            >
              <Input placeholder="e.g. Fresh Red Tomatoes" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select category" }]}
            >
              <Select placeholder="Select category">
                {CATEGORIES.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="price"
              label="Price (৳ BDT)"
              rules={[
                { required: true, message: "Please enter price" },
                { type: "number", min: 0.01, message: "Price must be > 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                prefix="৳"
                placeholder="50"
                min={0.01}
                step={0.5}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="unit"
              label="Unit of Measurement"
              rules={[{ required: true, message: "Please choose unit" }]}
            >
              <Select placeholder="Unit">
                {UNITS.map((u) => (
                  <Option key={u} value={u}>
                    per {u}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="quantity"
              label="Available Stock"
              rules={[
                { required: true, message: "Please enter stock quantity" },
                { type: "number", min: 0, message: "Quantity cannot be negative" },
              ]}
            >
              <InputNumber style={{ width: "100%" }} placeholder="100" min={0} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="farmer_name"
              label="Farmer / Producer Name"
              rules={[{ required: true, message: "Please enter farmer name" }]}
            >
              <Input placeholder="e.g. Farmer Abdul Karim" />
            </Form.Item>
          </Col>

          <Col span={7}>
            <Form.Item
              name="farmer_location"
              label="Farm Location / District"
              rules={[{ required: true, message: "Please enter farm district" }]}
            >
              <Input placeholder="e.g. Bogura, Rajshahi" />
            </Form.Item>
          </Col>

          <Col span={7}>
            <Form.Item name="farmer_phone" label="Farmer Phone">
              <Input placeholder="+88017xxxxxxxx" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="image_url"
          label="Product Image URL"
          extra="Provide a web image link or leave blank for automatic placeholder."
        >
          <Input placeholder="https://images.unsplash.com/..." />
        </Form.Item>

        <Form.Item name="description" label="Product Description">
          <TextArea
            rows={3}
            placeholder="Details about harvest freshness, cultivation methods, organic certification, etc."
          />
        </Form.Item>

        <Form.Item
          name="is_available"
          label="Availability Status"
          valuePropName="checked"
        >
          <Switch checkedChildren="In Stock" unCheckedChildren="Unavailable" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
