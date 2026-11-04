import { useEffect, useState } from "react"
import { App as AntApp, ConfigProvider, theme } from "antd"
import { Navbar } from "./components/Navbar"
import { Marketplace } from "./components/Marketplace"
import { FarmerDashboard } from "./components/FarmerDashboard"
import { ProductFormModal } from "./components/ProductFormModal"
import { ProductDetailsModal } from "./components/ProductDetailsModal"
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
        <AgroMarketplaceApp />
      </AntApp>
    </ConfigProvider>
  )
}

function AgroMarketplaceApp() {
  const { message } = AntApp.useApp()

  const [currentTab, setCurrentTab] = useState<"marketplace" | "dashboard">("marketplace")
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
      if (editingProduct) {
        // Update: PUT /api/v1/products/{id}
        await apiService.updateProduct(editingProduct.id, values)
        message.success(`Product "${values.name}" updated successfully!`)
      } else {
        // Create: POST /api/v1/products
        await apiService.createProduct(values)
        message.success(`Product "${values.name}" added to marketplace!`)
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
      // Fetch fresh details from backend (Read Single)
      const freshData = await apiService.getProduct(product.id)
      setSelectedProduct(freshData)
      setDetailsModalOpen(true)
    } catch (err) {
      // Fallback to currently selected item if offline
      setSelectedProduct(product)
      setDetailsModalOpen(true)
    }
  }

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setFormModalOpen(true)
  }

  // Open Edit modal
  const handleOpenEditModal = (product: Product) => {
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
