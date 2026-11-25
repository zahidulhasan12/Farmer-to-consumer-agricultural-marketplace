import { useEffect, useState } from "react"
import { App as AntApp, ConfigProvider, Spin } from "antd"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { AuthPage } from "./components/AuthPage"
import { Navbar, type ActiveNavTab } from "./components/Navbar"
import { Marketplace } from "./components/Marketplace"
import { FarmerDashboard } from "./components/FarmerDashboard"
import { GroupsView } from "./components/GroupsView"
import { AdminDashboard } from "./components/AdminDashboard"
import { ProductFormModal } from "./components/ProductFormModal"
import { ProductDetailsModal } from "./components/ProductDetailsModal"
import { ChangePasswordModal } from "./components/ChangePasswordModal"
import { apiService } from "./services/api"
import type { Product, ProductInput } from "./types/product"

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2e7d32",
          colorLink: "#2e7d32",
          borderRadius: 6,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth()

  // 1. Initial Auth Check Spinner
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6ffed",
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: "16px", color: "#2e7d32", fontWeight: 600, fontSize: "16px" }}>
          Loading AgroConnect...
        </div>
      </div>
    )
  }

  // 2. Gated Login/Signup Screen: If not authenticated, show standalone AuthPage
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // 3. Authenticated: Render Main Application Dashboard & Marketplace
  return <AgroMarketplaceApp />
}

function AgroMarketplaceApp() {
  const { message } = AntApp.useApp()
  const { user } = useAuth()

  const [currentTab, setCurrentTab] = useState<ActiveNavTab>("marketplace")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")
  const [category, setCategory] = useState<string>("All")

  // Form modal state (Create / Edit)
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Details modal state (Read Single)
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Change Password modal state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState<boolean>(false)

  // Fetch products from API (Read List: GET /api/v1/products)
  const fetchProducts = async (currentSearch = search, currentCategory = category) => {
    setLoading(true)
    try {
      const data = await apiService.getProducts(0, 100, currentSearch, currentCategory)
      setProducts(data.items)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load products"
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Load products on initial mount and when search/category change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search, category)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, category])

  // Create or Update Product handler (POST / PUT)
  const handleFormSubmit = async (values: ProductInput): Promise<boolean> => {
    setSubmitting(true)
    try {
      const payload: ProductInput = {
        ...values,
        farmer_name: values.farmer_name || user?.name || "Farmer",
        farmer_location: values.farmer_location || user?.location || "Bogura",
        farmer_phone: values.farmer_phone || user?.phone || "+8801700000000",
      }

      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, payload)
        message.success(`Product "${payload.name}" updated successfully!`)
      } else {
        await apiService.createProduct(payload)
        message.success(`Product "${payload.name}" added to marketplace!`)
      }
      setFormModalOpen(false)
      setEditingProduct(null)
      await fetchProducts()
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Operation failed"
      message.error(errorMsg)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Product handler (DELETE /api/v1/products/{id})
  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      await apiService.deleteProduct(id)
      message.success("Product deleted successfully from database")
      await fetchProducts()
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete product"
      message.error(errorMsg)
      return false
    }
  }

  // View Single Product Details handler (GET /api/v1/products/{id})
  const handleViewDetails = async (product: Product) => {
    try {
      const freshData = await apiService.getProduct(product.id)
      setSelectedProduct(freshData)
      setDetailsModalOpen(true)
    } catch {
      setSelectedProduct(product)
      setDetailsModalOpen(true)
    }
  }

  // Open Add modal
  const handleOpenAddModal = () => {
    if (user?.role === "CONSUMER") {
      message.warning("Consumers (Buyers) cannot list products. Please sign in with a Farmer or Administrator account.")
      return
    }
    setEditingProduct(null)
    setFormModalOpen(true)
  }

  // Open Edit modal
  const handleOpenEditModal = (product: Product) => {
    if (user && user.role !== "ADMIN" && product.user_id && product.user_id !== user.id) {
      message.error("You do not have permission to edit this product. Only the owner or an administrator can modify it.")
      return
    }
    setEditingProduct(product)
    setFormModalOpen(true)
  }

  return (
    <div className="agro-app-root">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onAddProduct={handleOpenAddModal}
        totalProducts={products.length}
        onOpenLogin={() => {}}
        onOpenRegister={() => {}}
        onOpenChangePassword={() => setChangePasswordModalOpen(true)}
      />

      <main className="agro-main-content">
        {currentTab === "marketplace" && (
          <Marketplace
            products={products}
            loading={loading}
            search={search}
            category={category}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onRefresh={() => fetchProducts(search, category)}
            onViewDetails={handleViewDetails}
            onEdit={handleOpenEditModal}
            onAddProduct={handleOpenAddModal}
          />
        )}

        {currentTab === "dashboard" && (
          <FarmerDashboard
            products={products}
            loading={loading}
            onAddProduct={handleOpenAddModal}
            onEditProduct={handleOpenEditModal}
            onDeleteProduct={handleDeleteProduct}
            onViewDetails={handleViewDetails}
            onRefresh={() => fetchProducts(search, category)}
          />
        )}

        {currentTab === "groups" && <GroupsView />}

        {currentTab === "admin" && user?.role === "ADMIN" && <AdminDashboard />}
      </main>

      {/* Product Form Modal (Create / Edit) */}
      <ProductFormModal
        open={formModalOpen}
        editingProduct={editingProduct}
        loading={submitting}
        onCancel={() => {
          setFormModalOpen(false)
          setEditingProduct(null)
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Product Details Modal (Read Single) */}
      <ProductDetailsModal
        product={selectedProduct}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedProduct(null)
        }}
        onEdit={handleOpenEditModal}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordModalOpen}
        onCancel={() => setChangePasswordModalOpen(false)}
      />

      {/* Footer */}
      <footer className="agro-footer">
        <div className="agro-footer-content">
          <p>
            <strong>AgroConnect</strong> — Farmer-to-Consumer Agricultural Marketplace
          </p>
        </div>
      </footer>
    </div>
  )
}
